import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/esign/tokens";
import { emailConfigured, sendOnboardingSubmittedEmail } from "@/lib/onboarding/email";
import { allFields, getFormSpec, type AccessGrant, type OnboardingFormSpec } from "@/lib/onboarding/forms";
import { validateResponses } from "@/lib/onboarding/requests";

interface PublicOnboardingView {
  status: string;
  account_name: string;
  recipient_name: string | null;
  form: OnboardingFormSpec;
  access_grants: AccessGrant[];
  expires_at: string | null;
  responses?: Record<string, string | boolean> | null;
}

function clientMeta(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return { ip, userAgent };
}

async function loadRequest(token: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("onboarding_requests")
    .select("*, account:accounts(id, name, contact_id)")
    .eq("token_hash", hashToken(token))
    .single();
  return { admin, onboardingRequest: data };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { admin, onboardingRequest } = await loadRequest(token);

  if (!onboardingRequest || !onboardingRequest.account) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  const spec = getFormSpec(onboardingRequest.form_key);
  if (!spec) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  // Expiry check
  if (
    ["pending", "viewed"].includes(onboardingRequest.status) &&
    onboardingRequest.expires_at &&
    new Date(onboardingRequest.expires_at) < new Date()
  ) {
    await admin
      .from("onboarding_requests")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", onboardingRequest.id);
    onboardingRequest.status = "expired";
  }

  if (onboardingRequest.status === "pending") {
    const { ip, userAgent } = clientMeta(request);
    await admin
      .from("onboarding_requests")
      .update({
        status: "viewed",
        viewed_at: new Date().toISOString(),
        submitter_ip: ip,
        submitter_user_agent: userAgent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", onboardingRequest.id);
    onboardingRequest.status = "viewed";
  }

  const view: PublicOnboardingView = {
    status: onboardingRequest.status,
    account_name: onboardingRequest.account.name,
    recipient_name: onboardingRequest.recipient_name,
    form: spec,
    access_grants: (onboardingRequest.access_grants as AccessGrant[]) ?? [],
    expires_at: onboardingRequest.expires_at,
  };
  if (onboardingRequest.status === "submitted") {
    view.responses = onboardingRequest.responses;
  }

  return NextResponse.json(view);
}

const submitSchema = z.object({
  responses: z.record(z.string(), z.union([z.string(), z.boolean()])),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const body = submitSchema.parse(await request.json());
    const { admin, onboardingRequest } = await loadRequest(token);

    if (!onboardingRequest || !onboardingRequest.account) {
      return NextResponse.json({ error: "Onboarding link not found" }, { status: 404 });
    }

    const spec = getFormSpec(onboardingRequest.form_key);
    if (!spec) {
      return NextResponse.json({ error: "Onboarding link not found" }, { status: 404 });
    }

    if (!["pending", "viewed"].includes(onboardingRequest.status)) {
      return NextResponse.json(
        { error: `This form can no longer be submitted (status: ${onboardingRequest.status})` },
        { status: 409 }
      );
    }
    if (onboardingRequest.expires_at && new Date(onboardingRequest.expires_at) < new Date()) {
      return NextResponse.json({ error: "This onboarding link has expired" }, { status: 410 });
    }

    const validation = validateResponses(spec, body.responses);
    if (!validation.ok) {
      return NextResponse.json(
        { error: "Please fill in all required fields", missing: validation.missing },
        { status: 400 }
      );
    }

    // Strip any keys not in the spec (plus allowed `${key}_detail` keys) —
    // never persist arbitrary client-supplied keys.
    const allowedKeys = new Set<string>();
    for (const field of allFields(spec)) {
      allowedKeys.add(field.key);
      if (field.detailWhen) allowedKeys.add(`${field.key}_detail`);
    }
    const cleanResponses: Record<string, string | boolean> = {};
    for (const [key, value] of Object.entries(body.responses)) {
      if (allowedKeys.has(key)) cleanResponses[key] = value;
    }

    const { ip, userAgent } = clientMeta(request);
    const submittedAt = new Date().toISOString();

    await admin
      .from("onboarding_requests")
      .update({
        status: "submitted",
        submitted_at: submittedAt,
        responses: cleanResponses,
        submitter_ip: ip,
        submitter_user_agent: userAgent,
        updated_at: submittedAt,
      })
      .eq("id", onboardingRequest.id);

    await admin.from("activities").insert({
      account_id: onboardingRequest.account_id,
      contact_id: onboardingRequest.account.contact_id,
      type: "onboarding_submitted",
      title: `Onboarding form submitted: ${spec.title}`,
      description: `Submitted by ${onboardingRequest.recipient_name ?? "client"} <${
        onboardingRequest.recipient_email ?? "unknown"
      }>`,
      metadata: { onboarding_request_id: onboardingRequest.id },
    });

    if (emailConfigured()) {
      const accountName = onboardingRequest.account.name;
      const recipientName = onboardingRequest.recipient_name ?? "Client";
      const formTitle = spec.title;
      const accountId = onboardingRequest.account_id;
      const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/$/, "");
      const adminUrl = `${baseUrl}/admin/accounts/${accountId}`;
      after(async () => {
        try {
          await sendOnboardingSubmittedEmail({
            accountName,
            recipientName,
            formTitle,
            adminUrl,
          });
        } catch (err) {
          console.error("Onboarding-submitted notification email failed:", err);
        }
      });
    }

    return NextResponse.json({ ok: true, confirmation: spec.confirmation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid submission", details: error.issues }, { status: 400 });
    }
    console.error("Onboarding submission error:", error);
    return NextResponse.json({ error: "Submission failed. Please try again." }, { status: 500 });
  }
}

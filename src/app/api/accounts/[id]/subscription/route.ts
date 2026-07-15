import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createMonthlySubscription,
  findExistingMonthlySubscription,
  getSavedMethod,
} from "@/lib/billing/subscription";

async function loadAccount(accountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, account: null };
  const { data: account } = await supabase
    .from("accounts")
    .select("id, name, contact_id, stripe_customer_id, setup_fee_paid_at")
    .eq("id", accountId)
    .single();
  return { user, account };
}

/** Preview: what would "Start subscription" do for this account? */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, account } = await loadAccount(id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  if (!account.stripe_customer_id) {
    return NextResponse.json({
      eligible: false,
      reason: "No Stripe customer linked — the setup-fee payment creates one.",
    });
  }
  if (!account.setup_fee_paid_at) {
    return NextResponse.json({
      eligible: false,
      reason: "Implementation fee has not been paid yet.",
    });
  }

  try {
    const existing = await findExistingMonthlySubscription(account.stripe_customer_id, id);
    if (existing) {
      return NextResponse.json({
        eligible: false,
        reason: `A monthly subscription already exists (status: ${existing.status}).`,
      });
    }
    const method = await getSavedMethod(account.stripe_customer_id);
    if (!method) {
      return NextResponse.json({
        eligible: false,
        reason: "No saved payment method found on the Stripe customer.",
      });
    }
    return NextResponse.json({
      eligible: true,
      method: { rail: method.rail, label: method.label },
      monthly_amount_cents: method.monthlyCents,
    });
  } catch (err) {
    console.error("Subscription preview error:", err);
    return NextResponse.json({ error: "Could not load Stripe details" }, { status: 500 });
  }
}

/** Start the monthly retainer — charges the saved method today (Service Start Date). */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, account } = await loadAccount(id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (!account.stripe_customer_id) {
    return NextResponse.json({ error: "No Stripe customer linked to this account" }, { status: 400 });
  }
  if (!account.setup_fee_paid_at) {
    return NextResponse.json(
      { error: "The implementation fee must be paid before starting the subscription" },
      { status: 409 }
    );
  }

  try {
    const existing = await findExistingMonthlySubscription(account.stripe_customer_id, id);
    if (existing) {
      return NextResponse.json(
        { error: `A monthly subscription already exists (status: ${existing.status})` },
        { status: 409 }
      );
    }

    const { subscription, method } = await createMonthlySubscription({
      customerId: account.stripe_customer_id,
      accountId: id,
      accountName: account.name,
    });

    const amount = (method.monthlyCents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "usd",
    });
    const admin = createAdminClient();
    await admin.from("activities").insert({
      account_id: id,
      contact_id: account.contact_id,
      type: "subscription_started",
      title: `Monthly subscription started: ${amount}/mo (${method.rail === "ach" ? "ACH" : "card"})`,
      description: `Service Start Date. Charging ${method.label} today and on this day each month. Started by ${user.email}.`,
      metadata: { subscription_id: subscription.id, rail: method.rail },
    });

    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      status: subscription.status,
      monthly_amount_cents: method.monthlyCents,
      method: { rail: method.rail, label: method.label },
    });
  } catch (err) {
    console.error("Subscription create error:", err);
    const message = err instanceof Error ? err.message : "Failed to start subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { AlertTriangle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import ApprovalClient, { type ApprovalActionView } from "./ApprovalClient";

export const metadata = {
  title: "Approve Fix | Triple 3 Labs",
  robots: { index: false, follow: false },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#030014] px-4 py-16 text-white">
      <div className="mx-auto max-w-xl">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wider text-white/30">
          Triple 3 Labs &middot; Fix Approval
        </p>
        {children}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Shell>
      <div className="glass-card rounded-xl p-8 text-center">
        <AlertTriangle size={32} className="mx-auto mb-4 text-amber-400" />
        <h1 className="mb-2 text-lg font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Link no longer valid
        </h1>
        <p className="text-sm text-white/50">{message}</p>
      </div>
    </Shell>
  );
}

// IMPORTANT: this page must remain side-effect free on GET. Discord (and other
// chat apps) prefetch link previews, so anything that mutates state here would
// silently auto-approve fixes the moment a link was pasted into a channel.
export default async function ApprovePage({
  params,
  searchParams,
}: {
  params: Promise<{ actionId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { actionId } = await params;
  const { token } = await searchParams;

  if (!token) {
    return <ErrorState message="This link is missing its approval token." />;
  }

  const admin = createAdminClient();
  const { data: action } = await admin
    .from("ticket_actions")
    .select(
      "*, ticket:tickets(id, ticket_number, subject, description, status, severity, account:accounts(name)), runbook:runbooks(key, title, description, tier)"
    )
    .eq("id", actionId)
    .maybeSingle();

  if (!action || !action.ticket) {
    return <ErrorState message="We couldn't find this fix request. It may have been removed." />;
  }

  if (action.approval_token !== token) {
    return <ErrorState message="This approval token doesn't match. Please use the original link from Discord." />;
  }

  if (action.status !== "proposed") {
    const decidedLabel =
      action.status === "approved"
        ? "already approved"
        : action.status === "rejected"
          ? "already rejected"
          : `already moved to "${action.status.replace("_", " ")}"`;
    return <ErrorState message={`This fix was ${decidedLabel} — no further action is needed.`} />;
  }

  const { data: diagnosis } = await admin
    .from("ticket_diagnoses")
    .select("category, summary, confidence, proposed_tier")
    .eq("ticket_id", action.ticket.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const view: ApprovalActionView = {
    id: action.id,
    tier: action.tier,
    action_params: action.action_params,
    ticket: {
      id: action.ticket.id,
      ticket_number: action.ticket.ticket_number,
      subject: action.ticket.subject,
      description: action.ticket.description,
      status: action.ticket.status,
      severity: action.ticket.severity,
      account_name: action.ticket.account?.name ?? null,
    },
    runbook: action.runbook
      ? {
          key: action.runbook.key,
          title: action.runbook.title,
          description: action.runbook.description,
          tier: action.runbook.tier,
        }
      : null,
    diagnosis: diagnosis
      ? {
          category: diagnosis.category,
          summary: diagnosis.summary,
          confidence: diagnosis.confidence,
          proposed_tier: diagnosis.proposed_tier,
        }
      : null,
  };

  return (
    <Shell>
      <ApprovalClient action={view} token={token} />
    </Shell>
  );
}

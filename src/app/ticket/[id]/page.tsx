import { AlertTriangle, Bot, Clock, User, UserCog } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatRelativeTime } from "@/lib/utils/format";
import CustomerReplyForm from "./CustomerReplyForm";
import type { TicketMessageAuthorType, TicketStatus } from "@/lib/crm/types";

export const metadata = {
  title: "Ticket Status | Triple 3 Labs",
  robots: { index: false, follow: false },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#030014] px-4 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wider text-white/30">
          Triple 3 Labs &middot; Ticket Status
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

const CUSTOMER_STATUS_LABELS: Record<TicketStatus, string> = {
  new: "Received",
  triaging: "Reviewing",
  awaiting_customer: "Waiting on you",
  pending_approval: "Fix in progress",
  fixing: "Fix in progress",
  verifying: "Fix in progress",
  resolved: "Resolved",
  escalated: "With our team",
  closed: "Closed",
};

const STATUS_COLORS: Record<string, string> = {
  new: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  triaging: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  awaiting_customer: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  pending_approval: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  fixing: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  verifying: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  resolved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  escalated: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  closed: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  normal: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  high: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  urgent: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

const authorStyles: Record<TicketMessageAuthorType, { icon: typeof User; bubble: string; iconWrap: string }> = {
  customer: {
    icon: User,
    bubble: "bg-white/[0.04] border-white/10",
    iconWrap: "bg-white/10 text-white/60",
  },
  ai: {
    icon: Bot,
    bubble: "bg-violet-500/[0.06] border-violet-500/20",
    iconWrap: "bg-violet-500/15 text-violet-300",
  },
  staff: {
    icon: UserCog,
    bubble: "bg-cyan-500/[0.06] border-cyan-500/20",
    iconWrap: "bg-cyan-500/15 text-cyan-300",
  },
  system: {
    icon: UserCog,
    bubble: "bg-white/[0.04] border-white/10",
    iconWrap: "bg-white/10 text-white/60",
  },
};

// IMPORTANT: this page must remain side-effect free on GET — it's a public,
// pre-authenticated link that may get prefetched by chat-app link previews.
export default async function CustomerTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) {
    return <ErrorState message="This link is missing its access token." />;
  }

  // Single conditional query — id + token together, uniform error either way,
  // so this page never acts as an oracle for whether a ticket id exists.
  const admin = createAdminClient();
  const { data: ticket } = await admin
    .from("tickets")
    .select("id, ticket_number, subject, status, severity, created_at, view_token")
    .eq("id", id)
    .eq("view_token", token)
    .maybeSingle();

  if (!ticket) {
    return <ErrorState message="This ticket link is invalid. Please use the original link from your email." />;
  }

  const { data: messages } = await admin
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticket.id)
    .eq("is_internal", false)
    .neq("author_type", "system")
    .order("created_at", { ascending: true });

  const status: TicketStatus = ticket.status;

  return (
    <Shell>
      <div className="glass-card rounded-xl p-6 sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-white/40">Ticket #{ticket.ticket_number}</p>
            <h1 className="mt-1 text-lg font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {ticket.subject}
            </h1>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
              SEVERITY_COLORS[ticket.severity] || SEVERITY_COLORS.normal
            }`}
          >
            {ticket.severity}
          </span>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
              STATUS_COLORS[status] || STATUS_COLORS.new
            }`}
          >
            {CUSTOMER_STATUS_LABELS[status] ?? "In progress"}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-white/40">
            <Clock size={12} /> Opened {formatDate(ticket.created_at)}
          </span>
        </div>

        <div className="rounded-lg bg-white/[0.03] p-4 sm:p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">Conversation</h3>
          {!messages || messages.length === 0 ? (
            <p className="py-4 text-center text-sm text-white/30">No messages yet.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => {
                const style = authorStyles[m.author_type as TicketMessageAuthorType] || authorStyles.staff;
                const Icon = style.icon;
                return (
                  <div key={m.id} className={`flex gap-3 rounded-lg border p-4 ${style.bubble}`}>
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.iconWrap}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-white/80">
                          {m.author_type === "customer" ? m.author_name || "You" : m.author_name || (m.author_type === "ai" ? "Triple 3 AI" : "Support")}
                        </span>
                        <span className="text-[10px] text-white/25">{formatRelativeTime(m.created_at)}</span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm text-white/70">{m.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <CustomerReplyForm ticketId={ticket.id} token={token} />
        </div>
      </div>
    </Shell>
  );
}

import { cn } from "@/lib/utils/cn";

interface TicketStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { label: string; colors: string }> = {
  new: { label: "New", colors: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  triaging: { label: "Triaging", colors: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
  awaiting_customer: { label: "Awaiting Customer", colors: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  pending_approval: { label: "Pending Approval", colors: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  fixing: { label: "Fixing", colors: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
  verifying: { label: "Verifying", colors: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  resolved: { label: "Resolved", colors: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  escalated: { label: "Escalated", colors: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  closed: { label: "Closed", colors: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

export default function TicketStatusBadge({ status, size = "sm" }: TicketStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, colors: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium whitespace-nowrap",
        config.colors,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      )}
    >
      {config.label}
    </span>
  );
}

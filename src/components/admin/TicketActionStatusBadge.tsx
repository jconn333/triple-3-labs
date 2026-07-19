import { cn } from "@/lib/utils/cn";

interface TicketActionStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { label: string; colors: string }> = {
  proposed: { label: "Proposed", colors: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  approved: { label: "Approved", colors: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  rejected: { label: "Rejected", colors: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  executing: { label: "Executing", colors: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
  executed: { label: "Executed", colors: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  verified: { label: "Verified", colors: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  failed: { label: "Failed", colors: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  rolled_back: { label: "Rolled Back", colors: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

export default function TicketActionStatusBadge({ status, size = "sm" }: TicketActionStatusBadgeProps) {
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

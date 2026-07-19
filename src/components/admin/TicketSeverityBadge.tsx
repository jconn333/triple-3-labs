import { cn } from "@/lib/utils/cn";

interface TicketSeverityBadgeProps {
  severity: string;
  size?: "sm" | "md";
}

const severityConfig: Record<string, { label: string; colors: string }> = {
  low: { label: "Low", colors: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  normal: { label: "Normal", colors: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  high: { label: "High", colors: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  urgent: { label: "Urgent", colors: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

export default function TicketSeverityBadge({ severity, size = "sm" }: TicketSeverityBadgeProps) {
  const config = severityConfig[severity] || { label: severity, colors: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium capitalize",
        config.colors,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      )}
    >
      {config.label}
    </span>
  );
}

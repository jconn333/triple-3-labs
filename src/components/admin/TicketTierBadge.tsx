import { cn } from "@/lib/utils/cn";

interface TicketTierBadgeProps {
  tier: number | null;
  size?: "sm" | "md";
}

const tierConfig: Record<number, { label: string; colors: string }> = {
  0: { label: "Tier 0 · Answer", colors: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  1: { label: "Tier 1 · Auto-fix", colors: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  2: { label: "Tier 2 · Approval", colors: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  3: { label: "Tier 3 · Escalate", colors: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

export default function TicketTierBadge({ tier, size = "sm" }: TicketTierBadgeProps) {
  if (tier === null || tier === undefined) return null;
  const config = tierConfig[tier] || { label: `Tier ${tier}`, colors: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };

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

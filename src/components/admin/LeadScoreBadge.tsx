import { cn } from "@/lib/utils/cn";

interface LeadScoreBadgeProps {
  score: number | string | null | undefined;
  size?: "sm" | "md";
}

export default function LeadScoreBadge({
  score,
  size = "sm",
}: LeadScoreBadgeProps) {
  const numScore = typeof score === "string" ? parseInt(score) : score;

  if (!numScore && numScore !== 0) return null;

  const label = numScore >= 70 ? "Hot" : numScore >= 40 ? "Warm" : "Cold";
  const colors =
    numScore >= 70
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : numScore >= 40
        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        colors,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      )}
    >
      {label} · {numScore}
    </span>
  );
}

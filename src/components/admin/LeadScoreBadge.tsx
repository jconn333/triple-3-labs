import { StatusBadge } from "@/components/ui";

interface LeadScoreBadgeProps {
  score: number | string | null | undefined;
  /** Kept for API compatibility with existing callers — always renders at kit "md". */
  size?: "sm" | "md";
}

/** Score → hot/warm/cold, rendered as the kit's lead StatusBadge. */
export default function LeadScoreBadge({ score }: LeadScoreBadgeProps) {
  const numScore = typeof score === "string" ? parseInt(score) : score;

  if (!numScore && numScore !== 0) return null;

  const label = numScore >= 70 ? "hot" : numScore >= 40 ? "warm" : "cold";

  return <StatusBadge kind="lead" value={label} size="md" />;
}

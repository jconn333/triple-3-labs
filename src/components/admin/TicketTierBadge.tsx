import { TierBadge } from "@/components/ui";

interface TicketTierBadgeProps {
  tier: number | null;
  size?: "sm" | "md";
}

/** Thin wrapper over the kit's TierBadge — old "sm"/"md" both map to kit "md" (22px). */
export default function TicketTierBadge({ tier }: TicketTierBadgeProps) {
  return <TierBadge tier={tier} size="md" />;
}

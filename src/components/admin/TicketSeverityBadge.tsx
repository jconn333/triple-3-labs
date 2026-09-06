import { StatusBadge } from "@/components/ui";

interface TicketSeverityBadgeProps {
  severity: string;
  size?: "sm" | "md";
}

/** Thin wrapper over the kit's StatusBadge — old "sm"/"md" both map to kit "md" (22px). */
export default function TicketSeverityBadge({ severity }: TicketSeverityBadgeProps) {
  return <StatusBadge kind="severity" value={severity} size="md" />;
}

import { StatusBadge } from "@/components/ui";

interface TicketStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

/** Thin wrapper over the kit's StatusBadge — old "sm"/"md" both map to kit "md" (22px). */
export default function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  return <StatusBadge kind="ticket" value={status} size="md" />;
}

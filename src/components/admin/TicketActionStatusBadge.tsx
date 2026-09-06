import { StatusBadge } from "@/components/ui";

interface TicketActionStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

/** Thin wrapper over the kit's StatusBadge — old "sm"/"md" both map to kit "md" (22px). */
export default function TicketActionStatusBadge({ status }: TicketActionStatusBadgeProps) {
  return <StatusBadge kind="action" value={status} size="md" />;
}

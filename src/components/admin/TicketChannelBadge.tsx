import { StatusBadge } from "@/components/ui";

interface TicketChannelBadgeProps {
  channel: string;
  size?: "sm" | "md";
}

/** Thin wrapper over the kit's StatusBadge — old "sm"/"md" both map to kit "md" (22px). */
export default function TicketChannelBadge({ channel }: TicketChannelBadgeProps) {
  return <StatusBadge kind="channel" value={channel} size="md" />;
}

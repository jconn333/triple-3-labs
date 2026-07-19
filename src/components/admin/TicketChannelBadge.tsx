import { cn } from "@/lib/utils/cn";

interface TicketChannelBadgeProps {
  channel: string;
  size?: "sm" | "md";
}

const channelConfig: Record<string, { label: string; colors: string }> = {
  portal: { label: "Portal", colors: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
  email: { label: "Email", colors: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  internal: { label: "Internal", colors: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  canary: { label: "Canary", colors: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
};

export default function TicketChannelBadge({ channel, size = "sm" }: TicketChannelBadgeProps) {
  const config = channelConfig[channel] || { label: channel, colors: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };

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

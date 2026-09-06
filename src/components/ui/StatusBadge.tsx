import { Badge } from "./Badge";
import {
  accountStatusTone,
  contractStatusTone,
  invoiceStatusTone,
  leadScoreTone,
  onboardingStatusTone,
  subscriptionStatusTone,
  ticketActionStatusTone,
  ticketChannelTone,
  ticketSeverityTone,
  ticketStatusTone,
  toneFor,
} from "./tones";

const maps = {
  account: accountStatusTone,
  contract: contractStatusTone,
  onboarding: onboardingStatusTone,
  ticket: ticketStatusTone,
  severity: ticketSeverityTone,
  channel: ticketChannelTone,
  action: ticketActionStatusTone,
  lead: leadScoreTone,
  subscription: subscriptionStatusTone,
  invoice: invoiceStatusTone,
} as const;

export type StatusKind = keyof typeof maps;

/** `<StatusBadge kind="ticket" value={ticket.status} />` — the only way a state gets a color. */
export function StatusBadge({
  kind,
  value,
  size,
  className,
}: {
  kind: StatusKind;
  value: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}) {
  const t = toneFor(maps[kind], value);
  return (
    <Badge tone={t.tone} dot={t.dot} size={size} className={className}>
      {t.label}
    </Badge>
  );
}

export function TierBadge({ tier, size }: { tier: number | null | undefined; size?: "sm" | "md" }) {
  if (tier === null || tier === undefined) return <span className="text-ink-3">—</span>;
  return (
    <Badge tone={tier === 0 ? "neutral" : tier === 1 ? "accent" : "warn"} size={size}>
      Tier {tier}
    </Badge>
  );
}

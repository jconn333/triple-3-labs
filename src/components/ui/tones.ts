import type { Tone } from "./Badge";

/** One place that decides what color a state gets. Color = state, nothing else. */

type ToneMap = Record<string, { label: string; tone: Tone; dot?: boolean }>;

export const accountStatusTone: ToneMap = {
  active: { label: "Active", tone: "good", dot: true },
  onboarding: { label: "Onboarding", tone: "warn", dot: true },
  at_risk: { label: "At risk", tone: "bad", dot: true },
  paused: { label: "Paused", tone: "warn", dot: true },
  churned: { label: "Churned", tone: "bad", dot: true },
};

export const contractStatusTone: ToneMap = {
  draft: { label: "Draft", tone: "neutral" },
  sent: { label: "Sent", tone: "accent" },
  partially_signed: { label: "Partially signed", tone: "warn" },
  signed: { label: "Signed", tone: "good" },
  expired: { label: "Expired", tone: "warn" },
  cancelled: { label: "Cancelled", tone: "bad" },
};

export const onboardingStatusTone: ToneMap = {
  pending: { label: "Pending", tone: "neutral" },
  viewed: { label: "Viewed", tone: "accent" },
  submitted: { label: "Submitted", tone: "good" },
  expired: { label: "Expired", tone: "warn" },
  cancelled: { label: "Cancelled", tone: "bad" },
};

export const ticketStatusTone: ToneMap = {
  new: { label: "New", tone: "accent" },
  triaging: { label: "Triaging", tone: "accent" },
  awaiting_customer: { label: "Awaiting customer", tone: "warn" },
  pending_approval: { label: "Pending approval", tone: "warn" },
  fixing: { label: "Fixing", tone: "accent" },
  verifying: { label: "Verifying", tone: "accent" },
  resolved: { label: "Resolved", tone: "good" },
  escalated: { label: "Escalated", tone: "bad", dot: true },
  closed: { label: "Closed", tone: "neutral" },
};

export const ticketSeverityTone: ToneMap = {
  low: { label: "Low", tone: "neutral" },
  normal: { label: "Normal", tone: "neutral" },
  high: { label: "High", tone: "warn" },
  urgent: { label: "Urgent", tone: "bad" },
};

export const ticketChannelTone: ToneMap = {
  portal: { label: "Portal", tone: "neutral" },
  email: { label: "Email", tone: "neutral" },
  internal: { label: "Internal", tone: "neutral" },
  canary: { label: "Canary", tone: "neutral" },
  pingo: { label: "Pingo", tone: "neutral" },
};

export const ticketActionStatusTone: ToneMap = {
  proposed: { label: "Proposed", tone: "neutral" },
  approved: { label: "Approved", tone: "accent" },
  rejected: { label: "Rejected", tone: "bad" },
  executing: { label: "Executing", tone: "accent" },
  executed: { label: "Executed", tone: "good" },
  verified: { label: "Verified", tone: "good" },
  failed: { label: "Failed", tone: "bad" },
  rolled_back: { label: "Rolled back", tone: "warn" },
};

export const leadScoreTone: ToneMap = {
  hot: { label: "Hot", tone: "good" },
  warm: { label: "Warm", tone: "warn" },
  cold: { label: "Cold", tone: "neutral" },
};

export const subscriptionStatusTone: ToneMap = {
  active: { label: "Active", tone: "good", dot: true },
  trialing: { label: "Trialing", tone: "accent" },
  past_due: { label: "Past due", tone: "warn", dot: true },
  unpaid: { label: "Unpaid", tone: "bad" },
  canceled: { label: "Canceled", tone: "neutral" },
  incomplete: { label: "Incomplete", tone: "warn" },
  incomplete_expired: { label: "Expired", tone: "neutral" },
  paused: { label: "Paused", tone: "warn" },
};

export const invoiceStatusTone: ToneMap = {
  paid: { label: "Paid", tone: "good" },
  open: { label: "Open", tone: "warn" },
  draft: { label: "Draft", tone: "neutral" },
  void: { label: "Void", tone: "neutral" },
  uncollectible: { label: "Uncollectible", tone: "bad" },
};

export const dealStageTone = (stageName: string, isClosed: boolean): { tone: Tone } => {
  const n = stageName.toLowerCase();
  if (n.includes("won")) return { tone: "good" };
  if (isClosed) return { tone: "neutral" };
  return { tone: "neutral" };
};

export function toneFor(map: ToneMap, value: string | null | undefined, fallbackLabel?: string) {
  if (value && map[value]) return map[value];
  return { label: fallbackLabel ?? (value ? value.replace(/_/g, " ") : "—"), tone: "neutral" as Tone };
}

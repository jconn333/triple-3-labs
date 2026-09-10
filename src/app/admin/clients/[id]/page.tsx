"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  PenLine,
  RefreshCw,
  Stamp,
  Trash2,
  X,
} from "lucide-react";
import { formatDate, formatRelativeTime, formatCurrency } from "@/lib/utils/format";
import { isWebUrl } from "@/lib/crm/links";
import { isOverdue } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { PageHeader } from "@/components/admin/PageHeader";
import { RecordShell, Fact, Details } from "@/components/admin/RecordShell";
import ContractUploadModal from "@/components/admin/ContractUploadModal";
import SendSignatureModal from "@/components/admin/SendSignatureModal";
import CounterSignModal from "@/components/admin/CounterSignModal";
import StartSubscriptionModal from "@/components/admin/StartSubscriptionModal";
import SendOnboardingModal from "@/components/admin/SendOnboardingModal";
import DealStageControl from "@/components/admin/DealStageControl";
import {
  Badge,
  Button,
  ButtonAnchor,
  EmptyState,
  Input,
  Panel,
  PanelHeader,
  PanelRows,
  PanelSkeleton,
  Segmented,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { getFormSpec } from "@/lib/onboarding/forms";
import type {
  Account,
  Activity,
  Contract,
  Deal,
  InvoiceSummary,
  OnboardingRequest,
  SubscriptionSummary,
} from "@/lib/crm/types";

// ---------- types for the extra data the account API now returns ----------

interface Commitment {
  id: string;
  name: string;
  kind: string;
  cadence: string | null;
  next_due: string | null;
  active: boolean;
  grace_days?: number | null;
  has_delivery?: boolean;
}
interface Delivery {
  id: string;
  commitment_id: string;
  summary: string | null;
  delivered_at: string;
  delivered_by?: string | null;
}
interface ClientLink {
  id: string;
  kind: string;
  title: string;
  url: string;
  views: number | null;
  lastViewed: string | null;
  createdAt: string;
}

type Tab = "activity" | "services" | "contracts" | "onboarding" | "links";
type ActivityFilter = "all" | "agent" | "billing" | "you";

const LINK_KIND_LABEL: Record<string, string> = {
  audit: "Audit",
  proposal: "Proposal",
  report: "Report",
  website: "Website",
  ads_plan: "Ads plan",
  contract: "Contract",
  onboarding: "Onboard",
  dossier: "Dossier",
  code: "Code",
  other: "Doc",
};

const label = "text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3";

/** Timeline classification: who did it drives the dot color. */
function classify(type: string): { who: "agent" | "billing" | "you" | "client"; tone: "accent" | "good" | "neutral" } {
  const t = type.toLowerCase();
  if (t.includes("delivery") || t.includes("agent") || t.startsWith("ai_")) return { who: "agent", tone: "accent" };
  if (t.includes("payment") || t.includes("subscription") || t.includes("invoice") || t.includes("fee") || t.includes("stripe"))
    return { who: "billing", tone: "good" };
  if (t.includes("onboarding_submitted") || t.includes("signed") || t.includes("form_submission")) return { who: "client", tone: "neutral" };
  return { who: "you", tone: "neutral" };
}

export default function ClientPage() {
  const { id } = useParams<{ id: string }>();
  // Dirty drafts and pending requests belong to this record only.
  return <ClientRecord key={id} id={id} />;
}

function ClientRecord({ id }: { id: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [links, setLinks] = useState<ClientLink[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [subsLoading, setSubsLoading] = useState(true);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [sigContract, setSigContract] = useState<Contract | null>(null);
  const [counterSignContract, setCounterSignContract] = useState<Contract | null>(null);
  const [showStartSub, setShowStartSub] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingRequests, setOnboardingRequests] = useState<OnboardingRequest[]>([]);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [resendResult, setResendResult] = useState<{
    requestId: string;
    onboarding_url: string;
    email_sent: boolean;
    email_error?: string;
  } | null>(null);
  const [resendCopied, setResendCopied] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const notesTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const notesDirtyRef = useRef(false);
  const notesSequenceRef = useRef(0);
  const notesSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [tab, setTab] = useState<Tab>("activity");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");

  const fetchAccount = useCallback(async () => {
    const notesSequence = notesSequenceRef.current;
    const notesWereDirty = notesDirtyRef.current;
    try {
      const res = await fetch(`/api/accounts/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAccount(data.account);
      setContracts(data.contracts || []);
      setActivities(data.activities || []);
      setDeals(data.deals || []);
      setCommitments(data.commitments || []);
      setDeliveries(data.deliveries || []);
      setLinks(data.links || []);
      if (!notesWereDirty && !notesDirtyRef.current && notesSequence === notesSequenceRef.current) {
        setNotes(data.account.notes || "");
      }
    } catch {
      toast.error("Failed to load client");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const fetchStripeData = useCallback(async () => {
    setSubsLoading(true);
    try {
      const res = await fetch(`/api/accounts/${id}/subscriptions`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(res.status === 401 ? "Session expired; reload this page." : data.error || "Failed to load billing");
      setSubscriptions(data.subscriptions || []);
      setInvoices(data.invoices || []);
      setBillingError(null);
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : "Failed to load billing");
    } finally {
      setSubsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStripeData();
  }, [fetchStripeData]);

  const fetchOnboarding = useCallback(async () => {
    try {
      const res = await fetch(`/api/accounts/${id}/onboarding`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOnboardingRequests(data.requests || []);
    } catch {
      // optional
    } finally {
      setOnboardingLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOnboarding();
  }, [fetchOnboarding]);

  async function handleCancelOnboarding(requestId: string) {
    if (!confirm("Cancel this onboarding request? The recipient's link will stop working.")) return;
    try {
      const res = await fetch(`/api/accounts/${id}/onboarding?requestId=${requestId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Onboarding request cancelled");
      fetchOnboarding();
    } catch {
      toast.error("Failed to cancel onboarding request");
    }
  }

  async function handleResendOnboarding(r: OnboardingRequest) {
    if (!confirm("Generate a new link? The previous link will stop working immediately.")) return;
    setResending(r.id);
    try {
      const res = await fetch(`/api/accounts/${id}/onboarding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: r.id, send_email: Boolean(r.recipient_email) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend link");
      setResendResult({
        requestId: r.id,
        onboarding_url: data.onboarding_url,
        email_sent: data.email_sent,
        email_error: data.email_error,
      });
      toast.success(data.email_sent ? "New link emailed" : "New link generated");
      fetchOnboarding();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend onboarding link");
    } finally {
      setResending(null);
    }
  }

  async function copyResendLink() {
    if (!resendResult) return;
    await navigator.clipboard.writeText(resendResult.onboarding_url);
    setResendCopied(true);
    setTimeout(() => setResendCopied(false), 2000);
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    notesDirtyRef.current = true;
    const sequence = ++notesSequenceRef.current;
    setNotesSaved("saving");
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => {
      // Serialize requests as well as guarding UI state: an older PATCH must
      // finish before the newer draft can be written to the database.
      notesSaveQueueRef.current = notesSaveQueueRef.current.then(async () => {
        if (sequence !== notesSequenceRef.current) return;
        try {
          const res = await fetch(`/api/accounts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: value }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(res.status === 401 ? "Session expired; reload after copying your notes." : data.error || "Failed to save notes");
          }
          if (sequence === notesSequenceRef.current) {
            notesDirtyRef.current = false;
            setNotesSaved("saved");
          }
        } catch (err) {
          if (sequence === notesSequenceRef.current) setNotesSaved("error");
          toast.error(err instanceof Error ? err.message : "Failed to save notes");
        }
      });
    }, 1000);
  }

  async function handleStatusChange(newStatus: string) {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAccount(data.account);
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDownload(contractId: string) {
    try {
      const res = await fetch(`/api/accounts/${id}/contracts/${contractId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      window.open(data.download_url, "_blank");
    } catch {
      toast.error("Failed to get download link");
    }
  }

  async function handleDeleteContract(contractId: string, title: string) {
    if (!confirm(`Delete contract "${title}"?`)) return;
    try {
      const res = await fetch(`/api/accounts/${id}/contracts/${contractId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete contract");
      }
      setContracts((prev) => prev.filter((c) => c.id !== contractId));
      toast.success("Contract deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete contract");
    }
  }

  // ---------- derived ----------

  const timeline = useMemo(() => {
    const items = [
      ...activities.map((a) => ({
        id: `a-${a.id}`,
        at: a.created_at,
        title: a.title,
        description: a.description,
        ...classify(a.type),
      })),
      ...deliveries.map((d) => ({
        id: `d-${d.id}`,
        at: d.delivered_at,
        title: d.summary ?? "Delivery logged",
        description: commitments.find((c) => c.id === d.commitment_id)?.name ?? null,
        who: "agent" as const,
        tone: "accent" as const,
      })),
    ].sort((a, b) => (a.at < b.at ? 1 : -1));
    if (activityFilter === "all") return items;
    return items.filter((i) => (activityFilter === "you" ? i.who === "you" || i.who === "client" : i.who === activityFilter));
  }, [activities, deliveries, commitments, activityFilter]);

  const activeSub = subscriptions.find((s) => !["canceled", "incomplete_expired"].includes(s.status));
  const contact = account?.contact;
  const contactName = contact ? `${contact.first_name} ${contact.last_name}`.trim() : "";
  const signedRoles = (c: Contract) =>
    new Set((c.signatures || []).filter((s) => s.status === "signed").map((s) => s.signer_role));
  const onboardingTimestamp = (r: OnboardingRequest) => {
    if (r.status === "submitted" && r.submitted_at) return `Submitted ${formatDate(r.submitted_at)}`;
    if (r.status === "viewed" && r.viewed_at) return `Viewed ${formatDate(r.viewed_at)}`;
    if (r.status === "cancelled") return `Sent ${r.sent_at ? formatDate(r.sent_at) : "—"} · cancelled`;
    if (r.status === "expired") return `Expired ${r.expires_at ? formatDate(r.expires_at) : ""}`;
    return r.sent_at ? `Sent ${formatDate(r.sent_at)}` : `Created ${formatDate(r.created_at)}`;
  };

  // ---------- states ----------

  if (loading) {
    return (
      <>
        <PageHeader title="Client" crumb={{ label: "Clients", href: "/admin/clients" }} />
        <div className="flex flex-col gap-5">
          <PanelSkeleton rows={2} />
          <PanelSkeleton rows={6} />
        </div>
      </>
    );
  }

  if (notFound || !account) {
    return (
      <>
        <PageHeader title="Not found" crumb={{ label: "Clients", href: "/admin/clients" }} />
        <Panel>
          <EmptyState title="Client not found" body="It may have been deleted, or the link is out of date." />
        </Panel>
      </>
    );
  }

  const mrrLine = account.mrr ? `${formatCurrency(account.mrr)} / mo` : activeSub ? `${formatCurrency(activeSub.items[0]?.price_amount ?? 0)} / ${activeSub.items[0]?.price_interval ?? "mo"}` : null;

  return (
    <>
      <PageHeader title={account.name} crumb={{ label: "Clients", href: "/admin/clients" }} />
      <RecordShell<Tab>
        title={account.name}
        status={<StatusBadge kind="account" value={account.status} />}
        facts={
          <>
            {mrrLine && <Fact>{mrrLine}</Fact>}
            {contact && (
              <Fact>
                <Link href={`/admin/people/${contact.id}`} className="hover:underline">
                  {contactName}
                </Link>
                {contact.email && (
                  <>
                    {" "}
                    <a href={`mailto:${contact.email}`} className="font-normal text-ink-2 hover:underline">
                      {contact.email}
                    </a>
                  </>
                )}
              </Fact>
            )}
            <Fact label="Client since">{formatDate(account.created_at)}</Fact>
            {activeSub && (
              <Fact label="Renews">
                {formatDate(activeSub.current_period_end)}
                {activeSub.default_payment_method && (
                  <span className="font-normal text-ink-2">
                    {" "}· {activeSub.default_payment_method.brand} ···· {activeSub.default_payment_method.last4}
                  </span>
                )}
              </Fact>
            )}
          </>
        }
        actions={
          <>
            <Button onClick={() => setShowOnboarding(true)}>Send onboarding</Button>
            <Button onClick={() => setShowUpload(true)}>Upload contract</Button>
            {account.stripe_customer_id && (
              <ButtonAnchor
                href={`https://dashboard.stripe.com/customers/${account.stripe_customer_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe <ExternalLink size={13} />
              </ButtonAnchor>
            )}
          </>
        }
        tabs={[
          { key: "activity", label: "Activity" },
          { key: "services", label: "Services & billing" },
          { key: "contracts", label: "Contracts", count: contracts.length || null },
          { key: "onboarding", label: "Onboarding", count: onboardingRequests.length || null },
          { key: "links", label: "Links & docs", count: links.length || null },
        ]}
        tab={tab}
        onTab={setTab}
        rail={
          <>
            <Panel>
              <PanelHeader title="Details" />
              <div className="px-4 pt-3">
                <label className={label} htmlFor="account-status">
                  Status
                </label>
                <Select id="account-status" value={account.status} onChange={(e) => handleStatusChange(e.target.value)} className="mt-1">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="churned">Churned</option>
                </Select>
              </div>
              <Details
                items={[
                  { label: "Company", value: contact?.company ?? account.name },
                  { label: "Contact", value: contact ? <Link href={`/admin/people/${contact.id}`} className="hover:underline">{contactName}</Link> : null },
                  { label: "Email", value: contact?.email ? <a href={`mailto:${contact.email}`} className="break-all hover:underline">{contact.email}</a> : null },
                  { label: "Phone", value: contact?.phone ?? null },
                  { label: "Billing", value: account.stripe_customer_id ? "Stripe linked" : <span className="font-medium text-warn">Not set up</span> },
                  {
                    label: "Setup fee",
                    value: !account.setup_fee_cents
                      ? "None"
                      : account.setup_fee_paid_at
                        ? `Paid ${formatDate(account.setup_fee_paid_at)}`
                        : <span className="font-medium text-warn">{formatCurrency(account.setup_fee_cents / 100)} unpaid</span>,
                  },
                ]}
              />
            </Panel>

            {deals.length > 0 && (
              <Panel>
                <PanelHeader title="Deals" count={deals.length} />
                <PanelRows>
                  {deals.map((deal) => (
                    <div key={deal.id} className="px-4 py-3">
                      <p className="text-sm font-medium text-ink">{deal.name}</p>
                      <p className="mt-0.5 text-sub text-ink-2">
                        {deal.amount ? formatCurrency(deal.amount) : "No amount"}
                        {deal.stage && <> · {(deal.stage as { name?: string }).name}</>}
                      </p>
                      <div className="mt-2">
                        <DealStageControl deal={deal} onChanged={fetchAccount} />
                      </div>
                    </div>
                  ))}
                </PanelRows>
              </Panel>
            )}

            <Panel>
              <PanelHeader title="Notes">
                <span className="text-xs text-ink-3">
                  {notesSaved === "saving" ? "Saving…" : notesSaved === "saved" ? "Saved" : notesSaved === "error" ? "Not saved" : "Autosaves"}
                </span>
                {notesSaved === "error" && <Button size="sm" onClick={() => handleNotesChange(notes)}>Retry</Button>}
              </PanelHeader>
              <div className="p-3">
                <Textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Anything worth remembering about this client…"
                  rows={6}
                  className="min-h-32 border-transparent bg-transparent px-1 py-1 focus:border-line-strong focus:bg-surface"
                />
              </div>
            </Panel>
          </>
        }
      >
        {/* ---------- Activity ---------- */}
        {tab === "activity" && (
          <Panel>
            <PanelHeader title="Activity" count={timeline.length}>
              <Segmented<ActivityFilter>
                value={activityFilter}
                onChange={setActivityFilter}
                ariaLabel="Activity filter"
                options={[
                  { value: "all", label: "All" },
                  { value: "agent", label: "Agent" },
                  { value: "billing", label: "Billing" },
                  { value: "you", label: "You & client" },
                ]}
              />
            </PanelHeader>
            {timeline.length === 0 ? (
              <EmptyState title="No activity yet" body="Deliveries, payments, signatures and notes will show up here." />
            ) : (
              <ul className="divide-y divide-line">
                {timeline.map((item) => (
                  <li key={item.id} className="grid grid-cols-[76px_14px_minmax(0,1fr)] items-start gap-3 px-4 py-2.5">
                    <time className="pt-0.5 text-xs tabular-nums text-ink-3" title={new Date(item.at).toLocaleString()}>
                      {formatRelativeTime(item.at)}
                    </time>
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 h-2 w-2 justify-self-center rounded-full",
                        item.tone === "accent" ? "bg-accent" : item.tone === "good" ? "bg-good" : "bg-line-strong",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-ink">{item.title}</p>
                      {item.description && <p className="mt-0.5 text-sub text-ink-2">{item.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        {/* ---------- Services & billing ---------- */}
        {tab === "services" && (
          <>
            <Panel>
              <PanelHeader title="Subscriptions">
                {account.setup_fee_cents ? (
                  <Badge tone={account.setup_fee_paid_at ? "good" : "warn"}>
                    {account.setup_fee_paid_at ? "Setup fee paid" : "Setup fee unpaid"}
                  </Badge>
                ) : (
                  <Badge>No setup fee</Badge>
                )}
                {account.setup_fee_paid_at && account.stripe_customer_id && !activeSub && (
                  <Button size="sm" variant="primary" disabled={subsLoading || !!billingError} onClick={() => setShowStartSub(true)}>
                    Start subscription
                  </Button>
                )}
              </PanelHeader>
              {billingError ? (
                <div role="alert" className="flex items-center gap-3 px-4 py-3 text-sm text-bad">
                  <span className="flex-1">{billingError}</span>
                  <Button size="sm" onClick={fetchStripeData} loading={subsLoading}>Retry</Button>
                </div>
              ) : subsLoading ? (
                <div className="p-4">
                  <PanelSkeleton rows={1} />
                </div>
              ) : subscriptions.length === 0 ? (
                <EmptyState
                  compact
                  title={account.stripe_customer_id ? "No active subscriptions" : "No Stripe customer linked"}
                  body={account.stripe_customer_id ? undefined : "The customer is created when the setup fee is paid."}
                />
              ) : (
                <PanelRows>
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                      <span className="text-sm font-medium text-ink">{sub.items.map((i) => i.product_name).join(", ")}</span>
                      <span className="text-sub text-ink-2">
                        {sub.items.map((item, i) => (
                          <span key={i}>
                            {formatCurrency(item.price_amount)}/{item.price_interval}
                            {item.quantity > 1 && ` × ${item.quantity}`}
                          </span>
                        ))}
                        {" · "}Renews {formatDate(sub.current_period_end)}
                        {sub.default_payment_method && (
                          <> · {sub.default_payment_method.brand} ···· {sub.default_payment_method.last4}</>
                        )}
                      </span>
                      <span className="ml-auto">
                        <StatusBadge kind="subscription" value={sub.status} />
                      </span>
                      {sub.cancel_at_period_end && <span className="w-full text-sub text-warn">Cancels at end of period</span>}
                    </div>
                  ))}
                </PanelRows>
              )}
            </Panel>

            <Panel>
              <PanelHeader title="Commitments" count={commitments.filter((c) => c.active).length || null} sub="what we owe them" />
              {commitments.length === 0 ? (
                <EmptyState compact title="No commitments recorded" body="Zeke adds these when a deal closes or you tell him what was promised." />
              ) : (
                <PanelRows>
                  {commitments.map((c) => {
                    const delivered = c.kind === "one_time" && (c.has_delivery || deliveries.some((d) => d.commitment_id === c.id));
                    const overdue = c.active && !delivered && isOverdue(c.next_due, c.grace_days);
                    const unanchored = c.kind === "recurring" && !c.next_due && c.active;
                    const last = deliveries.filter((d) => d.commitment_id === c.id)[0];
                    return (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm", c.active ? "text-ink" : "text-ink-3 line-through")}>{c.name}</p>
                          <p className="text-xs text-ink-3">
                            {c.kind}
                            {c.cadence ? ` · ${c.cadence}` : ""}
                            {last ? ` · last ${formatRelativeTime(last.delivered_at)}` : ""}
                          </p>
                        </div>
                        {delivered ? (
                          <Badge tone="good">Delivered</Badge>
                        ) : !c.active ? (
                          <Badge>Closed</Badge>
                        ) : overdue ? (
                          <Badge tone="bad" dot>Overdue {formatDate(c.next_due!)}</Badge>
                        ) : unanchored ? (
                          <Badge tone="warn" dot>Not scheduled</Badge>
                        ) : c.next_due ? (
                          <Badge tone="good">Due {formatDate(c.next_due)}</Badge>
                        ) : (
                          <Badge tone="good" dot>Ongoing</Badge>
                        )}
                      </div>
                    );
                  })}
                </PanelRows>
              )}
            </Panel>

            {!billingError && !subsLoading && invoices.length > 0 && (
              <Panel>
                <PanelHeader title="Invoices" count={invoices.length} />
                <PanelRows>
                  {invoices.slice(0, 8).map((inv) => (
                    <div key={inv.id} className="flex items-center gap-4 px-4 py-2.5 text-sm">
                      <span className="w-36 truncate font-ui-mono text-xs text-ink-2">{inv.number || inv.id.slice(0, 12)}</span>
                      <span className="text-sub text-ink-2">{formatDate(inv.created)}</span>
                      <span className="ml-auto tabular-nums text-ink">{formatCurrency(inv.amount_due)}</span>
                      <StatusBadge kind="invoice" value={inv.status} />
                      {inv.hosted_invoice_url ? (
                        <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-ink" aria-label="Open invoice">
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="w-3.5" />
                      )}
                    </div>
                  ))}
                </PanelRows>
              </Panel>
            )}
          </>
        )}

        {/* ---------- Contracts ---------- */}
        {tab === "contracts" && (
          <Panel>
            <PanelHeader title="Contracts" count={contracts.length || null}>
              <Button size="sm" onClick={() => setShowUpload(true)}>
                Upload
              </Button>
            </PanelHeader>
            {contracts.length === 0 ? (
              <EmptyState title="No contracts yet" body="Upload the services agreement, counter-sign it, then send it for signature." action={<Button onClick={() => setShowUpload(true)}>Upload contract</Button>} />
            ) : (
              <PanelRows>
                {contracts.map((c) => {
                  const roles = signedRoles(c);
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{c.title}</p>
                        <p className="truncate text-xs text-ink-3">
                          {c.file_name} · {formatDate(c.created_at)}
                          {roles.size > 0 && (
                            <>
                              {" · "}Signed by {roles.has("provider") ? "JMC" : ""}
                              {roles.size === 2 ? " + " : ""}
                              {roles.has("client") ? "client" : ""}
                              {roles.size < 2 && <span className="text-warn"> · awaiting {roles.has("provider") ? "client" : "JMC"}</span>}
                            </>
                          )}
                        </p>
                      </div>
                      <StatusBadge kind="contract" value={c.status} />
                      <div className="flex items-center gap-0.5">
                        {!roles.has("provider") && (
                          <Button variant="ghost" size="icon-sm" onClick={() => setCounterSignContract(c)} title="Counter-sign as JMC" aria-label="Counter-sign">
                            <Stamp size={15} />
                          </Button>
                        )}
                        {!roles.has("client") && (
                          <Button variant="ghost" size="icon-sm" onClick={() => setSigContract(c)} title="Send to client for signature" aria-label="Send for signature">
                            <PenLine size={15} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDownload(c.id)} title="Download" aria-label="Download">
                          <Download size={15} />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteContract(c.id, c.title)} title="Delete" aria-label="Delete" className="hover:text-bad">
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </PanelRows>
            )}
          </Panel>
        )}

        {/* ---------- Onboarding ---------- */}
        {tab === "onboarding" && (
          <>
            {onboardingLoading ? (
              <PanelSkeleton rows={2} />
            ) : onboardingRequests.length === 0 ? (
              <Panel>
                <EmptyState title="No onboarding requests yet" body="Send the getting-started form to collect access and goals." action={<Button onClick={() => setShowOnboarding(true)}>Send onboarding</Button>} />
              </Panel>
            ) : (
              onboardingRequests.map((r) => {
                const spec = getFormSpec(r.form_key);
                const isOpen = r.status === "pending" || r.status === "viewed";
                return (
                  <Panel key={r.id}>
                    <PanelHeader title={spec?.title || r.form_key} sub={onboardingTimestamp(r)}>
                      <StatusBadge kind="onboarding" value={r.status} />
                      {r.status !== "submitted" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleResendOnboarding(r)}
                          disabled={resending === r.id}
                          title="Resend link (generates a fresh link; the old one stops working)"
                          aria-label="Resend link"
                        >
                          <RefreshCw size={14} className={resending === r.id ? "animate-spin" : ""} />
                        </Button>
                      )}
                      {isOpen && (
                        <Button variant="ghost" size="icon-sm" onClick={() => handleCancelOnboarding(r.id)} title="Cancel request" aria-label="Cancel request" className="hover:text-bad">
                          <X size={14} />
                        </Button>
                      )}
                    </PanelHeader>
                    <div className="px-4 py-2 text-sub text-ink-2">
                      {r.recipient_name ? `${r.recipient_name} · ` : ""}
                      {r.recipient_email}
                    </div>

                    {resendResult && resendResult.requestId === r.id && (
                      <div className="mx-4 mb-3 space-y-2 rounded-lg border border-good/40 bg-good-soft p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="flex items-center gap-2 text-sub font-medium text-good">
                            <Check size={14} />
                            {resendResult.email_sent ? "New link emailed — also copyable below:" : "New link generated — share it manually:"}
                          </p>
                          <button type="button" onClick={() => setResendResult(null)} className="text-ink-3 hover:text-ink" aria-label="Dismiss">
                            <X size={14} />
                          </button>
                        </div>
                        {resendResult.email_error && (
                          <p className="rounded-md border border-warn/40 bg-warn-soft p-2 text-xs text-warn">
                            Email could not be sent: {resendResult.email_error} — the link itself is still valid.
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Input readOnly value={resendResult.onboarding_url} className="font-ui-mono text-xs" />
                          <Button size="md" onClick={copyResendLink}>
                            {resendCopied ? <Check size={14} className="text-good" /> : <Copy size={14} />}
                            {resendCopied ? "Copied" : "Copy"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {r.status === "submitted" && spec && (
                      <div className="divide-y divide-line border-t border-line">
                        {spec.sections.map((section, sIdx) => (
                          <dl key={sIdx} className="grid grid-cols-1 gap-x-6 gap-y-2 px-4 py-3 md:grid-cols-[220px_minmax(0,1fr)]">
                            <div className={cn(label, "md:col-span-2")}>{section.title}</div>
                            {section.fields.map((field) => {
                              const answer = r.responses?.[field.key];
                              const detail = r.responses?.[`${field.key}_detail`];
                              return (
                                <div key={field.key} className="contents">
                                  <dt className="text-sub text-ink-3">{field.label}</dt>
                                  <dd className="text-sm text-ink">
                                    {field.type === "checkbox" ? (
                                      answer === true ? <span className="text-good">✓ Yes</span> : answer === false ? "No" : <span className="text-ink-3">—</span>
                                    ) : typeof answer === "string" && answer.trim().length > 0 ? (
                                      <span className="whitespace-pre-wrap break-words">
                                        {answer}
                                        {typeof detail === "string" && detail.trim().length > 0 && <span className="text-ink-2"> ({detail})</span>}
                                      </span>
                                    ) : (
                                      <span className="text-ink-3">—</span>
                                    )}
                                  </dd>
                                </div>
                              );
                            })}
                          </dl>
                        ))}
                      </div>
                    )}
                  </Panel>
                );
              })
            )}
          </>
        )}

        {/* ---------- Links & docs ---------- */}
        {tab === "links" && (
          <Panel>
            <PanelHeader title="Links & docs" count={links.length || null} sub="attach more by telling Zeke in Pingo" />
            {links.length === 0 ? (
              <EmptyState title="Nothing attached yet" body="Audits, proposals, websites, dossiers and code locations show up here." />
            ) : (
              <PanelRows>
                {links.map((l) => {
                  const web = isWebUrl(l.url);
                  const rowClass = "group flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2";
                  const inner = (
                    <>
                      <span className="w-16 shrink-0 rounded bg-surface-2 px-1 py-0.5 text-center text-[11px] text-ink-2 group-hover:bg-surface">
                        {LINK_KIND_LABEL[l.kind] ?? l.kind}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink group-hover:underline">{l.title}</span>
                      <span className="shrink-0 text-xs tabular-nums text-ink-3">
                        {l.views !== null ? `${l.views} views${l.lastViewed ? ` · ${formatRelativeTime(l.lastViewed)}` : ""}` : formatDate(l.createdAt)}
                      </span>
                      {web ? <ExternalLink size={13} className="shrink-0 text-ink-3" /> : <Copy size={13} className="shrink-0 text-ink-3" />}
                    </>
                  );
                  // Local paths can't be opened from the browser — copy them instead of 404ing.
                  return web ? (
                    <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className={rowClass}>
                      {inner}
                    </a>
                  ) : (
                    <button
                      key={l.id}
                      type="button"
                      title={`Local path — click to copy: ${l.url}`}
                      className={rowClass}
                      onClick={() => {
                        navigator.clipboard.writeText(l.url).then(() => toast.success("Path copied"));
                      }}
                    >
                      {inner}
                    </button>
                  );
                })}
              </PanelRows>
            )}
          </Panel>
        )}
      </RecordShell>

      {showUpload && <ContractUploadModal accountId={id} onClose={() => setShowUpload(false)} onUploaded={fetchAccount} />}
      {counterSignContract && (
        <CounterSignModal accountId={id} contract={counterSignContract} onClose={() => setCounterSignContract(null)} onSigned={fetchAccount} />
      )}
      {showStartSub && (
        <StartSubscriptionModal
          accountId={id}
          accountName={account.name}
          onClose={() => setShowStartSub(false)}
          onStarted={() => {
            setSubsLoading(true);
            fetchStripeData();
            fetchAccount();
          }}
        />
      )}
      {sigContract && (
        <SendSignatureModal
          accountId={id}
          contract={sigContract}
          defaultSignerName={contactName}
          defaultSignerEmail={contact?.email || ""}
          onClose={() => setSigContract(null)}
          onSent={fetchAccount}
        />
      )}
      {showOnboarding && (
        <SendOnboardingModal
          accountId={id}
          defaultRecipientName={contactName}
          defaultRecipientEmail={contact?.email || ""}
          onClose={() => setShowOnboarding(false)}
          onSent={() => {
            fetchOnboarding();
            fetchAccount();
          }}
        />
      )}
    </>
  );
}

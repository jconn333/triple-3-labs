"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, ExternalLink, Mail, Sparkles, Trash2, UserPlus } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { RecordShell, Details } from "@/components/admin/RecordShell";
import LeadScoreBadge from "@/components/admin/LeadScoreBadge";
import DealStageControl from "@/components/admin/DealStageControl";
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  MoneyCell,
  Panel,
  PanelBody,
  PanelHeader,
  PanelRows,
  PanelSkeleton,
  dealStageTone,
} from "@/components/ui";
import type { Account, Activity, Contact, Deal } from "@/lib/crm/types";

const PROJECT_LABELS: Record<string, string> = {
  "ai-agent": "AI Agent",
  automation: "Automation",
  consulting: "Consulting",
  other: "Other",
};

const BUDGET_LABELS: Record<string, string> = {
  "under-5k": "Under $5K",
  "5k-15k": "$5K – $15K",
  "15k-50k": "$15K – $50K",
  "50k-plus": "$50K+",
};

type LinkedAccount = Pick<Account, "id" | "name" | "status" | "stripe_customer_id">;

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [account, setAccount] = useState<LinkedAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [draftingEmail, setDraftingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  const [scoring, setScoring] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchContact = useCallback(async () => {
    try {
      const res = await fetch(`/api/contacts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setContact(data.contact);
      setDeals(data.deals || []);
      setActivities(data.activities || []);
      setAccount(data.account || null);
    } catch {
      toast.error("Failed to load contact");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  async function handleDraftFollowUp() {
    setDraftingEmail(true);
    setEmailDraft(null);
    try {
      const res = await fetch("/api/ai/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: id }),
      });
      if (!res.ok) throw new Error("Failed");
      const draft = await res.json();
      setEmailDraft(draft);
      toast.success("Follow-up email drafted");
    } catch {
      toast.error("Failed to draft email");
    } finally {
      setDraftingEmail(false);
    }
  }

  async function handleRescore() {
    if (!contact) return;
    setScoring(true);
    try {
      const res = await fetch("/api/ai/lead-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: id,
          contactData: {
            name: `${contact.first_name} ${contact.last_name}`,
            email: contact.email,
            company: contact.company ?? undefined,
            phone: contact.phone ?? undefined,
            message: contact.message || "",
          },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const score = await res.json();
      setContact((prev) =>
        prev ? { ...prev, lead_score: score.score, lead_score_label: score.label, lead_score_reasoning: score.reasoning } : prev
      );
      toast.success(`Re-scored: ${score.score}/100 (${score.label})`);
    } catch {
      toast.error("Failed to re-score");
    } finally {
      setScoring(false);
    }
  }

  async function handleCreateAccount() {
    setCreatingAccount(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409 && data.account_id) {
          router.push(`/admin/clients/${data.account_id}`);
          return;
        }
        throw new Error(data.error || "Failed");
      }
      const data = await res.json();
      toast.success("Account created");
      router.push(`/admin/clients/${data.account.id}`);
    } catch {
      toast.error("Failed to create account");
    } finally {
      setCreatingAccount(false);
    }
  }

  async function handleDelete() {
    if (!contact) return;
    const name = `${contact.first_name} ${contact.last_name}`.trim() || "this contact";
    if (!confirm(`Delete ${name}? This removes the contact, all deals, and activity history. This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      toast.success("Contact deleted");
      router.push("/admin/people");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete contact";
      toast.error(`Failed to delete contact: ${msg}`);
      setDeleting(false);
    }
  }

  function copyDraft() {
    if (!emailDraft) return;
    navigator.clipboard.writeText(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`);
    toast.success("Copied to clipboard");
  }

  if (loading) {
    return <PanelSkeleton rows={6} />;
  }

  if (!contact) {
    return <EmptyState title="Contact not found" />;
  }

  const fullName = `${contact.first_name} ${contact.last_name}`.trim() || contact.email;

  return (
    <>
      <PageHeader
        title={fullName}
        crumb={{ label: "People", href: "/admin/people" }}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting}>
              <Trash2 size={14} />
              {deleting ? "Deleting…" : "Delete"}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleRescore} disabled={scoring}>
              <Sparkles size={14} />
              {scoring ? "Scoring…" : "Re-score lead"}
            </Button>
            {account ? (
              <ButtonLink href={`/admin/clients/${account.id}`} variant="secondary" size="sm">
                <ExternalLink size={14} />
                View client
              </ButtonLink>
            ) : (
              <Button variant="secondary" size="sm" onClick={handleCreateAccount} disabled={creatingAccount}>
                <UserPlus size={14} />
                {creatingAccount ? "Creating…" : "Create client"}
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleDraftFollowUp} disabled={draftingEmail}>
              <Mail size={14} />
              {draftingEmail ? "Drafting…" : "Draft follow-up"}
            </Button>
          </>
        }
      />

      <RecordShell
        title={fullName}
        status={<LeadScoreBadge score={contact.lead_score} />}
        facts={
          <>
            <a href={`mailto:${contact.email}`} className="hover:text-ink hover:underline">
              {contact.email}
            </a>
            {contact.phone && <span>{contact.phone}</span>}
            {contact.company && <span>{contact.company}</span>}
            <span className="capitalize">{contact.source.replace(/_/g, " ")}</span>
            <span>Added {formatDate(contact.created_at)}</span>
            {account && (
              <Link href={`/admin/clients/${account.id}`} className="text-accent-ink hover:underline">
                {account.name} →
              </Link>
            )}
          </>
        }
        rail={
          <>
            <Panel>
              <PanelHeader title="Details" />
              <Details
                items={[
                  {
                    label: "Project",
                    value: contact.project_type ? PROJECT_LABELS[contact.project_type] ?? contact.project_type : null,
                  },
                  {
                    label: "Budget",
                    value: contact.budget_range ? BUDGET_LABELS[contact.budget_range] ?? contact.budget_range : null,
                  },
                  {
                    label: "Score",
                    value:
                      contact.lead_score !== null
                        ? `${contact.lead_score}/100${contact.lead_score_label ? ` · ${contact.lead_score_label}` : ""}`
                        : null,
                  },
                  { label: "Reasoning", value: contact.lead_score_reasoning },
                  { label: "Contact ID", value: <span className="font-ui-mono text-xs">{contact.id}</span> },
                ]}
              />
            </Panel>

            <Panel>
              <PanelHeader title="Deals" count={deals.length} />
              {deals.length === 0 ? (
                <EmptyState compact title="No deals yet" />
              ) : (
                <PanelRows>
                  {deals.map((deal) => {
                    const stageName = deal.stage?.name ?? "—";
                    const isClosed = deal.stage?.is_closed ?? false;
                    return (
                      <div key={deal.id} className="px-4 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-sm font-medium text-ink">{deal.name}</span>
                          <MoneyCell amount={deal.amount} />
                        </div>
                        <div className="mt-1">
                          <Badge tone={dealStageTone(stageName, isClosed).tone} size="sm">
                            {stageName}
                          </Badge>
                        </div>
                        <DealStageControl deal={deal} onChanged={fetchContact} />
                      </div>
                    );
                  })}
                </PanelRows>
              )}
            </Panel>
          </>
        }
      >
        {contact.message && (
          <Panel>
            <PanelHeader title="Message" />
            <PanelBody>
              <p className="whitespace-pre-wrap text-sm text-ink">{contact.message}</p>
            </PanelBody>
          </Panel>
        )}

        {emailDraft && (
          <Panel>
            <PanelHeader title="AI-drafted follow-up">
              <Button variant="ghost" size="sm" onClick={copyDraft}>
                <Copy size={12} />
                Copy
              </Button>
            </PanelHeader>
            <PanelBody>
              <p className="text-sm font-medium text-ink">Subject: {emailDraft.subject}</p>
              <div className="mt-2 whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-sm text-ink-2">{emailDraft.body}</div>
            </PanelBody>
          </Panel>
        )}

        <Panel>
          <PanelHeader title="Activity" count={activities.length} />
          {activities.length === 0 ? (
            <EmptyState compact title="No activity yet" />
          ) : (
            <PanelRows>
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="w-[72px] shrink-0 pt-0.5 text-xs text-ink-3">{formatRelativeTime(activity.created_at)}</span>
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink">{activity.title}</div>
                    {activity.description && <div className="text-sub text-ink-2">{activity.description}</div>}
                  </div>
                </div>
              ))}
            </PanelRows>
          )}
        </Panel>
      </RecordShell>
    </>
  );
}

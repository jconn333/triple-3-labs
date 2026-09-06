"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge, Button, ButtonLink, Panel, PanelHeader, Select, SlideOver } from "@/components/ui";
import { Details as RecordDetails } from "./RecordShell";
import { formatCurrency, formatDate, formatRelativeTime, daysInStage } from "@/lib/utils/format";
import type { Deal, PipelineStage } from "@/lib/crm/types";

/** Quick look at a deal from the board: move it, open the person or client, delete. */
export default function DealPanel({
  deal,
  stages,
  onClose,
  onMove,
  onDelete,
}: {
  deal: Deal;
  stages: PipelineStage[];
  onClose: () => void;
  onMove: (deal: Deal, stageId: string) => void;
  onDelete: (deal: Deal) => void;
}) {
  const stage = stages.find((s) => s.id === deal.stage_id);
  const eng = deal.report_engagement;
  const who = deal.contact ? `${deal.contact.first_name} ${deal.contact.last_name}`.trim() : null;

  return (
    <SlideOver
      title={deal.name}
      sub={[deal.contact?.company, who].filter(Boolean).join(" · ") || undefined}
      onClose={onClose}
      actions={
        <Button variant="danger" size="sm" onClick={() => onDelete(deal)}>
          Delete
        </Button>
      }
    >
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={stage?.name.toLowerCase().includes("won") ? "good" : "neutral"}>{stage?.name ?? "—"}</Badge>
          <span className="text-sm font-medium tabular-nums text-ink">{deal.amount ? formatCurrency(deal.amount) : "No amount"}</span>
          <span className="text-sub text-ink-3">· {daysInStage(deal.updated_at || deal.created_at)}d in stage</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sub text-ink-2" htmlFor="deal-stage">
            Move to
          </label>
          <Select
            id="deal-stage"
            value={deal.stage_id}
            onChange={(e) => onMove(deal, e.target.value)}
            className="w-52"
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

        {deal.description && (
          <Panel>
            <PanelHeader title="Notes" />
            <p className="whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-ink">{deal.description}</p>
          </Panel>
        )}

        <Panel>
          <PanelHeader title="Engagement" />
          {eng ? (
            <div className="px-4 py-3 text-sm">
              {eng.views > 0 ? (
                <>
                  <span className="font-medium text-good">{eng.views} report views</span>
                  {eng.last_viewed_at && <span className="text-ink-3"> · last {formatRelativeTime(eng.last_viewed_at)}</span>}
                </>
              ) : (
                <span className="text-ink-3">Report not opened yet</span>
              )}
              <a
                href={`https://triple3labs.io/r/${eng.slug}`}
                target="_blank"
                rel="noopener"
                className="mt-1.5 flex items-center gap-1 text-sub text-accent-ink hover:underline"
              >
                triple3labs.io/r/{eng.slug} <ExternalLink size={12} />
              </a>
            </div>
          ) : (
            <p className="px-4 py-3 text-sub text-ink-3">No tracked report attached.</p>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Details" />
          <RecordDetails
            items={[
              { label: "Person", value: deal.contact_id ? <Link href={`/admin/people/${deal.contact_id}`} className="text-accent-ink hover:underline">{who || "Open"}</Link> : null },
              { label: "Company", value: deal.contact?.company ?? null },
              { label: "Email", value: deal.contact?.email && !deal.contact.email.endsWith(".invalid") ? deal.contact.email : null },
              { label: "Created", value: formatDate(deal.created_at) },
              { label: "Closed", value: deal.closed_at ? formatDate(deal.closed_at) : null },
            ]}
          />
        </Panel>

        {deal.contact_id && (
          <ButtonLink href={`/admin/people/${deal.contact_id}`} className="self-start">
            Open person →
          </ButtonLink>
        )}
      </div>
    </SlideOver>
  );
}

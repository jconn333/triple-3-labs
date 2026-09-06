"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import PipelineColumn from "@/components/admin/PipelineColumn";
import DealCard from "@/components/admin/DealCard";
import DealPanel from "@/components/admin/DealPanel";
import { Badge, DataTable, MoneyCell, MutedCell, NameCell, SectionHeader, Segmented, Skeleton, type Column } from "@/components/ui";
import { formatCurrency, formatRelativeTime, daysInStage } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Deal, PipelineStage } from "@/lib/crm/types";

type View = "board" | "table";
type Scope = "open" | "won" | "lost" | "all";

function PipelineInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [view, setView] = useState<View>("board");
  const [scope, setScope] = useState<Scope>("open");

  const selectedId = params.get("deal");
  const selected = useMemo(() => deals.find((d) => d.id === selectedId) ?? null, [deals, selectedId]);
  const select = useCallback(
    (id: string | null) => router.replace(id ? `/admin/pipeline?deal=${id}` : "/admin/pipeline", { scroll: false }),
    [router],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    (async () => {
      try {
        const [pipelineRes, dealsRes] = await Promise.all([fetch("/api/pipeline"), fetch("/api/deals")]);
        if (!pipelineRes.ok || !dealsRes.ok) throw new Error("Failed to fetch");
        const [pipelineData, dealsData] = await Promise.all([pipelineRes.json(), dealsRes.json()]);
        setStages(pipelineData.stages || []);
        setDeals(dealsData.deals || []);
      } catch {
        toast.error("Failed to load pipeline data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stageById = useMemo(() => new Map(stages.map((s) => [s.id, s])), [stages]);
  const isWon = (s?: PipelineStage) => Boolean(s?.is_closed && s.name.toLowerCase().includes("won"));
  const isLost = (s?: PipelineStage) => Boolean(s?.is_closed && !s.name.toLowerCase().includes("won"));

  const moveDeal = useCallback(
    async (deal: Deal, newStageId: string) => {
      if (deal.stage_id === newStageId) return;
      const prevStage = deal.stage_id;
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage_id: newStageId, stage: stageById.get(newStageId) } : d)));
      try {
        const res = await fetch(`/api/deals/${deal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage_id: newStageId }),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success(`Moved to ${stageById.get(newStageId)?.name || "new stage"}`);
      } catch {
        setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage_id: prevStage, stage: stageById.get(prevStage) } : d)));
        toast.error("Failed to move deal");
      }
    },
    [stageById],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => setActiveDeal(deals.find((d) => d.id === event.active.id) || null),
    [deals],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDeal(null);
      const { active, over } = event;
      if (!over) return;
      const deal = deals.find((d) => d.id === active.id);
      if (deal) void moveDeal(deal, over.id as string);
    },
    [deals, moveDeal],
  );

  const handleDeleteDeal = useCallback(
    async (deal: Deal) => {
      const label = deal.name || "this deal";
      if (!confirm(`Delete ${label}? This also removes the associated contact and activity history.`)) return;
      const prevDeals = deals;
      setDeals((current) => current.filter((d) => d.id !== deal.id));
      if (selectedId === deal.id) select(null);
      try {
        const res = await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete");
        toast.success("Deal deleted");
      } catch {
        setDeals(prevDeals);
        toast.error("Failed to delete deal");
      }
    },
    [deals, selectedId, select],
  );

  // Scope: the board shows open stages by default; Won / Lost become filters, not columns.
  const visibleStages = useMemo(
    () =>
      stages.filter((s) => {
        if (scope === "all") return true;
        if (scope === "open") return !s.is_closed;
        if (scope === "won") return isWon(s);
        return isLost(s);
      }),
    [stages, scope],
  );
  const visibleDeals = useMemo(() => deals.filter((d) => visibleStages.some((s) => s.id === d.stage_id)), [deals, visibleStages]);

  const openDeals = deals.filter((d) => !stageById.get(d.stage_id)?.is_closed);
  const openValue = openDeals.reduce((s, d) => s + (d.amount || 0), 0);
  const wonCount = deals.filter((d) => isWon(stageById.get(d.stage_id))).length;
  const lostCount = deals.filter((d) => isLost(stageById.get(d.stage_id))).length;

  const columns: Column<Deal>[] = [
    {
      key: "name",
      header: "Deal",
      render: (d) => (
        <NameCell name={d.name} sub={d.contact ? d.contact.company || `${d.contact.first_name} ${d.contact.last_name}`.trim() : undefined} />
      ),
    },
    {
      key: "stage",
      header: "Stage",
      width: "140px",
      render: (d) => {
        const s = stageById.get(d.stage_id);
        return <Badge tone={isWon(s) ? "good" : "neutral"}>{s?.name ?? "—"}</Badge>;
      },
    },
    { key: "amount", header: "Amount", width: "110px", align: "right", render: (d) => <MoneyCell amount={d.amount} /> },
    {
      key: "age",
      header: "In stage",
      width: "100px",
      hideBelow: "md",
      render: (d) => {
        const age = daysInStage(d.updated_at || d.created_at);
        return <span className={cn("text-sub tabular-nums", age >= 7 && !stageById.get(d.stage_id)?.is_closed ? "text-warn" : "text-ink-2")}>{age}d</span>;
      },
    },
    {
      key: "views",
      header: "Report",
      width: "140px",
      hideBelow: "lg",
      render: (d) => {
        const e = d.report_engagement;
        if (!e) return <span className="text-ink-3">—</span>;
        const hot = e.last_viewed_at && Date.now() - new Date(e.last_viewed_at).getTime() < 3 * 86_400_000;
        return (
          <span className={cn("text-sub tabular-nums", hot ? "font-medium text-good" : "text-ink-2")}>
            {e.views > 0 ? `${e.views} views · ${formatRelativeTime(e.last_viewed_at!)}` : "unopened"}
          </span>
        );
      },
    },
    { key: "created", header: "Created", width: "110px", hideBelow: "sm", render: (d) => <MutedCell>{formatRelativeTime(d.created_at)}</MutedCell> },
  ];

  const sortedForTable = useMemo(
    () => [...visibleDeals].sort((a, b) => (stageById.get(a.stage_id)?.display_order ?? 0) - (stageById.get(b.stage_id)?.display_order ?? 0) || (b.amount ?? 0) - (a.amount ?? 0)),
    [visibleDeals, stageById],
  );

  return (
    <>
      <PageHeader
        title="Pipeline"
        actions={
          <Segmented<View>
            value={view}
            onChange={setView}
            ariaLabel="View"
            options={[
              { value: "board", label: "Board" },
              { value: "table", label: "Table" },
            ]}
          />
        }
      />
      <SectionHeader
        title="Deals"
        count={
          loading ? undefined : (
            <>
              {openDeals.length} open · {formatCurrency(openValue)}
              {wonCount ? ` · ${wonCount} won` : ""}
            </>
          )
        }
      >
        <Segmented<Scope>
          value={scope}
          onChange={setScope}
          ariaLabel="Scope"
          options={[
            { value: "open", label: "Open", count: openDeals.length || null },
            { value: "won", label: "Won", count: wonCount || null },
            { value: "lost", label: "Lost", count: lostCount || null },
            { value: "all", label: "All" },
          ]}
        />
      </SectionHeader>

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[264px] shrink-0 space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : view === "table" ? (
        <DataTable
          columns={columns}
          rows={sortedForTable}
          rowKey={(d) => d.id}
          onRowClick={(d) => select(d.id)}
          emptyTitle="No deals in this view"
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-4">
            {visibleStages.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                deals={deals.filter((d) => d.stage_id === stage.id)}
                onDeleteDeal={handleDeleteDeal}
                onOpenDeal={(d) => select(d.id)}
              />
            ))}
            {visibleStages.length === 0 && <p className="py-10 text-sub text-ink-3">No stages in this view.</p>}
          </div>
          <DragOverlay>{activeDeal ? <DealCard deal={activeDeal} isDragOverlay /> : null}</DragOverlay>
        </DndContext>
      )}

      {selected && (
        <DealPanel
          deal={selected}
          stages={stages}
          onClose={() => select(null)}
          onMove={moveDeal}
          onDelete={handleDeleteDeal}
        />
      )}
    </>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={null}>
      <PipelineInner />
    </Suspense>
  );
}

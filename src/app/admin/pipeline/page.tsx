"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import PipelineColumn from "@/components/admin/PipelineColumn";
import DealCard from "@/components/admin/DealCard";
import type { Deal, PipelineStage } from "@/lib/crm/types";

export default function PipelinePage() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const [pipelineRes, dealsRes] = await Promise.all([
          fetch("/api/pipeline"),
          fetch("/api/deals"),
        ]);
        if (!pipelineRes.ok || !dealsRes.ok) throw new Error("Failed to fetch");

        const [pipelineData, dealsData] = await Promise.all([
          pipelineRes.json(),
          dealsRes.json(),
        ]);

        setStages(pipelineData.stages || []);
        setDeals(dealsData.deals || []);
      } catch {
        toast.error("Failed to load pipeline data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal || null);
  }, [deals]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const newStageId = over.id as string;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === newStageId) return;

    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => d.id === dealId ? { ...d, stage_id: newStageId } : d)
    );

    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage_id: newStageId }),
      });
      if (!res.ok) throw new Error("Failed to update");

      const stage = stages.find((s) => s.id === newStageId);
      toast.success(`Moved to ${stage?.name || "new stage"}`);
    } catch {
      setDeals((prev) =>
        prev.map((d) => d.id === dealId ? { ...d, stage_id: deal.stage_id } : d)
      );
      toast.error("Failed to move deal");
    }
  }, [deals, stages]);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-72 shrink-0">
            <div className="glass-card animate-pulse rounded-xl p-4 h-96" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}
      onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-8 px-8">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage_id === stage.id);
          return <PipelineColumn key={stage.id} stage={stage} deals={stageDeals} />;
        })}
      </div>
      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

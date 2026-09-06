"use client";

import { useCallback, useEffect, useState } from "react";
import AgentsView, { type MissionData } from "./view";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button, PanelSkeleton } from "@/components/ui";

export default function AgentsPage() {
  const [data, setData] = useState<MissionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/mission-control");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setData(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 60_000);
    return () => clearInterval(t);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Agents" />
        <div className="flex flex-col gap-6">
          <PanelSkeleton rows={1} />
          <PanelSkeleton rows={6} />
        </div>
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        <PageHeader title="Agents" />
        <div className="rounded-lg border border-line bg-surface p-8 text-center">
          <p className="text-sm text-ink-2">Agents couldn&apos;t load: {error}</p>
          <Button
            className="mt-4"
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
          >
            Retry
          </Button>
        </div>
      </>
    );
  }

  if (!data) return null;

  return <AgentsView data={data} onRefresh={fetchData} />;
}

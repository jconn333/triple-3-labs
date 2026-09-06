"use client";

import { useCallback, useEffect, useState } from "react";
import HomeView from "./view";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button, PanelSkeleton, Skeleton } from "@/components/ui";
import type { CommandResponse } from "@/app/api/command/route";

const REFRESH_MS = 60_000;

export default function HomePage() {
  const [data, setData] = useState<CommandResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/command", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as CommandResponse);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  return (
    <>
      <PageHeader title="Home" />
      {loading && !data ? (
        <div className="flex flex-col gap-6">
          <div className="flex gap-7">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-7 w-36" />
          </div>
          <PanelSkeleton rows={6} />
          <PanelSkeleton rows={5} />
        </div>
      ) : error && !data ? (
        <div className="rounded-lg border border-line bg-surface p-8 text-center">
          <p className="text-sm text-ink-2">Couldn&apos;t load the home page: {error}</p>
          <Button
            className="mt-4"
            onClick={() => {
              setLoading(true);
              load();
            }}
          >
            Retry
          </Button>
        </div>
      ) : data ? (
        <HomeView data={data} />
      ) : null}
    </>
  );
}

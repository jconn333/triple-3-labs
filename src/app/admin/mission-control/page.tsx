"use client";

import { useCallback, useEffect, useState } from "react";
import MissionControlView, { type MissionData } from "./view";

export default function MissionControlPage() {
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

  if (loading) return <div className="py-20 text-center text-white/40">Loading fleet…</div>;
  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-red-400/30 bg-red-400/10 p-6 text-center">
        <p className="mb-1 font-medium text-red-300">Mission Control couldn&apos;t load</p>
        <p className="text-sm text-white/60">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          className="mt-4 rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/70 hover:bg-white/10"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!data) return null;

  return <MissionControlView data={data} onRefresh={fetchData} />;
}

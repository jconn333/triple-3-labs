"use client";

import { useCallback, useEffect, useState } from "react";
import CommandView from "./view";
import type { CommandResponse } from "@/app/api/command/route";

const REFRESH_MS = 60_000;

export default function CommandPage() {
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

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-6">
        {[24, 40, 96].map((h, i) => (
          <div key={i} className="glass-card animate-pulse rounded-xl" style={{ height: h * 4 }} />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-red-400/80">Couldn&apos;t load the command center: {error}</p>
        <button
          onClick={() => {
            setLoading(true);
            load();
          }}
          className="mt-4 rounded-lg bg-violet/10 px-4 py-2.5 text-sm font-medium text-violet hover:bg-violet/20"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;
  return <CommandView data={data} />;
}

"use client";

// Dev-only visual harness for Mission Control: renders the real view with
// fixture data covering every state (healthy, degraded, down, paused,
// overdue, blocked) so design can be iterated without an admin session.
// Returns 404 outside development.

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import MissionControlView, { type MissionData } from "@/app/admin/mission-control/view";

const spiky = [0, 0, 3, 2, 3, 2, 0, 1, 3, 2, 3, 3, 2, 3, 2, 1, 3, 2, 3, 2, 3, 1, 2, 3];
const hourly = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1];
const quiet = new Array(24).fill(0);

const FIXTURE: MissionData = {
  fetchedAt: new Date(Date.now() - 40_000).toISOString(),
  rollup: { agents_ok: 3, agents_degraded: 1, agents_down: 1, overdue: 1, due_soon: 1 },
  companies: [
    {
      company_id: "ecoseal",
      company_name: "Eco Seal Solutions",
      state: "ok",
      attention: true,
      next_due: new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10),
      agents: [
        {
          agent_key: "dwight-ecoseal",
          display_name: "Dwight — SEO Agent",
          state: "ok",
          healthy: 1,
          total: 1,
          attention: true,
          activity: quiet,
          processes: [
            { key: "hb", label: "Heartbeat", kind: "heartbeat", state: "ok", detail: "38s ago", counted: true },
            { key: "c1", label: "ecoseal email poll fresh", kind: "canary", state: "paused", detail: "paused", counted: false },
          ],
          commitments: [
            {
              id: "c-1",
              name: "Monthly in-depth SEO report",
              kind: "recurring",
              status: "DUE_SOON",
              next_due: new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10),
              last_delivered: null,
              notes: null,
            },
            {
              id: "c-2",
              name: "Monitoring: GSC + GA4",
              kind: "continuous",
              status: "see_canaries",
              next_due: null,
              last_delivered: null,
              notes: "BLOCKED ON CUSTOMER: awaiting service-account access",
            },
          ],
        },
      ],
    },
    {
      company_id: "fivestar",
      company_name: "Five Star Group",
      state: "down",
      attention: true,
      next_due: null,
      agents: [
        {
          agent_key: "zeke",
          display_name: "Zeke — AI Assistant",
          state: "down",
          healthy: 2,
          total: 4,
          attention: true,
          activity: hourly,
          processes: [
            { key: "hb", label: "Heartbeat", kind: "heartbeat", state: "down", detail: "14m ago (threshold 5m)", counted: true },
            { key: "c1", label: "zeke daily brief fresh", kind: "canary", state: "ok", detail: "checked 4m ago", counted: true },
            { key: "c2", label: "claude cli alive", kind: "canary", state: "degraded", detail: "no data yet", counted: true },
            { key: "c3", label: "discord bot auth", kind: "canary", state: "ok", detail: "checked 4m ago", counted: true },
          ],
          commitments: [],
        },
        {
          agent_key: "syncs-fivestar",
          display_name: "Data syncs (HostAway + Cloudbeds)",
          state: "ok",
          healthy: 8,
          total: 8,
          attention: false,
          activity: spiky,
          processes: [
            { key: "hb1", label: "Heartbeat · sync.hostaway", kind: "heartbeat", state: "ok", detail: "6m ago", counted: true },
            { key: "hb2", label: "Heartbeat · sync.cloudbeds", kind: "heartbeat", state: "ok", detail: "9m ago", counted: true },
            { key: "c1", label: "hostaway incremental fresh", kind: "canary", state: "ok", detail: "checked 4m ago", counted: true },
            { key: "c2", label: "hostaway financials fresh", kind: "canary", state: "ok", detail: "checked 4m ago", counted: true },
            { key: "c3", label: "hostaway full fresh", kind: "canary", state: "ok", detail: "checked 4m ago", counted: true },
            { key: "c4", label: "cloudbeds incremental fresh", kind: "canary", state: "ok", detail: "checked 4m ago", counted: true },
            { key: "c5", label: "cloudbeds enrich fresh", kind: "canary", state: "ok", detail: "checked 4m ago", counted: true },
            { key: "c6", label: "cloudbeds full fresh", kind: "canary", state: "ok", detail: "checked 4m ago", counted: true },
          ],
          commitments: [],
        },
      ],
    },
    {
      company_id: "triple3",
      company_name: "Triple 3 Labs",
      state: "degraded",
      attention: true,
      next_due: null,
      agents: [
        {
          agent_key: "ticket-triage",
          display_name: "Ticket triage worker",
          state: "degraded",
          healthy: 2,
          total: 3,
          attention: true,
          activity: spiky,
          processes: [
            { key: "hb", label: "Heartbeat", kind: "heartbeat", state: "ok", detail: "3m ago", counted: true },
            { key: "c1", label: "ticket triage fresh", kind: "canary", state: "degraded", detail: "no data yet", counted: true },
            { key: "t1", label: "Last run · ticket-triage.run", kind: "task", state: "ok", detail: "ok 3m ago", counted: true },
          ],
          commitments: [
            {
              id: "c-3",
              name: "Weekly ops digest",
              kind: "recurring",
              status: "OVERDUE",
              next_due: new Date(Date.now() - 2 * 86400_000).toISOString().slice(0, 10),
              last_delivered: new Date(Date.now() - 9 * 86400_000).toISOString(),
              notes: null,
            },
          ],
        },
        {
          agent_key: "pingo-bot",
          display_name: "Pingo delivery bot",
          state: "ok",
          healthy: 2,
          total: 2,
          attention: false,
          activity: hourly,
          processes: [
            { key: "hb", label: "Heartbeat", kind: "heartbeat", state: "ok", detail: "50s ago", counted: true },
            { key: "c1", label: "pingo send probe", kind: "canary", state: "ok", detail: "checked 2m ago", counted: true },
          ],
          commitments: [],
        },
      ],
    },
  ],
};

export default function MissionControlPreview() {
  // Client-only render: the fixture bakes in Date.now(), so SSR text would
  // never match the client and trip hydration warnings.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (process.env.NODE_ENV !== "development") notFound();
  if (!mounted) return null;
  return (
    <main className="min-h-screen bg-background p-8">
      <MissionControlView data={FIXTURE} onRefresh={() => {}} />
    </main>
  );
}

#!/usr/bin/env node
// t3-agent-sweep.mjs — pre-brief agent check ("Zeke wakes up before the brief").
//
// Runs ~30 min before the private brief. For every agent in the ops registry:
//   • health   — heartbeat freshness vs its stale threshold
//   • status   — last task run + result, task errors in the last 24h
//   • canaries — each enabled canary's latest event age vs its max staleness
//   • client   — for client-facing agents, the last communication/delivery
//                recorded in the CRM for that client
// Writes the result to .t3-sweep.json in the repo root; t3-private-brief.mjs
// folds it into the 7:15am private brief. Never sends anything itself.
//
// Usage: node scripts/t3-agent-sweep.mjs [--print]
// Scheduled by ~/Library/LaunchAgents/com.triple3.t3-agent-sweep.plist (6:45am).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(repoRoot, ".t3-sweep.json");

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const env = loadEnv(join(repoRoot, ".env.local"));
const ops = createClient(env.OPS_SUPABASE_URL, env.OPS_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const crm = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function q(client, promise, what) {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

const now = Date.now();
const iso24h = new Date(now - 86_400_000).toISOString();
const ago = (iso) => {
  if (!iso) return "never";
  const m = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 48 * 60) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
};

// ---------- ops data ----------
const [registry, health, canaryCfg, canaryEvents, taskErrors, deadman] = await Promise.all([
  q(ops, ops.from("agent_registry").select("*").order("sort_order"), "agent_registry"),
  q(ops, ops.from("agent_health").select("*"), "agent_health"),
  q(ops, ops.from("agent_canary_config").select("*").eq("enabled", true), "agent_canary_config"),
  q(ops, ops.from("agent_events").select("agent_id,task_name,ts,status").eq("event_type", "canary").gte("ts", new Date(now - 2 * 86_400_000).toISOString()).order("ts", { ascending: false }).limit(2000), "canary events"),
  q(ops, ops.from("agent_events").select("agent_id,task_name,ts,status,error_class,error_message").eq("event_type", "task_end").neq("status", "ok").gte("ts", iso24h).order("ts", { ascending: false }).limit(50), "task errors"),
  q(ops, ops.from("agent_events").select("agent_id,ts,task_name").eq("event_type", "deadman_alert").gte("ts", iso24h), "deadman alerts"),
]);

// latest canary event per (agent_id, task_name)
const latestCanary = new Map();
for (const e of canaryEvents) {
  const k = `${e.agent_id}::${e.task_name}`;
  if (!latestCanary.has(k)) latestCanary.set(k, e);
}

// ---------- CRM: last client communication per company ----------
const [accounts, activities, deliveries, commitments] = await Promise.all([
  q(crm, crm.from("accounts").select("id,name"), "accounts"),
  q(crm, crm.from("activities").select("account_id,type,title,created_at").not("account_id", "is", null).order("created_at", { ascending: false }).limit(200), "activities"),
  q(crm, crm.from("deliveries").select("commitment_id,delivered_at,summary").order("delivered_at", { ascending: false }).limit(50), "deliveries"),
  q(crm, crm.from("commitments").select("id,account_id"), "commitments"),
]);
const commitmentAccount = new Map(commitments.map((c) => [c.id, c.account_id]));
const lastTouchByAccountName = new Map();
for (const a of accounts) {
  const act = activities.find((x) => x.account_id === a.id);
  const del = deliveries.find((x) => commitmentAccount.get(x.commitment_id) === a.id);
  const cand = [
    act && { at: act.created_at, what: `${act.title} (${act.type})` },
    del && { at: del.delivered_at, what: `delivery: ${del.summary ?? "logged"}` },
  ].filter(Boolean).sort((x, y) => y.at.localeCompare(x.at));
  if (cand[0]) lastTouchByAccountName.set(a.name.toLowerCase(), cand[0]);
}

// ---------- evaluate each registered agent ----------
const agents = registry.map((r) => {
  const ids = r.telemetry_ids ?? [];
  const rows = health.filter((h) => ids.includes(h.agent_id));
  const problems = [];

  // heartbeat freshness (per telemetry id, honoring per-row or registry threshold)
  let newestBeat = null;
  for (const h of rows) {
    if (h.last_heartbeat && (!newestBeat || h.last_heartbeat > newestBeat)) newestBeat = h.last_heartbeat;
    const threshold = (h.stale_threshold_seconds ?? r.task_stale_seconds ?? 7200) * 1000;
    if (!h.last_heartbeat || now - new Date(h.last_heartbeat).getTime() > threshold) {
      problems.push(`${h.agent_id} heartbeat stale (${ago(h.last_heartbeat)})`);
    }
  }
  if (rows.length === 0) problems.push("no health rows for telemetry ids");

  // canaries — the canary EVENT's task_name is the config's canary_id
  const myCanaries = canaryCfg.filter((c) => ids.includes(c.agent_id));
  let canariesOk = 0;
  for (const c of myCanaries) {
    const e = latestCanary.get(`${c.agent_id}::${c.canary_id}`);
    const maxAge = (c.max_staleness_seconds ?? 3600) * 1000;
    const age = e ? now - new Date(e.ts).getTime() : Infinity;
    if (!e || age > maxAge || (e.status && e.status !== "ok")) {
      problems.push(`canary ${c.canary_id} ${!e ? "missing" : e.status && e.status !== "ok" ? e.status : "stale"}`);
    } else canariesOk++;
  }

  // errors + deadman
  const myErrors = taskErrors.filter((e) => ids.includes(e.agent_id));
  if (myErrors.length) problems.push(`${myErrors.length} task error${myErrors.length > 1 ? "s" : ""} 24h (latest: ${myErrors[0].task_name} ${myErrors[0].error_class ?? myErrors[0].status})`);
  const myDeadman = deadman.filter((e) => ids.includes(e.agent_id));
  if (myDeadman.length) problems.push(`dead-man alert fired ${ago(myDeadman[0].ts)}`);

  // last task line
  const lastTask = rows
    .filter((h) => h.last_task_at)
    .sort((a, b) => b.last_task_at.localeCompare(a.last_task_at))[0];

  // last client communication (client-facing agents only)
  const isClientFacing = !["fivestar", "triple3"].includes(r.company_id);
  const touch = isClientFacing ? lastTouchByAccountName.get(r.company_name.toLowerCase()) ?? null : null;

  const errorSum = rows.reduce((s, h) => s + (h.error_count_24h ?? 0), 0);
  return {
    key: r.agent_key,
    name: r.display_name,
    company: r.company_name,
    clientFacing: isClientFacing,
    ok: problems.length === 0,
    heartbeat: newestBeat,
    heartbeatAgo: ago(newestBeat),
    lastTask: lastTask ? `${lastTask.last_task_name} ${lastTask.last_task_status} (${ago(lastTask.last_task_at)})` : null,
    canaries: myCanaries.length ? `${canariesOk}/${myCanaries.length} ok` : null,
    errors24h: errorSum + myErrors.length,
    lastClientTouch: touch ? `${touch.what} — ${ago(touch.at)}` : isClientFacing ? "none recorded" : null,
    problems,
  };
});

const result = {
  sweptAt: new Date().toISOString(),
  agents,
  allOk: agents.every((a) => a.ok),
};
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(`✓ Swept ${agents.length} agents → ${OUT}${result.allOk ? " (all ok)" : ` (${agents.filter((a) => !a.ok).length} with problems)`}`);
if (process.argv.includes("--print")) console.log(JSON.stringify(result, null, 2));

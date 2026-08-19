#!/usr/bin/env node
// t3-private-brief.mjs — Jeff-only Triple 3 Labs morning brief.
//
// PRIVACY: this brief contains CRM data (clients, revenue, prospects) and must
// only ever post to a Jeff-only channel. It reads PINGO_BRIDGE_CHANNEL_ID from
// ~/.pingo-claude-bridge/env — the private #claude-code channel (Jeff + Zeke).
// It shares NO plumbing with the multi-recipient 7am portfolio brief, by design.
//
// Deterministic by design: composed straight from CRM SQL, no LLM in the loop.
//
// Usage:
//   node scripts/t3-private-brief.mjs            # compose + send (idempotent per day)
//   node scripts/t3-private-brief.mjs --dry-run  # print to stdout, send nothing
//   node scripts/t3-private-brief.mjs --test     # send with a unique key (bypasses daily idempotency)
//
// Scheduled by ~/Library/LaunchAgents/com.triple3.t3-private-brief.plist (7:15am daily).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry-run");
const TEST = process.argv.includes("--test");

// ---------- env ----------
function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const crmEnv = loadEnv(join(repoRoot, ".env.local"));
const pingoEnv = loadEnv(join(homedir(), ".pingo-claude-bridge", "env"));

const db = createClient(crmEnv.NEXT_PUBLIC_SUPABASE_URL, crmEnv.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function q(promise, what) {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

// ---------- gather ----------
const now = new Date();
const DAY = 86_400_000;
const iso24h = new Date(now.getTime() - DAY).toISOString();
const today = now.toISOString().slice(0, 10);
const in7d = new Date(now.getTime() + 7 * DAY).toISOString().slice(0, 10);

const [accounts, commitments, deliveries, views, reports, deals, stages] = await Promise.all([
  q(db.from("accounts").select("id,name,mrr,stripe_customer_id"), "accounts"),
  q(db.from("commitments").select("*").eq("active", true), "commitments"),
  q(db.from("deliveries").select("*").gte("delivered_at", iso24h), "deliveries"),
  q(db.from("report_views").select("report_id,viewed_at").gte("viewed_at", iso24h), "report_views"),
  q(db.from("prospect_reports").select("id,prospect_name,title"), "prospect_reports"),
  q(db.from("deals").select("id,name,stage_id,amount,prospect_report_id,created_at,closed_at"), "deals"),
  q(db.from("pipeline_stages").select("id,name,is_closed"), "stages"),
]);

const stageById = new Map(stages.map((s) => [s.id, s]));
const money = (n) => `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

// KPI line
const mrr = accounts.reduce((s, a) => s + Number(a.mrr ?? 0), 0);
const openDeals = deals.filter((d) => !stageById.get(d.stage_id)?.is_closed);

// Needs-you (mirrors /api/command + crm.mjs status)
const needs = [];
for (const a of accounts) {
  const mine = commitments.filter((c) => c.account_id === a.id);
  if (!a.stripe_customer_id && Number(a.mrr) > 0) needs.push(`${a.name}: billing not set up (${money(a.mrr)}/mo)`);
  const unanchored = mine.filter((c) => c.kind === "recurring" && !c.next_due).length;
  if (unanchored) needs.push(`${a.name}: ${unanchored} recurring commitment${unanchored > 1 ? "s" : ""} not anchored`);
  for (const c of mine) {
    if (c.kind === "recurring" && c.next_due && c.next_due < today) needs.push(`${a.name}: "${c.name}" overdue (${c.next_due})`);
  }
}

// Who read your stuff in the last 24h
const reportById = new Map(reports.map((r) => [r.id, r]));
const reads = new Map();
for (const v of views) {
  const r = reportById.get(v.report_id);
  if (!r) continue;
  const key = r.title; // report titles already lead with the prospect name
  reads.set(key, (reads.get(key) ?? 0) + 1);
}
const readLines = [...reads.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} (${n}×)`);

// Deliveries in the last 24h (agent/Jeff output)
const commitmentById = new Map(commitments.map((c) => [c.id, c]));
const accountById = new Map(accounts.map((a) => [a.id, a]));
const deliveryLines = deliveries.map((d) => {
  const cm = commitmentById.get(d.commitment_id);
  const acct = cm ? accountById.get(cm.account_id) : null;
  return `${acct?.name ?? "?"}: ${d.summary ?? cm?.name ?? "delivery"}`;
});

// Due in the next 7 days
const dueSoon = commitments
  .filter((c) => c.next_due && c.next_due >= today && c.next_due <= in7d)
  .sort((a, b) => a.next_due.localeCompare(b.next_due))
  .map((c) => `${accountById.get(c.account_id)?.name ?? "?"}: ${c.name} (${c.next_due})`);

// ---------- compose ----------
const dateLabel = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const lines = [
  `🔒 **Triple 3 — Private Brief** · ${dateLabel}`,
  `${money(mrr)}/mo recurring · ${accounts.length} customer${accounts.length === 1 ? "" : "s"} · ${openDeals.length} open deal${openDeals.length === 1 ? "" : "s"}`,
  "",
];
if (needs.length) {
  lines.push(`⚑ Needs you (${needs.length})`);
  for (const n of needs) lines.push(`  • ${n}`);
  lines.push("");
}
if (readLines.length) {
  lines.push(`👀 Read in the last 24h`);
  for (const r of readLines) lines.push(`  • ${r}`);
  lines.push("");
}
if (deliveryLines.length) {
  lines.push(`📦 Delivered in the last 24h`);
  for (const d of deliveryLines) lines.push(`  • ${d}`);
  lines.push("");
}
if (dueSoon.length) {
  lines.push(`📬 Due in the next 7 days`);
  for (const d of dueSoon) lines.push(`  • ${d}`);
  lines.push("");
}
if (!needs.length && !readLines.length && !deliveryLines.length && !dueSoon.length) {
  lines.push("All quiet — nothing needs you, nothing was read or delivered in the last 24h.");
}
lines.push(`_Full picture: /admin/command · ask me "what needs me" anytime_`);
const brief = lines.join("\n").slice(0, 11_900); // Pingo body cap

// ---------- deliver ----------
if (DRY) {
  console.log(brief);
  process.exit(0);
}

const channelId = pingoEnv.PINGO_BRIDGE_CHANNEL_ID; // private #claude-code (Jeff + Zeke only)
if (!channelId || !pingoEnv.PINGO_API_URL || !pingoEnv.PINGO_API_KEY) {
  console.error("Missing Pingo bridge env — not sending.");
  process.exit(1);
}
const res = await fetch(`${pingoEnv.PINGO_API_URL.replace(/\/$/, "")}/v1/messages`, {
  method: "POST",
  headers: { Authorization: `Bearer ${pingoEnv.PINGO_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    channel_id: channelId,
    body: brief,
    idempotency_key: TEST ? `t3-private-brief-test-${Date.now()}` : `t3-private-brief-${today}`,
  }),
});
if (!res.ok) {
  console.error(`Pingo send failed: HTTP ${res.status} ${await res.text()}`);
  process.exit(1);
}
console.log(`✓ Private brief sent to #claude-code (${today}${TEST ? ", test key" : ""})`);

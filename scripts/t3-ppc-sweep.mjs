#!/usr/bin/env node
// t3-ppc-sweep.mjs — pre-brief PPC read for Amish Country Lodging.
//
// Reads YESTERDAY's ACL Google + Microsoft performance from Supabase
// (ppc_performance_snapshot, xwku project). The hourly ACL PPC dashboard sync
// on Jeff's laptop is the source of truth and already stores this.
//
// Repointed 2026-08-30 from live Google/Microsoft Ads API pulls: those need the
// ad-platform credentials, which live on the LAPTOP, not the Mini — so the live
// pull ENOENT-failed here every morning. The snapshot has spend / conversions /
// conversion value but NOT clicks, so clicks is reported null (the brief omits
// it). Read-only; writes .t3-ppc.json, which t3-private-brief.mjs folds into the
// 7:15am brief.
//
// "Yesterday" = the last 'today' snapshot whose report day was yesterday (ET) —
// i.e. yesterday's end-of-day totals.
//
// Usage: node scripts/t3-ppc-sweep.mjs [--print]
// Scheduled by ~/Library/LaunchAgents/com.triple3.t3-ppc-sweep.plist (6:50am).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const PRINT = process.argv.includes("--print");
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(repoRoot, ".t3-ppc.json");

function loadEnv(path) {
  const out = {};
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* handled below */ }
  return out;
}
// The ACL dashboard Supabase (xwku) creds live with the ga4-backfill tooling.
const ppcEnv = loadEnv(join(homedir(), "Dev", "zeke", "ga4-backfill", ".env"));
const SUPA_URL = (ppcEnv.SUPABASE_URL || "").replace(/\/$/, "");
const SUPA_KEY = ppcEnv.SUPABASE_SERVICE_ROLE_KEY;

// Yesterday in America/New_York — the dashboard reports on ET.
const etNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
const etYesterday = new Date(etNow.getTime() - 86_400_000);
const reportDate =
  `${etYesterday.getFullYear()}-${String(etYesterday.getMonth() + 1).padStart(2, "0")}-${String(etYesterday.getDate()).padStart(2, "0")}`;

async function platformYesterday(platform) {
  if (!SUPA_URL || !SUPA_KEY) {
    throw new Error("xwku SUPABASE_URL / SERVICE_ROLE_KEY missing (Dev/zeke/ga4-backfill/.env)");
  }
  const url =
    `${SUPA_URL}/rest/v1/ppc_performance_snapshot` +
    `?platform=eq.${platform}&period_key=eq.today&report_end=eq.${reportDate}` +
    `&select=spend,conversions,conversion_value,captured_at&order=captured_at.desc`;
  const res = await fetch(url, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);
  const rows = await res.json();
  if (!rows.length) {
    return { ok: true, spend: 0, conversions: 0, conversionValue: 0, clicks: null, note: "no snapshot for yesterday" };
  }
  // Rows are hourly snapshots of yesterday's running total; take the last one.
  const latest = rows[0].captured_at;
  const row = rows.find((r) => r.captured_at === latest) ?? rows[0];
  return {
    ok: true,
    spend: Number(row.spend ?? 0),
    conversions: Number(row.conversions ?? 0),
    conversionValue: Number(row.conversion_value ?? 0),
    clicks: null, // not stored in the snapshot
  };
}

const [google, microsoft] = await Promise.all([
  platformYesterday("google").catch((e) => ({ ok: false, error: String(e.message ?? e) })),
  platformYesterday("microsoft").catch((e) => ({ ok: false, error: String(e.message ?? e) })),
]);

const result = { sweptAt: new Date().toISOString(), date: reportDate, source: "supabase:ppc_performance_snapshot", google, microsoft };
writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
if (PRINT) console.log(JSON.stringify(result, null, 2));
const label = (p, n) => (p.ok ? `${n} ok ($${Number(p.spend).toFixed(2)}, ${p.conversions} conv)` : `${n} FAILED: ${p.error}`);
console.log(`✓ PPC sweep (supabase) for ${reportDate} → .t3-ppc.json — ${label(google, "google")}; ${label(microsoft, "microsoft")}`);

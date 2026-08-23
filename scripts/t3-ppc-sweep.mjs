#!/usr/bin/env node
// t3-ppc-sweep.mjs — pre-brief PPC pull for Amish Country Lodging.
//
// Read-only. Pulls YESTERDAY's campaign performance (account timezone, ET on
// both platforms) from:
//   • Google Ads API  — ACL child account 8241161607, ADC credentials shared
//     with the google-ads MCP (~/.config/google-ads-adc.json), developer token
//     from .env.local (GOOGLE_ADS_DEVELOPER_TOKEN).
//   • Microsoft Advertising API — account G1074MWA (189330951), same Google
//     OAuth identity + developer token as the read-only checker in
//     ~/Dev/zeke/marketing/acl-ppc/microsoft-ads/ (~/.config/microsoft-ads/).
//     Only report Submit/Poll endpoints are called — no mutation paths exist.
//
// Writes the result to .t3-ppc.json in the repo root; t3-private-brief.mjs
// folds it into the 7:15am private brief. Never sends anything itself.
// A platform failure is recorded in its entry — one side failing must not
// blank the other side's numbers.
//
// Usage: node scripts/t3-ppc-sweep.mjs [--print]
// Scheduled by ~/Library/LaunchAgents/com.triple3.t3-ppc-sweep.plist (6:50am).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

const PRINT = process.argv.includes("--print");
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(repoRoot, ".t3-ppc.json");

const GOOGLE_ADS_CUSTOMER_ID = "8241161607"; // ACL Ad Campaigns (child; the MCC 403s)
const GOOGLE_ADS_API_VERSION = "v22";
const MS_ACCOUNT_ID = 189330951; // Amish Country Lodging (G1074MWA)
const MS_CUSTOMER_ID = 255003507;
const MS_CONFIG_DIR = join(homedir(), ".config", "microsoft-ads");

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const env = loadEnv(join(repoRoot, ".env.local"));

// Yesterday in America/New_York — both ad accounts run on Eastern Time.
const etNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
const etYesterday = new Date(etNow.getTime() - 86_400_000);
const yyyy = etYesterday.getFullYear();
const mm = String(etYesterday.getMonth() + 1).padStart(2, "0");
const dd = String(etYesterday.getDate()).padStart(2, "0");
const reportDate = `${yyyy}-${mm}-${dd}`;

async function refreshGoogleToken({ client_id, client_secret, refresh_token }) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id, client_secret, refresh_token, grant_type: "refresh_token" }),
  });
  if (!res.ok) throw new Error(`OAuth refresh failed: HTTP ${res.status}`);
  const token = await res.json();
  if (!token.access_token) throw new Error("OAuth refresh returned no access_token");
  return token.access_token;
}

// ---------- Google Ads ----------
async function pullGoogle() {
  const devToken = env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN missing from .env.local");
  const adc = JSON.parse(readFileSync(join(homedir(), ".config", "google-ads-adc.json"), "utf8"));
  const accessToken = await refreshGoogleToken(adc);

  // The 8241161607 account also holds legacy Theater/Encore/Weddings campaigns;
  // the brief section is ACL-only, and ACL campaigns are all "ACL"-prefixed.
  const query = `
    SELECT campaign.name, metrics.cost_micros, metrics.clicks,
           metrics.conversions, metrics.conversions_value
    FROM campaign
    WHERE segments.date = '${reportDate}' AND campaign.name LIKE 'ACL%'`;
  const res = await fetch(
    `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${GOOGLE_ADS_CUSTOMER_ID}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": devToken,
        "login-customer-id": GOOGLE_ADS_CUSTOMER_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  if (!res.ok) throw new Error(`Google Ads search failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  const { results = [] } = await res.json();

  const campaigns = results.map((r) => ({
    name: r.campaign?.name ?? "(unknown)",
    spend: Number(r.metrics?.costMicros ?? 0) / 1_000_000,
    clicks: Number(r.metrics?.clicks ?? 0),
    conversions: Number(r.metrics?.conversions ?? 0),
    conversionValue: Number(r.metrics?.conversionsValue ?? 0),
  }));
  return totals(campaigns);
}

// ---------- Microsoft Advertising ----------
const MS_SUBMIT_URL = "https://reporting.api.bingads.microsoft.com/Reporting/v13/GenerateReport/Submit";
const MS_POLL_URL = "https://reporting.api.bingads.microsoft.com/Reporting/v13/GenerateReport/Poll";

async function msPost(url, body, accessToken, devToken) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      DeveloperToken: devToken,
      IdentityProvider: "Google",
      CustomerId: String(MS_CUSTOMER_ID),
      CustomerAccountId: String(MS_ACCOUNT_ID),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Microsoft Ads request failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

// Minimal ZIP extraction (single-entry report archives): walk the central
// directory for each entry's offset/method/size, inflate with raw deflate.
function unzipFirstFile(buf) {
  const eocdSig = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65_536); i--) {
    if (buf.readUInt32LE(i) === eocdSig) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("ZIP: no end-of-central-directory record");
  let off = buf.readUInt32LE(eocd + 16);
  while (off + 4 <= buf.length && buf.readUInt32LE(off) === 0x02014b50) {
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString("utf8", off + 46, off + 46 + nameLen);
    if (!name.endsWith("/")) {
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const dataStart = localOff + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(dataStart, dataStart + compSize);
      if (method === 8) return inflateRawSync(data);
      if (method === 0) return Buffer.from(data);
      throw new Error(`ZIP: unsupported compression method ${method}`);
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error("ZIP: no file entry found");
}

function parseCsv(text) {
  const rows = [];
  let field = "", row = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (field || row.length) { row.push(field); rows.push(row); field = ""; row = []; }
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

const num = (v) => {
  if (!v || v === "--" || v === "N/A") return 0;
  const n = Number(String(v).replace(/[$,%\s,]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

async function pullMicrosoft() {
  const devToken = readFileSync(join(MS_CONFIG_DIR, "developer-token"), "utf8").trim();
  const clientFile = JSON.parse(readFileSync(join(MS_CONFIG_DIR, "google-oauth-client.json"), "utf8"));
  const client = clientFile.installed ?? clientFile.web;
  const tokenFile = JSON.parse(readFileSync(join(MS_CONFIG_DIR, "google-oauth-token.json"), "utf8"));
  const accessToken = await refreshGoogleToken({
    client_id: client.client_id,
    client_secret: client.client_secret,
    refresh_token: tokenFile.refresh_token,
  });

  const reportRequest = {
    ExcludeColumnHeaders: false,
    ExcludeReportFooter: true,
    ExcludeReportHeader: true,
    Format: "Csv",
    FormatVersion: "2.0",
    ReportName: "ACL private-brief PPC yesterday",
    ReturnOnlyCompleteData: false,
    Type: "CampaignPerformanceReportRequest",
    Aggregation: "Daily",
    Columns: ["TimePeriod", "CampaignName", "Clicks", "Spend", "ConversionsQualified", "Revenue"],
    Scope: { AccountIds: [MS_ACCOUNT_ID] },
    Time: { PredefinedTime: "Yesterday", ReportTimeZone: "EasternTimeUSCanada" },
  };
  const submitted = await msPost(MS_SUBMIT_URL, { ReportRequest: reportRequest }, accessToken, devToken);
  const requestId = submitted.ReportRequestId;
  if (!requestId) throw new Error("Microsoft reporting returned no ReportRequestId");

  const deadline = Date.now() + 120_000;
  let downloadUrl = null;
  while (Date.now() < deadline) {
    const poll = await msPost(MS_POLL_URL, { ReportRequestId: requestId }, accessToken, devToken);
    const status = poll.ReportRequestStatus?.Status;
    if (status === "Success") { downloadUrl = poll.ReportRequestStatus?.ReportDownloadUrl; break; }
    if (status === "Error") throw new Error("Microsoft report generation failed");
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (downloadUrl === null && Date.now() >= deadline) throw new Error("Microsoft report generation timed out");
  // Success with no download URL = zero rows for the period (campaigns had no delivery).
  if (!downloadUrl) return totals([]);

  const archive = Buffer.from(await (await fetch(downloadUrl)).arrayBuffer());
  const rows = parseCsv(unzipFirstFile(archive).toString("utf8").replace(/^﻿/, ""));
  const campaigns = rows
    .filter((r) => r.CampaignName)
    .map((r) => ({
      name: r.CampaignName,
      spend: num(r.Spend),
      clicks: num(r.Clicks),
      conversions: num(r.ConversionsQualified),
      conversionValue: num(r.Revenue),
    }));
  return totals(campaigns);
}

function totals(campaigns) {
  const sum = (k) => campaigns.reduce((s, c) => s + c[k], 0);
  return {
    ok: true,
    spend: sum("spend"),
    clicks: sum("clicks"),
    conversions: sum("conversions"),
    conversionValue: sum("conversionValue"),
    campaigns: campaigns.filter((c) => c.spend || c.clicks || c.conversions),
  };
}

// ---------- run both, isolate failures ----------
const [google, microsoft] = await Promise.all([
  pullGoogle().catch((e) => ({ ok: false, error: String(e.message ?? e) })),
  pullMicrosoft().catch((e) => ({ ok: false, error: String(e.message ?? e) })),
]);

const result = { sweptAt: new Date().toISOString(), date: reportDate, google, microsoft };
writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
if (PRINT) console.log(JSON.stringify(result, null, 2));
const label = (p, n) => (p.ok ? `${n} ok ($${p.spend.toFixed(2)}, ${p.clicks} clicks)` : `${n} FAILED: ${p.error}`);
console.log(`✓ PPC sweep for ${reportDate} → .t3-ppc.json — ${label(google, "google")}; ${label(microsoft, "microsoft")}`);

#!/usr/bin/env node
// crm.mjs — Zeke's write path into the Triple 3 Labs CRM.
//
// Called from headless Zeke sessions (Pingo bridge etc.) so Jeff can say
// "move Atwood to Proposal Sent" and have the CRM update itself. Every
// mutation also writes an `activities` row so the Command Center's
// "Latest for them" column stays fresh.
//
// Usage: node scripts/crm.mjs <command> [args]   (run from anywhere; env is
// loaded from the repo's .env.local next to this script's parent dir)
//
//   find <query>                         search accounts / contacts / deals (+ their dossier/code locations)
//   status                               needs-you summary (reads only)
//   move-deal <deal> <stage>             e.g. move-deal atwood "proposal sent"
//   add-prospect <company> [opts]        --contact "First Last" --email a@b --phone n
//                                        --deal "Name" --amount 1500 --note "..."
//   add-deal <who> <deal name> [opts]    --amount 1500 --stage prospecting
//   log <who> <text> [--type note]       timeline entry on account/deal/contact
//   attach-link <who> <url> [opts]       --kind audit|proposal|report|website|ads_plan|contract|onboarding|dossier|code|other
//                                        dossier = business docs folder (triple3-business), code = site/app source (repo or path)
//                                        --title "..."   (triple3labs.io/r/<slug> auto-resolves)
//   remove-link <link-id>                delete an attached link (corrections)
//   record-delivery <account> <commitment> <summary> [--url u]
//   anchor <account> <commitment> <YYYY-MM-DD>   set a commitment's next_due
//   set-mrr <account> <amount>
//   add-commitment <account> "<name>" --kind recurring|continuous|one_time
//                                        [--cadence monthly] [--due YYYY-MM-DD] [--agent id] [--customer id]
//                                        [--source "..."] [--notes "..."]
//   edit-commitment <account> <commitment> [--name "..."] [--due YYYY-MM-DD] [--active true|false] [--notes "..."]
//   mark-contract-signed <account> <contract-title-or-id> [--signed-on YYYY-MM-DD] [--note "..."]
//   list-links <account|deal>            print link id, kind, title, url
//
// <who>/<deal>/<account> are fuzzy name matches; ambiguity lists candidates
// and exits 2 so the caller can retry with a tighter query.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

// ---------- env ----------
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(repoRoot, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) die("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
const db = createClient(url, key, { auth: { persistSession: false } });

// ---------- helpers ----------
function die(msg, code = 1) {
  console.error(`✗ ${msg}`);
  process.exit(code);
}
function ok(msg) {
  console.log(`✓ ${msg}`);
}
const COMMAND_FLAGS = {
  find: [], status: [], "move-deal": [],
  "add-prospect": ["contact", "email", "phone", "deal", "amount", "stage", "note"],
  "add-deal": ["amount", "stage"], log: ["type"],
  "attach-link": ["kind", "title"], "remove-link": [],
  "record-delivery": ["url"], anchor: [], "set-mrr": [],
  "add-commitment": ["kind", "cadence", "due", "agent", "customer", "source", "notes"],
  "edit-commitment": ["name", "due", "active", "notes"],
  "mark-contract-signed": ["signed-on", "note"], "list-links": [],
};
const COMMITMENT_KINDS = ["recurring", "continuous", "one_time"];
// Production cadence is unconstrained text. Monthly is the only cadence the
// existing delivery trigger advances; reject unsupported schedules explicitly.
const SUPPORTED_CADENCES = ["monthly"];
const LINK_KINDS = ["audit", "proposal", "report", "website", "ads_plan", "contract", "onboarding", "dossier", "code", "other"];
function parseFlags(args, accepted) {
  const pos = [];
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const name = args[i].slice(2);
      if (!accepted.includes(name)) die(`Unknown flag --${name}. Accepted flags: ${accepted.map((f) => `--${f}`).join(", ") || "(none)"}`);
      if (args[i + 1] === undefined || args[i + 1].startsWith("--")) die(`--${name} requires a value.`);
      flags[name] = args[++i];
    } else pos.push(args[i]);
  }
  return { pos, flags };
}
function validateDate(value, label = "date") {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") ? new Date(`${value}T00:00:00Z`) : new Date(NaN);
  if (!Number.isFinite(date.getTime()) || value.startsWith("0000-") || date.toISOString().slice(0, 10) !== value) die(`Invalid ${label}: ${value}. Use a real calendar date (YYYY-MM-DD).`);
  return value;
}
function nonempty(value, label) {
  if (typeof value !== "string" || !value.trim()) die(`${label} must not be empty.`);
  return value.trim();
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function resolveCommitment(accountId, query) {
  const lookup = db.from("commitments").select("*").eq("account_id", accountId);
  const rows = await q(UUID_RE.test(query) ? lookup.eq("id", query) : lookup.ilike("name", `%${query}%`), "commitments lookup");
  return pickOne(rows, "commitment", (r) => `${r.name} [${r.id}]`);
}
const short = (s, n = 90) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

// client_links.url must open in a browser. Dossier/code locations are often
// given as local paths; map the two known repos to their GitHub tree URLs and
// refuse anything else that isn't http(s) — a Mac path 404s on triple3labs.io.
const LOCAL_REPOS = [
  { prefix: "Dev/triple3-business/", web: "https://github.com/jconn333/triple3-business/tree/main/" },
  { prefix: "Dev/triple_3_platform/", web: "https://github.com/jconn333/triple-3-platform/tree/main/" },
];
function toWebUrl(u) {
  if (/^https?:\/\//i.test(u)) return u;
  const home = process.env.HOME ?? "";
  let p = u.startsWith("~/") ? u.slice(2) : home && u.startsWith(home + "/") ? u.slice(home.length + 1) : null;
  if (p === null) die(`Not a web URL: ${u}. Give an http(s) link (or a path inside ~/Dev/triple3-business or ~/Dev/triple_3_platform).`);
  p = p.replace(/\/+$/, "");
  for (const r of LOCAL_REPOS) if (p.startsWith(r.prefix)) return r.web + p.slice(r.prefix.length);
  die(`Not a web URL: ${u}. Only paths inside ~/Dev/triple3-business or ~/Dev/triple_3_platform can be mapped to GitHub.`);
}

async function q(promise, what) {
  const { data, error } = await promise;
  if (error) die(`${what}: ${error.message}`);
  return data;
}

function pickOne(rows, label, describe) {
  if (!rows || rows.length === 0) die(`No ${label} matches.`, 2);
  if (rows.length > 1) {
    console.error(`Ambiguous ${label} — ${rows.length} matches:`);
    for (const r of rows) console.error(`  · ${describe(r)}`);
    process.exit(2);
  }
  return rows[0];
}

async function resolveAccount(query) {
  const rows = await q(
    db.from("accounts").select("*, contact:contacts(id,first_name,last_name,email,company)").ilike("name", `%${query}%`),
    "accounts lookup",
  );
  return pickOne(rows, "account", (r) => `${r.name} [${r.id}]`);
}

async function resolveDeal(query) {
  const rows = await q(
    db
      .from("deals")
      .select("*, stage:pipeline_stages(name,is_closed), contact:contacts(id,company,first_name,last_name)")
      .or(`name.ilike.%${query}%`),
    "deals lookup",
  );
  let hits = rows;
  if (hits.length === 0) {
    // fall back to company match
    const all = await q(
      db.from("deals").select("*, stage:pipeline_stages(name,is_closed), contact:contacts(id,company,first_name,last_name)"),
      "deals lookup",
    );
    hits = all.filter((d) => (d.contact?.company ?? "").toLowerCase().includes(query.toLowerCase()));
  }
  return pickOne(hits, "deal", (r) => `${r.name} (${r.stage?.name}) [${r.id}]`);
}

async function resolveContact(query) {
  const rows = await q(
    db
      .from("contacts")
      .select("*")
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%`),
    "contacts lookup",
  );
  return pickOne(rows, "contact", (r) => `${r.first_name} ${r.last_name} · ${r.company ?? "—"} [${r.id}]`);
}

async function resolveStage(query) {
  const rows = await q(db.from("pipeline_stages").select("*").ilike("name", `%${query}%`), "stages lookup");
  return pickOne(rows, "stage", (r) => r.name);
}

/** Resolve "<who>" to {account_id?, deal_id?, contact_id?} preferring accounts, then deals, then contacts. */
async function resolveTarget(query) {
  const accounts = await q(db.from("accounts").select("id,name,contact_id").ilike("name", `%${query}%`), "accounts lookup");
  if (accounts.length === 1) return { kind: "account", label: accounts[0].name, account_id: accounts[0].id, contact_id: accounts[0].contact_id };
  if (accounts.length > 1) pickOne(accounts, "account", (r) => `${r.name} [${r.id}]`);
  try {
    const d = await resolveDeal(query);
    return { kind: "deal", label: d.name, deal_id: d.id, contact_id: d.contact?.id ?? d.contact_id };
  } catch {
    /* resolveDeal exits on hard failure; only reachable if it threw synchronously */
  }
  const c = await resolveContact(query);
  return { kind: "contact", label: `${c.first_name} ${c.last_name}`.trim() || c.company, contact_id: c.id };
}

async function logActivity({ type, title, description = null, account_id = null, deal_id = null, contact_id = null, metadata = {} }) {
  await q(
    db.from("activities").insert({ type, title, description, account_id, deal_id, contact_id, metadata: { ...metadata, via: "zeke-crm-cli" } }),
    "log activity",
  );
}

const REPORT_URL_RE = /triple3labs\.io\/r\/([A-Za-z0-9_-]+)/;

// ---------- commands ----------
const [, , cmd, ...rest] = process.argv;
if (!Object.hasOwn(COMMAND_FLAGS, cmd)) die(`Unknown command "${cmd ?? ""}". Commands: ${Object.keys(COMMAND_FLAGS).join(", ")}`);
const { pos, flags } = parseFlags(rest, COMMAND_FLAGS[cmd]);

switch (cmd) {
  case "find": {
    const query = pos.join(" ");
    if (!query) die("Usage: find <query>");
    const [accounts, contacts, deals] = await Promise.all([
      q(db.from("accounts").select("id,name,status,mrr").ilike("name", `%${query}%`), "accounts"),
      q(db.from("contacts").select("id,first_name,last_name,company,email").or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%`), "contacts"),
      q(db.from("deals").select("id,name,amount, stage:pipeline_stages(name)").ilike("name", `%${query}%`), "deals"),
    ]);
    const ids = [...accounts.map((a) => a.id), ...deals.map((d) => d.id)];
    const locs = ids.length
      ? await q(db.from("client_links").select("account_id,deal_id,kind,url").in("kind", ["dossier", "code"]).or(`account_id.in.(${ids.join(",")}),deal_id.in.(${ids.join(",")})`), "locations")
      : [];
    const where = (id) => locs.filter((l) => l.account_id === id || l.deal_id === id).map((l) => `         ${l.kind.padEnd(7)} ${l.url}`).join("\n");
    for (const a of accounts) console.log(`account  ${a.name} · ${a.status} · $${a.mrr ?? "?"}/mo [${a.id}]` + (where(a.id) ? `\n${where(a.id)}` : ""));
    for (const c of contacts) console.log(`contact  ${c.first_name} ${c.last_name} · ${c.company ?? "—"} · ${c.email} [${c.id}]`);
    for (const d of deals) console.log(`deal     ${d.name} · ${d.stage?.name} · ${d.amount ? `$${d.amount}` : "TBD"} [${d.id}]` + (where(d.id) ? `\n${where(d.id)}` : ""));
    if (!accounts.length && !contacts.length && !deals.length) console.log("(no matches)");
    break;
  }

  case "status": {
    const [accounts, commitments] = await Promise.all([
      q(db.from("accounts").select("id,name,mrr,stripe_customer_id"), "accounts"),
      q(db.from("commitments").select("*").eq("active", true), "commitments"),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    for (const a of accounts) {
      const mine = commitments.filter((c) => c.account_id === a.id);
      const flagsOut = [];
      if (!a.stripe_customer_id && Number(a.mrr) > 0) flagsOut.push("NO BILLING");
      const unanchored = mine.filter((c) => c.kind === "recurring" && !c.next_due).length;
      if (unanchored) flagsOut.push(`${unanchored} unanchored`);
      const overdue = mine.filter((c) => c.kind === "recurring" && c.next_due && c.next_due < today);
      const staleOneTime = mine.filter((c) => c.kind === "one_time" && c.next_due && c.next_due < today);
      for (const s of staleOneTime) flagsOut.push(`one-time still open: ${s.name}`);
      for (const o of overdue) flagsOut.push(`OVERDUE: ${o.name} (${o.next_due})`);
      console.log(`${a.name} · $${a.mrr ?? "?"}/mo${flagsOut.length ? " · ⚠ " + flagsOut.join(" · ") : " · ok"}`);
    }
    break;
  }

  case "move-deal": {
    const [dealQ, stageQ] = pos;
    if (!dealQ || !stageQ) die('Usage: move-deal <deal> <stage>  e.g. move-deal atwood "proposal sent"');
    const deal = await resolveDeal(dealQ);
    const stage = await resolveStage(stageQ);
    const patch = { stage_id: stage.id, closed_at: stage.is_closed ? new Date().toISOString() : null };
    await q(db.from("deals").update(patch).eq("id", deal.id), "update deal");
    await logActivity({
      type: "stage_change",
      title: `Deal moved to ${stage.name}: ${deal.name}`,
      description: `${deal.stage?.name ?? "?"} → ${stage.name} (via Zeke)`,
      deal_id: deal.id,
      contact_id: deal.contact?.id ?? deal.contact_id,
    });
    ok(`${deal.name}: ${deal.stage?.name ?? "?"} → ${stage.name}`);
    break;
  }

  case "add-prospect": {
    const company = pos.join(" ");
    if (!company) die('Usage: add-prospect <company> [--contact "First Last"] [--email x] [--phone x] [--deal "Name"] [--amount n] [--stage prospecting] [--note "..."]');
    const [first = "", ...restName] = (flags.contact ?? "").split(" ");
    // contacts.email is NOT NULL; unknown emails use the existing `.invalid`
    // placeholder convention (see PAXIT) so they can never be mailed by accident.
    const placeholderEmail = `${(first || company).toLowerCase().replace(/[^a-z0-9]+/g, "")}@${company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.invalid`;
    const contact = await q(
      db
        .from("contacts")
        .insert({
          first_name: first || company,
          last_name: restName.join(" "),
          company,
          email: flags.email ?? placeholderEmail,
          phone: flags.phone ?? null,
          source: "prospecting",
          message: flags.note ?? null,
        })
        .select()
        .single(),
      "insert contact",
    );
    let dealLine = "";
    if (flags.deal) {
      const stage = await resolveStage(flags.stage ?? "prospecting");
      const deal = await q(
        db
          .from("deals")
          .insert({ name: flags.deal, contact_id: contact.id, stage_id: stage.id, amount: flags.amount ?? null, description: flags.note ?? null })
          .select()
          .single(),
        "insert deal",
      );
      dealLine = ` + deal "${deal.name}" in ${stage.name}`;
      await logActivity({ type: "note", title: `Prospect added: ${company}`, description: flags.note ?? null, contact_id: contact.id, deal_id: deal.id });
    } else {
      await logActivity({ type: "note", title: `Prospect added: ${company}`, description: flags.note ?? null, contact_id: contact.id });
    }
    ok(`Prospect ${company} [${contact.id}]${dealLine}`);
    break;
  }

  case "add-deal": {
    const [who, ...nameParts] = pos;
    const dealName = nameParts.join(" ");
    if (!who || !dealName) die('Usage: add-deal <contact/company> <deal name> [--amount n] [--stage prospecting]');
    const contact = await resolveContact(who);
    const stage = await resolveStage(flags.stage ?? "prospecting");
    const deal = await q(
      db.from("deals").insert({ name: dealName, contact_id: contact.id, stage_id: stage.id, amount: flags.amount ?? null }).select().single(),
      "insert deal",
    );
    await logActivity({ type: "note", title: `Deal created: ${dealName}`, contact_id: contact.id, deal_id: deal.id });
    ok(`Deal "${dealName}" in ${stage.name} for ${contact.company ?? contact.first_name} [${deal.id}]`);
    break;
  }

  case "log": {
    const [who, ...textParts] = pos;
    const text = textParts.join(" ");
    if (!who || !text) die('Usage: log <who> <text> [--type note|email|call|meeting]');
    const t = await resolveTarget(who);
    await logActivity({
      type: typeof flags.type === "string" ? flags.type : "note",
      title: short(text),
      description: text.length > 90 ? text : null,
      account_id: t.account_id ?? null,
      deal_id: t.deal_id ?? null,
      contact_id: t.contact_id ?? null,
    });
    ok(`Logged on ${t.kind} ${t.label}: ${short(text, 60)}`);
    break;
  }

  case "attach-link": {
    const [who, rawUrl] = pos;
    if (!who || !rawUrl) die('Usage: attach-link <who> <url> [--kind ...] [--title "..."]');
    const linkUrl = toWebUrl(rawUrl);
    if (linkUrl !== rawUrl) console.error(`↪ stored as ${linkUrl}`);
    const t = await resolveTarget(who);
    if (!t.account_id && !t.deal_id) die("Links attach to accounts or deals — matched only a bare contact.");
    let prospect_report_id = null;
    let title = typeof flags.title === "string" ? flags.title : null;
    let kind = typeof flags.kind === "string" ? flags.kind : null;
    const m = linkUrl.match(REPORT_URL_RE);
    if (m) {
      const report = (await q(db.from("prospect_reports").select("id,title").eq("slug", m[1]), "report lookup"))[0];
      if (report) {
        prospect_report_id = report.id;
        title = title ?? report.title;
        const tl = (report.title ?? "").toLowerCase();
        kind = kind ?? (tl.includes("audit") ? "audit" : tl.includes("proposal") ? "proposal" : tl.includes("ads") ? "ads_plan" : tl.includes("report") ? "report" : "other");
      }
    }
    title = title ?? linkUrl;
    kind = kind ?? "other";
    if (!LINK_KINDS.includes(kind)) die(`Invalid --kind. Accepted: ${LINK_KINDS.join(", ")}`);
    const row = await q(
      db
        .from("client_links")
        .insert({ account_id: t.account_id ?? null, deal_id: t.deal_id ?? null, contact_id: t.contact_id ?? null, kind, title, url: linkUrl, prospect_report_id })
        .select()
        .single(),
      "insert link",
    );
    await logActivity({
      type: "note",
      title: `Link attached (${kind}): ${title}`,
      description: linkUrl,
      account_id: t.account_id ?? null,
      deal_id: t.deal_id ?? null,
      contact_id: t.contact_id ?? null,
    });
    ok(`Attached ${kind} "${title}" to ${t.kind} ${t.label} [${row.id}]${prospect_report_id ? " (view-tracked)" : ""}`);
    break;
  }

  case "remove-link": {
    const [id] = pos;
    if (!id) die("Usage: remove-link <link-id>");
    const rows = await q(db.from("client_links").delete().eq("id", id).select(), "delete link");
    if (!rows.length) die("No link with that id.", 2);
    ok(`Removed link "${rows[0].title}"`);
    break;
  }

  case "record-delivery": {
    const [accountQ, commitmentQ, ...summaryParts] = pos;
    const summary = summaryParts.join(" ");
    if (!accountQ || !commitmentQ || !summary) die('Usage: record-delivery <account> <commitment> <summary> [--url u]');
    const account = await resolveAccount(accountQ);
    const commitments = await q(
      db.from("commitments").select("*").eq("account_id", account.id).eq("active", true).ilike("name", `%${commitmentQ}%`),
      "commitments lookup",
    );
    const commitment = pickOne(commitments, "commitment", (r) => `${r.name} (${r.kind}) [${r.id}]`);
    await q(
      db.from("deliveries").insert({ commitment_id: commitment.id, delivered_at: new Date().toISOString(), summary, output_url: flags.url ?? null }),
      "insert delivery",
    );
    await logActivity({ type: "delivery", title: `Delivered: ${commitment.name}`, description: summary, account_id: account.id, contact_id: account.contact_id });
    ok(`Delivery recorded for ${account.name} · ${commitment.name}`);
    break;
  }

  case "anchor": {
    const [accountQ, commitmentQ, date] = pos;
    if (!accountQ || !commitmentQ || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) die("Usage: anchor <account> <commitment> <YYYY-MM-DD>");
    validateDate(date);
    const account = await resolveAccount(accountQ);
    const commitments = await q(
      db.from("commitments").select("*").eq("account_id", account.id).ilike("name", `%${commitmentQ}%`),
      "commitments lookup",
    );
    const commitment = pickOne(commitments, "commitment", (r) => `${r.name} [${r.id}]`);
    await q(db.from("commitments").update({ next_due: date }).eq("id", commitment.id), "update commitment");
    await logActivity({ type: "note", title: `Commitment anchored: ${commitment.name} → ${date}`, account_id: account.id, contact_id: account.contact_id });
    ok(`${account.name} · "${commitment.name}" next due ${date}`);
    break;
  }

  case "add-commitment": {
    const [accountQ, rawName] = pos;
    if (!accountQ || !rawName || pos.length !== 2) die('Usage: add-commitment <account> "<name>" --kind recurring|continuous|one_time [--cadence monthly] [--due YYYY-MM-DD] [--agent id] [--customer id] [--source "..."] [--notes "..."]');
    const name = nonempty(rawName, "name");
    if (!COMMITMENT_KINDS.includes(flags.kind)) die(`Invalid --kind. Accepted: ${COMMITMENT_KINDS.join(", ")}`);
    const cadence = flags.cadence ?? (flags.kind === "recurring" ? "monthly" : null);
    if (cadence !== null && !SUPPORTED_CADENCES.includes(cadence)) die(`Unsupported --cadence. Accepted: ${SUPPORTED_CADENCES.join(", ")}; only monthly has automatic due-date advancement.`);
    const nextDue = flags.due !== undefined ? validateDate(flags.due, "--due") : null;
    const account = await resolveAccount(accountQ);
    const customerId = nonempty(flags.customer ?? account.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""), "--customer (or account slug)");
    const agentId = nonempty(flags.agent ?? `${customerId}.ops`, "--agent");
    console.log(`Using customer_id=${customerId}, agent_id=${agentId}`);
    const commitment = await q(db.from("commitments").insert({
      account_id: account.id, name, kind: flags.kind, cadence, next_due: nextDue,
      customer_id: customerId, agent_id: agentId, source: flags.source ?? null, notes: flags.notes ?? null,
    }).select().single(), "insert commitment");
    await logActivity({ type: "note", title: `Commitment added: ${name}`, description: flags.notes ?? null,
      account_id: account.id, contact_id: account.contact_id,
      metadata: { commitment_id: commitment.id, kind: flags.kind, cadence, next_due: nextDue, customer_id: customerId, agent_id: agentId },
    });
    ok(`${account.name}: commitment "${name}" [${commitment.id}] · customer ${customerId} · agent ${agentId}`);
    break;
  }

  case "edit-commitment": {
    const [accountQ, commitmentQ] = pos;
    if (!accountQ || !commitmentQ || pos.length !== 2 || !Object.keys(flags).length) die('Usage: edit-commitment <account> <commitment> [--name "..."] [--due YYYY-MM-DD] [--active true|false] [--notes "..."]');
    const patch = {};
    if (flags.name !== undefined) patch.name = nonempty(flags.name, "--name");
    if (flags.due !== undefined) patch.next_due = validateDate(flags.due, "--due");
    if (flags.notes !== undefined) patch.notes = flags.notes;
    if (flags.active !== undefined) {
      if (!["true", "false"].includes(flags.active)) die("--active must be true or false.");
      patch.active = flags.active === "true";
    }
    const account = await resolveAccount(accountQ);
    const commitment = await resolveCommitment(account.id, commitmentQ);
    const updated = await q(db.from("commitments").update(patch).eq("id", commitment.id).eq("account_id", account.id).select().single(), "update commitment");
    await logActivity({ type: "note", title: `Commitment updated: ${updated.name}`, account_id: account.id, contact_id: account.contact_id,
      metadata: { commitment_id: commitment.id, before: Object.fromEntries(Object.keys(patch).map((key) => [key, commitment[key]])), after: patch },
    });
    ok(`${account.name}: updated "${updated.name}" [${updated.id}] · ${Object.entries(patch).map(([key, value]) => `${key}=${value}`).join(", ")}`);
    break;
  }

  case "mark-contract-signed": {
    const [accountQ, contractQ] = pos;
    if (!accountQ || !contractQ || pos.length !== 2) die('Usage: mark-contract-signed <account> <contract-title-or-id> [--signed-on YYYY-MM-DD] [--note "..."]');
    const signedOn = flags["signed-on"] !== undefined ? validateDate(flags["signed-on"], "--signed-on") : null;
    const account = await resolveAccount(accountQ);
    const lookup = db.from("contracts").select("*").eq("account_id", account.id);
    const rows = await q(UUID_RE.test(contractQ) ? lookup.eq("id", contractQ) : lookup.ilike("title", `%${contractQ}%`), "contracts lookup");
    const contract = pickOne(rows, "contract", (r) => `${r.title} [${r.id}]`);
    const note = `Recorded as externally signed${signedOn ? ` on ${signedOn}` : ""}.${flags.note ? ` ${flags.note}` : ""}`;
    const description = [contract.description, note].filter(Boolean).join("\n\n");
    await q(db.from("contracts").update({ status: "signed", description, updated_at: new Date().toISOString() }).eq("id", contract.id).eq("account_id", account.id).select().single(), "mark contract signed");
    await logActivity({ type: "contract_signed", title: `Contract marked signed: ${contract.title}`, description: note,
      account_id: account.id, contact_id: account.contact_id,
      metadata: { contract_id: contract.id, signed_on: signedOn, previous_status: contract.status, source: "external_record" },
    });
    ok(`${account.name}: "${contract.title}" marked signed${signedOn ? ` on ${signedOn}` : ""} [${contract.id}]`);
    break;
  }

  case "list-links": {
    const who = pos.join(" ");
    if (!who) die("Usage: list-links <account|deal>");
    const target = await resolveTarget(who);
    if (!target.account_id && !target.deal_id) die("Links belong to accounts or deals.");
    const links = await q(db.from("client_links").select("id,kind,title,url")
      .eq(target.account_id ? "account_id" : "deal_id", target.account_id ?? target.deal_id)
      .order("created_at", { ascending: true }), "list links");
    for (const link of links) console.log(`${link.id}\t${link.kind}\t${link.title}\t${link.url}`);
    if (!links.length) console.log(`No links attached to ${target.kind} ${target.label}.`);
    break;
  }

  case "set-mrr": {
    const [accountQ, amount] = pos;
    if (!accountQ || isNaN(Number(amount))) die("Usage: set-mrr <account> <amount>");
    const account = await resolveAccount(accountQ);
    await q(db.from("accounts").update({ mrr: Number(amount) }).eq("id", account.id), "update account");
    await logActivity({ type: "note", title: `MRR set to $${Number(amount).toLocaleString()}/mo`, account_id: account.id, contact_id: account.contact_id });
    ok(`${account.name} MRR → $${Number(amount).toLocaleString()}/mo`);
    break;
  }

  default:
    die(`Unknown command "${cmd ?? ""}". Commands: ${Object.keys(COMMAND_FLAGS).join(", ")}`);
}

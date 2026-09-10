// Radiant Shine Wash — start the recurring subscription SCHEDULE (LIVE Stripe).
//
// Run this AFTER the first-payment link is paid (that payment creates the
// Stripe customer + saves the payment method and covers setup + month 1).
// Unlike Mast-Lepley's flat subscription, Radiant's SEO fee STEPS DOWN at
// month 7 (agreement §3.2), so this uses a subscription schedule:
//   Phase 1 — 5 monthly cycles (months 2-6):
//     • SEO Agent                 $799/mo
//     • GBP & Reputation Agent    $499/mo
//   Phase 2 — indefinite (month 7+):
//     • SEO Agent                 $499/mo
//     • GBP & Reputation Agent    $499/mo
// Card rail adds the 3% service fee (§3.4); ACH does not. The rail follows the
// method the client saved on the first-payment link.
//
// The schedule starts ONE MONTH after the Service Start Date (month 1 was on
// the link), so the first recurring charge is month 2 and the step-down lands
// exactly at month 7 with no human intervention.
//
// Usage:  node scripts/radiantshine-subscription.mjs YYYY-MM-DD   # Service Start Date
//         (defaults to today if omitted)

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(repoRoot, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ACCOUNT_ID = "08b02fed-3cf5-46e8-b7f3-e9baa402aeb6";
const SURCHARGE = 0.03;
const cardCents = (ach) => Math.round(ach * (1 + SURCHARGE));

// [phase1 cents, phase2 cents] per item
const ITEMS = [
  { key: "seo", name: "SEO Agent — Monthly", phase1: 79900, phase2: 49900 },
  { key: "gbp", name: "GBP & Reputation Agent — Monthly", phase1: 49900, phase2: 49900 },
];
const PHASE1_CYCLES = 5; // months 2-6 (month 1 covered by the first-payment link)

function addCalendarMonth(date) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

// Service Start Date → schedule starts one calendar month later.
const start = process.argv[2] ? new Date(process.argv[2] + "T12:00:00Z") : new Date();
const anchor = addCalendarMonth(start);
const anchorTs = Math.floor(anchor.getTime() / 1000);

async function recurringPrice(name, lookupKey, unitAmount) {
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (existing.data[0]) return existing.data[0].id;
  const product = await stripe.products.create({ name });
  const price = await stripe.prices.create({
    product: product.id, currency: "usd", unit_amount: unitAmount,
    recurring: { interval: "month" }, lookup_key: lookupKey, nickname: name,
  });
  return price.id;
}

const { data: account } = await db
  .from("accounts").select("id, name, contact_id, stripe_customer_id")
  .eq("id", ACCOUNT_ID).single();
if (!account?.stripe_customer_id) throw new Error("No Stripe customer yet — has the first-payment link been paid?");

const methods = await stripe.customers.listPaymentMethods(account.stripe_customer_id, { limit: 10 });
const pm = methods.data.sort((a, b) => b.created - a.created)[0];
if (!pm) throw new Error("No saved payment method on the customer.");
const rail = pm.type === "us_bank_account" ? "ach" : "card";
const suffix = rail === "card" ? " (incl. 3% card fee)" : "";

async function phaseItems(phase) {
  const items = [];
  for (const it of ITEMS) {
    const cents = rail === "card" ? cardCents(it[phase]) : it[phase];
    const price = await recurringPrice(
      `${it.name}${suffix}`,
      `rs_${it.key}_monthly_${rail}_${cents}c`,
      cents
    );
    items.push({ price, quantity: 1 });
  }
  return items;
}

const phase1Items = await phaseItems("phase1");
const phase2Items = await phaseItems("phase2");

const schedule = await stripe.subscriptionSchedules.create({
  customer: account.stripe_customer_id,
  start_date: anchorTs,
  end_behavior: "release", // after phases, the subscription continues as-is
  default_settings: {
    default_payment_method: pm.id,
    collection_method: "charge_automatically",
  },
  phases: [
    { items: phase1Items, iterations: PHASE1_CYCLES, proration_behavior: "none" },
    { items: phase2Items, proration_behavior: "none" }, // no iterations = runs until released
  ],
  metadata: {
    purpose: "seo_monthly", account_id: ACCOUNT_ID, account_name: account.name,
    rail, items: "seo+gbp", step_down: "799->499 at month 7",
  },
});

const usd = (c) => (c / 100).toLocaleString("en-US", { style: "currency", currency: "usd" });
const p1 = ITEMS.reduce((s, i) => s + (rail === "card" ? cardCents(i.phase1) : i.phase1), 0);
const p2 = ITEMS.reduce((s, i) => s + (rail === "card" ? cardCents(i.phase2) : i.phase2), 0);

await db.from("activities").insert({
  account_id: ACCOUNT_ID, contact_id: account.contact_id, type: "subscription_started",
  title: `Subscription schedule started: ${usd(p1)}/mo months 2-6, ${usd(p2)}/mo from month 7 (${rail.toUpperCase()})`,
  description: `SEO + GBP two-item schedule ${schedule.id}. First recurring charge ${anchor.toISOString().slice(0, 10)} (setup + month 1 covered by the first-payment link). Step-down to ${usd(p2)}/mo is automatic at month 7.`,
  metadata: { subscription_schedule_id: schedule.id, rail },
});

console.log(`✓ Subscription schedule ${schedule.id} (${schedule.status}) — ${rail.toUpperCase()} rail`);
console.log(`  Months 2-6: ${usd(p1)}/mo · Month 7+: ${usd(p2)}/mo`);
console.log(`  First recurring charge: ${anchor.toISOString().slice(0, 10)}`);

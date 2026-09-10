// Radiant Shine Wash — ACH settle-watch (LIVE Stripe/CRM).
//
// Polls the first-payment PaymentIntent. While it's "processing" (ACH pending),
// it does nothing and exits. When it "succeeds", it starts the recurring
// subscription SCHEDULE (Service Start Date = 2026-08-31, so the first recurring
// charge lands one month later, 2026-09-30), marks the account paid, and logs.
// If the ACH FAILS, it logs an alert.
//
// Fully idempotent: if a schedule already exists for the customer it won't make
// another, so it's safe to run on a cron every couple of hours until the ACH
// resolves. Prints WAITING / DONE / FAILED so a cron log shows what happened.
//
// Usage:  node scripts/radiantshine-settle-watch.mjs

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
const CONTACT_ID = "d84d0aa4-488d-4e53-bfc4-330863331783";
const CUSTOMER = "cus_VAqSiMBbMdeFmZ";
const PI_ID = "pi_3UAUiSFEYv5tv6D11FxZxo3T";
const SERVICE_START = "2026-08-31"; // Jeff: default to today; first recurring charge = +1 month
const SURCHARGE = 0.03;
const cardCents = (ach) => Math.round(ach * (1 + SURCHARGE));
const ITEMS = [
  { key: "seo", name: "SEO Agent — Monthly", phase1: 79900, phase2: 49900 },
  { key: "gbp", name: "GBP & Reputation Agent — Monthly", phase1: 49900, phase2: 49900 },
];
const PHASE1_CYCLES = 5; // months 2-6 (month 1 was on the first-payment link)
const stamp = () => new Date().toISOString();

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

async function startSchedule() {
  const existing = await stripe.subscriptionSchedules.list({ customer: CUSTOMER, limit: 5 });
  const live = existing.data.filter((s) => s.status !== "canceled" && s.status !== "released");
  if (live.length) { console.log(`[${stamp()}] schedule already exists (${live[0].id}) — skipping`); return; }

  const methods = await stripe.customers.listPaymentMethods(CUSTOMER, { limit: 10 });
  const pm = methods.data.sort((a, b) => b.created - a.created)[0];
  if (!pm) throw new Error("no saved payment method on customer");
  const rail = pm.type === "us_bank_account" ? "ach" : "card";
  const suffix = rail === "card" ? " (incl. 3% card fee)" : "";

  const start = new Date(SERVICE_START + "T12:00:00Z");
  const anchor = new Date(start); anchor.setMonth(anchor.getMonth() + 1);
  const anchorTs = Math.floor(anchor.getTime() / 1000);

  const phaseItems = async (phase) => {
    const items = [];
    for (const it of ITEMS) {
      const cents = rail === "card" ? cardCents(it[phase]) : it[phase];
      const price = await recurringPrice(`${it.name}${suffix}`, `rs_${it.key}_monthly_${rail}_${cents}c`, cents);
      items.push({ price, quantity: 1 });
    }
    return items;
  };
  const phase1Items = await phaseItems("phase1");
  const phase2Items = await phaseItems("phase2");

  const schedule = await stripe.subscriptionSchedules.create({
    customer: CUSTOMER, start_date: anchorTs, end_behavior: "release",
    default_settings: { default_payment_method: pm.id, collection_method: "charge_automatically" },
    phases: [
      { items: phase1Items, iterations: PHASE1_CYCLES, proration_behavior: "none" },
      { items: phase2Items, proration_behavior: "none" },
    ],
    metadata: { purpose: "seo_monthly", account_id: ACCOUNT_ID, account_name: "Radiant Shine Wash", rail, items: "seo+gbp", step_down: "799->499 at month 7" },
  });

  const usd = (c) => (c / 100).toLocaleString("en-US", { style: "currency", currency: "usd" });
  const p1 = ITEMS.reduce((s, i) => s + (rail === "card" ? cardCents(i.phase1) : i.phase1), 0);
  const p2 = ITEMS.reduce((s, i) => s + (rail === "card" ? cardCents(i.phase2) : i.phase2), 0);
  await db.from("activities").insert({
    account_id: ACCOUNT_ID, contact_id: CONTACT_ID, type: "subscription_started",
    title: `Subscription schedule started: ${usd(p1)}/mo months 2-6, ${usd(p2)}/mo from month 7 (${rail.toUpperCase()})`,
    description: `Auto-started by settle-watch on ACH settlement. Schedule ${schedule.id}. First recurring charge ${anchor.toISOString().slice(0, 10)} (setup + month 1 covered by the first payment). Step-down to ${usd(p2)}/mo automatic at month 7.`,
    metadata: { subscription_schedule_id: schedule.id, rail },
  });
  console.log(`[${stamp()}] DONE schedule ${schedule.id} — ${usd(p1)}/mo -> ${usd(p2)}/mo, first charge ${anchor.toISOString().slice(0, 10)}`);
}

async function main() {
  const pi = await stripe.paymentIntents.retrieve(PI_ID);
  console.log(`[${stamp()}] PI ${PI_ID} = ${pi.status}`);

  if (pi.status === "succeeded") {
    await db.from("accounts").update({ setup_fee_paid_at: stamp(), setup_fee_payment_intent: PI_ID }).eq("id", ACCOUNT_ID);
    await startSchedule();
    return;
  }
  if (pi.status === "processing" || pi.status === "requires_action") {
    console.log(`[${stamp()}] WAITING — ACH still pending`);
    return;
  }
  await db.from("activities").insert({
    account_id: ACCOUNT_ID, contact_id: CONTACT_ID, type: "payment",
    title: `First payment FAILED — ACH did not clear (${pi.status})`,
    description: `PaymentIntent ${PI_ID} is ${pi.status}. No subscription started. Re-mint a first-payment link and follow up with Mark.`,
    metadata: { payment_intent: PI_ID, rail: "ach", status: pi.status },
  });
  console.log(`[${stamp()}] FAILED — ACH ${pi.status}, logged`);
}

main().catch((e) => { console.error(`[${stamp()}] settle-watch error:`, e.message || e); process.exit(1); });

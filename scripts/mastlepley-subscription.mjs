// Mast-Lepley — start the recurring TWO-ITEM subscription (LIVE Stripe).
//
// Run this AFTER the first-month link is paid (that payment creates the Stripe
// customer + saves the payment method and IS the Service Start Date charge).
// This starts the ongoing retainer as two separate line items per the deal:
//   • Local Search Build   $1,999/mo   (agreement §3.2 — during 6-month Build)
//   • Google Ads Management $  499/mo   (agreement §3.4 — during the Build)
// Card rail adds the 3% service fee (§3.5); ACH does not. The rail follows the
// method the client saved on the first-month link.
//
// Anchored to ONE MONTH after the Service Start Date with no proration, so the
// first recurring charge lands the month after the link already covered.
// (The built-in "+ Start subscription" button can't do this — it's single-item
//  from MRR and charges immediately.)
//
// Usage:  node scripts/mastlepley-subscription.mjs YYYY-MM-DD   # Service Start Date
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

const ACCOUNT_ID = "e1e0b71f-fe4b-463b-bd72-ffb07131a50e";
const SURCHARGE = 0.03;
const cardCents = (ach) => Math.round(ach * (1 + SURCHARGE));
const ITEMS = [
  { key: "build", name: "Local Search Build — Monthly", ach: 199900 },
  { key: "ppc", name: "Google Ads Management — Monthly", ach: 49900 },
];

function addCalendarMonth(date) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

// Service Start Date → first recurring charge one calendar month later.
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
  .from("accounts").select("id, name, contact_id, stripe_customer_id, setup_fee_paid_at")
  .eq("id", ACCOUNT_ID).single();
if (!account?.stripe_customer_id) throw new Error("No Stripe customer yet — has the first-month link been paid?");

const methods = await stripe.customers.listPaymentMethods(account.stripe_customer_id, { limit: 10 });
const pm = methods.data.sort((a, b) => b.created - a.created)[0];
if (!pm) throw new Error("No saved payment method on the customer.");
const rail = pm.type === "us_bank_account" ? "ach" : "card";

const items = [];
for (const it of ITEMS) {
  const cents = rail === "card" ? cardCents(it.ach) : it.ach;
  const suffix = rail === "card" ? " (incl. 3% card fee)" : "";
  const price = await recurringPrice(`${it.name}${suffix}`, `ml_${it.key}_monthly_${rail}_${cents}c`, cents);
  items.push({ price, quantity: 1 });
}

const sub = await stripe.subscriptions.create({
  customer: account.stripe_customer_id,
  items,
  default_payment_method: pm.id,
  collection_method: "charge_automatically",
  billing_cycle_anchor: anchorTs,
  proration_behavior: "none",
  metadata: { purpose: "seo_monthly", account_id: ACCOUNT_ID, account_name: account.name, rail, items: "build+ppc" },
});

await db.from("activities").insert({
  account_id: ACCOUNT_ID, contact_id: account.contact_id, type: "subscription_started",
  title: `Subscription started: $2,498/mo (${rail.toUpperCase()}), Build $1,999 + PPC $499`,
  description: `Two-item retainer. First recurring charge ${anchor.toISOString().slice(0, 10)} (month 1 covered by the first-month link).`,
  metadata: { subscription_id: sub.id, rail },
});

console.log(`✓ Subscription ${sub.id} (${sub.status}) — ${rail.toUpperCase()} rail`);
console.log(`  First recurring charge: ${anchor.toISOString().slice(0, 10)}`);

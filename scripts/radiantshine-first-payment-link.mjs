// Radiant Shine Wash — first-payment link generator (LIVE Stripe).
//
// Mirrors scripts/mastlepley-first-month-link.mjs. Per the services agreement
// (triple_3_platform/prospects/radiant-shine-wash/agreement/), everything due
// on the Service Start Date goes on ONE link — three line items:
//   • Setup — SEO + GBP & Reputation Agents      $2,000.00   (agreement §3.1)
//   • SEO Agent — Month 1                        $  799.00   (agreement §3.2)
//   • GBP & Reputation Agent — Month 1           $  499.00   (agreement §3.3)
//   ACH total $3,298.00 · card total adds the 3% service fee (§3.4).
//
// The links carry purpose=implementation_fee + account_id metadata, so the
// existing Stripe webhook will, on payment: create the Stripe customer, save
// the payment method off-session, mark the account paid, and retire the unused
// sibling link. Paying here IS the Service Start Date payment.
//
// After payment, start the recurring subscription SCHEDULE (months 2-6 at
// $799+$499, then $499+$499 from month 7 — the step-down is automatic):
// see scripts/radiantshine-subscription.mjs.
//
// NOTE: no CRM contract row yet (contracts require an uploaded file; the
// agreement docx still has the registered-entity fill-in), so contract_id
// metadata carries the deal id for attribution instead.
//
// Idempotent: reuses prices by lookup_key, and if active links already exist
// for this account it prints them instead of minting duplicates.
//
// Usage:  node scripts/radiantshine-first-payment-link.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(repoRoot, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("STRIPE_SECRET_KEY missing from .env.local");
const stripe = new Stripe(key, { typescript: true });
const LIVE = key.startsWith("sk_live");

// ── Deal constants ────────────────────────────────────────────────────────
const ACCOUNT_ID = "08b02fed-3cf5-46e8-b7f3-e9baa402aeb6";
const DEAL_ID = "3fbee346-e3f6-4778-b8ce-7580cfc554f8"; // stands in for contract_id
const ACCOUNT_NAME = "Radiant Shine Wash";
const SURCHARGE = 0.03;
const cardCents = (ach) => Math.round(ach * (1 + SURCHARGE));

const LINE_ITEMS = [
  { key: "setup", name: "Setup — SEO + GBP & Reputation Agents", ach: 200000 },
  { key: "seo_m1", name: "SEO Agent — Month 1", ach: 79900 },
  { key: "gbp_m1", name: "GBP & Reputation Agent — Month 1", ach: 49900 },
];

async function findOrCreatePrice(name, lookupKey, unitAmount) {
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (existing.data[0]) return existing.data[0].id;
  const product = await stripe.products.create({ name });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: unitAmount,
    lookup_key: lookupKey,
    nickname: name,
  });
  return price.id;
}

async function existingActiveLinks() {
  const out = [];
  let startingAfter;
  for (let page = 0; page < 5; page++) {
    const batch = await stripe.paymentLinks.list({
      active: true,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const l of batch.data) {
      if (l.metadata?.purpose === "implementation_fee" && l.metadata?.account_id === ACCOUNT_ID) {
        out.push(l);
      }
    }
    if (!batch.has_more) break;
    startingAfter = batch.data.at(-1)?.id;
  }
  return out;
}

async function priceIdsFor(rail) {
  const ids = [];
  for (const li of LINE_ITEMS) {
    const cents = rail === "card" ? cardCents(li.ach) : li.ach;
    const suffix = rail === "card" ? " (incl. 3% card fee)" : "";
    const id = await findOrCreatePrice(
      `${li.name}${suffix}`,
      `rs_${li.key}_${rail}_${cents}c`,
      cents
    );
    ids.push({ price: id, quantity: 1 });
  }
  return ids;
}

// Shown above the pay button on checkout — the itemized list is collapsed
// behind "View details" on mobile, so this is the breakdown Mark actually
// sees before paying (per Jeff 2026-08-28).
const CUSTOM_TEXT = {
  ach: "This one-time payment covers: $2,000.00 setup (SEO + GBP & Reputation agents) + $799.00 SEO Agent month 1 + $499.00 GBP & Reputation Agent month 1 = $3,298.00. Ongoing service then bills monthly: $1,298/mo for months 2-6, then $998/mo from month 7.",
  card: "This one-time payment covers (incl. 3% card fee): $2,060.00 setup (SEO + GBP & Reputation agents) + $822.97 SEO Agent month 1 + $513.97 GBP & Reputation Agent month 1 = $3,396.94. Ongoing service then bills monthly: $1,336.94/mo for months 2-6, then $1,027.94/mo from month 7. Pay by bank (ACH) instead to skip the 3% card fee.",
};

async function createLink(rail) {
  const line_items = await priceIdsFor(rail);
  return stripe.paymentLinks.create({
    line_items,
    custom_text: { submit: { message: CUSTOM_TEXT[rail] } },
    customer_creation: "always",
    payment_method_types: [rail === "card" ? "card" : "us_bank_account"],
    payment_intent_data: {
      setup_future_usage: "off_session",
      metadata: { purpose: "implementation_fee", account_id: ACCOUNT_ID, contract_id: DEAL_ID, method: rail },
    },
    metadata: {
      purpose: "implementation_fee",
      account_id: ACCOUNT_ID,
      contract_id: DEAL_ID,
      account_name: ACCOUNT_NAME,
      method: rail,
    },
    restrictions: { completed_sessions: { limit: 1 } },
  });
}

// ── Run ─────────────────────────────────────────────────────────────────
const usd = (c) => (c / 100).toLocaleString("en-US", { style: "currency", currency: "usd" });
const achTotal = LINE_ITEMS.reduce((s, l) => s + l.ach, 0);
const cardTotal = LINE_ITEMS.reduce((s, l) => s + cardCents(l.ach), 0);
console.log(`Stripe mode: ${LIVE ? "LIVE" : "test"}`);
console.log(`ACH total:  ${usd(achTotal)}`);
console.log(`Card total: ${usd(cardTotal)} (incl. 3%)\n`);

const already = await existingActiveLinks();
if (already.length) {
  console.log("Active first-payment links already exist for this account — not creating duplicates:\n");
  for (const l of already) console.log(`  ${l.metadata.method?.toUpperCase().padEnd(4)} ${l.url}`);
  console.log("\n(Deactivate them in Stripe first if you want a fresh pair.)");
} else {
  const ach = await createLink("ach");
  const card = await createLink("card");
  await stripe.paymentLinks.update(ach.id, { metadata: { ...ach.metadata, sibling_link_id: card.id } });
  await stripe.paymentLinks.update(card.id, { metadata: { ...card.metadata, sibling_link_id: ach.id } });
  console.log("Created first-payment links:\n");
  console.log(`  ACH  (${usd(achTotal)}):       ${ach.url}`);
  console.log(`  CARD (${usd(cardTotal)}, +3%):  ${card.url}`);
}

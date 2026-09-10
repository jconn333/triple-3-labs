// Mast-Lepley — first-month payment link generator (LIVE Stripe).
//
// Why this exists: Mast-Lepley has NO setup fee (agreement §3.1), so the CRM's
// built-in setup-fee button (which needs setup_fee_cents > 0) can't capture a
// payment method. This mints a pair of single-use Payment Links (ACH + card)
// for the FIRST MONTH — two line items per the deal:
//   • Local Search Build (Month 1)        $1,999.00   (agreement §3.2)
//   • Google Ads Management (Month 1)      $  499.00   (agreement §3.4)
// Card rail adds the 3% service fee (§3.5); ACH does not.
//
// The links carry purpose=implementation_fee + account_id metadata, so the
// existing Stripe webhook (src/app/api/stripe/webhook/route.ts) will, on
// payment: create the Stripe customer, save the payment method off-session
// (for the recurring subscription), mark the account paid, and retire the
// unused sibling link. Paying month 1 here IS the Service Start Date payment.
//
// After payment, start the recurring TWO-ITEM subscription (Build $1,999/mo +
// PPC $499/mo) anchored to next month — see scripts/mastlepley-subscription.mjs.
//
// Idempotent: reuses prices by lookup_key, and if active links already exist
// for this account it prints them instead of minting duplicates.
//
// Usage:  node scripts/mastlepley-first-month-link.mjs

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
const ACCOUNT_ID = "e1e0b71f-fe4b-463b-bd72-ffb07131a50e";
const CONTRACT_ID = "da6a4e6c-5ad9-4ff3-bc51-97a602ae3fed";
const ACCOUNT_NAME = "Mast-Lepley Silo, Inc.";
const SURCHARGE = 0.03;
const cardCents = (ach) => Math.round(ach * (1 + SURCHARGE));

const LINE_ITEMS = [
  { key: "build_m1", name: "Local Search Build — Month 1", ach: 199900 },
  { key: "ppc_m1", name: "Google Ads Management — Month 1", ach: 49900 },
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
      `ml_${li.key}_${rail}_${cents}c`,
      cents
    );
    ids.push({ price: id, quantity: 1 });
  }
  return ids;
}

async function createLink(rail) {
  const line_items = await priceIdsFor(rail);
  return stripe.paymentLinks.create({
    line_items,
    customer_creation: "always",
    payment_method_types: [rail === "card" ? "card" : "us_bank_account"],
    payment_intent_data: {
      setup_future_usage: "off_session",
      metadata: { purpose: "implementation_fee", account_id: ACCOUNT_ID, contract_id: CONTRACT_ID, method: rail },
    },
    metadata: {
      purpose: "implementation_fee",
      account_id: ACCOUNT_ID,
      contract_id: CONTRACT_ID,
      account_name: ACCOUNT_NAME,
      method: rail,
    },
    restrictions: { completed_sessions: { limit: 1 } },
  });
}

// ── Run ─────────────────────────────────────────────────────────────────
const usd = (c) => (c / 100).toLocaleString("en-US", { style: "currency", currency: "usd" });
console.log(`Stripe mode: ${LIVE ? "LIVE" : "test"}`);
console.log(`ACH total:  ${usd(LINE_ITEMS.reduce((s, l) => s + l.ach, 0))}`);
console.log(`Card total: ${usd(LINE_ITEMS.reduce((s, l) => s + cardCents(l.ach), 0))} (incl. 3%)\n`);

const already = await existingActiveLinks();
if (already.length) {
  console.log("Active first-month links already exist for this account — not creating duplicates:\n");
  for (const l of already) console.log(`  ${l.metadata.method?.toUpperCase().padEnd(4)} ${l.url}`);
  console.log("\n(Deactivate them in Stripe first if you want a fresh pair.)");
} else {
  const ach = await createLink("ach");
  const card = await createLink("card");
  await stripe.paymentLinks.update(ach.id, { metadata: { ...ach.metadata, sibling_link_id: card.id } });
  await stripe.paymentLinks.update(card.id, { metadata: { ...card.metadata, sibling_link_id: ach.id } });
  console.log("Created first-month payment links:\n");
  console.log(`  ACH  (${usd(249800)}):        ${ach.url}`);
  console.log(`  CARD (${usd(257294)}, +3%):    ${card.url}`);
}

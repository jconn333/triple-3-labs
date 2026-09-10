// AloNovus Corp. — Website-Recreation Skill license: one-time ACH payment link (LIVE Stripe).
//
// Per the JMC ↔ AloNovus Website-Recreation Skill License Agreement (2026-09-09):
//   • One-time fee: $10,000.00, ACH only (no card option, no surcharge).
//   • Seller of record: JMC Companies LLC. Payment collected in the Triple 3 Labs
//     Stripe account (this .env.local key), per Jeff 2026-09-09.
//
// Idempotent: if an active link with purpose=skill_license + client=AloNovus already
// exists (e.g. minted by another session), it prints that instead of creating a duplicate.
//
// Usage:  node scripts/alonovus-skill-license-link.mjs

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

// ── Deal constants ──────────────────────────────────────────────────────
const CLIENT = "AloNovus Corp.";
const PURPOSE = "skill_license";
const AMOUNT_CENTS = 1000000; // $10,000.00
const PRODUCT_NAME = "Website-Recreation Skill — exclusive license (one-time)";
const LOOKUP_KEY = "alonovus_skill_license_ach_1000000c";

const usd = (c) => (c / 100).toLocaleString("en-US", { style: "currency", currency: "usd" });

async function findOrCreatePrice() {
  const existing = await stripe.prices.list({ lookup_keys: [LOOKUP_KEY], limit: 1 });
  if (existing.data[0]) return existing.data[0].id;
  const product = await stripe.products.create({ name: PRODUCT_NAME });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: AMOUNT_CENTS,
    lookup_key: LOOKUP_KEY,
    nickname: PRODUCT_NAME,
  });
  return price.id;
}

async function existingActiveLink() {
  let startingAfter;
  for (let page = 0; page < 5; page++) {
    const batch = await stripe.paymentLinks.list({
      active: true,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const l of batch.data) {
      if (l.metadata?.purpose === PURPOSE && l.metadata?.client === CLIENT) return l;
    }
    if (!batch.has_more) break;
    startingAfter = batch.data.at(-1)?.id;
  }
  return null;
}

console.log(`Stripe mode: ${LIVE ? "LIVE" : "test"}`);
console.log(`Client: ${CLIENT}  ·  Amount (ACH): ${usd(AMOUNT_CENTS)}\n`);

const already = await existingActiveLink();
if (already) {
  console.log("An active skill-license link already exists for AloNovus — not creating a duplicate:\n");
  console.log(`  ACH (${usd(AMOUNT_CENTS)}):  ${already.url}`);
  console.log("\n(Deactivate it in Stripe first if you want a fresh one.)");
} else {
  const price = await findOrCreatePrice();
  const link = await stripe.paymentLinks.create({
    line_items: [{ price, quantity: 1 }],
    payment_method_types: ["us_bank_account"],
    customer_creation: "always",
    custom_text: {
      submit: {
        message:
          "One-time payment of $10,000.00 for the exclusive license to JMC's website-recreation Skill, per the signed License Agreement. Paid by bank transfer (ACH) — no card fee.",
      },
    },
    payment_intent_data: {
      metadata: { purpose: PURPOSE, client: CLIENT, method: "ach" },
    },
    metadata: { purpose: PURPOSE, client: CLIENT, method: "ach", amount_usd: "10000" },
    restrictions: { completed_sessions: { limit: 1 } },
  });
  console.log("Created one-time ACH payment link:\n");
  console.log(`  ACH (${usd(AMOUNT_CENTS)}):  ${link.url}`);
}

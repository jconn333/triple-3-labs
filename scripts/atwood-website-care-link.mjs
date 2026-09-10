// Atwood Glass — website + care-plan payment link generator (LIVE Stripe).
//
// Revised deal (Jeff, 2026-09-01/02): $2,500 one-time for the website + $99/mo
// ongoing, ALL ON ONE LINK. Supersedes atwood-website-link.mjs ($2,500-only)
// and atwood-subscription.mjs (manual post-payment subscription start).
//
// Mints a single-use, CARD-ONLY Payment Link in subscription mode with two
// line items:
//   • Website Build (one-time)             $2,500.00   — charged today
//   • Website Care — Monthly               $   99.00   — 30-day trial, so the
//                                                        first $99 bills one
//                                                        month after payment
// No 3% surcharge (Jeff absorbs the card fee on this one).
//
// Paying the link creates the Stripe customer, saves the card, charges $2,500
// and starts the $99/mo subscription automatically — no follow-up script.
// The link carries purpose=implementation_fee + account_id metadata, so the
// existing webhook marks the account paid and retires the link on payment.
//
// Idempotent: reuses prices by lookup_key. Any OLDER active setup-fee link for
// this account (e.g. the $2,500-only one from 2026-09-01) is deactivated first
// so only one live link exists; if a website+care link already exists it is
// printed instead of minting a duplicate.
//
// Usage:  node scripts/atwood-website-care-link.mjs

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
const ACCOUNT_ID = "611cb4ab-c7f0-40f3-9a11-23fdf255e2bf";
const ACCOUNT_NAME = "Atwood Glass";
const WEBSITE = { name: "Website Build (one-time)", cents: 250000, lookup: "atwood_website_card_250000c" };
const CARE = { name: "Website Care — Monthly", cents: 9900, lookup: "atwood_care_monthly_card_9900c" };
const TRIAL_DAYS = 30; // first $99 lands ~one month after the $2,500 is paid
const VARIANT = "website_plus_care"; // marks the with-subscription link

async function findOrCreatePrice({ name, cents, lookup }, recurring) {
  const existing = await stripe.prices.list({ lookup_keys: [lookup], limit: 1 });
  if (existing.data[0]) return existing.data[0].id;
  const product = await stripe.products.create({ name });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: cents,
    lookup_key: lookup,
    nickname: name,
    ...(recurring ? { recurring: { interval: "month" } } : {}),
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

// Shown above the pay button on checkout (the itemized list collapses behind
// "View details" on mobile, so spell the deal out here).
const SUBMIT_TEXT =
  "Today's payment covers the $2,500.00 one-time website build. Your $99.00/month website care plan then starts automatically 30 days from today and bills monthly to this card.";

async function createLink() {
  const websitePrice = await findOrCreatePrice(WEBSITE, false);
  const carePrice = await findOrCreatePrice(CARE, true);
  return stripe.paymentLinks.create({
    line_items: [
      { price: websitePrice, quantity: 1 },
      { price: carePrice, quantity: 1 },
    ],
    payment_method_types: ["card"],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { purpose: "website_monthly", account_id: ACCOUNT_ID, account_name: ACCOUNT_NAME, rail: "card" },
    },
    custom_text: { submit: { message: SUBMIT_TEXT } },
    metadata: {
      purpose: "implementation_fee",
      account_id: ACCOUNT_ID,
      account_name: ACCOUNT_NAME,
      method: "card",
      variant: VARIANT,
    },
    restrictions: { completed_sessions: { limit: 1 } },
  });
}

// ── Run ─────────────────────────────────────────────────────────────────
const usd = (c) => (c / 100).toLocaleString("en-US", { style: "currency", currency: "usd" });
console.log(`Stripe mode: ${LIVE ? "LIVE" : "test"}`);
console.log(`Today (card only): ${usd(WEBSITE.cents)} · then ${usd(CARE.cents)}/mo after a ${TRIAL_DAYS}-day trial\n`);

const already = await existingActiveLinks();
const current = already.find((l) => l.metadata?.variant === VARIANT);
if (current) {
  console.log("A website+care link already exists for this account — not creating a duplicate:\n");
  console.log(`  CARD  ${current.url}`);
} else {
  for (const old of already) {
    await stripe.paymentLinks.update(old.id, { active: false });
    console.log(`Deactivated older link ${old.id} (${old.url})`);
  }
  const link = await createLink();
  console.log("\nCreated website + care-plan payment link:\n");
  console.log(`  CARD (${usd(WEBSITE.cents)} today, ${usd(CARE.cents)}/mo from day ${TRIAL_DAYS}):  ${link.url}`);
}

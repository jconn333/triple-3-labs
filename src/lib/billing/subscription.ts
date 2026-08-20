import Stripe from "stripe";
import { cardCentsFor } from "./setup-fee";

/**
 * Monthly retainer subscription (services agreement §3.2/§3.4). The base (ACH)
 * amount comes from the account's agreed MRR — no longer hardcoded to the Eco
 * Seal $499 template. The price follows the payment rail saved during the
 * setup-fee payment: ACH at face value, card with the 3% processing surcharge.
 */

// Fallback base (ACH) amount for accounts with no MRR recorded — the original
// Eco Seal template price, so that flow is unchanged.
export const MONTHLY_ACH_CENTS = 49_900; // $499.00

/** Base (ACH) monthly amount in cents from an account's MRR (dollars), or the fallback. */
export function resolveMonthlyBaseCents(mrr: number | null | undefined): number {
  return mrr && mrr > 0 ? Math.round(mrr * 100) : MONTHLY_ACH_CENTS;
}

/** Charged monthly amount for a rail, given the ACH/base amount. */
export function monthlyCentsFor(baseAchCents: number, rail: "ach" | "card"): number {
  return rail === "card" ? cardCentsFor(baseAchCents) : baseAchCents;
}

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
}

/**
 * Find (or lazily create) the recurring ACH + card prices for a specific base
 * monthly amount. Lookup keys are keyed off the exact cents so each distinct
 * retainer gets its own reusable pair.
 */
async function findOrCreateMonthlyPrices(
  stripe: Stripe,
  baseAchCents: number
): Promise<{ ach: string; card: string }> {
  const cardCents = cardCentsFor(baseAchCents);
  const lookups = {
    ach: `jmc_seo_monthly_ach_${baseAchCents}c`,
    card: `jmc_seo_monthly_card_${cardCents}c`,
  } as const;

  const existing = await stripe.prices.list({
    lookup_keys: [lookups.ach, lookups.card],
    limit: 2,
  });
  const found: Partial<Record<"ach" | "card", string>> = {};
  for (const p of existing.data) {
    if (p.lookup_key === lookups.ach) found.ach = p.id;
    if (p.lookup_key === lookups.card) found.card = p.id;
  }
  if (found.ach && found.card) return { ach: found.ach, card: found.card };

  const product = await stripe.products.create({
    name: "SEO Agent — Monthly Service",
    description: "Monthly SEO agent service fee per the SEO Services Agreement (§3.2).",
  });
  if (!found.ach) {
    found.ach = (
      await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: baseAchCents,
        recurring: { interval: "month" },
        lookup_key: lookups.ach,
        nickname: "Monthly — ACH",
      })
    ).id;
  }
  if (!found.card) {
    found.card = (
      await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: cardCents,
        recurring: { interval: "month" },
        lookup_key: lookups.card,
        nickname: "Monthly — card (incl. 3% processing)",
      })
    ).id;
  }
  return { ach: found.ach!, card: found.card! };
}

export interface SavedMethodInfo {
  paymentMethodId: string;
  rail: "ach" | "card";
  label: string;
  monthlyCents: number;
}

/**
 * The payment method saved during the setup-fee payment determines the rail
 * and therefore how the base monthly amount is charged. Most recently added
 * method wins. `baseAchCents` is the account's base (ACH) monthly amount.
 */
export async function getSavedMethod(
  customerId: string,
  baseAchCents: number
): Promise<SavedMethodInfo | null> {
  const stripe = getStripe();
  const methods = await stripe.customers.listPaymentMethods(customerId, { limit: 10 });
  const pm = methods.data.sort((a, b) => b.created - a.created)[0];
  if (!pm) return null;
  if (pm.type === "us_bank_account") {
    return {
      paymentMethodId: pm.id,
      rail: "ach",
      label: `Bank account ····${pm.us_bank_account?.last4 ?? "????"}`,
      monthlyCents: monthlyCentsFor(baseAchCents, "ach"),
    };
  }
  if (pm.type === "card") {
    return {
      paymentMethodId: pm.id,
      rail: "card",
      label: `${pm.card?.brand ?? "card"} ····${pm.card?.last4 ?? "????"}`,
      monthlyCents: monthlyCentsFor(baseAchCents, "card"),
    };
  }
  return null;
}

/** An account's existing monthly subscription, if any non-cancelled one exists. */
export async function findExistingMonthlySubscription(
  customerId: string,
  accountId: string
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  return (
    subs.data.find(
      (s) =>
        s.metadata?.purpose === "seo_monthly" &&
        s.metadata?.account_id === accountId &&
        !["canceled", "incomplete_expired"].includes(s.status)
    ) ?? null
  );
}

/**
 * Starts the monthly retainer, charging the saved method immediately (Service
 * Start Date) and on the same day of each month thereafter (§3.2).
 */
export async function createMonthlySubscription(params: {
  customerId: string;
  accountId: string;
  accountName: string;
  /** Base (ACH) monthly amount in cents. Card rail adds the 3% surcharge. */
  baseAchCents: number;
}): Promise<{ subscription: Stripe.Subscription; method: SavedMethodInfo }> {
  const stripe = getStripe();
  const method = await getSavedMethod(params.customerId, params.baseAchCents);
  if (!method) throw new Error("No saved payment method on the Stripe customer");

  const prices = await findOrCreateMonthlyPrices(stripe, params.baseAchCents);
  const subscription = await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: prices[method.rail], quantity: 1 }],
    default_payment_method: method.paymentMethodId,
    collection_method: "charge_automatically",
    metadata: {
      purpose: "seo_monthly",
      account_id: params.accountId,
      account_name: params.accountName,
      rail: method.rail,
    },
  });
  return { subscription, method };
}

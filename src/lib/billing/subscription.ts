import Stripe from "stripe";

/**
 * Monthly retainer subscription (services agreement §3.2/§3.4). The price
 * follows the payment rail saved during the setup-fee payment: ACH at face
 * value, card with the 3% processing surcharge.
 */

export const MONTHLY_ACH_CENTS = 49_900; // $499.00
export const MONTHLY_CARD_CENTS = 51_397; // $513.97 (incl. 3% card surcharge)

const PRICE_LOOKUPS = {
  ach: "jmc_seo_monthly_ach_499",
  card: "jmc_seo_monthly_card_51397",
} as const;

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
}

async function findOrCreateMonthlyPrices(stripe: Stripe): Promise<{ ach: string; card: string }> {
  const existing = await stripe.prices.list({
    lookup_keys: [PRICE_LOOKUPS.ach, PRICE_LOOKUPS.card],
    limit: 2,
  });
  const found: Partial<Record<"ach" | "card", string>> = {};
  for (const p of existing.data) {
    if (p.lookup_key === PRICE_LOOKUPS.ach) found.ach = p.id;
    if (p.lookup_key === PRICE_LOOKUPS.card) found.card = p.id;
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
        unit_amount: MONTHLY_ACH_CENTS,
        recurring: { interval: "month" },
        lookup_key: PRICE_LOOKUPS.ach,
        nickname: "Monthly — ACH",
      })
    ).id;
  }
  if (!found.card) {
    found.card = (
      await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: MONTHLY_CARD_CENTS,
        recurring: { interval: "month" },
        lookup_key: PRICE_LOOKUPS.card,
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
 * and therefore the monthly price. Most recently added method wins.
 */
export async function getSavedMethod(customerId: string): Promise<SavedMethodInfo | null> {
  const stripe = getStripe();
  const methods = await stripe.customers.listPaymentMethods(customerId, { limit: 10 });
  const pm = methods.data.sort((a, b) => b.created - a.created)[0];
  if (!pm) return null;
  if (pm.type === "us_bank_account") {
    return {
      paymentMethodId: pm.id,
      rail: "ach",
      label: `Bank account ····${pm.us_bank_account?.last4 ?? "????"}`,
      monthlyCents: MONTHLY_ACH_CENTS,
    };
  }
  if (pm.type === "card") {
    return {
      paymentMethodId: pm.id,
      rail: "card",
      label: `${pm.card?.brand ?? "card"} ····${pm.card?.last4 ?? "????"}`,
      monthlyCents: MONTHLY_CARD_CENTS,
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
}): Promise<{ subscription: Stripe.Subscription; method: SavedMethodInfo }> {
  const stripe = getStripe();
  const method = await getSavedMethod(params.customerId);
  if (!method) throw new Error("No saved payment method on the Stripe customer");

  const prices = await findOrCreateMonthlyPrices(stripe);
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

import Stripe from "stripe";

/**
 * Implementation-fee collection. Two payment options per the services
 * agreement §3.4: ACH at face value, card with a 3% processing surcharge.
 * Each customer gets a pair of single-use Payment Links (links don't expire,
 * unlike Checkout Sessions). The paying session saves the payment method for
 * future off-session charges (the monthly subscription) and creates the
 * Stripe customer, which the webhook writes back onto the CRM account.
 */

export const SETUP_FEE_ACH_CENTS = 150_000; // $1,500.00
export const SETUP_FEE_CARD_CENTS = 154_500; // $1,545.00 (incl. 3% card surcharge)

const PRICE_LOOKUPS = {
  ach: "jmc_setup_fee_ach_1500",
  card: "jmc_setup_fee_card_1545",
} as const;

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
}

async function findOrCreatePrices(stripe: Stripe): Promise<{ ach: string; card: string }> {
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
    name: "SEO Agent — Implementation Fee",
    description: "One-time implementation fee per the SEO Services Agreement (§3.1).",
  });
  if (!found.ach) {
    found.ach = (
      await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: SETUP_FEE_ACH_CENTS,
        lookup_key: PRICE_LOOKUPS.ach,
        nickname: "Implementation fee — ACH",
      })
    ).id;
  }
  if (!found.card) {
    found.card = (
      await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: SETUP_FEE_CARD_CENTS,
        lookup_key: PRICE_LOOKUPS.card,
        nickname: "Implementation fee — card (incl. 3% processing)",
      })
    ).id;
  }
  return { ach: found.ach!, card: found.card! };
}

export interface SetupFeeLinks {
  achUrl: string;
  cardUrl: string;
}

/**
 * Creates a pair of single-use payment links for one account. Metadata carries
 * the CRM ids so the webhook can attribute the payment; each link knows its
 * sibling so the unused one can be deactivated after payment.
 */
export async function createSetupFeeLinks(params: {
  accountId: string;
  contractId: string;
  accountName: string;
}): Promise<SetupFeeLinks> {
  const stripe = getStripe();
  const prices = await findOrCreatePrices(stripe);

  const common = (method: "ach" | "card") => ({
    line_items: [{ price: prices[method], quantity: 1 }],
    customer_creation: "always" as const,
    payment_intent_data: {
      setup_future_usage: "off_session" as const,
      metadata: {
        purpose: "implementation_fee",
        account_id: params.accountId,
        contract_id: params.contractId,
        method,
      },
    },
    metadata: {
      purpose: "implementation_fee",
      account_id: params.accountId,
      contract_id: params.contractId,
      account_name: params.accountName,
      method,
    },
    restrictions: { completed_sessions: { limit: 1 } },
  });

  const ach = await stripe.paymentLinks.create({
    ...common("ach"),
    payment_method_types: ["us_bank_account"],
  });
  const card = await stripe.paymentLinks.create({
    ...common("card"),
    payment_method_types: ["card"],
  });

  // Cross-reference so the webhook can retire the unused sibling.
  await stripe.paymentLinks.update(ach.id, {
    metadata: { ...ach.metadata, sibling_link_id: card.id },
  });
  await stripe.paymentLinks.update(card.id, {
    metadata: { ...card.metadata, sibling_link_id: ach.id },
  });

  return { achUrl: ach.url, cardUrl: card.url };
}

/**
 * Once the fee is paid, retire EVERY active setup-fee link for the account —
 * not just the paid pair. Multiple executions (or resends) can mint multiple
 * pairs, and any stale active link could otherwise take a second payment.
 */
export async function deactivateAllSetupFeeLinks(accountId: string): Promise<void> {
  const stripe = getStripe();
  let startingAfter: string | undefined;
  for (let page = 0; page < 10; page++) {
    const batch = await stripe.paymentLinks.list({
      active: true,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const link of batch.data) {
      if (
        link.metadata?.purpose === "implementation_fee" &&
        link.metadata?.account_id === accountId
      ) {
        await stripe.paymentLinks.update(link.id, { active: false }).catch(() => {});
      }
    }
    if (!batch.has_more) break;
    startingAfter = batch.data[batch.data.length - 1]?.id;
  }
}

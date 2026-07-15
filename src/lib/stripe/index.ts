import Stripe from "stripe";
import type { SubscriptionSummary, InvoiceSummary } from "@/lib/crm/types";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
  }
  return _stripe;
}

export async function createStripeCustomer(params: {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  return getStripe().customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata || {},
  });
}

export async function getCustomerSubscriptions(
  stripeCustomerId: string
): Promise<SubscriptionSummary[]> {
  const stripe = getStripe();
  const { data } = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "all",
    // NOTE: "data.items.data.price.product" is 5 levels — Stripe caps expansion
    // at 4 and rejects the whole call. Product names are resolved separately.
    expand: ["data.default_payment_method", "data.items.data.price"],
    limit: 100,
  });

  // Resolve product names for the (few) unique product ids.
  const productIds = [
    ...new Set(
      data
        .flatMap((sub) => sub.items.data.map((item) => item.price?.product))
        .filter((p): p is string => typeof p === "string")
    ),
  ];
  const productNames = new Map<string, string>();
  await Promise.all(
    productIds.map(async (pid) => {
      try {
        const product = await stripe.products.retrieve(pid);
        productNames.set(pid, product.name);
      } catch {
        // leave unnamed
      }
    })
  );

  return data.map((sub) => {
    // In newer Stripe API versions, current_period lives on items
    const firstItem = sub.items.data[0];
    const periodStart = firstItem?.current_period_start;
    const periodEnd = firstItem?.current_period_end;

    return {
    id: sub.id,
    status: sub.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : new Date().toISOString(),
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : new Date().toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    items: sub.items.data.map((item) => {
      const product = item.price?.product;
      const productName =
        typeof product === "string"
          ? productNames.get(product) || item.price?.nickname || "Subscription"
          : (product as Stripe.Product | null)?.name || "Subscription";
      return {
        product_name: productName,
        price_amount: (item.price?.unit_amount || 0) / 100,
        price_currency: item.price?.currency || "usd",
        price_interval: item.price?.recurring?.interval || "month",
        quantity: item.quantity || 1,
      };
    }),
    default_payment_method: (() => {
      const pm = sub.default_payment_method;
      if (typeof pm !== "object" || !pm) return null;
      if ("card" in pm && pm.card) {
        return {
          brand: pm.card.brand || "unknown",
          last4: pm.card.last4 || "****",
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
        };
      }
      if ("us_bank_account" in pm && pm.us_bank_account) {
        return {
          brand: "bank",
          last4: pm.us_bank_account.last4 || "****",
          exp_month: 0,
          exp_year: 0,
        };
      }
      return null;
    })(),
  }});
}

export async function getCustomerInvoices(
  stripeCustomerId: string,
  limit = 10
): Promise<InvoiceSummary[]> {
  const { data } = await getStripe().invoices.list({
    customer: stripeCustomerId,
    limit,
  });

  return data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    status: inv.status,
    amount_due: (inv.amount_due || 0) / 100,
    currency: inv.currency || "usd",
    created: new Date((inv.created || 0) * 1000).toISOString(),
    hosted_invoice_url: inv.hosted_invoice_url ?? null,
  }));
}

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
  const { data } = await getStripe().subscriptions.list({
    customer: stripeCustomerId,
    status: "all",
    expand: ["data.default_payment_method", "data.items.data.price.product"],
    limit: 100,
  });

  return data.map((sub) => {
    // In newer Stripe SDK, current_period is on items, not the subscription itself
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
        typeof product === "object" && product && "name" in product
          ? (product as Stripe.Product).name
          : "Unknown";
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
      if (typeof pm === "object" && pm && "card" in pm && pm.card) {
        return {
          brand: pm.card.brand || "unknown",
          last4: pm.card.last4 || "****",
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
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

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { deactivateAllSetupFeeLinks } from "@/lib/billing/setup-fee";
import { findStripeCustomerIds } from "@/lib/stripe";

/**
 * Stripe webhook. Currently handles implementation-fee payments made through
 * the per-account payment links: marks the CRM account paid, saves the Stripe
 * customer id (whose payment method is stored for the future subscription),
 * and retires the unused sibling link.
 *
 * ACH nuance: bank-debit payments confirm asynchronously. `completed` with
 * payment_status "unpaid" means the debit was initiated; the money lands (or
 * fails) days later via the async_payment_* events.
 */

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: receiptError } = await admin.from("stripe_events").insert({
    id: event.id,
    type: event.type,
  });
  if (receiptError?.code === "23505") return NextResponse.json({ received: true });
  if (receiptError) {
    console.error("Could not record Stripe event:", receiptError);
    return NextResponse.json({ error: "Could not record event" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.purpose !== "implementation_fee") break;
        if (session.payment_status === "paid") {
          await markSetupFeePaid(session, event.created);
        } else {
          // ACH debit initiated; funds settle asynchronously.
          await logActivity(session, {
            type: "payment_initiated",
            title: "Implementation fee payment initiated (bank debit processing)",
            description:
              "The client started an ACH payment. Funds typically settle within a few business days.",
          });
        }
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.purpose !== "implementation_fee") break;
        await markSetupFeePaid(session, event.created);
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.purpose !== "implementation_fee") break;
        await logActivity(session, {
          type: "payment_failed",
          title: "Implementation fee payment FAILED (bank debit did not clear)",
          description: "The ACH payment failed. Follow up with the client for another payment.",
        });
        break;
      }
      case "invoice.paid": {
        await logInvoiceActivity(event.data.object as Stripe.Invoice, "paid");
        break;
      }
      case "invoice.payment_failed": {
        await logInvoiceActivity(event.data.object as Stripe.Invoice, "failed");
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`Webhook handling failed for ${event.type}:`, err);
    // A failed attempt must remain retryable; only completed processing keeps the claim.
    const { error: releaseError } = await admin.from("stripe_events").delete().eq("id", event.id);
    if (releaseError) console.error(`Could not release failed Stripe event ${event.id}:`, releaseError);
    // 500 so Stripe retries the delivery.
    return NextResponse.json({ error: "Handler failure" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function markSetupFeePaid(session: Stripe.Checkout.Session, created: number): Promise<void> {
  const admin = createAdminClient();
  const accountId = session.metadata?.account_id;
  if (!accountId) return;

  const paidAt = new Date(created * 1000).toISOString();
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  const { data: account, error: accountError } = await admin
    .from("accounts")
    .select("id, contact_id, setup_fee_paid_at, setup_fee_payment_intent, stripe_customer_id")
    .eq("id", accountId)
    .single();
  if (accountError) throw accountError;
  if (!account) throw new Error(`Setup-fee account not found: ${accountId}`);
  // Different Stripe event types can describe the same checkout; that is not a second payment.
  const { data: previous, error: previousError } = await admin.from("activities")
    .select("id").eq("account_id", accountId).eq("type", "payment_received")
    .contains("metadata", { checkout_session: session.id });
  if (previousError) throw previousError;
  if (previous?.length) return;

  if (account.setup_fee_paid_at && (!paymentIntent || account.setup_fee_payment_intent !== paymentIntent)) {
    // Already recorded (e.g. a stale link got paid twice) — still make sure no
    // link stays active, and leave a loud trace for follow-up/refund.
    await deactivateAllSetupFeeLinks(accountId).catch(() => {});
    const { error } = await admin.from("activities").insert({
      account_id: accountId,
      contact_id: account.contact_id,
      type: "payment_received",
      title: "DUPLICATE implementation-fee payment received — review for refund",
      description: `A second setup-fee payment came in after the fee was already marked paid. Checkout session ${session.id}.`,
      metadata: { checkout_session: session.id, stripe_customer_id: customerId },
    });
    if (error) throw error;
    return;
  }

  const { error: updateError } = await admin
    .from("accounts")
    .update({
      setup_fee_paid_at: account.setup_fee_paid_at ?? paidAt,
      setup_fee_payment_intent: paymentIntent ?? null,
      stripe_customer_id: account.stripe_customer_id ?? customerId ?? null,
      updated_at: paidAt,
    })
    .eq("id", accountId);
  if (updateError) throw updateError;

  const method = session.metadata?.method === "card" ? "card" : "ACH";
  const amount = ((session.amount_total ?? 0) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "usd",
  });
  const { error: activityError } = await admin.from("activities").insert({
    account_id: accountId,
    contact_id: account.contact_id,
    type: "payment_received",
    title: `Implementation fee paid: ${amount} (${method})`,
    description: `Setup fee received via Stripe.${customerId && account.stripe_customer_id && customerId !== account.stripe_customer_id ? ` Additional paying Stripe customer: ${customerId}; primary customer preserved.` : ""}`,
    metadata: {
      stripe_customer_id: customerId,
      previous_stripe_customer_id: account.stripe_customer_id,
      payment_intent: paymentIntent,
      checkout_session: session.id,
      method,
    },
  });
  if (activityError) throw activityError;

  // Retire every outstanding setup-fee link for this account (not just this pair).
  await deactivateAllSetupFeeLinks(accountId).catch((e) =>
    console.error("Link deactivation failed:", e)
  );
}

/** Resolve exact ownership first, then the account contact's billing email. */
async function findInvoiceAccount(customerId: string) {
  const admin = createAdminClient();
  const { data: direct, error } = await admin.from("accounts")
    .select("id, contact_id").eq("stripe_customer_id", customerId);
  if (error) throw error;
  if (direct?.length === 1) return direct[0];
  if (direct?.length) return null; // Ambiguous ownership must never pick a client.

  const customer = await getStripe().customers.retrieve(customerId);
  if (customer.deleted || !customer.email) return null;
  const email = customer.email.trim();
  const { data: candidates, error: lookupError } = await admin.from("accounts")
    .select("id, contact_id, stripe_customer_id, contact:contacts!inner(email)")
    .ilike("contact.email", email.replace(/[\\%_]/g, "\\$&"));
  if (lookupError) throw lookupError;
  if (candidates?.length !== 1) return null;
  const account = candidates[0];
  const customerIds = await findStripeCustomerIds({
    knownId: account.stripe_customer_id, email, strict: true,
  });
  return customerIds.includes(customerId) ? account : null;
}

/** Subscription invoices → account timeline, including secondary checkout customers. */
async function logInvoiceActivity(invoice: Stripe.Invoice, outcome: "paid" | "failed"): Promise<void> {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  const admin = createAdminClient();
  const account = customerId ? await findInvoiceAccount(customerId) : null;
  if (!account) {
    const { error } = await admin.from("activities").insert({
      account_id: null,
      type: "unmatched_stripe_event",
      title: `Unmatched Stripe invoice ${outcome}: ${invoice.number ?? invoice.id}`,
      description: "No unique CRM account matches this invoice customer; review account ownership.",
      metadata: { invoice_id: invoice.id, stripe_customer_id: customerId, outcome },
    });
    if (error) throw error;
    return;
  }

  const amount = ((outcome === "paid" ? invoice.amount_paid : invoice.amount_due) / 100).toLocaleString(
    "en-US",
    { style: "currency", currency: "usd" }
  );
  const cycle = invoice.billing_reason === "subscription_create" ? "first" : "monthly";
  const { error } = await admin.from("activities").insert({
    account_id: account.id,
    contact_id: account.contact_id,
    type: outcome === "paid" ? "payment_received" : "payment_failed",
    title:
      outcome === "paid"
        ? `Subscription payment received: ${amount} (${cycle} invoice)`
        : `Subscription payment FAILED: ${amount} — follow up with the client`,
    description:
      outcome === "paid"
        ? `Invoice ${invoice.number ?? invoice.id} paid.`
        : `Invoice ${invoice.number ?? invoice.id} did not collect. Stripe will retry per its dunning settings.`,
    metadata: { invoice_id: invoice.id, billing_reason: invoice.billing_reason, stripe_customer_id: customerId },
  });
  if (error) throw error;
}

async function logActivity(
  session: Stripe.Checkout.Session,
  entry: { type: string; title: string; description: string }
): Promise<void> {
  const admin = createAdminClient();
  const accountId = session.metadata?.account_id;
  if (!accountId) return;
  const { data: account, error: accountError } = await admin
    .from("accounts")
    .select("contact_id")
    .eq("id", accountId)
    .single();
  if (accountError) throw accountError;
  if (!account) throw new Error(`Payment account not found: ${accountId}`);
  const { error } = await admin.from("activities").insert({
    account_id: accountId,
    contact_id: account.contact_id,
    type: entry.type,
    title: entry.title,
    description: entry.description,
    metadata: { checkout_session: session.id, method: session.metadata?.method },
  });
  if (error) throw error;
}

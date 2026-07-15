import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { deactivateLinkAndSibling } from "@/lib/billing/setup-fee";

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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.purpose !== "implementation_fee") break;
        if (session.payment_status === "paid") {
          await markSetupFeePaid(session);
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
        await markSetupFeePaid(session);
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
      default:
        break;
    }
  } catch (err) {
    console.error(`Webhook handling failed for ${event.type}:`, err);
    // 500 so Stripe retries the delivery.
    return NextResponse.json({ error: "Handler failure" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function markSetupFeePaid(session: Stripe.Checkout.Session): Promise<void> {
  const admin = createAdminClient();
  const accountId = session.metadata?.account_id;
  if (!accountId) return;

  const paidAt = new Date().toISOString();
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  const { data: account } = await admin
    .from("accounts")
    .select("id, contact_id, setup_fee_paid_at, stripe_customer_id")
    .eq("id", accountId)
    .single();
  if (!account || account.setup_fee_paid_at) return; // unknown or already recorded

  await admin
    .from("accounts")
    .update({
      setup_fee_paid_at: paidAt,
      setup_fee_payment_intent: paymentIntent ?? null,
      stripe_customer_id: account.stripe_customer_id ?? customerId ?? null,
      updated_at: paidAt,
    })
    .eq("id", accountId);

  const method = session.metadata?.method === "card" ? "card" : "ACH";
  const amount = ((session.amount_total ?? 0) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "usd",
  });
  await admin.from("activities").insert({
    contact_id: account.contact_id,
    type: "payment_received",
    title: `Implementation fee paid: ${amount} (${method})`,
    description: `Setup fee received via Stripe. Payment method saved for the monthly subscription.`,
    metadata: {
      stripe_customer_id: customerId,
      payment_intent: paymentIntent,
      checkout_session: session.id,
      method,
    },
  });

  // Retire both payment links so the pair can't be paid twice.
  const linkId = typeof session.payment_link === "string" ? session.payment_link : session.payment_link?.id;
  if (linkId) await deactivateLinkAndSibling(linkId).catch((e) => console.error("Link deactivation failed:", e));
}

async function logActivity(
  session: Stripe.Checkout.Session,
  entry: { type: string; title: string; description: string }
): Promise<void> {
  const admin = createAdminClient();
  const accountId = session.metadata?.account_id;
  if (!accountId) return;
  const { data: account } = await admin
    .from("accounts")
    .select("contact_id")
    .eq("id", accountId)
    .single();
  if (!account) return;
  await admin.from("activities").insert({
    contact_id: account.contact_id,
    type: entry.type,
    title: entry.title,
    description: entry.description,
    metadata: { checkout_session: session.id, method: session.metadata?.method },
  });
}

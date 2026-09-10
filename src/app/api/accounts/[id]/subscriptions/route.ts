import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCustomerSubscriptions, getCustomerInvoices, findStripeCustomerIds } from "@/lib/stripe";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: account, error } = await supabase
    .from("accounts")
    .select("stripe_customer_id, contact:contacts(email)")
    .eq("id", id)
    .single();

  if (error || !account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe billing is not configured" }, { status: 502 });
  }
  if (!account.stripe_customer_id) {
    return NextResponse.json({ subscriptions: [], invoices: [] });
  }

  try {
    // One client can own several Stripe customers (one per payment link paid);
    // list subscriptions + invoices across all of them, not just the stored id.
    const contact = account.contact as { email?: string | null } | { email?: string | null }[] | null;
    const email = Array.isArray(contact) ? contact[0]?.email : contact?.email;
    const customerIds = await findStripeCustomerIds({ knownId: account.stripe_customer_id, email, strict: true });

    const perCustomer = await Promise.all(
      customerIds.map((cid) => Promise.all([getCustomerSubscriptions(cid), getCustomerInvoices(cid)])),
    );
    const subscriptions = perCustomer.flatMap(([subs]) => subs);
    const invoices = perCustomer
      .flatMap(([, invs]) => invs)
      .sort((a, b) => Date.parse(b.created) - Date.parse(a.created));

    return NextResponse.json({ subscriptions, invoices });
  } catch (stripeErr) {
    console.error("Stripe fetch error:", stripeErr);
    return NextResponse.json({ error: "Failed to fetch Stripe data" }, { status: 502 });
  }
}

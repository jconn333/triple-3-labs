import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCustomerSubscriptions, getCustomerInvoices } from "@/lib/stripe";

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
    .select("stripe_customer_id")
    .eq("id", id)
    .single();

  if (error || !account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (!account.stripe_customer_id || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ subscriptions: [], invoices: [] });
  }

  try {
    const [subscriptions, invoices] = await Promise.all([
      getCustomerSubscriptions(account.stripe_customer_id),
      getCustomerInvoices(account.stripe_customer_id),
    ]);

    return NextResponse.json({ subscriptions, invoices });
  } catch (stripeErr) {
    console.error("Stripe fetch error:", stripeErr);
    return NextResponse.json({ subscriptions: [], invoices: [], error: "Failed to fetch Stripe data" });
  }
}

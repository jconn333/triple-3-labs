import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createStripeCustomer } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "50");
  const contactId = searchParams.get("contact_id");

  let query = supabase
    .from("accounts")
    .select("*, contact:contacts(id, first_name, last_name, email, company)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (contactId) {
    query = query.eq("contact_id", contactId);
  }

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ accounts: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { contact_id } = await request.json();

    // Fetch the contact
    const { data: contact, error: contactErr } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contact_id)
      .single();

    if (contactErr || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Check if account already exists
    const { data: existing } = await supabase
      .from("accounts")
      .select("id")
      .eq("contact_id", contact_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Account already exists", account_id: existing.id }, { status: 409 });
    }

    // Create Stripe customer (skip if no STRIPE_SECRET_KEY)
    let stripeCustomerId: string | null = null;
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const customer = await createStripeCustomer({
          email: contact.email,
          name: contact.company || `${contact.first_name} ${contact.last_name}`,
          metadata: { contact_id, source: "triple3labs-crm" },
        });
        stripeCustomerId = customer.id;
      } catch (stripeErr) {
        console.error("Stripe customer creation failed:", stripeErr);
        // Continue without Stripe — account still gets created
      }
    }

    // Create the account
    const accountName = contact.company || `${contact.first_name} ${contact.last_name}`;
    const { data: account, error: insertErr } = await supabase
      .from("accounts")
      .insert({
        contact_id,
        name: accountName,
        stripe_customer_id: stripeCustomerId,
      })
      .select("*, contact:contacts(id, first_name, last_name, email, company)")
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Log activity
    await supabase.from("activities").insert({
      contact_id,
      account_id: account.id,
      type: "account_created",
      title: "Account created",
      description: stripeCustomerId
        ? `Stripe customer ${stripeCustomerId} linked`
        : "Created without Stripe link",
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("Account creation error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}

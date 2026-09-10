import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [accountRes, contractsRes, activitiesRes] = await Promise.all([
    supabase
      .from("accounts")
      .select("*, contact:contacts(*)")
      .eq("id", id)
      .single(),
    supabase
      .from("contracts")
      .select("*, signatures:signature_requests(signer_role, status, signer_name, signed_at)")
      .eq("account_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("*")
      .eq("account_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (accountRes.error || !accountRes.data) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Deals belong to the account's contact — surface them so they can be closed
  // (Won/Lost) from the account page without the pipeline board.
  const contactId = (accountRes.data as { contact_id?: string | null }).contact_id;
  const dealsRes = contactId
    ? await supabase
        .from("deals")
        .select("*, stage:pipeline_stages(*)")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
    : { data: [], error: null };
  if (dealsRes.error) return NextResponse.json({ error: "Could not load client deals" }, { status: 500 });
  const dealIds = (dealsRes.data ?? []).map((deal) => deal.id as string);

  // Commitments (what we owe them), deliveries (what was done), and attached
  // docs/links — so the client page can show the whole relationship.
  const [commitmentsRes, linksRes, dealLinksRes] = await Promise.all([
    supabase.from("commitments").select("*, deliveries(id)").limit(1, { referencedTable: "deliveries" }).eq("account_id", id).order("next_due", { ascending: true, nullsFirst: false }),
    supabase.from("client_links").select("*").eq("account_id", id).order("created_at", { ascending: true }),
    dealIds.length
      ? supabase.from("client_links").select("*").in("deal_id", dealIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (linksRes.error || dealLinksRes.error) return NextResponse.json({ error: "Could not load client links" }, { status: 500 });
  if (commitmentsRes.error) return NextResponse.json({ error: "Could not load commitments" }, { status: 500 });
  const commitments = (commitmentsRes.data ?? []).map(({ deliveries, ...commitment }) => ({
    ...commitment,
    has_delivery: (deliveries as { id: string }[] | null)?.length ? true : false,
  })) as Record<string, unknown>[];
  const links = [...new Map(
    [...(linksRes.data ?? []), ...(dealLinksRes.data ?? [])].map((link) => [link.id, link]),
  ).values()].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))) as Record<string, unknown>[];

  const commitmentIds = commitments.map((c) => c.id as string);
  const deliveriesRes = commitmentIds.length
    ? await supabase
        .from("deliveries")
        .select("*")
        .in("commitment_id", commitmentIds)
        .order("delivered_at", { ascending: false })
        .limit(100)
    : { data: [] as Record<string, unknown>[], error: null };
  if (deliveriesRes.error) return NextResponse.json({ error: "Could not load delivery evidence" }, { status: 500 });

  const reportIds = links.map((l) => l.prospect_report_id as string | null).filter((x): x is string => !!x);
  const viewsRes = reportIds.length
    ? await supabase.from("report_views").select("report_id,viewed_at").in("report_id", reportIds)
    : { data: [] as { report_id: string; viewed_at: string }[], error: null };
  if (viewsRes.error) return NextResponse.json({ error: "Could not load link views" }, { status: 500 });
  const viewsByReport = new Map<string, { count: number; last: string | null }>();
  for (const v of (viewsRes.data ?? []) as { report_id: string; viewed_at: string }[]) {
    const cur = viewsByReport.get(v.report_id) ?? { count: 0, last: null };
    cur.count += 1;
    if (!cur.last || v.viewed_at > cur.last) cur.last = v.viewed_at;
    viewsByReport.set(v.report_id, cur);
  }

  return NextResponse.json({
    account: accountRes.data,
    contracts: contractsRes.data || [],
    activities: activitiesRes.data || [],
    deals: dealsRes.data || [],
    commitments,
    deliveries: deliveriesRes.data ?? [],
    links: links.map((l) => {
      const rid = l.prospect_report_id as string | null;
      const v = rid ? viewsByReport.get(rid) : undefined;
      return {
        id: l.id,
        kind: l.kind,
        title: l.title,
        url: l.url,
        views: rid ? (v?.count ?? 0) : null,
        lastViewed: v?.last ?? null,
        createdAt: l.created_at,
      };
    }),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updates.name = body.name;
    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;

    // Fetch old account for activity logging
    const { data: oldAccount } = await supabase
      .from("accounts")
      .select("status, contact_id")
      .eq("id", id)
      .single();

    const { data: account, error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", id)
      .select("*, contact:contacts(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log status changes
    if (body.status && oldAccount && body.status !== oldAccount.status) {
      await supabase.from("activities").insert({
        contact_id: oldAccount.contact_id,
        account_id: id,
        type: "status_change",
        title: `Account status changed to ${body.status}`,
        description: `From ${oldAccount.status} to ${body.status}`,
      });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Account update error:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

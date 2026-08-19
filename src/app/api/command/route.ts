import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ---------- response types ----------

export interface CommandKpis {
  mrr: number;
  customers: number;
  customersBilling: number;
  customersOnboarding: number;
  openDeals: number;
  engagingProspects7d: number;
  needsYou: number;
}

export interface QueueItem {
  severity: "crit" | "warn";
  action: string;
  why: string;
  accountId?: string;
  dealId?: string;
}

export interface CommandLink {
  id: string;
  kind: string;
  title: string;
  url: string;
  views: number | null; // null = untracked link
  lastViewed: string | null;
}

export interface CommandCommitment {
  id: string;
  name: string;
  kind: string;
  cadence: string | null;
  nextDue: string | null;
  active: boolean;
}

export interface CommandClient {
  accountId: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  status: "active" | "onboarding" | "at_risk";
  services: string[];
  mrr: number | null;
  billingSetUp: boolean;
  setupFeePaidAt: string | null;
  customerSince: string;
  latest: { text: string; by: string; at: string } | null;
  nextDue: string | null; // earliest upcoming commitment date
  commitments: CommandCommitment[];
  links: CommandLink[];
}

export interface CommandDeal {
  id: string;
  name: string;
  company: string | null;
  stage: string;
  stageColor: string;
  stageOrder: number;
  isClosed: boolean;
  amount: number | null;
  description: string | null;
  views: number | null;
  lastViewed: string | null;
  createdAt: string;
}

export interface CommandStage {
  name: string;
  color: string;
  order: number;
  isClosed: boolean;
  count: number;
}

export interface CommandProspect {
  key: string;
  name: string;
  domain: string | null;
  docs: number;
  views: number;
  lastViewed: string | null;
  hasDeal: boolean;
  viewedLast7d: boolean;
}

export interface CommandResponse {
  kpis: CommandKpis;
  queue: QueueItem[];
  clients: CommandClient[];
  stages: CommandStage[];
  deals: CommandDeal[];
  prospects: CommandProspect[];
  generatedAt: string;
}

// ---------- helpers ----------

const DAY = 24 * 60 * 60 * 1000;

/** Derive the service chips for an account from its commitment names. */
function servicesFromCommitments(names: string[]): string[] {
  const services = new Set<string>();
  for (const n of names) {
    const l = n.toLowerCase();
    if (l.includes("google ads") || l.includes("ppc")) services.add("Google Ads");
    else if (l.includes("chief of staff")) services.add("Chief of Staff");
    else if (l.includes("local search build")) services.add("SEO Build");
    else if (l.includes("seo") || l.includes("rankings") || l.includes("gsc")) services.add("SEO Agent");
  }
  return [...services];
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    accountsRes,
    commitmentsRes,
    deliveriesRes,
    activitiesRes,
    linksRes,
    stagesRes,
    dealsRes,
    reportsRes,
    viewsRes,
  ] = await Promise.all([
    supabase.from("accounts").select("*, contact:contacts(first_name,last_name,email,company)"),
    supabase.from("commitments").select("*").order("next_due", { ascending: true, nullsFirst: false }),
    supabase.from("deliveries").select("*").order("delivered_at", { ascending: false }),
    supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("client_links").select("*").order("created_at", { ascending: true }),
    supabase.from("pipeline_stages").select("*").order("display_order", { ascending: true }),
    supabase.from("deals").select("*, contact:contacts(first_name,last_name,company,email)"),
    supabase.from("prospect_reports").select("id,slug,prospect_name,prospect_domain,title,created_at"),
    supabase.from("report_views").select("report_id,viewed_at"),
  ]);

  const firstError =
    accountsRes.error ?? commitmentsRes.error ?? deliveriesRes.error ?? activitiesRes.error ??
    linksRes.error ?? stagesRes.error ?? dealsRes.error ?? reportsRes.error ?? viewsRes.error;
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

  const accounts = accountsRes.data ?? [];
  const commitments = commitmentsRes.data ?? [];
  const deliveries = deliveriesRes.data ?? [];
  const activities = activitiesRes.data ?? [];
  const links = linksRes.data ?? [];
  const stages = stagesRes.data ?? [];
  const deals = dealsRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const reportViews = viewsRes.data ?? [];

  const now = Date.now();

  // views per report
  const viewsByReport = new Map<string, { count: number; last: string | null }>();
  for (const v of reportViews) {
    const cur = viewsByReport.get(v.report_id) ?? { count: 0, last: null };
    cur.count += 1;
    if (!cur.last || v.viewed_at > cur.last) cur.last = v.viewed_at;
    viewsByReport.set(v.report_id, cur);
  }

  const commitmentsByAccount = new Map<string, typeof commitments>();
  for (const c of commitments) {
    if (!c.account_id) continue;
    const arr = commitmentsByAccount.get(c.account_id) ?? [];
    arr.push(c);
    commitmentsByAccount.set(c.account_id, arr);
  }
  const commitmentAccount = new Map<string, string>(
    commitments.filter((c) => c.account_id).map((c) => [c.id, c.account_id as string]),
  );

  // latest event per account = newest of (activities, deliveries)
  const latestByAccount = new Map<string, { text: string; by: string; at: string }>();
  for (const d of deliveries) {
    const accountId = commitmentAccount.get(d.commitment_id);
    if (!accountId) continue;
    const cur = latestByAccount.get(accountId);
    if (!cur || d.delivered_at > cur.at) {
      latestByAccount.set(accountId, {
        text: d.summary ?? "Delivery logged",
        by: "agent",
        at: d.delivered_at,
      });
    }
  }
  for (const a of activities) {
    if (!a.account_id) continue;
    const cur = latestByAccount.get(a.account_id);
    if (!cur || a.created_at > cur.at) {
      latestByAccount.set(a.account_id, { text: a.title, by: a.type, at: a.created_at });
    }
  }

  // ---------- clients ----------
  const clients: CommandClient[] = accounts.map((a) => {
    const accountCommitments = commitmentsByAccount.get(a.id) ?? [];
    const active = accountCommitments.filter((c) => c.active);
    const upcoming = active
      .map((c) => c.next_due as string | null)
      .filter((d): d is string => !!d)
      .sort();

    const accountLinks: CommandLink[] = links
      .filter((l) => l.account_id === a.id)
      .map((l) => {
        const v = l.prospect_report_id ? viewsByReport.get(l.prospect_report_id) : undefined;
        return {
          id: l.id,
          kind: l.kind,
          title: l.title,
          url: l.url,
          views: l.prospect_report_id ? (v?.count ?? 0) : null,
          lastViewed: v?.last ?? null,
        };
      });

    const billingSetUp = !!a.stripe_customer_id;
    // At risk: a recurring commitment is anchored and overdue past its grace.
    const overdue = active.some(
      (c) => c.kind === "recurring" && c.next_due && now - new Date(c.next_due).getTime() > 3 * DAY,
    );
    const status: CommandClient["status"] = overdue ? "at_risk" : billingSetUp ? "active" : "onboarding";

    const contact = a.contact as { first_name?: string; last_name?: string; email?: string } | null;

    return {
      accountId: a.id,
      name: a.name,
      contactName: contact ? `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || null : null,
      contactEmail: contact?.email ?? null,
      status,
      services: servicesFromCommitments(active.map((c) => c.name)),
      mrr: a.mrr !== null && a.mrr !== undefined ? Number(a.mrr) : null,
      billingSetUp,
      setupFeePaidAt: a.setup_fee_paid_at,
      customerSince: a.created_at,
      latest: latestByAccount.get(a.id) ?? null,
      nextDue: upcoming[0] ?? null,
      commitments: active.map((c) => ({
        id: c.id,
        name: c.name,
        kind: c.kind,
        cadence: c.cadence,
        nextDue: c.next_due,
        active: c.active,
      })),
      links: accountLinks,
    };
  });

  // ---------- pipeline ----------
  const stageById = new Map(stages.map((s) => [s.id, s]));
  const commandDeals: CommandDeal[] = deals.map((d) => {
    const stage = stageById.get(d.stage_id);
    const v = d.prospect_report_id ? viewsByReport.get(d.prospect_report_id) : undefined;
    const contact = d.contact as { company?: string; first_name?: string; last_name?: string } | null;
    return {
      id: d.id,
      name: d.name,
      company: contact?.company ?? null,
      stage: stage?.name ?? "Unknown",
      stageColor: stage?.color ?? "zinc",
      stageOrder: stage?.display_order ?? 99,
      isClosed: stage?.is_closed ?? false,
      amount: d.amount !== null && d.amount !== undefined ? Number(d.amount) : null,
      description: d.description,
      views: d.prospect_report_id ? (v?.count ?? 0) : null,
      lastViewed: v?.last ?? null,
      createdAt: d.created_at,
    };
  });
  commandDeals.sort((a, b) => a.stageOrder - b.stageOrder || (b.views ?? 0) - (a.views ?? 0));

  const commandStages: CommandStage[] = stages.map((s) => ({
    name: s.name,
    color: s.color,
    order: s.display_order,
    isClosed: s.is_closed,
    count: commandDeals.filter((d) => d.stage === s.name).length,
  }));

  // ---------- prospects (grouped reports) ----------
  const dealReportIds = new Set(deals.map((d) => d.prospect_report_id).filter(Boolean));
  const linkedDealReportIds = new Set(
    links.filter((l) => l.deal_id && l.prospect_report_id).map((l) => l.prospect_report_id),
  );
  const groups = new Map<string, CommandProspect & { reportIds: string[] }>();
  for (const r of reports) {
    const key = (r.prospect_domain ?? r.prospect_name).toLowerCase();
    const g =
      groups.get(key) ??
      ({
        key,
        name: r.prospect_name,
        domain: r.prospect_domain,
        docs: 0,
        views: 0,
        lastViewed: null,
        hasDeal: false,
        viewedLast7d: false,
        reportIds: [],
      } as CommandProspect & { reportIds: string[] });
    g.docs += 1;
    g.reportIds.push(r.id);
    // keep the shortest name as the display name (drops "… Proposal"/"(package)")
    if (r.prospect_name.length < g.name.length) g.name = r.prospect_name;
    const v = viewsByReport.get(r.id);
    if (v) {
      g.views += v.count;
      if (!g.lastViewed || (v.last && v.last > g.lastViewed)) g.lastViewed = v.last;
      if (v.last && now - new Date(v.last).getTime() < 7 * DAY) g.viewedLast7d = true;
    }
    if (dealReportIds.has(r.id) || linkedDealReportIds.has(r.id)) g.hasDeal = true;
    groups.set(key, g);
  }
  const prospects: CommandProspect[] = [...groups.values()]
    .map(({ reportIds: _reportIds, ...p }) => p)
    .sort((a, b) => (b.lastViewed ?? "").localeCompare(a.lastViewed ?? ""));

  // ---------- needs-you queue ----------
  const queue: QueueItem[] = [];
  for (const c of clients) {
    if (!c.billingSetUp && (c.mrr ?? 0) > 0) {
      queue.push({
        severity: "crit",
        action: `Set up ${c.name} billing`,
        why: `$${c.mrr?.toLocaleString()}/mo agreed, no Stripe customer yet`,
        accountId: c.accountId,
      });
    }
    const unanchored = c.commitments.filter((cm) => cm.kind === "recurring" && !cm.nextDue);
    if (unanchored.length > 0) {
      queue.push({
        severity: "warn",
        action: `Kick off ${c.name}`,
        why: `${unanchored.length} recurring commitment${unanchored.length > 1 ? "s" : ""} not anchored — onboarding/access pending`,
        accountId: c.accountId,
      });
    }
    for (const cm of c.commitments) {
      if (!cm.nextDue) continue;
      const dueIn = new Date(cm.nextDue).getTime() - now;
      if (dueIn < 0) {
        queue.push({
          severity: "crit",
          action: `${c.name}: ${cm.name} overdue`,
          why: `was due ${cm.nextDue}`,
          accountId: c.accountId,
        });
      } else if (dueIn < 7 * DAY) {
        queue.push({
          severity: "warn",
          action: `${c.name}: ${cm.name} due soon`,
          why: `due ${cm.nextDue}`,
          accountId: c.accountId,
        });
      }
    }
  }
  for (const p of prospects) {
    if (p.viewedLast7d && !p.hasDeal) {
      queue.push({
        severity: "crit",
        action: `Follow up ${p.name}`,
        why: `${p.docs} doc${p.docs > 1 ? "s" : ""} out, ${p.views} views, opened recently — no deal in pipeline`,
      });
    }
  }
  queue.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "crit" ? -1 : 1));

  // ---------- KPIs ----------
  const kpis: CommandKpis = {
    mrr: clients.reduce((s, c) => s + (c.mrr ?? 0), 0),
    customers: clients.length,
    customersBilling: clients.filter((c) => c.billingSetUp).length,
    customersOnboarding: clients.filter((c) => c.status === "onboarding").length,
    openDeals: commandDeals.filter((d) => !d.isClosed).length,
    engagingProspects7d: prospects.filter((p) => p.viewedLast7d).length,
    needsYou: queue.length,
  };

  const payload: CommandResponse = {
    kpis,
    queue,
    clients,
    stages: commandStages,
    deals: commandDeals,
    prospects,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload);
}

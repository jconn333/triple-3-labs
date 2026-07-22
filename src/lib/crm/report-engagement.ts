import { createAdminClient } from "@/lib/supabase/admin";
import type { Deal, ReportEngagement } from "@/lib/crm/types";

// prospect_reports / report_views are RLS-locked to the service role, so
// engagement is joined in server-side (callers must already be auth-gated).
export async function attachReportEngagement<T extends Deal>(
  deals: T[]
): Promise<T[]> {
  const reportIds = [
    ...new Set(deals.map((d) => d.prospect_report_id).filter(Boolean)),
  ] as string[];
  if (reportIds.length === 0) return deals;

  const admin = createAdminClient();
  const [{ data: reports }, { data: views }] = await Promise.all([
    admin.from("prospect_reports").select("id, slug").in("id", reportIds),
    admin
      .from("report_views")
      .select("report_id, viewed_at")
      .in("report_id", reportIds)
      .order("viewed_at", { ascending: false }),
  ]);

  const engagement = new Map<string, ReportEngagement>();
  for (const r of reports ?? []) {
    engagement.set(r.id, { slug: r.slug, views: 0, last_viewed_at: null });
  }
  for (const v of views ?? []) {
    const e = engagement.get(v.report_id);
    if (!e) continue;
    e.views += 1;
    if (!e.last_viewed_at) e.last_viewed_at = v.viewed_at;
  }

  return deals.map((d) =>
    d.prospect_report_id
      ? { ...d, report_engagement: engagement.get(d.prospect_report_id) ?? null }
      : d
  );
}

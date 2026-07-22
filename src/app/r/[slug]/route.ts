import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Report HTML is authored artifact-style (no document skeleton); wrap it
// unless it's already a full document.
function toDocument(html: string): string {
  if (/^\s*<!doctype/i.test(html)) return html;
  const titleMatch = html.match(/<title>[\s\S]*?<\/title>/i);
  const title = titleMatch?.[0] ?? "<title>SEO Report — Triple 3 Labs</title>";
  const body = titleMatch ? html.replace(titleMatch[0], "") : html;
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<meta name="robots" content="noindex, nofollow" />\n${title}\n</head>\n<body>${body}</body>\n</html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: report, error } = await supabase
    .from("prospect_reports")
    .select("id, html")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !report) {
    return new NextResponse("Report not found", { status: 404 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const referer = request.headers.get("referer") ?? "";
  const { error: viewError } = await supabase.from("report_views").insert({
    report_id: report.id,
    user_agent: userAgent.slice(0, 500),
    referer: referer.slice(0, 500),
  });
  if (viewError) {
    console.error("report_views insert failed", viewError);
  }

  return new NextResponse(toDocument(report.html), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

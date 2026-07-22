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

const LOGO_SVG = `<svg width="30" height="30" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="t3grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7c3aed"/><stop offset="50%" stop-color="#06b6d4"/><stop offset="100%" stop-color="#f472b6"/></linearGradient></defs><rect x="2" y="2" width="96" height="96" rx="22" fill="#0a0a1a" stroke="url(#t3grad)" stroke-width="2"/><text x="12" y="74" font-family="ui-rounded, system-ui, sans-serif" font-size="62" font-weight="800" fill="#7c3aed" opacity="0.3">3</text><text x="26" y="74" font-family="ui-rounded, system-ui, sans-serif" font-size="62" font-weight="800" fill="#06b6d4" opacity="0.6">3</text><text x="40" y="74" font-family="ui-rounded, system-ui, sans-serif" font-size="62" font-weight="800" fill="url(#t3grad)">3</text></svg>`;

// The report keeps its own prospect branding, so it renders inside a
// same-origin iframe under Triple 3 Labs chrome — no style collisions.
function shellDocument(slug: string, reportTitle: string): string {
  const title = reportTitle || "SEO Report";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${title} — Triple 3 Labs</title>
<style>
  :root{color-scheme:dark}
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#030014;color:#ededed;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;min-height:100vh;display:flex;flex-direction:column}
  a{color:inherit;text-decoration:none}
  .chrome{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 24px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(3,0,20,.85);position:sticky;top:0;z-index:10;backdrop-filter:blur(12px)}
  .brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:17px;letter-spacing:-.02em}
  .brand svg{display:block}
  .grad{background:linear-gradient(90deg,#7c3aed,#06b6d4);-webkit-background-clip:text;background-clip:text;color:transparent}
  .portfolio-link{font-size:13.5px;font-weight:600;background:linear-gradient(90deg,#a855f7,#06b6d4);-webkit-background-clip:text;background-clip:text;color:transparent;white-space:nowrap}
  .portfolio-link:hover{opacity:.8}
  main{flex:1}
  iframe{display:block;width:100%;border:0;min-height:70vh}
  footer{border-top:1px solid rgba(255,255,255,.07);padding:36px 24px;text-align:center}
  footer p{font-size:14px;color:rgba(255,255,255,.55);max-width:520px;margin:0 auto 18px;line-height:1.6}
  .cta{display:inline-block;border-radius:999px;background:linear-gradient(90deg,#7c3aed,#a855f7);color:#fff;font-size:14px;font-weight:600;padding:10px 22px;transition:box-shadow .2s,transform .2s}
  .cta:hover{box-shadow:0 0 20px rgba(124,58,237,.4);transform:scale(1.03)}
  .fineprint{margin-top:22px;font-size:12px;color:rgba(255,255,255,.35)}
  @media(max-width:480px){.brand span{display:none}}
</style>
</head>
<body>
<header class="chrome">
  <a class="brand" href="https://triple3labs.io" target="_blank" rel="noopener">${LOGO_SVG}<span>Triple 3 <span class="grad">Labs</span></span></a>
  <a class="portfolio-link" href="https://triple3labs.io" target="_blank" rel="noopener">View Our AI Agents &amp; Automations &rarr;</a>
</header>
<main>
  <iframe id="report" src="/r/${slug}?raw=1" title="${title}"></iframe>
</main>
<footer>
  <p>This report was researched, written, and designed by an AI agent built by Triple 3 Labs. We build agents like this one to run marketing, operations, and customer follow-up for small businesses.</p>
  <a class="cta" href="https://triple3labs.io" target="_blank" rel="noopener">See what our agents can do</a>
  <div class="fineprint">&copy; ${new Date().getFullYear()} Triple 3 Labs &middot; triple3labs.io</div>
</footer>
<script>
  const frame = document.getElementById("report");
  function fit(){
    try{
      const body = frame.contentDocument && frame.contentDocument.body;
      if(!body) return;
      // Measure the body, not documentElement — the latter is >= the iframe
      // viewport, which would feed back into itself and grow forever.
      const h = Math.ceil(body.scrollHeight);
      if(Math.abs(h - frame.offsetHeight) > 2) frame.style.height = h + "px";
    }catch{}
  }
  frame.addEventListener("load", () => {
    fit();
    try{
      new ResizeObserver(fit).observe(frame.contentDocument.body);
    }catch{}
  });
  window.addEventListener("resize", fit);
</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const raw = request.nextUrl.searchParams.get("raw") === "1";
  const supabase = createAdminClient();

  const { data: report, error } = await supabase
    .from("prospect_reports")
    .select("id, html, title, prospect_name")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !report) {
    return new NextResponse("Report not found", { status: 404 });
  }

  const htmlHeaders = {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow",
  };

  if (!raw) {
    // The shell logs nothing; the iframe's ?raw=1 load is the real view.
    return new NextResponse(
      shellDocument(slug, escapeHtml(report.title ?? report.prospect_name ?? "")),
      { headers: htmlHeaders }
    );
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

  return new NextResponse(toDocument(report.html), { headers: htmlHeaders });
}

import type { CaseStudy } from "./types";

const seoAgent: CaseStudy = {
  slug: "seo-agent",
  title: "The SEO Agent Watching Every Property's Rankings",
  client: "Five Star Group",
  industry: "Marketing",
  tags: ["SEO", "Site Audits", "Search Monitoring"],
  summary:
    "An always-on SEO capability that audits every Five Star Group brand site on a weekly cadence, tracks rankings over time, and turns three separate data sources into one digest — replacing the occasional, reactive burst of SEO work that used to happen only when someone found the time.",
  challenge: [
    "Five Star Group runs several public-facing brand sites — lodging, a hotel, a theater-adjacent ticketing business — and nobody had a standing job to watch any of them. SEO happened in bursts: a push before a season, then months of nothing, then a scramble when someone noticed traffic had slipped.",
    "That reactive pattern misses the things that matter most — a slow technical regression, a competitor quietly overtaking a shared keyword, a Search Console anomaly that would have been a five-minute fix the week it happened instead of the quarter it was finally noticed.",
  ],
  solution: {
    intro:
      "So we built a standing SEO agent — not a one-off audit, but a recurring capability running the same checks on the same cadence across every property, whether or not anyone remembers to ask.",
    bullets: [
      "Runs technical and content site audits on a weekly cadence across every brand site, not just the one that happens to be top of mind that month.",
      "Tracks keyword rankings over time so a slow slide shows up as a trend line, not a surprise.",
      "Watches Google Search Console and Google Analytics for anomalies and drops — a sudden dip gets caught the week it happens.",
      "Monitors competitor movement, so a competitor's gain on a shared keyword is visible before it costs meaningful traffic.",
      "Surfaces prioritized recommendations as a weekly digest instead of a dashboard nobody logs into — the point is a readout that actually gets read.",
    ],
  },
  stack: ["Ahrefs", "Google Search Console", "Google Analytics"],
  results: [
    { value: "Weekly, not quarterly", label: "Audit cadence across every brand site" },
    { value: "3 data sources, 1 digest", label: "Ahrefs, Search Console, and Analytics unified into one weekly readout" },
    { value: "Every property", label: "Not just the one site that happened to get attention that month" },
  ],
  pullQuote: "The point isn't a dashboard nobody opens. It's a digest that gets read.",
  blogSlug: "generative-engine-optimization-geo-explainer",
  blogLinkLabel: "Read our SEO & GEO playbook",
  gradient: "from-lime-400 to-teal-600",
  accentColor: "lime",
};

export default seoAgent;

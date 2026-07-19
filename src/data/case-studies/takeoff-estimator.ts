import type { CaseStudy } from "./types";

const takeoffEstimator: CaseStudy = {
  slug: "takeoff-estimator",
  title: "The Takeoff That Has to Show Its Work",
  client: "A Regional Rebar & Concrete Accessories Supplier",
  industry: "Construction Estimating",
  tags: ["Construction", "AI Estimating", "Rebar", "In Development"],
  summary:
    "An AI-assisted rebar takeoff and estimating system for a concrete accessories supplier — still mid-build, being validated job by job against real historical estimates before it ever touches a live bid.",
  challenge: [
    "Rebar estimating today runs through Bluebeam and aSa: an estimator scrolls PDF plan sheets by hand, traces footing and wall geometry, counts bars and accessories detail by detail, cross-references schedules, and keys the result into an estimating system. It's slow, and the accuracy is only as good as whoever's tracing that sheet that day.",
    "The client wanted the process faster without losing the thing that makes a rebar estimate usable in the first place — every quantity has to be defensible after the bid is submitted, traceable back to the sheet and the rule that produced it.",
  ],
  solution: {
    intro:
      "So instead of shipping a demo, we're running a slow, adversarial validation process — proving the estimating logic against real historical jobs before it ever gets near a live bid.",
    bullets: [
      "Two independent AI systems each read the same drawing set and produce a full takeoff and estimate — sealed with a git commit before either one is allowed to see the historical answer key, so it's a blind test every time, not a demo tuned to look good.",
      "Every proposed measurement carries its source sheet as evidence, and rebar quantities, spacing, laps, and weights are calculated by versioned deterministic rules — a language model proposes, it never gets to invent the final number.",
      "A review workspace lets a human estimator scroll the plan set, approve or edit every extracted element, flag open questions, and acknowledge sheets with no rebar on them — with a complete, append-only audit trail on every action.",
      "The historical answer keys aren't treated as gospel either — they're cross-examined the same way the AI estimates are, because a past estimator's assumptions can be wrong too. Real disagreements get adjudicated, not averaged away.",
      "Every miss becomes a documented rule instead of a one-off correction, so the system gets stricter and more specific with each job instead of just accumulating exceptions nobody remembers.",
    ],
  },
  stack: ["Claude", "Codex", "Next.js", "Supabase", "Apryse", "Nutrient"],
  results: [
    { value: "17 jobs", label: "Real historical client estimates run through validation" },
    { value: "2 estimators", label: "Independent AI takeoffs, cross-examined before either sees the answer" },
    { value: "128 commits", label: "In the first 4 days of building the review workspace and rulebook" },
    { value: "Evidence-linked", label: "No measurement or quantity without a source sheet and a rule behind it" },
  ],
  pullQuote: "AI proposes; the estimator decides.",
  gradient: "from-slate-400 to-zinc-600",
  accentColor: "slate",
  inDevelopment: true,
};

export default takeoffEstimator;

import type { CaseStudy } from "./types";

const takeoffEstimator: CaseStudy = {
  slug: "takeoff-estimator",
  title: "The Takeoff That Has to Show Its Work",
  client: "A Regional Rebar & Concrete Accessories Supplier",
  industry: "Construction Estimating",
  tags: ["Construction", "AI Estimating", "Rebar", "Quantity Takeoff"],
  summary:
    "An AI-assisted rebar takeoff and estimating system for a concrete accessories supplier. It reads the plan set, proposes every quantity with the source sheet and the rule behind it, and runs as a second takeoff that flags disagreements before a bid is priced.",
  challenge: [
    "Rebar estimating today runs through Bluebeam and aSa: an estimator scrolls PDF plan sheets by hand, traces footing and wall geometry, counts bars and accessories detail by detail, cross-references schedules, and keys the result into an estimating system. It's slow, and the accuracy is only as good as whoever's tracing that sheet that day.",
    "The client wanted the process faster without losing the thing that makes a rebar estimate usable in the first place — every quantity has to be defensible after the bid is submitted, traceable back to the sheet and the rule that produced it.",
  ],
  solution: {
    intro:
      "So the system is built to be fast without giving up defensibility: it reads the plan set, computes every quantity from versioned deterministic rules, and puts a human estimator in front of every number before it's priced.",
    bullets: [
      "Two independent AI systems each read the same drawing set and produce a full takeoff — cross-checked against each other, and against an estimate you already have, so a soft read doesn't quietly become the number you bid.",
      "Every proposed measurement carries its source sheet as evidence, and rebar quantities, spacing, laps, and weights are calculated by versioned deterministic rules — a language model proposes, it never gets to invent the final number.",
      "A review workspace lets a human estimator scroll the plan set, approve or edit every extracted element, flag open questions, and acknowledge sheets with no rebar on them — with a complete, append-only audit trail on every action.",
      "Run as a second takeoff, it flags disagreements both ways — where the plan reads light and where it reads heavy — so a mis-keyed dimension gets caught before pricing, not after the bid is out.",
      "Every miss becomes a documented rule instead of a one-off correction, so the system gets stricter and more specific with each job instead of just accumulating exceptions nobody remembers.",
    ],
  },
  stack: ["Claude", "Codex", "Next.js", "Supabase", "Apryse", "Nutrient"],
  results: [
    { value: "~19,000 lb", label: "Phantom steel caught on one review — a single mis-keyed wall dimension, flagged before pricing" },
    { value: "2 estimators", label: "Independent AI takeoffs, cross-checked on every job" },
    { value: "Same-day", label: "Turnaround from plan set to reviewed report" },
    { value: "Evidence-linked", label: "No measurement or quantity without a source sheet and a rule behind it" },
  ],
  pullQuote: "AI proposes; the estimator decides.",
  gradient: "from-slate-400 to-zinc-600",
  accentColor: "slate",
};

export default takeoffEstimator;

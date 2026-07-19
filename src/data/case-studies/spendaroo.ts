import type { CaseStudy } from "./types";

const spendaroo: CaseStudy = {
  slug: "spendaroo",
  title: "Company Card Spend, Categorized Two Ways at Once",
  client: "Five Star Group",
  industry: "Internal Tools",
  tags: ["Expense Management", "Multi-Entity", "Internal Tools"],
  summary:
    "An internal spend-management app for a holding company running several LLCs on shared cards — every transaction gets a Category and an Entity, pre-guessed automatically at ingest so the accountant reviews instead of starting from zero.",
  challenge: [
    "Five Star Group runs several LLCs off a shared set of company cards and one overworked accountant. Every transaction needs two answers, not one — what it was, GL-coded into a category, and which company it belongs to — and most off-the-shelf spend tools only handle the first dimension.",
    "The tools that do handle entities treat it as an edge case, bolted on after the fact. For a business that's structurally multi-entity from the ground up, that split is the whole job, not a setting to configure around.",
  ],
  solution: {
    intro:
      "We built Spendaroo around the two-dimensional reality of the business: every transaction gets categorized and entity-tagged, and the app leads with the actual work queue instead of a vanity dashboard number.",
    bullets: [
      "The home dashboard opens on the work itself — how many transactions need review, how many are missing a category, how many are missing an entity — not a chart nobody acts on.",
      "Transactions sync automatically from card accounts via Plaid, cursor-based and deduplicated, so re-running a sync can never double a charge.",
      "Categorization rules run at ingest — by the time a transaction reaches a human, it already carries a best-guess category and entity, and the job shrinks from categorizing everything to reviewing the guesses.",
      "Every table is row-level-security scoped to the organization, Plaid access tokens are readable only server-side, and receipts live in a private storage bucket served through short-lived signed URLs.",
      "Every write runs through a server action, and sensitive ones are audit-logged — who changed what, and when.",
      "The review queue ends in an accountant-ready CSV export, so the last step of the month is a download, not a spreadsheet rebuild.",
    ],
  },
  stack: ["Next.js 16", "Supabase", "Plaid", "Vercel"],
  results: [
    { value: "2 dimensions", label: "Every transaction gets a Category and an Entity, not just one" },
    { value: "1 day", label: "From empty folder to a working, seeded, deployable app" },
    { value: "Pre-categorized", label: "Ingest-time rules mean review starts from a guess, not a blank field" },
    { value: "Accountant-ready", label: "Ends in a clean CSV export, not a spreadsheet rebuild" },
  ],
  pullQuote: "The dashboard leads with the work queue, not a vanity number.",
  blogSlug: "building-spendaroo",
  gradient: "from-yellow-400 to-amber-600",
  accentColor: "yellow",
};

export default spendaroo;

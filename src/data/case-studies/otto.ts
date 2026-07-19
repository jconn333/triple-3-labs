import type { CaseStudy } from "./types";

const otto: CaseStudy = {
  slug: "otto",
  title: "People Ops for a Company That's Really Five Companies",
  client: "Five Star Group",
  industry: "People Operations",
  tags: ["HR Platform", "Multi-Entity", "Internal Tools"],
  summary:
    "An HR and people-ops platform built for a holding company where the same employee can work shifts under two entities in the same week — multi-entity as a first-class data model instead of a spreadsheet-and-filing-cabinet workaround.",
  challenge: [
    "Five Star Group is several LLCs sharing one workforce. The same employee can clock in under two different entities in the same week, and a manager may oversee staff spread across three — a shape no off-the-shelf HR tool assumes. Every mainstream option is built around one company, one org chart, one payroll.",
    "So the actual system in place before Otto was spreadsheets, texts, and a filing cabinet — PTO balances nobody could fully trust, and access boundaries enforced by memory rather than by the software.",
  ],
  solution: {
    intro:
      "We built Otto — designed brand-first, with a full design system and a mascot otter built before the first migration ever ran — around a data model where multi-entity isn't a feature, it's the foundation.",
    bullets: [
      "Every table carries an organization ID, and employees hold \"assignments\" to multiple entities, each with its own role and pay rate — one person, several jobs, cleanly separated.",
      "Row-level security enforces who can see whom at the database layer, not in application code — a manager only ever sees employees assigned to their entities.",
      "PTO is an auditable transaction ledger, not a number in a column: accrual policies credit hours on schedule through Postgres cron jobs, approvals debit them, and carryover and caps are enforced against the ledger itself, so any balance traces back through its full history.",
      "Employees clock in from a shared kiosk using a PIN — faster than a password on a device five people touch a day — and every punch records geolocation for the audit trail.",
      "A payroll pre-processor turns approved time, PTO, and pay rates into clean, per-entity exports, and a document library tracks policy acknowledgment alongside private personal document storage.",
      "Every sensitive write flows through a central server-action layer that logs who changed what and when — and the product's own voice stays deliberately calm and human: \"You're all set\" instead of \"Your request has been submitted.\"",
    ],
  },
  stack: ["Next.js 16", "React 19", "Tailwind 4", "Supabase", "Vercel"],
  results: [
    { value: "Multi-entity", label: "First-class in the schema — an assignment per entity, not a workaround" },
    { value: "Full ledger", label: "Every PTO balance traceable back through its complete history" },
    { value: "Database-level", label: "Access enforced by row-level security, not application code" },
    { value: "Co-built", label: "Built with a business partner, not solo, from the first migration" },
  ],
  pullQuote: "A full design system and a mascot otter were built before the first migration ever ran.",
  blogSlug: "building-otto",
  gradient: "from-sky-400 to-blue-600",
  accentColor: "sky",
};

export default otto;

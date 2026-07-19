import type { CaseStudy } from "./types";

const pilotBilling: CaseStudy = {
  slug: "pilot-billing",
  title: "The Invoice That Builds Itself",
  client: "JMC Billing",
  industry: "Aviation",
  tags: ["Billing Automation", "Flight Data Sync", "Aviation"],
  summary:
    "A personal contract-pilot billing tool — not a generic small-business bookkeeping product — that pulls flight data automatically, reconstructs the month into billable days, and generates per-owner invoices without an evening of spreadsheet archaeology.",
  challenge: [
    "This one's personal: the founder flies as a contract pilot, and billing an aircraft owner meant reconstructing the month by hand from flight logs — which days were flown, which were standby or travel, the daily rate, per-diem days, fuel and hotel receipts. Spreadsheet archaeology, every month, with something missed almost every time.",
    "The tracking data already existed — an aviation tracking API knew exactly where and when the aircraft flew — but nothing turned it into an invoice. Every month started from zero.",
  ],
  solution: {
    intro:
      "So we built a tool that treats the invoice as something that assembles itself from real flight data, with a human reviewing the result instead of reconstructing it.",
    bullets: [
      "A scheduled job pulls flight data from an aviation tracking API three times a day and files each leg under the right aircraft; every leg stores the provider's ID so re-running a sync can never create a duplicate.",
      "Legs are dated by Eastern-time calendar day, not UTC, so a late-night departure doesn't accidentally bill as the next day.",
      "Flights group into billable days, re-ordered into a coherent itinerary instead of trusting raw storage order — and days the tracker can't see, like standby or repositioning, get added manually and flow through the same pipeline.",
      "Each day moves through a review state machine — imported, assigned, reviewed, ready, invoiced — with the ability to override a rate, adjust per diem, attach receipts, mark a day non-billable, or split a day between two owners who shared the aircraft, each at their own rate.",
      "Days that receive new flight data after being invoiced get flagged, never silently changed.",
      "Invoices generate per owner per month with pilot services, per diem, and expense reimbursement as separate, normalized line items; owners pay via a Stripe checkout link or by check or ACH with manual tracking, and receipts are downloadable through tokenized links so an owner's bookkeeper never needs an account.",
    ],
  },
  stack: ["React 18", "Vite", "Supabase", "Stripe", "Resend"],
  results: [
    { value: "3x daily", label: "Automated flight-data sync, deduplicated by provider ID" },
    { value: "48 commits", label: "Spec to a working invoice, over about three weeks" },
    { value: "9 edge functions", label: "Handling sync, invoicing, payments, and receipt access" },
    { value: "Zero reconstruction", label: "The first fully self-built invoice was reviewed and sent as-is" },
  ],
  pullQuote: "More pilots, more aircraft — that's a config change, not a rewrite.",
  blogSlug: "building-pilot-billing",
  gradient: "from-red-400 to-rose-600",
  accentColor: "red",
};

export default pilotBilling;

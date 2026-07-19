import type { CaseStudy } from "./types";

const regyPro: CaseStudy = {
  slug: "regy-pro",
  title: "Owning the Checkout Instead of Renting It",
  client: "Land Cruise Vacations",
  industry: "Travel & Group Tours",
  tags: ["Booking Platform", "Payments", "Custom SaaS"],
  summary:
    "A custom registration and checkout platform for multi-day motor-coach trips — built to replace a per-transaction SaaS fee with direct Stripe processing, atomic inventory, and an operations layer that runs itself.",
  challenge: [
    "Land Cruise Vacations sells multi-day trips with limited seats, multiple price tiers, add-ons, and group pricing — not a business a Stripe checkout link can run.",
    "A hosted registration platform handled it, and it worked — but its per-transaction fees ate real margin on every booking, across every guest, every trip, every season. The product underneath those fees was, functionally, a form builder with payment processing bolted on.",
  ],
  solution: {
    intro:
      "We built Regy Pro: a registration platform we own end-to-end, embedded directly on landcruisevacations.com instead of bouncing guests to a third-party checkout.",
    bullets: [
      "A single well-structured checkout — package picker with a live total summary, then guest info, travelers, dietary needs, signature, and payment in one flow, no bouncing between pages.",
      "Payments run through Stripe directly — card, Apple Pay, Google Pay, and Stripe Link, all live without a separate integration, and we pay Stripe's processing rate with nothing layered on top.",
      "Inventory is never held. Seats and add-ons are claimed only at the instant an order completes, inside one atomic database transaction — no reservation timers, no abandoned-cart cleanup, no zombie holds. Two buyers racing for the last room both get an honest answer.",
      "Every inventory movement — stock, adjustment, claim, release — writes to an audit log with who, when, and why.",
      "Refunds (full or partial, with retry logic), order edits that auto-generate and email a balance-due payment link, and offline payments (checks, cash, comps) are all handled with the same rigor as a card charge, plus a daily payout report nobody has to ask for.",
      "Every confirmation, cancellation, refund, and reminder email passes through a durable outbox — written to the database before it's handed to the delivery provider, so a failed send retries instead of vanishing.",
      "Role-based access enforced at the API, an audit log on every state change, deny-by-default database policies, and end-to-end browser tests on checkout, refunds, and receipts running against a fresh server on every deploy.",
    ],
  },
  stack: ["Next.js", "React 19", "Supabase", "Prisma", "Stripe", "Resend", "Vitest", "Playwright"],
  results: [
    { value: "$0", label: "Platform fees — Stripe's processing rate only, nothing layered on top" },
    { value: "Zero holds", label: "Inventory claimed atomically at order completion, not reserved on entry" },
    { value: "155 commits", label: "From spec to production, over two months" },
    { value: "Now a product", label: "What started as our own checkout is now sold to other operators" },
  ],
  pullQuote: "Building software is no longer hard. The math has flipped.",
  blogSlug: "building-regy-pro-land-cruise-vacations",
  gradient: "from-emerald-400 to-green-600",
  accentColor: "emerald",
};

export default regyPro;

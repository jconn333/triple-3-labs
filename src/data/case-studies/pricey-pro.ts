import type { CaseStudy } from "./types";

const priceyPro: CaseStudy = {
  slug: "pricey-pro",
  title: "Dynamic Pricing That Can Explain Itself",
  client: "Amish Country Lodging",
  industry: "Vacation Rentals & Hospitality",
  tags: ["Dynamic Pricing", "Revenue Management", "Internal Tools"],
  summary:
    "An explainable pricing engine for 75 cabins, lodges, and treehouses — every price traceable to the exact chain of rules that produced it, with a dry-run safeguard before anything reaches a guest.",
  challenge: [
    "Amish Country Lodging is 75 listings, each needing a price for every night of the next year — and the right answer moves constantly: a holiday week isn't a random Tuesday, a Saturday isn't a Wednesday, a lone open night between two bookings is worth less than one that starts a wide-open week.",
    "Pricing that by hand is a full-time job. Automating it risks the opposite failure: software that spits out a number nobody can explain. When a guest books at $219 and the owner asks why, \"the algorithm said so\" isn't an answer.",
  ],
  solution: {
    intro:
      "We built Pricey Pro around one non-negotiable requirement: every price has to be able to explain itself.",
    bullets: [
      "A pricing pipeline where every stage writes down its own work — base price, then seasonality (recurring date-range factors like fall foliage weeks), then day-of-week demand, then customization rules (percentage and fixed adjustments, gap-night discounts, far-out-date premiums, calendar-fullness tiers), then safety-rail clamps at a floor of 30% of base and a ceiling of 10x.",
      "Every step is persisted per night, per listing — hover a date on the calendar and see the whole chain: what the base was, which season touched it, which rules fired, what got clamped.",
      "Rules live at three scopes — account, group, listing — with the more specific scope winning, so a weekend premium set once at the account level can be overridden for one group or pinned for one cabin without reconfiguring all 75 listings by hand.",
      "Every listing has a push mode — off, dry-run, or live. Dry-run computes and logs the full payload without ever writing it, and the live write path only fires when a global environment kill-switch is enabled alongside the listing's own flag — two independent keys, so no single mistake can publish prices by accident.",
      "A scheduled watchdog runs the whole loop daily — import new reservations, recompute every calendar, publish for listings that are live — so prices stay current whether or not anyone logs in.",
      "The pricing engine is covered by 177 offline unit tests plus golden-fixture regression files, so a refactor of the pipeline shows instantly if any night's price moved when it shouldn't have.",
    ],
  },
  stack: ["Node.js", "Express", "Supabase", "Postgres", "Vercel Cron"],
  results: [
    { value: "75", label: "Cabins, lodges, and treehouses priced automatically, every day" },
    { value: "Every price", label: "Explains itself — the full chain of seasonality, demand, and rules behind it" },
    { value: "177 tests", label: "Plus golden-fixture regression checks on the pricing engine" },
    { value: "Two keys", label: "Dry-run and a global kill-switch both required before any price goes live" },
  ],
  pullQuote:
    "Dynamic pricing isn't magic; it's a few dozen legible decisions applied consistently to thousands of nights.",
  blogSlug: "building-pricey-pro",
  gradient: "from-amber-400 to-orange-500",
  accentColor: "amber",
};

export default priceyPro;

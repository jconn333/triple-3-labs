import type { CaseStudy } from "./types";

const zendini: CaseStudy = {
  slug: "zendini",
  title: "The Seat Map That Can't Double-Sell a Ticket",
  client: "Amish Country Theater",
  industry: "Live Entertainment & Ticketing",
  tags: ["Ticketing Platform", "Seat-Map Checkout", "Multi-Tenant"],
  summary:
    "A seat-map ticketing platform built for the Amish Country Theater's 538 seats — an interactive SVG seat picker, a ten-minute checkout hold with atomic seat claims, and a staff point-of-sale, owned outright instead of rented from a vendor.",
  challenge: [
    "The Amish Country Theater sells real seats, in real rows, and the online buying experience is the first impression every guest gets before the house lights ever come down. A rented, generic ticketing vendor doesn't feel like the theater's own — it feels like a detour through someone else's site.",
    "Selling seats also means never double-selling them: two people tapping the same seat at the same moment during a rush is the kind of failure a theater can't explain away at the door.",
  ],
  solution: {
    intro:
      "We built Zendini: a seat-map ticketing platform that's the theater's own, multi-tenant from the first table so the theater is tenant number one rather than a hardcoded assumption.",
    bullets: [
      "Shows own events; individual performances inherit pricing and details by default and can override any tier for a single date without touching the rest — change a show's description once and it updates everywhere.",
      "An interactive SVG seatmap renders the theater's real 538-seat layout, section by section, row by row, with color-coded price tiers and live availability.",
      "Checkout holds a seat for ten minutes, and the final claim happens inside a single atomic database transaction — if two checkouts race for the same seat, exactly one wins and the other gets a clear message instead of a double-sold ticket.",
      "A staff-facing box-office POS mode handles the half of ticket sales that never touch the website — phone orders, walk-ups, comps — in one unified selling flow for reserved seating and general admission.",
      "Group sales take a deposit, flat or percentage, then track balances through as many partial payments as a tour operator needs, with unpaid holds lapsing back into sellable inventory automatically.",
      "Tickets are QR-coded and scanned at the door, so will-call and walk-up check-in run off the same system as online sales.",
    ],
  },
  stack: ["Next.js 16", "Supabase", "Postgres RLS", "Stripe", "Resend"],
  results: [
    { value: "538 seats", label: "Rendered as a real, interactive seatmap — every row, every section" },
    { value: "Zero double-sells", label: "Atomic seat claims inside a single database transaction" },
    { value: "~80 commits", label: "From empty project to pre-launch hardening" },
    { value: "Q1 2027", label: "Targeted launch, timed to the theater's off-season" },
  ],
  pullQuote: "Multi-tenant from the first table — the theater is tenant number one, not a hardcoded assumption.",
  blogSlug: "building-zendini",
  gradient: "from-fuchsia-500 to-purple-600",
  accentColor: "fuchsia",
};

export default zendini;

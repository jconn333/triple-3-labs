import type { CaseStudy } from "./types";

const pingo: CaseStudy = {
  slug: "pingo",
  title: "The Chat App With AI Teammates in the Room",
  client: "Five Star Group",
  industry: "Internal Tools",
  tags: ["Team Chat", "Cross-Platform", "AI-Native"],
  summary:
    "A cross-platform team chat app built to end the per-seat SaaS bill — with AI agents wired in as first-class teammates through a bot API, not bolted on through an integration marketplace.",
  challenge: [
    "Every mainstream team-chat product bills per seat, forever — the invoice grows every time the team does, for a product that's fundamentally a database with a UI wrapped around it.",
    "Worse, none of them were built with AI agents in mind as participants. Bots live behind an integration marketplace, boxed into slash commands and narrow webhooks — not a real presence in the room who can read a channel, understand context, and reply like anyone else on the team.",
  ],
  solution: {
    intro:
      "So we built Pingo: one React/TypeScript codebase that ships everywhere the team already is, with AI agents wired in as first-class teammates from day one.",
    bullets: [
      "One codebase ships to Mac, iPhone, Android, and web — Electron wraps it for desktop, Capacitor for mobile — so there's one UI to build and one set of bugs to fix, not four apps drifting out of sync.",
      "Realtime sync runs on Supabase Realtime, with row-level security enforcing channel membership at the database layer — a user can't query a channel they're not a member of, let alone read its messages.",
      "Outgoing messages queue and retry instead of vanishing when the connection drops, and each channel catches up cleanly on reconnect, so a subway tunnel or flaky hotel wifi never costs a message.",
      "Push notifications fire through a Postgres webhook that fans out to every registered device through an edge function — the database itself is the message bus, not a separate notification service to keep in sync.",
      "A rate-limited, key-authenticated bot API lets AI agents post and reply in channels exactly like any other teammate — the founder's own AI assistant says good morning in #general every day.",
      "A custom QA gallery mode renders hostile content on demand — script-injection attempts, RTL text, pathological formatting — so rendering bugs get caught in a test view, not in a live channel.",
    ],
  },
  stack: ["React 19", "TypeScript", "Electron", "Capacitor", "Supabase"],
  results: [
    { value: "4 platforms", label: "Mac, iPhone, Android, and web from one codebase" },
    { value: "89 commits", label: "Zero to a team-wide beta in about a month" },
    { value: "1st-class AI", label: "Agents post and reply through a bot API, not a bolted-on integration" },
    { value: "$0 per seat", label: "No recurring per-seat SaaS bill as the team grows" },
  ],
  pullQuote: "The database is the message bus.",
  blogSlug: "building-pingo",
  gradient: "from-indigo-400 to-blue-600",
  accentColor: "indigo",
};

export default pingo;

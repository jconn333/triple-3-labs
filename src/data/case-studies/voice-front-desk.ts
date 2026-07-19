import type { CaseStudy } from "./types";

const voiceFrontDesk: CaseStudy = {
  slug: "voice-front-desk",
  title: "The Hotel That Stopped Missing Calls",
  client: "Berlin Encore Hotel",
  industry: "Hospitality",
  tags: ["Voice AI", "Hospitality", "PMS Integration"],
  summary:
    "A 24/7 voice agent that answers every call the front desk can't, quotes live tax-inclusive pricing straight from Cloudbeds, and texts a ready-to-book link before the caller hangs up.",
  challenge: [
    "Call a hotel at 11pm on a Saturday looking for a room next weekend and you get voicemail. You hang up. You google the next hotel. You book there instead — and that sequence used to play out at the Berlin Encore Hotel every single night.",
    "The front desk can't staff a phone 24 hours a day, and every after-hours call that goes to voicemail is a booking that walks to a competitor before the sun comes up.",
  ],
  solution: {
    intro:
      "We built a voice agent that only does one job — answer the phone and get a real conversation about availability into every caller's hands — and did it well enough that most callers never realize it isn't a person.",
    bullets: [
      "ElevenLabs runs the voice and conversation; a Node + TypeScript webhook service gives it real tools — quote availability, pull room types, build a booking link, send it by SMS, and resolve relative dates like \"next Saturday\" correctly.",
      "Every quote is tax-inclusive, pulled live from Cloudbeds — not a cached price sheet — using a dedicated fees-and-taxes lookup so the number on the phone matches the number at checkout.",
      "Rate plans are filtered to public, flexible, refundable options only — the prices a walk-in caller is actually eligible for.",
      "The agent texts a direct Cloudbeds booking link, pre-populated with the dates and guest count just discussed, so there's no re-typing and no second-guessing.",
      "A strict, read-only method allowlist sits in front of every Cloudbeds call in production — the agent service physically cannot call an endpoint that isn't on the list, belt-and-suspenders against a prompt-injection attempt.",
      "A shared-secret header on every tool call, a separate OAuth-gated admin path, and a warn-first rollout mode (flip to enforce only after the legitimate calls stop tripping it) keep a public voice endpoint honest.",
    ],
  },
  stack: ["ElevenLabs", "Twilio", "Cloudbeds", "Node.js", "TypeScript"],
  results: [
    { value: "24/7", label: "Every call answered — nights, weekends, holidays" },
    { value: "< 2 rings", label: "Average time to pick up" },
    { value: "< 2 min", label: "From hello to a booking link sent" },
    { value: "Live pricing", label: "Tax-inclusive quotes pulled straight from Cloudbeds, not a cached menu" },
  ],
  pullQuote:
    "The agent is only as honest as the price it quotes. The integration layer is where honesty lives.",
  blogSlug: "building-the-voice-agent",
  gradient: "from-violet to-purple",
  accentColor: "violet",
};

export default voiceFrontDesk;

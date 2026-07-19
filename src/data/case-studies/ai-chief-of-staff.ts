import type { CaseStudy } from "./types";

const aiChiefOfStaff: CaseStudy = {
  slug: "ai-chief-of-staff",
  title: "The AI Chief of Staff That Got Us to Anfield",
  client: "Five Star Group — Founder's Office",
  industry: "Executive Operations",
  tags: ["AI Chief of Staff", "Inbox & Calendar", "Personal Ops"],
  summary:
    "Zeke, the founder's own AI chief of staff, holds every confirmation, email, and calendar detail across the business — and, on one cancelled-train morning in London, replanned an entire day in under a minute.",
  challenge: [
    "Running several businesses at once means the details that matter are scattered — booking confirmations, calendar invites, itineraries, threads across a dozen inboxes. Finding the right one at the moment it matters is its own job.",
    "That job doesn't pause for travel. On a Saturday morning at London Euston, on the way to watch Liverpool play at Anfield, the departure board flipped to CANCELLED four minutes after showing a delay — no app offering rebooking options, no idea what happens next, a wife and son standing there waiting on an answer.",
  ],
  solution: {
    intro:
      "Zeke has his own email address, and every confirmation — trains, hotel, match tickets, the hospitality itinerary — gets forwarded to him as it arrives. No separate setup, no manual itinerary building.",
    bullets: [
      "Delivers a full morning brief on request — train times, seats, how to get to the station, when the connecting coach leaves, and exactly how much buffer there is.",
      "Diagnoses live disruptions from live sources — the first delay's real cause and expected clear time, not just a repeated status-board message.",
      "When the train was cancelled outright, produced a full replan in under a minute: the next train, confirmation that the existing ticket was automatically valid on it, the new arrival time, and the exact buffer before the connecting coach.",
      "Answered the practical questions that matter in the moment — realistic worst case if the next train was full, how to read UK carriage-loading indicators and seat-reservation displays, which unreserved coaches to head for.",
      "Pulled live rail data to find the departure platform before the station's own board announced it — the answer arrived ahead of the concourse crowd.",
      "Ranked fallback options honestly — a same-day taxi, an alternate routing — without booking any of them prematurely, and named the exact trigger point at which it would be time to act.",
      "Runs the same way every day, not just on the road — morning briefs, inbox triage, and calendar management across every Five Star Group business.",
    ],
  },
  stack: ["Claude", "Discord", "Email (multi-account)", "Calendar", "Live rail & travel data"],
  results: [
    { value: "1 minute", label: "From \"our train was cancelled\" to a full working plan" },
    { value: "Every morning", label: "Inbox triage, calendar, and a daily brief across every business" },
    { value: "Zero setup", label: "Forward a confirmation once — no manual itinerary building" },
    { value: "Found it first", label: "Located the departure platform via live rail data before the station board did" },
  ],
  pullQuote: "A lesser advisor panic-books the taxi. A good one tells you when you would.",
  blogSlug: "cancelled-at-euston",
  gradient: "from-pink to-rose-500",
  accentColor: "pink",
};

export default aiChiefOfStaff;

import type { CaseStudy } from "./types";

const theaterBoxOffice: CaseStudy = {
  slug: "theater-box-office",
  title: "The Box Office That Never Closes",
  client: "Amish Country Theater",
  industry: "Live Entertainment & Ticketing",
  tags: ["Voice AI", "Ticketing", "QA Automation"],
  summary:
    "An after-hours voice agent for a 538-seat theater's box office — answering only when the desk is closed, quoting live show data, and texting a ticket link before the caller hangs up.",
  challenge: [
    "The Amish Country Theater's box office is staffed during business hours by a great team. The problem is the hours in between — 9pm, Sundays, the holidays the office is closed.",
    "Those calls used to go to voicemail. Most callers don't leave one. They google the next venue and buy tickets there instead.",
  ],
  solution: {
    intro:
      "We built an agent that handles exactly the overflow the box office can't — nothing more. It never picks up while a human is at the desk; it only answers when there's nobody there to.",
    bullets: [
      "ElevenLabs runs the voice; a Node + TypeScript webhook service pulls live show data from VBO Ticketing and Land Cruise dates from RegFox so the agent never talks from a stale script.",
      "A fuzzy-matching tool resolves caller-spoken show titles against a rolling date window — the hardest engineering problem in the build, since ASR mishears split titles and drops syllables.",
      "Callers who want tickets get a direct, branded link texted to them, hosted on VBO and ready to check out — the whole call takes about ninety seconds.",
      "Every call ends with a webhook that pulls the full transcript, scores it against a QA rubric, and posts the result to Slack — so a bad answer surfaces in minutes, not weeks.",
      "A QA dashboard tracks summary metrics and a dead-letter queue for any post-call event that failed to process, with an automatic retry job so a Slack outage can't silently lose QA data.",
      "An agent allowlist rejects webhook events from any unregistered agent ID, and intro-only call filtering keeps one-second hang-ups from flooding the QA queue.",
    ],
  },
  stack: ["ElevenLabs", "Twilio", "VBO Ticketing", "RegFox", "Node.js", "TypeScript", "Slack"],
  results: [
    { value: "After-hours only", label: "Never answers while the box office is staffed" },
    { value: "~90 sec", label: "Average call, ticket link included" },
    { value: "Every call", label: "Transcript-scored against a QA rubric and posted to Slack" },
    { value: "Zero lost", label: "QA events — dead letters retry automatically" },
  ],
  pullQuote:
    "The QA layer isn't a nice-to-have. It's the difference between an agent that works and an agent that quietly degrades for weeks before anyone notices.",
  blogSlug: "building-the-theater-agent",
  gradient: "from-cyan to-blue-500",
  accentColor: "cyan",
};

export default theaterBoxOffice;

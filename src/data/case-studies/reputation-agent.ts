import type { CaseStudy } from "./types";

const reputationAgent: CaseStudy = {
  slug: "reputation-agent",
  title: "Waking Up a Dormant Google Business Profile",
  client: "Five Star Group Properties",
  industry: "Hospitality & Local Business",
  tags: ["Reputation Management", "Google Business Profile", "Local SEO"],
  summary:
    "A reputation agent that monitors Google Business Profiles in real time, drafts on-brand replies and Q&A answers, and routes anything sensitive to a human — replacing a $300–$1,500/mo reputation-management SaaS.",
  challenge: [
    "For most local businesses, the Google Business Profile is the highest-leverage real estate on the internet — it shows up before the homepage, before the ads, before the social feeds. And most of the time, nobody is actively managing it.",
    "The pattern repeats across every vertical: the profile exists, reviews trickle in and go unanswered, photos are years old, and Q&A sits open for a competitor — or a troll — to answer on your behalf. Every unanswered review is a quiet signal to Google's ranking algorithm that nobody's home.",
  ],
  solution: {
    intro:
      "We built a reputation agent with a narrow, important scope — watch the profile, draft the responses, and keep a human on the trigger for anything sensitive.",
    bullets: [
      "Monitors the profile in real time — every new review, question, and photo upload is seen within minutes, not days.",
      "Drafts replies in the business's actual voice — referencing what the customer said, naming the property or service, not generic \"Thanks for the 5 stars!\" filler.",
      "Routes negative reviews through a separate workflow: a 1- or 2-star review gets flagged, gets a response drafted that takes accountability without admitting liability, and goes to a human for approval before it ever posts publicly.",
      "Answers public Q&A as it comes in — a question asked at 11pm on a Saturday gets answered that night, and the answer becomes permanent, indexable content on the profile.",
      "Drafts weekly Google Posts and photo updates from real business activity — an underused ranking signal most profiles let go stale.",
      "Everything routine (4- and 5-star reviews, generic Q&A, photo posting) runs autonomously; anything that touches reputation risk waits for a human.",
    ],
  },
  stack: ["Google Business Profile API", "LLM drafting", "Slack escalation", "Human approval workflow"],
  results: [
    { value: "24/7", label: "Every new review, question, and photo monitored within minutes" },
    { value: "80%", label: "Of routine review and Q&A volume runs fully autonomously" },
    { value: "$300–$1,500/mo", label: "Typical reputation-SaaS spend this replaces" },
    { value: "Human-reviewed", label: "Every 1- and 2-star reply, before it ever goes public" },
  ],
  pullQuote: "Response speed matters. Response quality matters. Volume matters.",
  blogSlug: "google-business-profile-reputation-ai-agent",
  gradient: "from-teal-400 to-cyan-500",
  accentColor: "teal",
};

export default reputationAgent;

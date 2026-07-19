import type { VerticalConfig } from "./types";

const homeServices: VerticalConfig = {
  slug: "home-services",
  industry: "Home Services",
  meta: {
    title: "AI Agents for Home Services | Triple 3 Labs",
    description:
      "AI agents built for HVAC, plumbing, electrical, roofing, landscaping, and cleaning companies — automate call answering, dispatch, invoicing, and reviews so your crews stay on the tools, not the phone.",
  },
  hero: {
    headline: "Triple 3 Labs",
    headlineAccent: "Your trade's unfair advantage.",
    subheading:
      "AI agents that answer every call, book the job, chase the invoice, and ask for the review — while your crew stays on the tools, not the phone. Every missed call while a tech is under a sink is a booked job for the competitor down the road.",
    description:
      "AI agents built for HVAC, plumbing, electrical, roofing, landscaping, and cleaning companies — answering calls, triaging emergencies, filling the schedule, and collecting on invoices around the clock.",
    ctaLabel: "Meet Your AI Team",
    ctaHref: "#agents",
  },
  marqueeItems: [
    "Voice Dispatcher",
    "Emergency Call Triage",
    "Job Scheduler",
    "Invoice Chaser",
    "Review Requester",
    "Reputation Manager",
    "Lead Follow-Up",
    "Social Media Manager",
    "SEO Specialist",
    "Bookkeeper",
  ],
  agents: {
    sectionLabel: "Your AI Trade Team",
    headline: "Specialist agents.",
    headlineAccent: "Built for the trades.",
    description:
      "The same agents we run in our own companies, tuned for HVAC, plumbing, electrical, roofing, landscaping, and cleaning — connected to your dispatch software and phone lines, ready to work on day one. Pick the roles you need and we handle the rest.",
    list: [
      {
        name: "The Voice Dispatcher",
        title: "24/7 Phone Answering & Live Job Booking",
        description:
          "Answers every call in under two rings, day or night, and quotes real service windows off your live schedule. Books the job on the spot, texts a confirmation with the tech's ETA, and answers the questions customers always ask — pricing ranges, service area, what to expect. True emergencies get pulled out and escalated straight to the on-call tech instead of sitting in a queue.",
        skills: [
          "Live call answering",
          "Service window quoting",
          "Real-time schedule booking",
          "SMS booking confirmations",
          "On-call escalation for emergencies",
          "After-hours coverage",
        ],
        tools: ["Twilio", "ElevenLabs", "ServiceTitan", "Jobber"],
        iconName: "Phone",
        gradient: "from-violet to-purple",
        accentColor: "violet",
        status: "available" as const,
      },
      {
        name: "The Emergency Triage Agent",
        title: "After-Hours Emergency Line & Dispatch",
        description:
          "Runs your after-hours line and does the one thing an answering service can't: tells a burst pipe from a dripping faucet. Real emergencies get the on-call tech dispatched immediately with full details texted ahead of arrival. Everything else gets booked into tomorrow's schedule instead of pulling a tech out of bed for a call that could wait.",
        skills: [
          "Emergency vs. non-emergency triage",
          "On-call tech dispatch",
          "Next-day booking for non-urgent calls",
          "Real-time text alerts to on-call staff",
          "Call recording & handoff notes",
          "Severity-based routing rules",
        ],
        tools: ["Twilio", "ElevenLabs", "ServiceTitan", "Slack"],
        iconName: "AlertTriangle",
        gradient: "from-red-500 to-orange-500",
        accentColor: "red",
        status: "available" as const,
      },
      {
        name: "The Job Scheduler",
        title: "Calendar Management & Crew Coordination",
        description:
          "Keeps the calendar full and moving. Sends appointment reminders and 'tech on the way' texts, fills cancelled slots straight from the waitlist, and follows up on no-shows before that slot goes to waste. Your office isn't playing phone tag to rebuild tomorrow's route every time someone cancels.",
        skills: [
          "Appointment reminders",
          "'Tech on the way' texts",
          "Cancellation waitlist fill",
          "No-show recovery",
          "Route-aware scheduling",
          "Crew availability sync",
        ],
        tools: ["ServiceTitan", "Jobber", "Housecall Pro", "Google Calendar"],
        iconName: "CalendarClock",
        gradient: "from-cyan to-blue-500",
        accentColor: "cyan",
        status: "available" as const,
      },
      {
        name: "The Invoice Chaser",
        title: "Accounts Receivable Follow-Up",
        description:
          "Follows up on every open invoice — polite, persistent, and never having a bad day about it. Sends reminders with a payment link attached, escalates the tone on accounts that go quiet, and flags the truly stubborn ones for a human call. Your cash gets collected without your office manager spending an afternoon on it every week.",
        skills: [
          "Automated payment reminders",
          "Payment link delivery",
          "Escalation sequencing",
          "Aging report monitoring",
          "Dispute flagging",
          "Payment confirmation logging",
        ],
        tools: ["QuickBooks", "ServiceTitan", "Twilio", "Gmail"],
        iconName: "Receipt",
        gradient: "from-amber-400 to-orange-500",
        accentColor: "amber",
        status: "available" as const,
      },
      {
        name: "The Review Requester / Reputation Manager",
        title: "Post-Job Reviews & Online Reputation",
        description:
          "Asks for a review the moment the job's marked complete, while the work is still fresh in the customer's mind — that's when a five-star review actually gets left. Watches Google and Yelp for new reviews, drafts responses, and flags anything negative to a manager within the hour instead of letting it sit for a week.",
        skills: [
          "Review requests at job completion",
          "Google & Yelp monitoring",
          "Response drafting",
          "Negative review escalation",
          "Rating trend tracking",
          "Competitor review analysis",
        ],
        tools: ["Google Business", "Twilio", "Gmail", "Slack"],
        iconName: "Star",
        gradient: "from-yellow-400 to-orange-400",
        accentColor: "yellow",
        status: "available" as const,
      },
      {
        name: "The Lead Follow-Up Agent",
        title: "Speed-to-Lead & Estimate Booking",
        description:
          "Responds to every web form and missed call within seconds, not hours — the first company to call back is usually the company that gets the job. Qualifies the lead, answers the basics, and books the estimate straight onto the calendar so it never sits in an inbox overnight.",
        skills: [
          "Instant web-form response",
          "Missed-call text-back",
          "Lead qualification",
          "Estimate booking",
          "Follow-up sequencing",
          "CRM logging",
        ],
        tools: ["Twilio", "Gmail", "Google Calendar", "ServiceTitan"],
        iconName: "UserPlus",
        gradient: "from-pink to-rose-500",
        accentColor: "pink",
        status: "available" as const,
      },
      {
        name: "The Marketing Agent",
        title: "Seasonal Campaigns & Project Content",
        description:
          "Turns finished jobs into before-and-after posts that actually sell the work, and times campaigns around what customers are already thinking about — tune-up season, storm follow-ups, holiday lighting. Sends win-back emails to past customers so the next furnace or roof replacement comes back to you instead of a Google search.",
        skills: [
          "Before/after project posts",
          "Seasonal campaign creation",
          "Past-customer email campaigns",
          "Ad performance monitoring",
          "Post scheduling",
          "Engagement tracking",
        ],
        tools: ["Meta Ads", "Google Ads", "Instagram", "Mailchimp"],
        iconName: "Megaphone",
        gradient: "from-indigo-400 to-violet-500",
        accentColor: "indigo",
        status: "available" as const,
      },
      {
        name: "The SEO Specialist",
        title: "Local Search & Service-Area Visibility",
        description:
          "Optimizes your Google Business Profile and service-area pages for the searches that actually convert — '24 hour plumber near me', 'HVAC repair [town]', 'emergency electrician'. Builds out the content that gets you found before a customer ever calls, and delivers a weekly audit showing what moved.",
        skills: [
          "Local SEO audits",
          "Google Business optimization",
          "Service-area page content",
          "Keyword tracking",
          "Competitor monitoring",
          "Weekly action reports",
        ],
        tools: ["Google Search Console", "Google Business", "Ahrefs"],
        iconName: "Search",
        gradient: "from-blue-400 to-indigo-500",
        accentColor: "blue",
        status: "available" as const,
      },
      {
        name: "The Bookkeeper",
        title: "Expense Tracking & Monthly Financial Summaries",
        description:
          "Categorizes expenses, matches receipts to transactions, and tracks every invoice in and out. Flags anything that looks off before it becomes a surprise at tax time, and hands you a clean monthly summary instead of a shoebox of paperwork in April.",
        skills: [
          "Expense categorization",
          "Invoice tracking",
          "Monthly summary reports",
          "Receipt matching",
          "Anomaly flagging",
          "Tax-ready reporting",
        ],
        tools: ["QuickBooks", "Gmail", "Google Sheets"],
        iconName: "Calculator",
        gradient: "from-teal-400 to-cyan-500",
        accentColor: "teal",
        status: "available" as const,
      },
    ],
  },
  features: {
    sectionLabel: "What We Do",
    headline: "More Booked Jobs.",
    headlineAccent: "Fewer Missed Calls.",
    description:
      "We build AI systems specifically for HVAC, plumbing, electrical, roofing, landscaping, and cleaning companies — so your crew's time goes to the job in front of them, not the phone ringing in the truck.",
    list: [
      {
        iconName: "AlertTriangle",
        title: "Never Miss an Emergency Call",
        description:
          "After-hours emergencies are the highest-value calls you get, and the ones nobody answers. A burst pipe gets the on-call tech dispatched in minutes — a dripping faucet gets booked for morning.",
        gradient: "from-red-500 to-orange-500",
      },
      {
        iconName: "Wrench",
        title: "Booked While You're On the Roof",
        description:
          "Every call gets answered and booked whether your crew is on a ladder, under a sink, or three jobs deep. The call that used to hit voicemail is now a job on tomorrow's schedule.",
        gradient: "from-violet to-purple",
      },
      {
        iconName: "Receipt",
        title: "Invoices That Chase Themselves",
        description:
          "Payment reminders go out automatically, with a link attached, until the invoice is paid — no office manager spending Friday afternoons on collection calls.",
        gradient: "from-amber-400 to-orange-500",
      },
      {
        iconName: "Star",
        title: "Five Stars on Autopilot",
        description:
          "Every completed job gets a review request while the work is still fresh, and every review — good or bad — gets a response within the hour.",
        gradient: "from-yellow-400 to-orange-400",
      },
      {
        iconName: "MapPin",
        title: "Own Your Service Area on Google",
        description:
          "Your Google Business Profile and service-area pages get optimized for the searches that turn into jobs, with a weekly report on what moved and what's next.",
        gradient: "from-blue-400 to-indigo-500",
      },
      {
        iconName: "Headphones",
        title: "The Office Manager That Never Quits",
        description:
          "Dispatch, scheduling, invoicing, and reviews run in the background around the clock — the office manager who never takes a sick day or a lunch break.",
        gradient: "from-teal-400 to-cyan-500",
      },
    ],
  },
  automation: {
    sectionLabel: "Simplify Your Tech Stack",
    headline: "Replace your expensive",
    headlineAccent: "trade software.",
    description:
      "You're paying for an answering service, a scheduling add-on, a reputation platform, and per-lead fees to the lead sites — each doing one job, none of them talking to each other. A single AI agent can cover the same ground, connected to your dispatch software, for a fraction of the cost. These are the same agents we run in our own companies, tuned for the trades.",
    stats: [
      { value: "24/7", label: "Every call answered, every night of the year" },
      { value: "Seconds", label: "Speed to lead, not hours" },
      { value: "Day 1", label: "Live on your phone line" },
    ],
    comparisons: [
      {
        category: "After-Hours Answering",
        software: "Answering service (per-minute or flat monthly)",
        softwareCost: "$1.50–$2.50/min or $300+/mo",
        aiSolution:
          "AI Voice Dispatcher — answers every call live, books directly into your schedule, texts a confirmation on the spot",
        badge: "24/7 live booking",
        gradient: "from-violet to-purple",
      },
      {
        category: "Field Service Scheduling",
        software: "ServiceTitan / Jobber / Housecall Pro dispatch add-ons",
        softwareCost: "$50–$300/mo add-on",
        aiSolution:
          "AI Job Scheduler — fills cancellations from the waitlist, sends tech-on-the-way texts, recovers no-shows automatically",
        badge: "Self-healing schedule",
        gradient: "from-cyan to-blue-500",
      },
      {
        category: "Reputation Management",
        software: "Birdeye / Podium / NiceJob",
        softwareCost: "$200–$600/mo",
        aiSolution:
          "AI Review Requester — asks for a review the moment the job's marked complete, monitors Google & Yelp, drafts responses",
        badge: "Reviews requested same-day",
        gradient: "from-yellow-400 to-orange-400",
      },
      {
        category: "Invoice Follow-Up",
        software: "Manual collections (office admin hours)",
        softwareCost: "$400–$1,000/mo in labor",
        aiSolution:
          "AI Invoice Chaser — polite, persistent follow-up with payment links, escalates stubborn accounts before you have to",
        badge: "Gets paid faster",
        gradient: "from-amber-400 to-orange-500",
      },
      {
        category: "Paid Lead Generation",
        software: "Angi / HomeAdvisor / Thumbtack per-lead fees",
        softwareCost: "$20–$90/lead, no exclusivity",
        aiSolution:
          "AI Lead Follow-Up Agent — responds to web-form and missed-call leads in seconds, qualifies, books the estimate",
        badge: "Seconds, not hours",
        gradient: "from-pink to-rose-500",
      },
      {
        category: "Local SEO & Google Business",
        software: "Local SEO agency retainer",
        softwareCost: "$500–$1,500/mo",
        aiSolution:
          "AI SEO Specialist — optimizes your Google Business Profile and service-area pages, delivers a weekly audit",
        badge: "Weekly action plans",
        gradient: "from-blue-400 to-indigo-500",
      },
    ],
  },
  process: {
    sectionLabel: "How It Works",
    headline: "From Discovery to",
    headlineAccent: "a Full Schedule",
    description:
      "A streamlined process designed to get your trade business results fast — the same one we use to stand up these agents for our own companies.",
    steps: [
      {
        number: "01",
        iconName: "MessageSquare",
        title: "Trade Discovery",
        description:
          "We listen to your call flow, walk your quote-to-job funnel, and review your review pipeline to find where calls, bookings, and invoices are slipping through the cracks.",
        gradient: "from-violet to-purple",
      },
      {
        number: "02",
        iconName: "Cpu",
        title: "Build & Connect",
        description:
          "We build custom AI agents wired directly to your dispatch software, phone lines, and QuickBooks — and iterate with your office and field team's feedback.",
        gradient: "from-cyan to-blue-500",
      },
      {
        number: "03",
        iconName: "Rocket",
        title: "Launch & Optimize",
        description:
          "We deploy your AI team, monitor every call and booking, and continuously optimize based on real results — jobs booked, invoices collected, calls never missed.",
        gradient: "from-pink to-rose-500",
      },
    ],
  },
  cta: {
    headline: "Let's grab a coffee and",
    headlineAccent: "talk about your trade.",
    description:
      "Tell us how the calls come in, who books the jobs, and where the invoices pile up — and we'll map exactly where an AI agent would pay for itself. And if it wouldn't, we'll tell you that too.",
    footnote:
      "Free assessment · No commitment · We'll get back to you within 24 hours.",
  },
};

export default homeServices;

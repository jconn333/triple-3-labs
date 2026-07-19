import type { VerticalConfig } from "./types";

const hospitality: VerticalConfig = {
  slug: "hospitality",
  industry: "Hospitality",
  meta: {
    title: "AI Agents for Hospitality | Triple 3 Labs",
    description:
      "AI agents built for hotels, vacation rentals, and event venues — automate phone answering, guest messaging, reviews, and pricing so your staff can focus on guests, not busywork.",
  },
  hero: {
    headline: "Triple 3 Labs",
    headlineAccent: "Your property's unfair advantage.",
    subheading:
      "AI agents that answer every call, message every guest, respond to every review, and price every room — so your staff can focus on the guest standing in front of them. Built and battle-tested on our own hotel, cabins, and event venues first.",
    description:
      "AI agents built for independent hotels, vacation rental operators, B&Bs, and event venues — answering calls, messaging guests, managing reviews, and adjusting rates around the clock.",
    ctaLabel: "Meet Your AI Team",
    ctaHref: "#agents",
  },
  marqueeItems: [
    "Voice Front Desk",
    "Guest Messaging",
    "Review Manager",
    "Revenue Analyst",
    "Booking Assistant",
    "Housekeeping Coordinator",
    "OTA Auditor",
    "Social Media Manager",
    "SEO Specialist",
    "Event Inquiry Agent",
  ],
  agents: {
    sectionLabel: "Your AI Hospitality Team",
    headline: "Specialist agents.",
    headlineAccent: "Built for hospitality.",
    description:
      "Each agent is trained for a specific role at your property, connected to your PMS and channels, and ready to work on day one. We run every one of these in production on our own hotel, cabins, and event venues — pick the roles you need and we handle the rest.",
    list: [
      {
        name: "The Voice Front Desk",
        title: "24/7 Phone Answering & Live Quoting",
        description:
          "Answers every call, day or night, and quotes room and cabin availability live from your PMS. Texts a booking link on the spot, answers the FAQs guests always ask — check-in time, pet policy, parking — and escalates anything urgent straight to staff. This is the same agent we run on our own front desk, built on ElevenLabs and Twilio, wired into Cloudbeds.",
        skills: [
          "Live availability quoting",
          "Real-time PMS lookups",
          "SMS booking links",
          "FAQ handling",
          "Staff escalation",
          "After-hours coverage",
        ],
        tools: ["ElevenLabs", "Twilio", "Cloudbeds", "HostAway"],
        iconName: "Phone",
        gradient: "from-violet to-purple",
        accentColor: "violet",
        status: "available" as const,
      },
      {
        name: "The Guest Messaging Agent",
        title: "Inbox Triage & Pre-Arrival Communication",
        description:
          "Triages every OTA and direct inbox message, sends pre-arrival information, handles in-stay requests, and follows up at check-out to invite a review. Keeps every conversation moving without a guest ever waiting on a reply — while access codes and lock credentials stay strictly out of its hands and route to staff instead.",
        skills: [
          "Inbox triage",
          "Pre-arrival messaging",
          "In-stay request handling",
          "Post-stay follow-up",
          "Multi-channel threading",
          "Staff handoff for sensitive requests",
        ],
        tools: ["Cloudbeds", "HostAway", "Airbnb", "Booking.com"],
        iconName: "MessageCircle",
        gradient: "from-cyan to-blue-500",
        accentColor: "cyan",
        status: "available" as const,
      },
      {
        name: "The Review & Reputation Manager",
        title: "Reviews, Ratings & Brand Monitoring",
        description:
          "Watches Google, TripAdvisor, and every OTA for new reviews, drafts on-brand responses within hours, and flags anything negative straight to a manager before it sits unanswered. Tracks rating trends over time so you catch a slipping category — cleanliness, noise, value — before it shows up in your occupancy.",
        skills: [
          "Review monitoring",
          "Response drafting",
          "Negative alert escalation",
          "Rating trend tracking",
          "Competitor review analysis",
          "Google Business Q&A",
        ],
        tools: ["Google Business", "TripAdvisor", "Booking.com", "Slack"],
        iconName: "Star",
        gradient: "from-yellow-400 to-orange-400",
        accentColor: "yellow",
        status: "available" as const,
      },
      {
        name: "The Revenue Analyst",
        title: "Nightly Rate Recommendations & Pacing Alerts",
        description:
          "Recommends nightly rates and minimum stays with rules you can actually see and adjust — no black box. Watches your booking pace against last year, flags soft nights before they happen, and keeps an eye on competitor rates so you're never the only property that forgot to move price for the holiday weekend.",
        skills: [
          "Nightly rate recommendations",
          "Explainable pricing rules",
          "Min-stay suggestions",
          "Occupancy pacing alerts",
          "Competitor rate watching",
          "Seasonal demand modeling",
        ],
        tools: ["Cloudbeds", "HostAway", "Google Sheets", "Slack"],
        iconName: "LineChart",
        gradient: "from-emerald-400 to-green-600",
        accentColor: "emerald",
        status: "available" as const,
      },
      {
        name: "The Event Inquiry Agent",
        title: "Venue & Banquet Lead Response",
        description:
          "Answers venue and banquet inquiries the moment they land, checks real space availability, sends packages and pricing tailored to the date and guest count, and books site tours onto your team's calendar. No inquiry sits in an inbox overnight while another venue answers first.",
        skills: [
          "Instant inquiry response",
          "Space availability checks",
          "Package & pricing quotes",
          "Site tour booking",
          "Lead qualification",
          "Follow-up sequencing",
        ],
        tools: ["Event Temple", "Google Calendar", "Gmail", "Twilio"],
        iconName: "CalendarCheck",
        gradient: "from-pink to-rose-500",
        accentColor: "pink",
        status: "available" as const,
      },
      {
        name: "The OTA Auditor",
        title: "Statement Reconciliation & Dispute Drafting",
        description:
          "Reconciles every Booking.com and Expedia statement against your PMS, line by line, and flags commission errors, no-show fees on guests who showed up, and cancellations charged in error. Drafts the dispute response so all your team has to do is review and send. Real revenue we've recovered on our own reconciliation.",
        skills: [
          "Statement reconciliation",
          "Commission error detection",
          "Cancellation auditing",
          "Dispute drafting",
          "PMS cross-matching",
          "Monthly recovery reporting",
        ],
        tools: ["Booking.com", "Cloudbeds", "HostAway", "Google Sheets"],
        iconName: "Receipt",
        gradient: "from-amber-400 to-orange-500",
        accentColor: "amber",
        status: "available" as const,
      },
      {
        name: "The Housekeeping Coordinator",
        title: "Turnover Scheduling & Task Tracking",
        description:
          "Turns every reservation into a cleaning or maintenance task automatically, tracks completion in real time, and flags same-day turns and late checkouts before they become a guest-facing problem. Keeps your housekeeping team working off one clean task list instead of a group text.",
        skills: [
          "Automatic task creation",
          "Same-day turn flagging",
          "Late checkout alerts",
          "Completion tracking",
          "Staff assignment",
          "Supply shortage alerts",
        ],
        tools: ["Breezeway", "Cloudbeds", "HostAway", "Slack"],
        iconName: "ClipboardCheck",
        gradient: "from-teal-400 to-cyan-500",
        accentColor: "teal",
        status: "available" as const,
      },
      {
        name: "The Marketing Agent",
        title: "Social Content & Guest Email Campaigns",
        description:
          "Creates social posts that actually show off the property — cabin views, hotel amenities, event spaces — and schedules them across Instagram and Facebook. Sends seasonal promotions and win-back campaigns to past guests, timed around your slow season instead of guessing.",
        skills: [
          "Social content creation",
          "Post scheduling",
          "Past-guest email campaigns",
          "Seasonal promotions",
          "Win-back sequences",
          "Engagement tracking",
        ],
        tools: ["Instagram", "Facebook", "Mailchimp", "Canva"],
        iconName: "Megaphone",
        gradient: "from-indigo-400 to-violet-500",
        accentColor: "indigo",
        status: "available" as const,
      },
      {
        name: "The SEO Specialist",
        title: "Local Search & Direct-Booking Content",
        description:
          "Optimizes your Google Business Profile and website for the searches that actually book — 'cabins near [town]', 'hotel with event space', 'venue for a wedding' — and writes content that pulls guests toward booking direct instead of through an OTA. Delivers a weekly audit with what moved and what to do next.",
        skills: [
          "Local SEO audits",
          "Google Business optimization",
          "Direct-booking content",
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
    ],
  },
  features: {
    sectionLabel: "What We Do",
    headline: "More Direct Bookings.",
    headlineAccent: "Less Busywork.",
    description:
      "We build AI systems specifically for hotels, vacation rentals, and event venues — so your staff spend time with guests, not on hold, on hold-music, or on hold for a manager.",
    list: [
      {
        iconName: "Phone",
        title: "Never Miss a Booking Call",
        description:
          "Every call gets answered, quoted, and texted a booking link — at 2pm or 2am. The call that used to go to voicemail is now a reservation.",
        gradient: "from-violet to-purple",
      },
      {
        iconName: "TrendingUp",
        title: "Direct Bookings Over OTA Commissions",
        description:
          "Faster responses, better SEO, and a front desk that never drops a call all push guests toward booking with you instead of paying an OTA 15-20% to be the middleman.",
        gradient: "from-cyan to-blue-500",
      },
      {
        iconName: "Star",
        title: "Every Review Answered",
        description:
          "No review sits unanswered for a week, and no negative review sits unanswered at all — your manager knows within the hour, every time.",
        gradient: "from-yellow-400 to-orange-400",
      },
      {
        iconName: "LineChart",
        title: "Rates That Explain Themselves",
        description:
          "Every rate recommendation comes with the reason behind it — pacing, competitor set, seasonality — so you're never guessing why the price moved.",
        gradient: "from-emerald-400 to-green-600",
      },
      {
        iconName: "Inbox",
        title: "One Inbox, Every Channel",
        description:
          "Airbnb, Booking.com, direct email, and text messages all triage into one place, so nothing falls through the cracks between channels.",
        gradient: "from-pink to-rose-500",
      },
      {
        iconName: "Workflow",
        title: "Back Office on Autopilot",
        description:
          "Housekeeping tasks, OTA reconciliation, and reporting run in the background — so your team's time goes to guests, not spreadsheets.",
        gradient: "from-indigo-400 to-violet-500",
      },
    ],
  },
  automation: {
    sectionLabel: "Simplify Your Tech Stack",
    headline: "Replace your expensive",
    headlineAccent: "hospitality software.",
    description:
      "You're paying for an answering service, a reputation platform, a pricing tool, and a messaging inbox — each doing one job. A single AI agent can cover the same ground, customized to your property and connected to your PMS, for a fraction of the cost.",
    stats: [
      { value: "24/7", label: "Every call answered, every night of the year" },
      { value: "0", label: "Missed booking calls once the Voice Front Desk is live" },
      { value: "Day 1", label: "Agents live and working on your PMS" },
    ],
    comparisons: [
      {
        category: "Phone Answering",
        software: "After-hours call center / answering service",
        softwareCost: "$300–$1,200/mo",
        aiSolution:
          "AI Voice Front Desk — answers every call live, quotes real availability from your PMS, and texts a booking link on the spot",
        badge: "24/7 live quoting",
        gradient: "from-violet to-purple",
      },
      {
        category: "Reputation Management",
        software: "BirdEye / Podium / Reputation.com",
        softwareCost: "$300–$1,500/mo",
        aiSolution:
          "AI reputation agent — monitors Google, TripAdvisor, and every OTA, drafts responses, and escalates negative reviews immediately",
        badge: "No review left unanswered",
        gradient: "from-yellow-400 to-orange-400",
      },
      {
        category: "Dynamic Pricing",
        software: "PriceLabs / Wheelhouse / Beyond",
        softwareCost: "$20–$100/unit/mo",
        aiSolution:
          "AI revenue analyst — nightly rate and min-stay recommendations with rules you can see, plus pacing and competitor alerts",
        badge: "Explainable pricing",
        gradient: "from-emerald-400 to-green-600",
      },
      {
        category: "Guest Messaging",
        software: "Hospitable / Your Porter / Smartbnb",
        softwareCost: "$25–$100/unit/mo",
        aiSolution:
          "AI messaging agent — triages every OTA and direct inbox, sends pre-arrival info, handles in-stay requests, follows up post-stay",
        badge: "One inbox, every channel",
        gradient: "from-cyan to-blue-500",
      },
      {
        category: "Email & Guest Marketing",
        software: "Mailchimp / Constant Contact + a marketer",
        softwareCost: "$300–$1,000/mo",
        aiSolution:
          "AI marketing agent — social content, seasonal promotions, and past-guest win-back campaigns, timed around your booking calendar",
        badge: "No contact limits",
        gradient: "from-indigo-400 to-violet-500",
      },
      {
        category: "OTA Reconciliation",
        software: "Manual statement review (bookkeeper hours)",
        softwareCost: "$500–$1,500/mo in labor",
        aiSolution:
          "AI OTA auditor — reconciles every statement against your PMS automatically and drafts disputes for billing errors",
        badge: "Line-by-line reconciliation",
        gradient: "from-amber-400 to-orange-500",
      },
    ],
  },
  process: {
    sectionLabel: "How It Works",
    headline: "From Discovery to",
    headlineAccent: "a Fuller Calendar",
    description:
      "A streamlined process designed to get your property results fast — the same one we used on our own hotel, cabins, and event venues.",
    steps: [
      {
        number: "01",
        iconName: "MessageSquare",
        title: "Property Discovery",
        description:
          "We audit your phones, OTA channels, review flow, and PMS setup to find where calls, messages, and reviews are slipping through the cracks.",
        gradient: "from-violet to-purple",
      },
      {
        number: "02",
        iconName: "Cpu",
        title: "Build & Connect",
        description:
          "We build custom AI agents wired directly to your PMS, channels, and phone lines — and iterate with your front desk and housekeeping team's feedback.",
        gradient: "from-cyan to-blue-500",
      },
      {
        number: "03",
        iconName: "Rocket",
        title: "Launch & Optimize",
        description:
          "We deploy your AI team, monitor every call and message, and continuously optimize based on real results — bookings won, reviews answered, calls never missed.",
        gradient: "from-pink to-rose-500",
      },
    ],
  },
  cta: {
    headline: "Let's grab a coffee and",
    headlineAccent: "talk about your property.",
    description:
      "Tell us how your property runs — who answers the phones, where the hours go — and we'll map exactly where an AI agent would pay for itself. And if it wouldn't, we'll tell you that too.",
    footnote:
      "Free assessment · No commitment · We'll get back to you within 24 hours.",
  },
};

export default hospitality;

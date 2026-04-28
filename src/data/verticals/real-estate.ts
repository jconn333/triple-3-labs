import type { VerticalConfig } from "./types";

const realEstate: VerticalConfig = {
  slug: "real-estate",
  industry: "Real Estate",
  meta: {
    title: "AI Agents for Real Estate | Triple 3 Labs",
    description:
      "AI agents built for real estate agencies — automate lead follow-up, listing management, showing coordination, and client communication so your agents can focus on closing deals.",
  },
  hero: {
    headline: "Triple 3 Labs",
    headlineAccent: "Your brokerage's unfair advantage.",
    subheading:
      "AI agents that handle the busywork — following up with leads, coordinating showings, managing listings, and nurturing clients — so your agents can focus on closing deals.",
    description: "",
    ctaLabel: "Meet Your AI Team",
    ctaHref: "#agents",
  },
  marqueeItems: [
    "Lead Follow-Up",
    "Showing Coordinator",
    "Listing Manager",
    "Client Nurturing",
    "Transaction Coordinator",
    "Reputation Manager",
    "Social Media Manager",
    "SEO Specialist",
    "Ad Manager",
    "Bookkeeper",
    "Recruiter",
    "Content Creator",
  ],
  agents: {
    sectionLabel: "Your AI Real Estate Team",
    headline: "Specialist agents.",
    headlineAccent: "Built for real estate.",
    description:
      "Each agent is trained for a specific role in your brokerage, connected to your MLS, CRM, and tools, and ready to work on day one. Pick the roles you need — we handle the rest.",
    list: [
      {
        name: "The Lead Follow-Up Agent",
        title: "Instant Lead Response & Nurturing",
        description:
          "Responds to new leads within seconds — via text, email, or call. Qualifies prospects by asking about budget, timeline, and preferences, then routes hot leads to the right agent. Keeps nurturing cold leads automatically until they're ready to engage.",
        skills: [
          "Instant lead response",
          "Lead qualification",
          "Text & email follow-up",
          "Drip campaigns",
          "Agent routing",
          "Pipeline updates",
        ],
        tools: ["Follow Up Boss", "KVCore", "Gmail", "Twilio"],
        iconName: "UserPlus",
        gradient: "from-violet to-purple",
        accentColor: "violet",
        status: "available" as const,
      },
      {
        name: "The Showing Coordinator",
        title: "Appointment Scheduling & Confirmation",
        description:
          "Handles showing requests, coordinates schedules between buyers and listing agents, sends confirmations and reminders, and follows up after every showing for feedback. No more phone tag.",
        skills: [
          "Showing scheduling",
          "Calendar coordination",
          "Confirmation texts",
          "Feedback collection",
          "Rescheduling",
          "Agent availability",
        ],
        tools: ["ShowingTime", "Google Calendar", "Twilio", "Slack"],
        iconName: "Calendar",
        gradient: "from-cyan to-blue-500",
        accentColor: "cyan",
        status: "available" as const,
      },
      {
        name: "The Listing Manager",
        title: "Listing Updates & Syndication",
        description:
          "Keeps your listings accurate across MLS, Zillow, Realtor.com, and your website. Monitors status changes, updates pricing, and alerts your team when action is needed. Drafts compelling listing descriptions from property details.",
        skills: [
          "MLS sync",
          "Listing descriptions",
          "Price change alerts",
          "Photo coordination",
          "Status updates",
          "Syndication monitoring",
        ],
        tools: ["MLS", "Zillow", "Realtor.com", "Google Docs"],
        iconName: "Home",
        gradient: "from-emerald-400 to-green-600",
        accentColor: "emerald",
        status: "available" as const,
      },
      {
        name: "The Client Nurture Agent",
        title: "Long-Term Relationship Management",
        description:
          "Maintains relationships with past clients and sphere of influence. Sends market updates, home anniversary messages, and seasonal check-ins. Identifies repeat and referral opportunities before your competitors do.",
        skills: [
          "Past client outreach",
          "Market update emails",
          "Home anniversaries",
          "Referral requests",
          "Seasonal campaigns",
          "CRM enrichment",
        ],
        tools: ["Follow Up Boss", "Mailchimp", "Gmail", "Google Sheets"],
        iconName: "Heart",
        gradient: "from-pink to-rose-500",
        accentColor: "pink",
        status: "available" as const,
      },
      {
        name: "The Transaction Coordinator",
        title: "Deal Management & Deadline Tracking",
        description:
          "Tracks every milestone from contract to close — inspection deadlines, appraisal dates, title work, and closing prep. Sends reminders to all parties and flags anything at risk of slipping.",
        skills: [
          "Deadline tracking",
          "Document collection",
          "Party coordination",
          "Milestone reminders",
          "Risk flagging",
          "Closing prep",
        ],
        tools: ["Dotloop", "SkySlope", "Google Calendar", "Slack"],
        iconName: "ClipboardCheck",
        gradient: "from-amber-400 to-orange-500",
        accentColor: "amber",
        status: "available" as const,
      },
      {
        name: "The Reputation Manager",
        title: "Reviews, Ratings & Brand Monitoring",
        description:
          "Monitors your reviews across Google, Zillow, and Realtor.com. Requests reviews from happy clients after closing, drafts responses to new reviews, and alerts you immediately to negative feedback.",
        skills: [
          "Review monitoring",
          "Review request campaigns",
          "Response drafting",
          "Negative alert escalation",
          "Rating trend tracking",
          "Competitor review analysis",
        ],
        tools: ["Google Business", "Zillow", "Realtor.com", "Slack"],
        iconName: "Star",
        gradient: "from-yellow-400 to-orange-400",
        accentColor: "yellow",
        status: "available" as const,
      },
      {
        name: "The Social Media Manager",
        title: "Content Strategy & Publishing",
        description:
          "Creates scroll-stopping real estate content — just-listed posts, market updates, neighborhood spotlights, and agent features. Schedules across Instagram, Facebook, and LinkedIn. Tracks engagement and adjusts strategy.",
        skills: [
          "Listing posts",
          "Market update content",
          "Neighborhood guides",
          "Post scheduling",
          "Engagement tracking",
          "Hashtag strategy",
        ],
        tools: ["Buffer", "Instagram", "Facebook", "LinkedIn", "Canva"],
        iconName: "Share2",
        gradient: "from-indigo-400 to-violet-500",
        accentColor: "indigo",
        status: "available" as const,
      },
      {
        name: "The SEO Specialist",
        title: "Search Rankings & Local Visibility",
        description:
          "Optimizes your website for local search — targeting neighborhood keywords, improving Google Business rankings, and building content that drives organic leads. Delivers weekly ranking reports and action items.",
        skills: [
          "Local SEO audits",
          "Keyword tracking",
          "Google Business optimization",
          "Content recommendations",
          "Competitor monitoring",
          "Backlink analysis",
        ],
        tools: ["Ahrefs", "Google Search Console", "Google Business"],
        iconName: "Search",
        gradient: "from-teal-400 to-cyan-500",
        accentColor: "teal",
        status: "available" as const,
      },
      {
        name: "The Ad Manager",
        title: "Paid Lead Generation & Reporting",
        description:
          "Monitors your Google and Meta ad campaigns for buyer and seller leads. Flags budget anomalies, identifies underperforming ads, and delivers weekly performance summaries with cost-per-lead breakdowns.",
        skills: [
          "Campaign monitoring",
          "Cost-per-lead tracking",
          "Budget anomaly alerts",
          "Weekly reports",
          "Ad fatigue detection",
          "Audience optimization",
        ],
        tools: ["Google Ads", "Meta Ads", "Google Analytics", "Google Sheets"],
        iconName: "MousePointerClick",
        gradient: "from-blue-400 to-indigo-500",
        accentColor: "blue",
        status: "available" as const,
      },
    ],
  },
  features: {
    sectionLabel: "What We Do",
    headline: "Close More Deals.",
    headlineAccent: "Waste Less Time.",
    description:
      "We build AI systems specifically for real estate brokerages — so your agents spend time with clients, not on admin.",
    list: [
      {
        iconName: "Bot",
        title: "Custom AI Agents",
        description:
          "Purpose-built AI agents for real estate — lead follow-up, showing coordination, transaction management — working 24/7 without fatigue.",
        gradient: "from-violet to-purple",
      },
      {
        iconName: "Workflow",
        title: "Workflow Automation",
        description:
          "Automate listing-to-close workflows, eliminate manual data entry, and ensure no deadline or lead falls through the cracks.",
        gradient: "from-cyan to-blue-500",
      },
      {
        iconName: "Brain",
        title: "AI Strategy for Brokerages",
        description:
          "Strategic roadmaps to identify the highest-impact AI opportunities in your brokerage and maximize ROI.",
        gradient: "from-pink to-rose-500",
      },
      {
        iconName: "Zap",
        title: "MLS & CRM Integrations",
        description:
          "Seamlessly connect your MLS, CRM, showing tools, and transaction platforms into one intelligent ecosystem.",
        gradient: "from-amber-400 to-orange-500",
      },
      {
        iconName: "Layers",
        title: "Lead-to-Close Systems",
        description:
          "Complete AI-powered pipelines from lead capture through closing — every step tracked, automated, and optimized.",
        gradient: "from-emerald-400 to-green-600",
      },
      {
        iconName: "LineChart",
        title: "Performance Analytics",
        description:
          "Real-time dashboards tracking agent performance, lead conversion, marketing ROI, and deal pipeline health.",
        gradient: "from-violet to-cyan",
      },
    ],
  },
  automation: {
    sectionLabel: "Simplify Your Tech Stack",
    headline: "Replace your expensive",
    headlineAccent: "real estate software.",
    description:
      "You're paying for a dozen tools that each do one thing. A single AI agent can cover the same ground — customized to your brokerage, connected to your data — for a fraction of the cost.",
    stats: [
      { value: "73%", label: "Average software budget wasted on unused features" },
      { value: "10x", label: "Cost reduction vs. legacy SaaS subscriptions" },
      { value: "Day 1", label: "Custom AI agents deployed and working" },
    ],
    comparisons: [
      {
        category: "CRM & Lead Management",
        software: "Follow Up Boss / KVCore / BoomTown",
        softwareCost: "$150–$500/seat/mo",
        aiSolution:
          "AI lead agent — responds instantly, qualifies leads, nurtures long-term, updates your pipeline automatically",
        badge: "No seat limits",
        gradient: "from-violet to-purple",
      },
      {
        category: "Transaction Management",
        software: "Dotloop / SkySlope / Brokermint",
        softwareCost: "$100–$300/mo",
        aiSolution:
          "AI transaction coordinator — tracks deadlines, collects docs, reminds all parties, flags risks automatically",
        badge: "Never misses a deadline",
        gradient: "from-cyan to-blue-500",
      },
      {
        category: "Social Media Marketing",
        software: "Coffee & Contracts / Hootsuite",
        softwareCost: "$99–$249/mo",
        aiSolution:
          "AI social agent — creates real estate content, schedules posts, tracks engagement, adjusts strategy",
        badge: "Unlimited posts",
        gradient: "from-pink to-rose-500",
      },
      {
        category: "SEO & Local Search",
        software: "Semrush / Moz Local",
        softwareCost: "$120–$500/mo",
        aiSolution:
          "AI SEO agent — optimizes local rankings, manages Google Business, delivers weekly action plans",
        badge: "Weekly action plans",
        gradient: "from-emerald-400 to-green-600",
      },
      {
        category: "Review Management",
        software: "BirdEye / Podium",
        softwareCost: "$200–$400/mo",
        aiSolution:
          "AI reputation agent — requests reviews after close, drafts responses, monitors all platforms 24/7",
        badge: "Automated review requests",
        gradient: "from-amber-400 to-orange-500",
      },
      {
        category: "Email Marketing & Drip",
        software: "Mailchimp / ActiveCampaign",
        softwareCost: "$100–$800/mo",
        aiSolution:
          "AI nurture agent — writes campaigns, builds sequences, segments your sphere, optimizes send times",
        badge: "No contact limits",
        gradient: "from-indigo-400 to-violet-500",
      },
    ],
  },
  process: {
    sectionLabel: "How It Works",
    headline: "From Discovery to",
    headlineAccent: "Closing More Deals",
    description:
      "A streamlined process designed to get your brokerage results fast.",
    steps: [
      {
        number: "01",
        iconName: "MessageSquare",
        title: "Brokerage Discovery",
        description:
          "We audit your current tech stack, workflows, and pain points to identify the highest-impact opportunities for AI in your brokerage.",
        gradient: "from-violet to-purple",
      },
      {
        number: "02",
        iconName: "Cpu",
        title: "Build & Configure",
        description:
          "We build custom AI agents tailored to your brokerage — connected to your MLS, CRM, and tools — and iterate with your team's feedback.",
        gradient: "from-cyan to-blue-500",
      },
      {
        number: "03",
        iconName: "Rocket",
        title: "Launch & Optimize",
        description:
          "We deploy your AI team, monitor performance, and continuously optimize based on real results — leads converted, time saved, deals closed.",
        gradient: "from-pink to-rose-500",
      },
    ],
  },
  cta: {
    headline: "Ready to",
    headlineAccent: "Supercharge",
    description:
      "Tell us about your brokerage and we'll show you exactly how AI agents can help your team close more deals with less busywork.",
    footnote:
      "No commitment required. We'll get back to you within 24 hours.",
  },
};

export default realEstate;

"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  Search,
  Share2,
  Headphones,
  Mail,
  TrendingUp,
  Calendar,
  BarChart3,
  MessageSquare,
  Globe,
  FileText,
  Users,
  PenLine,
  Megaphone,
  Star,
  UserPlus,
  Video,
  MousePointerClick,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Agent {
  name: string;
  title: string;
  description: string;
  skills: string[];
  tools: string[];
  icon: LucideIcon;
  gradient: string;
  accentColor: string;
  status: "available" | "coming-soon";
}

const agents: Agent[] = [
  {
    name: "The Chief of Staff",
    title: "Executive Assistant & Operations Manager",
    description:
      "Your right hand. Scans your inbox and calendar each morning, delivers a prioritized brief, drafts responses, flags urgent items, and keeps your day on track. Connects to Slack, email, and your calendar so nothing falls through the cracks.",
    skills: [
      "Morning briefings",
      "Email triage & drafting",
      "Calendar management",
      "Task prioritization",
      "Team coordination",
      "Meeting prep",
    ],
    tools: ["Gmail", "Google Calendar", "Slack", "Notion"],
    icon: BrainCircuit,
    gradient: "from-violet to-purple",
    accentColor: "violet",
    status: "available",
  },
  {
    name: "The Customer Support Rep",
    title: "24/7 Customer Service & Ticket Resolution",
    description:
      "Answers customer inquiries around the clock via chat, email, or phone. Pulls from your knowledge base to resolve issues instantly, and escalates to your team only when needed.",
    skills: [
      "Live chat support",
      "Email responses",
      "FAQ automation",
      "Ticket routing",
      "Voice support",
      "Escalation handling",
    ],
    tools: ["Intercom", "Zendesk", "Slack", "Twilio"],
    icon: Headphones,
    gradient: "from-emerald-400 to-green-600",
    accentColor: "emerald",
    status: "available",
  },
  {
    name: "The SEO Specialist",
    title: "Search Rankings & Site Performance",
    description:
      "Runs weekly site audits, tracks keyword rankings, identifies content opportunities, and delivers actionable recommendations. Monitors your competitors and alerts you when rankings shift.",
    skills: [
      "Weekly site audits",
      "Keyword tracking",
      "Competitor monitoring",
      "Content gap analysis",
      "Technical SEO checks",
      "Backlink monitoring",
    ],
    tools: ["Ahrefs", "Google Search Console", "Google Analytics"],
    icon: Search,
    gradient: "from-cyan to-blue-500",
    accentColor: "cyan",
    status: "available",
  },
  {
    name: "The Social Media Manager",
    title: "Content Strategy & Publishing",
    description:
      "Creates on-brand social content, schedules posts across platforms, tracks engagement metrics, and adjusts strategy based on what's working. Keeps your brand active and consistent without you lifting a finger.",
    skills: [
      "Content creation",
      "Post scheduling",
      "Engagement tracking",
      "Hashtag strategy",
      "Trend monitoring",
      "Performance reporting",
    ],
    tools: ["Buffer", "Instagram", "Facebook", "LinkedIn", "X"],
    icon: Share2,
    gradient: "from-pink to-rose-500",
    accentColor: "pink",
    status: "available",
  },
  {
    name: "The Order Transcriber",
    title: "Phone Order Transcription & Draft Prefill",
    description:
      "Listens to phone call recordings, transcribes the conversation, and automatically prefills order drafts with the extracted details. Drafts are queued for a human to review and approve — or configured to submit automatically.",
    skills: [
      "Call transcription",
      "Order detail extraction",
      "Draft prefill",
      "Human approval queue",
      "Auto-submit option",
      "Error flagging",
    ],
    tools: ["Twilio", "Google Docs", "Slack", "Zapier"],
    icon: FileText,
    gradient: "from-orange-400 to-amber-500",
    accentColor: "orange",
    status: "available",
  },
  {
    name: "The Ad Manager",
    title: "Paid Media Monitoring & Reporting",
    description:
      "Monitors your Google and Meta ad campaigns daily, flags budget anomalies and underperforming ads, and delivers weekly performance summaries. Keeps your spend efficient without requiring a full-time media buyer.",
    skills: [
      "Campaign monitoring",
      "Budget anomaly alerts",
      "Weekly reports",
      "ROAS tracking",
      "Ad fatigue detection",
      "Spend optimization tips",
    ],
    tools: ["Google Ads", "Meta Ads", "Google Analytics", "Google Sheets"],
    icon: MousePointerClick,
    gradient: "from-blue-400 to-indigo-500",
    accentColor: "blue",
    status: "available",
  },
  {
    name: "The Reputation Manager",
    title: "Reviews, Ratings & Brand Monitoring",
    description:
      "Monitors your reviews across Google, Yelp, TripAdvisor, and more. Drafts on-brand responses to new reviews, alerts you immediately to negative feedback, and tracks your rating trends over time.",
    skills: [
      "Review monitoring",
      "Response drafting",
      "Negative alert escalation",
      "Rating trend tracking",
      "Competitor review analysis",
      "Sentiment reporting",
    ],
    tools: ["Google Business", "Yelp", "TripAdvisor", "Slack"],
    icon: Star,
    gradient: "from-yellow-400 to-orange-400",
    accentColor: "yellow",
    status: "available",
  },
  {
    name: "The Sales Development Rep",
    title: "Lead Research & Outreach",
    description:
      "Researches target prospects, personalizes outreach emails, tracks follow-up sequences, and keeps your pipeline moving. Works your lead list so you only spend time on warm conversations.",
    skills: [
      "Lead research",
      "Personalized outreach",
      "Follow-up sequences",
      "CRM updates",
      "Prospect qualification",
      "Pipeline reporting",
    ],
    tools: ["LinkedIn", "Gmail", "HubSpot", "Apollo"],
    icon: UserPlus,
    gradient: "from-teal-400 to-cyan-500",
    accentColor: "teal",
    status: "available",
  },
  {
    name: "The Meeting Assistant",
    title: "Call Transcription & Action Items",
    description:
      "Joins your calls, transcribes the conversation, extracts action items and decisions, and sends a clean summary to Slack or email. No more scrambling for notes — every meeting is documented automatically.",
    skills: [
      "Call transcription",
      "Action item extraction",
      "Meeting summaries",
      "Slack notifications",
      "Follow-up drafting",
      "Decision logging",
    ],
    tools: ["Zoom", "Google Meet", "Slack", "Notion"],
    icon: Video,
    gradient: "from-indigo-400 to-violet-500",
    accentColor: "indigo",
    status: "available",
  },
  {
    name: "The Bookkeeper",
    title: "Expense Tracking & Financial Reporting",
    description:
      "Monitors transactions, categorizes expenses, reconciles accounts, and generates financial summaries. Flags anomalies and keeps your books clean so you always know where your money is going.",
    skills: [
      "Expense categorization",
      "Account reconciliation",
      "Monthly summaries",
      "Anomaly detection",
      "Invoice tracking",
      "Cash flow monitoring",
    ],
    tools: ["QuickBooks", "Stripe", "Plaid", "Google Sheets"],
    icon: BarChart3,
    gradient: "from-amber-400 to-orange-500",
    accentColor: "amber",
    status: "available",
  },
  {
    name: "The Recruiter",
    title: "Hiring Pipeline & Candidate Screening",
    description:
      "Screens applicants, scores resumes against your job criteria, schedules interviews, and keeps candidates updated. Manages your hiring pipeline so you only talk to the best fits.",
    skills: [
      "Resume screening",
      "Candidate scoring",
      "Interview scheduling",
      "Pipeline management",
      "Follow-up automation",
      "Job posting",
    ],
    tools: ["LinkedIn", "Indeed", "Google Calendar", "Gmail"],
    icon: Users,
    gradient: "from-rose-400 to-pink-600",
    accentColor: "rose",
    status: "available",
  },
  {
    name: "The Content Creator",
    title: "Blog Writing & Email Newsletters",
    description:
      "Researches topics, writes SEO-optimized blog posts, and crafts email newsletters your subscribers actually want to read. Repurposes content across formats — turn one blog into a newsletter, a LinkedIn post, and a social caption.",
    skills: [
      "Blog post writing",
      "Email newsletters",
      "SEO optimization",
      "Content repurposing",
      "Topic research",
      "Brand voice consistency",
    ],
    tools: ["WordPress", "Beehiiv", "Mailchimp", "Google Docs", "Ahrefs"],
    icon: PenLine,
    gradient: "from-fuchsia-500 to-pink-500",
    accentColor: "fuchsia",
    status: "available",
  },
];

const toolIcons: Record<string, LucideIcon> = {
  Gmail: Mail,
  "Google Calendar": Calendar,
  Slack: MessageSquare,
  Notion: FileText,
  Ahrefs: TrendingUp,
  "Google Search Console": Search,
  "Google Analytics": BarChart3,
  "Google Docs": FileText,
  "Google Sheets": FileText,
  "Google Business": Star,
  "Google Ads": MousePointerClick,
  "Meta Ads": MousePointerClick,
  Buffer: Share2,
  Instagram: Globe,
  Facebook: Globe,
  LinkedIn: Globe,
  X: Globe,
  WordPress: Globe,
  Beehiiv: Mail,
  Mailchimp: Mail,
  Klaviyo: Mail,
  ActiveCampaign: Mail,
  Intercom: Headphones,
  Zendesk: Headphones,
  Twilio: Headphones,
  QuickBooks: BarChart3,
  Stripe: BarChart3,
  Plaid: BarChart3,
  Indeed: Users,
  HubSpot: Users,
  Apollo: UserPlus,
  Yelp: Star,
  TripAdvisor: Star,
  Zoom: Video,
  "Google Meet": Video,
};

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const Icon = agent.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="glass-card group relative overflow-hidden rounded-2xl p-8"
    >
      {/* Hover glow */}
      <div
        className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${agent.gradient} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-[0.07]`}
      />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`inline-flex rounded-xl bg-gradient-to-br ${agent.gradient} p-3 shadow-lg`}
          >
            <Icon size={24} className="text-white" />
          </div>
          <div>
            <h3
              className="text-xl font-bold text-white"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {agent.name}
            </h3>
            <p className="text-sm text-white/40">{agent.title}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            agent.status === "available"
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }`}
        >
          {agent.status === "available" ? "Available" : "Coming Soon"}
        </span>
      </div>

      {/* Description */}
      <p className="mb-6 text-sm leading-relaxed text-white/50">
        {agent.description}
      </p>

      {/* Skills */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
          Skills
        </p>
        <div className="flex flex-wrap gap-2">
          {agent.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-white/50"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
          Connects to
        </p>
        <div className="flex flex-wrap gap-2">
          {agent.tools.map((tool) => {
            const ToolIcon = toolIcons[tool] || Globe;
            return (
              <span
                key={tool}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/60"
              >
                <ToolIcon size={12} />
                {tool}
              </span>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function MeetTheOffice() {
  return (
    <section id="agents" className="relative py-24 px-6">
      {/* Background glows */}
      <div className="pointer-events-none absolute left-0 top-1/4 h-[600px] w-[600px] rounded-full bg-violet/5 blur-[128px]" />
      <div className="pointer-events-none absolute right-0 bottom-1/4 h-[500px] w-[500px] rounded-full bg-cyan/5 blur-[128px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-center"
        >
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-violet-400">
            Meet the AI Office
          </span>
          <h2
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Specialist agents.{" "}
            <span className="gradient-text">Ready on day one.</span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-white/50 leading-relaxed">
            Each agent is a specialist — trained for a specific role, connected to
            your tools, and ready to work on day one. Pick the roles you need.
            We handle onboarding, configuration, and ongoing optimization.
          </p>
        </motion.div>

        {/* Staffing stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-16 flex max-w-3xl flex-wrap items-center justify-center gap-8 rounded-2xl border border-white/5 bg-white/[0.02] px-8 py-5"
        >
          {[
            { value: "24/7", label: "Availability" },
            { value: "Day 1", label: "Productive" },
            { value: "Instant", label: "Scales with demand" },
            { value: "Fixed", label: "Predictable monthly cost" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p
                className="text-xl font-bold text-white"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {stat.value}
              </p>
              <p className="text-xs text-white/40">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Section heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Meet Your <span className="gradient-text">AI Team</span>
        </motion.h2>

        {/* Agent grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {agents.map((agent, idx) => (
            <AgentCard key={agent.name} agent={agent} index={idx} />
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="mb-6 text-lg text-white/40">
            Don&apos;t see the role you need?{" "}
            <span className="text-white/70">We build custom agents too.</span>
          </p>
          <a
            href="#contact"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet to-purple px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
          >
            <span className="relative z-10">Tell Us What You Need</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple to-cyan opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

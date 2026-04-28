"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  Zap,
  Users,
  Target,
  RefreshCw,
  Mail,
  TrendingUp,
  Calendar,
  BarChart3,
  MessageSquare,
  Globe,
  FileText,
  Search,
  Share2,
  Headphones,
  Star,
  UserPlus,
  Video,
  MousePointerClick,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/admin/ContactForm";
import { resolveIcon } from "@/data/verticals/icons";
import type { VerticalConfig } from "@/data/verticals/types";

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
  Canva: Globe,
  WordPress: Globe,
  Beehiiv: Mail,
  Mailchimp: Mail,
  Intercom: Headphones,
  Zendesk: Headphones,
  Twilio: Headphones,
  QuickBooks: BarChart3,
  Stripe: BarChart3,
  Plaid: BarChart3,
  Indeed: UserPlus,
  HubSpot: Users,
  Apollo: UserPlus,
  Yelp: Star,
  TripAdvisor: Star,
  "Realtor.com": Globe,
  Zillow: Globe,
  MLS: Globe,
  ShowingTime: Calendar,
  "Follow Up Boss": Users,
  KVCore: Users,
  BoomTown: Users,
  Dotloop: FileText,
  SkySlope: FileText,
  Zoom: Video,
  "Google Meet": Video,
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function VerticalPage({ config }: { config: VerticalConfig }) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[75vh] items-center justify-center overflow-hidden px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-slow absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet/20 blur-[128px]" />
          <div className="animate-float absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-cyan/15 blur-[128px]" />
          <div className="animate-pulse-glow absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-pink/10 blur-[128px]" />
        </div>
        <div className="grid-pattern pointer-events-none absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {config.hero.badge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-block rounded-full border border-violet/30 bg-violet/10 px-4 py-1.5 text-sm font-medium text-violet-300">
                {config.hero.badge}
              </span>
            </motion.div>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <span className="gradient-text">{config.hero.headline}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mx-auto mb-6 max-w-2xl text-xl font-medium text-white/80 sm:text-2xl md:text-3xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <span className="gradient-text font-semibold">
              {config.hero.headlineAccent}
            </span>
          </motion.p>
          {config.hero.subheading && (
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-white/50 sm:text-lg"
            >
              {config.hero.subheading}
            </motion.p>
          )}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <a
              href={config.hero.ctaHref}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet to-purple px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
            >
              <span className="relative z-10">{config.hero.ctaLabel}</span>
              <ArrowRight
                size={18}
                className="relative z-10 transition-transform group-hover:translate-x-1"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple to-cyan opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-10 flex flex-col items-center gap-2"
          >
            <span className="text-xs uppercase tracking-widest text-white/30">
              Scroll to explore
            </span>
            <div className="h-10 w-px bg-gradient-to-b from-violet/50 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* ── Marquee ──────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative overflow-hidden border-y border-white/5 py-6"
      >
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-[#030014] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-[#030014] to-transparent" />
        <div className="animate-marquee flex whitespace-nowrap">
          {[...config.marqueeItems, ...config.marqueeItems].map((item, i) => (
            <span
              key={i}
              className="mx-8 text-lg font-medium text-white/20 transition-colors hover:text-white/50"
            >
              {item}
              <span className="ml-8 text-violet/40">/</span>
            </span>
          ))}
        </div>
      </motion.section>

      {/* ── Why Agents ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-16 pt-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/5 blur-[120px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-violet">
              {config.whyAgents.tagline}
            </p>
            <h2
              className="mb-8 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-7xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              <span className="text-white">{config.whyAgents.headlineWhite}</span>
              <br />
              <span className="gradient-text">
                {config.whyAgents.headlineAccent}
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/50 sm:text-xl">
              {config.whyAgents.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Meet the AI Team ─────────────────────────────────────── */}
      <section id="agents" className="relative px-6 py-24">
        <div className="pointer-events-none absolute left-0 top-1/4 h-[600px] w-[600px] rounded-full bg-violet/5 blur-[128px]" />
        <div className="pointer-events-none absolute bottom-1/4 right-0 h-[500px] w-[500px] rounded-full bg-cyan/5 blur-[128px]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-6 text-center"
          >
            <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-violet-400">
              {config.agents.sectionLabel}
            </span>
            <h2
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {config.agents.headline}{" "}
              <span className="gradient-text">{config.agents.headlineAccent}</span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/50">
              {config.agents.description}
            </p>
          </motion.div>

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

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {config.agents.list.map((agent, idx) => {
              const Icon = resolveIcon(agent.iconName);
              return (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="glass-card group relative overflow-hidden rounded-2xl p-8"
                >
                  <div
                    className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${agent.gradient} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-[0.07]`}
                  />
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
                  <p className="mb-6 text-sm leading-relaxed text-white/50">
                    {agent.description}
                  </p>
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
            })}
          </motion.div>

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

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="services" className="relative px-6 py-16">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet/5 blur-[128px]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-20 text-center"
          >
            <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-violet-400">
              {config.features.sectionLabel}
            </span>
            <h2
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {config.features.headline}{" "}
              <span className="gradient-text">
                {config.features.headlineAccent}
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              {config.features.description}
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {config.features.list.map((feature) => {
              const Icon = resolveIcon(feature.iconName);
              return (
                <motion.div
                  key={feature.title}
                  variants={cardVariants}
                  className="glass-card group relative rounded-2xl p-8"
                >
                  <div
                    className={`mb-5 inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-3`}
                  >
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/50">
                    {feature.description}
                  </p>
                  <div
                    className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 blur-xl transition-opacity group-hover:opacity-5`}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Automation / Replace Software ────────────────────────── */}
      <section id="automation" className="relative overflow-hidden px-6 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-violet/5 blur-[128px]" />
          <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan/5 blur-[128px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-6 text-center"
          >
            <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-cyan-400">
              {config.automation.sectionLabel}
            </span>
            <h2
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {config.automation.headline}{" "}
              <span className="gradient-text">
                {config.automation.headlineAccent}
              </span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/50">
              {config.automation.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mb-16 grid max-w-3xl grid-cols-3 gap-4"
          >
            {config.automation.stats.map((stat) => (
              <div
                key={stat.label}
                className="glass-card rounded-2xl p-6 text-center"
              >
                <p
                  className="gradient-text mb-1 text-3xl font-bold"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {stat.value}
                </p>
                <p className="text-xs leading-snug text-white/40">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          <div className="space-y-4">
            {config.automation.comparisons.map((item, idx) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="glass-card group grid grid-cols-1 overflow-hidden rounded-2xl md:grid-cols-[1fr_1fr_auto]"
              >
                <div className="border-b border-white/5 p-6 md:border-b-0 md:border-r">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/30">
                    {item.category}
                  </p>
                  <div className="flex items-start gap-2">
                    <X size={16} className="mt-0.5 flex-shrink-0 text-red-400/70" />
                    <div>
                      <p className="font-semibold text-white/60 line-through decoration-red-400/40">
                        {item.software}
                      </p>
                      <p className="mt-1 text-sm font-medium text-red-400/80">
                        {item.softwareCost}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-b border-white/5 p-6 md:border-b-0 md:border-r">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/30">
                    AI Alternative
                  </p>
                  <div className="flex items-start gap-2">
                    <Check
                      size={16}
                      className="mt-0.5 flex-shrink-0 text-emerald-400"
                    />
                    <p className="text-sm leading-relaxed text-white/70">
                      {item.aiSolution}
                    </p>
                  </div>
                </div>
                <div
                  className={`flex shrink-0 flex-col items-center justify-center bg-gradient-to-br ${item.gradient} p-6 opacity-90 md:h-[120px] md:w-[180px]`}
                >
                  <p
                    className="text-center text-lg font-bold leading-tight text-white"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {item.badge}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 text-center"
          >
            <p className="mb-3 text-lg text-white/40">
              Ready to simplify your stack?
            </p>
            <a
              href="#contact"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet to-purple px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
            >
              <span className="relative z-10">See What We Can Consolidate</span>
              <ArrowRight
                size={18}
                className="relative z-10 transition-transform group-hover:translate-x-1"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple to-cyan opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Process ──────────────────────────────────────────────── */}
      <section id="process" className="relative px-6 py-16">
        <div className="pointer-events-none absolute left-0 top-1/3 h-[400px] w-[400px] rounded-full bg-pink/5 blur-[128px]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-20 text-center"
          >
            <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-pink-400">
              {config.process.sectionLabel}
            </span>
            <h2
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {config.process.headline}{" "}
              <span className="gradient-text">
                {config.process.headlineAccent}
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              {config.process.description}
            </p>
          </motion.div>

          <div className="relative mx-auto max-w-4xl">
            <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-violet/50 via-cyan/50 to-pink/50 md:left-1/2 md:block" />
            <div className="space-y-16">
              {config.process.steps.map((step, idx) => {
                const StepIcon = resolveIcon(step.iconName);
                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                      duration: 0.7,
                      delay: idx * 0.15,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`relative flex flex-col items-start gap-6 md:flex-row md:items-center ${
                      idx % 2 === 1 ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`glass-card flex-1 rounded-2xl p-8 ${
                        idx % 2 === 1 ? "md:text-right" : ""
                      }`}
                    >
                      <span
                        className={`mb-4 inline-block bg-gradient-to-r ${step.gradient} bg-clip-text text-5xl font-bold text-transparent opacity-30`}
                      >
                        {step.number}
                      </span>
                      <h3 className="mb-3 text-2xl font-bold text-white">
                        {step.title}
                      </h3>
                      <p className="text-base text-white/50">{step.description}</p>
                    </div>
                    <div className="z-10 hidden flex-shrink-0 md:block">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient} shadow-lg`}
                      >
                        <StepIcon size={20} className="text-white" />
                      </div>
                    </div>
                    <div className="hidden flex-1 md:block" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA / Contact ────────────────────────────────────────── */}
      <section id="contact" className="relative px-6 py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-violet/10 blur-[128px]" />
          <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-cyan/10 blur-[128px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="relative z-10 mx-auto max-w-2xl"
        >
          <div className="mb-8 text-center">
            <h2
              className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {config.cta.headline}{" "}
              <span className="gradient-text">{config.cta.headlineAccent}</span>
              <br />
              Your {config.industry}?
            </h2>
            <p className="mx-auto max-w-xl text-lg text-white/50">
              {config.cta.description}
            </p>
          </div>
          <div className="glass-card rounded-2xl p-8">
            <ContactForm />
          </div>
          <p className="mt-4 text-center text-sm text-white/30">
            {config.cta.footnote}
          </p>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}

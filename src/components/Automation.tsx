"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";

const comparisons = [
  {
    category: "CRM & Sales Pipeline",
    software: "Salesforce / HubSpot",
    softwareCost: "$150–$300/seat/mo",
    aiSolution: "Custom AI sales agent — tracks deals, updates pipeline, drafts follow-ups, surfaces risks",
    badge: "No seat limits",
    gradient: "from-violet to-purple",
  },
  {
    category: "Email Marketing",
    software: "Klaviyo / Mailchimp / ActiveCampaign",
    softwareCost: "$100–$800/mo",
    aiSolution: "AI email agent — writes campaigns, builds sequences, segments lists, optimizes send times",
    badge: "No contact limits",
    gradient: "from-cyan to-blue-500",
  },
  {
    category: "Social Media Management",
    software: "Hootsuite / Sprout Social",
    softwareCost: "$99–$249/mo",
    aiSolution: "AI social agent — creates content, schedules posts, tracks engagement, adjusts strategy",
    badge: "Unlimited posts",
    gradient: "from-pink to-rose-500",
  },
  {
    category: "SEO & Analytics",
    software: "Semrush / Moz",
    softwareCost: "$120–$500/mo",
    aiSolution: "AI SEO agent — runs audits, tracks rankings, finds gaps, delivers weekly action plans",
    badge: "Weekly action plans",
    gradient: "from-emerald-400 to-green-600",
  },
  {
    category: "Customer Support",
    software: "Zendesk / Intercom",
    softwareCost: "$55–$150/seat/mo",
    aiSolution: "AI support agent — resolves tickets 24/7, drafts responses, escalates only when needed",
    badge: "Zero hold time",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    category: "HR & Recruiting",
    software: "Greenhouse / Lever",
    softwareCost: "$200–$600/mo",
    aiSolution: "AI recruiter — screens resumes, scores candidates, schedules interviews, manages pipeline",
    badge: "Unlimited candidates",
    gradient: "from-indigo-400 to-violet-500",
  },
];

const stats = [
  { value: "73%", label: "Average software budget wasted on unused features" },
  { value: "10x", label: "Cost reduction vs. legacy SaaS subscriptions" },
  { value: "Day 1", label: "Custom AI agents deployed and working" },
];

export default function Automation() {
  return (
    <section id="automation" className="relative py-24 px-6 overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/4 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-violet/5 blur-[128px]" />
        <div className="absolute top-1/3 right-0 h-[500px] w-[500px] rounded-full bg-cyan/5 blur-[128px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-center"
        >
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-cyan-400">
            Kill Your Software Stack
          </span>
          <h2
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            The SaaS era is{" "}
            <span className="gradient-text">ending.</span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-white/50 leading-relaxed">
            For decades, software companies have charged thousands of dollars a month for tools that do one thing. AI can now replicate that functionality — customized to your business, connected to your data — for a fraction of the price. The companies that figure this out first win.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mb-16 grid max-w-3xl grid-cols-3 gap-4"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <p
                className="mb-1 text-3xl font-bold gradient-text"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {stat.value}
              </p>
              <p className="text-xs leading-snug text-white/40">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Comparison table */}
        <div className="space-y-4">
          {comparisons.map((item, idx) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="glass-card group grid grid-cols-1 overflow-hidden rounded-2xl md:grid-cols-[1fr_1fr_auto]"
            >
              {/* Category label */}
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

              {/* AI solution */}
              <div className="border-b border-white/5 p-6 md:border-b-0 md:border-r">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/30">
                  AI Replacement
                </p>
                <div className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                  <p className="text-sm leading-relaxed text-white/70">
                    {item.aiSolution}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className={`flex flex-col items-center justify-center bg-gradient-to-br ${item.gradient} p-6 opacity-90 md:w-[180px] md:h-[120px] shrink-0`}>
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

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="mb-3 text-lg text-white/40">
            Ready to cut your software bill?
          </p>
          <a
            href="#contact"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet to-purple px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
          >
            <span className="relative z-10">See What We Can Replace</span>
            <ArrowRight
              size={18}
              className="relative z-10 transition-transform group-hover:translate-x-1"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple to-cyan opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

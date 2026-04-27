"use client";

import { motion } from "framer-motion";
import { Zap, Check, Users, Target, RefreshCw } from "lucide-react";

/* ── Data ────────────────────────────────────────────────────────── */

const pricingTiers = [
  {
    name: "Essentials",
    price: "499",
    subtitle: "For businesses starting with AI call handling",
    featured: false,
    overage: "$0.25/min",
    features: [
      { text: "1 custom AI voice agent", highlight: true },
      { text: "250 included minutes", highlight: true },
      { text: "1 dedicated phone number", highlight: false },
      { text: "24/7 inbound call handling", highlight: false },
      { text: "FAQ & knowledge base (50 entries)", highlight: false },
      { text: "Call recordings & transcripts", highlight: false },
      { text: "Weekly email summary", highlight: false },
      { text: "Email & chat support", highlight: false },
    ],
  },
  {
    name: "Professional",
    price: "797",
    subtitle: "Full-featured for growing businesses",
    featured: true,
    overage: "$0.20/min",
    features: [
      { text: "1 custom AI voice agent", highlight: true },
      { text: "500 included minutes", highlight: true },
      { text: "1 dedicated phone number", highlight: false },
      { text: "24/7 inbound call handling", highlight: false },
      { text: "Live call transfer to staff", highlight: false },
      { text: "1 CRM integration", highlight: false },
      { text: "Calendar & appointment booking", highlight: false },
      { text: "FAQ & knowledge base (150 entries)", highlight: false },
      { text: "Monthly analytics report", highlight: false },
      { text: "Priority support", highlight: false },
    ],
  },
  {
    name: "Premium",
    price: "1,297",
    subtitle: "White-glove service for high-volume needs",
    featured: false,
    overage: "$0.18/min",
    features: [
      { text: "1 custom AI voice agent", highlight: true },
      { text: "1,000 included minutes", highlight: true },
      { text: "Up to 3 phone numbers", highlight: false },
      { text: "24/7 with intelligent call routing", highlight: false },
      { text: "Live transfer with routing rules", highlight: false },
      { text: "1 CRM integration", highlight: false },
      { text: "Multi-calendar booking", highlight: false },
      { text: "Custom conditional call flows", highlight: false },
      { text: "FAQ & knowledge base (300 entries)", highlight: false },
      { text: "Monthly optimization call", highlight: false },
      { text: "Performance report & recs", highlight: false },
      { text: "Dedicated Slack/text support", highlight: false },
    ],
  },
];

const discountTiers = [
  { label: "1st Agent", value: "$1,500", sub: "Full setup", gradient: false },
  { label: "2nd Agent", value: "$500", sub: "15% off retainer", gradient: true },
  { label: "3rd+ Agent", value: "$500", sub: "20% off retainer", gradient: true },
];

const roiStats = [
  { number: "80%", description: "of callers hang up rather than leave a voicemail" },
  { number: "24/7", description: "coverage vs. business hours with a human receptionist" },
  { number: "~$3,500/mo", description: "average cost of after-hours coverage with live answering" },
];

const includedBoxes = [
  {
    icon: Target,
    title: "What's Included in Setup",
    description:
      "Discovery call to understand your business, custom call flow design, AI voice selection and tuning, knowledge base built from your FAQs, phone number provisioning, CRM and calendar integration, thorough testing, and live launch support.",
    gradient: "from-violet to-purple",
  },
  {
    icon: RefreshCw,
    title: "Ongoing Management",
    description:
      "24/7 monitoring to ensure uptime, knowledge base updates as your business evolves, call flow optimization based on real data, analytics and reporting, technical support, and platform maintenance — all included in your monthly plan.",
    gradient: "from-cyan to-blue-500",
  },
];

/* ── Animation variants ──────────────────────────────────────────── */

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* ── Component ───────────────────────────────────────────────────── */

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-16 px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet/5 blur-[128px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* ── Section header ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-violet-400">
            AI Voice Agent Service
          </span>
          <h2
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Never miss a call again.{" "}
            <br className="hidden sm:inline" />
            <span className="gradient-text">Your AI receptionist, 24/7.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            We design, build, and manage a custom AI voice agent that answers
            your phone around the clock — handling FAQs, booking appointments,
            routing calls, and capturing leads so you never lose another
            customer.
          </p>
        </motion.div>

        {/* ── Setup banner ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 glass-card rounded-2xl bg-gradient-to-r from-violet/[0.08] to-cyan/[0.05] p-6"
        >
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-violet to-purple p-3">
                <Zap size={22} className="text-white" />
              </div>
              <div>
                <h3
                  className="text-base font-semibold text-white"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  One-Time Setup &amp; Configuration
                </h3>
                <p className="mt-1 text-sm text-white/40">
                  Discovery call · Call flow design · Voice selection · Knowledge
                  base training · Integration setup · Go-live support
                </p>
              </div>
            </div>
            <span
              className="gradient-text text-4xl font-bold"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              $1,500
            </span>
          </div>
        </motion.div>

        {/* ── Pricing cards ──────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {pricingTiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={cardVariants}
              className={`glass-card group relative rounded-2xl p-8 ${
                tier.featured
                  ? "border-violet/40 bg-violet/[0.06] shadow-[0_0_40px_rgba(124,58,237,0.08)]"
                  : ""
              }`}
            >
              {/* Most Popular badge */}
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet to-cyan px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  Most Popular
                </span>
              )}

              {/* Tier name */}
              <p
                className={`text-xs font-bold uppercase tracking-[0.15em] ${
                  tier.featured ? "text-violet-300" : "text-white/35"
                }`}
              >
                {tier.name}
              </p>

              {/* Price */}
              <div className="mb-1 mt-2 flex items-baseline gap-0.5">
                <span
                  className={`relative -top-3 text-lg font-bold ${
                    tier.featured ? "gradient-text" : "text-white"
                  }`}
                >
                  $
                </span>
                <span
                  className={`text-5xl font-bold leading-none ${
                    tier.featured ? "gradient-text" : "text-white"
                  }`}
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {tier.price}
                </span>
                <span className="ml-1 text-sm text-white/30">/mo</span>
              </div>

              {/* Subtitle */}
              <p className="mb-4 text-sm text-white/35">{tier.subtitle}</p>

              {/* Divider */}
              <div className="mb-4 h-px bg-white/[0.06]" />

              {/* Feature list */}
              <ul className="mb-4 space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-2">
                    <Check
                      size={14}
                      className={`mt-0.5 shrink-0 ${
                        tier.featured ? "text-violet-400" : "text-cyan"
                      }`}
                    />
                    <span
                      className={`text-sm leading-snug ${
                        feature.highlight
                          ? "font-semibold text-white/80"
                          : "text-white/50"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Overage tag */}
              <span className="inline-block rounded-lg border border-cyan/25 bg-cyan/[0.08] px-3 py-1 text-xs font-semibold text-cyan-300">
                Overage: {tier.overage}
              </span>

              {/* Hover glow */}
              <div
                className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${
                  tier.featured ? "from-violet to-cyan" : "from-violet to-purple"
                } opacity-0 blur-xl transition-opacity group-hover:opacity-5`}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Multi-agent discounts ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 glass-card rounded-2xl p-6"
        >
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-violet to-purple p-3">
                <Users size={22} className="text-white" />
              </div>
              <div>
                <h3
                  className="text-base font-semibold text-white"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Need a second agent?
                </h3>
                <p className="mt-0.5 text-sm text-white/35">
                  Buy a second package at a discount.
                </p>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-3">
              {discountTiers.map((tier, i) => (
                <div
                  key={tier.label}
                  className={`px-4 py-2 text-center ${
                    i < discountTiers.length - 1
                      ? "border-r border-white/[0.06]"
                      : ""
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                    {tier.label}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      tier.gradient ? "gradient-text" : "text-white"
                    }`}
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {tier.value}
                  </p>
                  <p className="text-xs text-white/30">{tier.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Included / Management ──────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          {includedBoxes.map((box) => (
            <motion.div
              key={box.title}
              variants={cardVariants}
              className="glass-card group relative rounded-2xl p-6"
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${box.gradient} p-2.5`}
                >
                  <box.icon size={18} className="text-white" />
                </div>
                <h4
                  className="text-sm font-semibold text-white"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {box.title}
                </h4>
              </div>
              <p className="text-sm leading-relaxed text-white/40">
                {box.description}
              </p>

              {/* Hover glow */}
              <div
                className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${box.gradient} opacity-0 blur-xl transition-opacity group-hover:opacity-5`}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* ── ROI stats bar ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 rounded-2xl border border-violet/20 bg-gradient-to-r from-violet/[0.08] via-cyan/[0.05] to-pink/[0.04] p-6"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {roiStats.map((stat) => (
              <div key={stat.number} className="text-center">
                <p
                  className="gradient-text text-3xl font-bold"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {stat.number}
                </p>
                <p className="mt-1 text-sm text-white/40">{stat.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Footer note + CTA ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row"
        >
          <p className="text-xs text-white/25">
            All plans require a 6-month minimum commitment.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-sm font-semibold text-white/60">
              Ready to stop missing calls?
            </p>
            <a
              href="/#contact"
              className="rounded-full bg-gradient-to-r from-violet to-purple px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
            >
              Book a Discovery Call →
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

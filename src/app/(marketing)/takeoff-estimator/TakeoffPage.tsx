"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Upload,
  Lock,
  ClipboardCheck,
  FileSpreadsheet,
  Ruler,
  FileStack,
  Scale,
  ShieldCheck,
  Check,
  X,
  Building2,
  Boxes,
  ChevronDown,
  Eye,
  GitBranch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/admin/ContactForm";

/* ────────────────────────────────────────────────────────────────
   Content — every claim here is real, drawn from the validation
   work in takeoff-core / the client pilots. No fabricated stats,
   ratings, contractor counts, or pricing.
   ──────────────────────────────────────────────────────────────── */

const heroStats: { value: string; label: string }[] = [
  { value: "17 jobs", label: "Historical estimates run through blind validation" },
  { value: "2 estimators", label: "Independent AI takeoffs, cross-examined every time" },
  { value: "Evidence-linked", label: "No quantity without a source sheet and a rule" },
  { value: "Append-only", label: "Full audit trail on every review action" },
];

const marqueeItems = [
  "Any trade",
  "Rebar",
  "Structural steel",
  "Glazing",
  "Plumbing",
  "Electrical",
  "PDF plan sets",
  "Evidence-linked quantities",
  "Deterministic rules",
  "Blind validation",
  "Append-only audit trail",
  "Human-in-the-loop",
];

const differentiators: {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}[] = [
  {
    icon: GitBranch,
    title: "Blind, dual-estimator validation",
    description:
      "Two independent AI systems read the same drawing set and each produce a full takeoff and estimate — sealed with a commit before either is allowed to see the historical answer key. It's a blind test every time, not a demo tuned to look good.",
    gradient: "from-violet to-purple",
  },
  {
    icon: FileStack,
    title: "Evidence on every line",
    description:
      "Every proposed measurement carries its source sheet as evidence. Nothing enters the estimate without a sheet behind it and a rule that produced it — so every number is defensible after the bid is submitted.",
    gradient: "from-cyan to-blue-500",
  },
  {
    icon: Ruler,
    title: "AI proposes, the math is deterministic",
    description:
      "Counts, lengths, areas, spacing, and weights are calculated by versioned deterministic rules — rebar laps or glazing perimeters, same discipline. A language model proposes what it sees on the sheet; it never gets to invent the final number.",
    gradient: "from-pink to-rose-500",
  },
  {
    icon: ClipboardCheck,
    title: "A review workspace for estimators",
    description:
      "Scroll the plan set, approve or edit every extracted element, flag open questions, and acknowledge sheets with nothing in scope on them — with a complete, append-only audit trail behind every action.",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    icon: Scale,
    title: "The answer key gets cross-examined too",
    description:
      "Historical estimates aren't treated as gospel — a past estimator's assumptions can be wrong. Real disagreements get adjudicated, not averaged away, so validation makes the system sharper instead of just agreeable.",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    icon: ShieldCheck,
    title: "Every miss becomes a rule",
    description:
      "Corrections don't stay one-offs. Each miss becomes a documented, versioned rule the whole system inherits — so it gets stricter and more specific with every job instead of accumulating exceptions nobody remembers.",
    gradient: "from-fuchsia-500 to-violet",
  },
];

const processSteps: {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}[] = [
  {
    number: "01",
    icon: Upload,
    title: "Upload the plan set",
    description:
      "Drop in the PDF drawings and the scope. The plans are pre-processed — text and geometry extracted from every sheet — before anything is measured.",
    gradient: "from-violet to-purple",
  },
  {
    number: "02",
    icon: Lock,
    title: "Two AI estimators run blind",
    description:
      "Each independently produces a complete takeoff and estimate, sealed by a commit before either one is allowed to see a historical answer. Then they're cross-examined against each other and the record.",
    gradient: "from-cyan to-blue-500",
  },
  {
    number: "03",
    icon: Eye,
    title: "An estimator reviews every element",
    description:
      "In the review workspace, a human approves, edits, or flags each extracted element — every one linked to the sheet it came from — with an audit trail capturing the decision.",
    gradient: "from-pink to-rose-500",
  },
  {
    number: "04",
    icon: FileSpreadsheet,
    title: "Export a defensible estimate",
    description:
      "Quantities, lengths, and weights come out the far end — each traceable back to a source sheet and the versioned rule that produced it.",
    gradient: "from-emerald-400 to-teal-500",
  },
];

const comparisons: {
  category: string;
  oldWay: string;
  newWay: string;
}[] = [
  {
    category: "Reading the plan",
    oldWay:
      "An estimator scrolls PDF sheets by hand, traces the geometry, and counts and measures every element detail by detail.",
    newWay:
      "The system reads the full set and proposes every element — each one linked back to the exact sheet it was found on.",
  },
  {
    category: "The math",
    oldWay:
      "Quantities get keyed into an estimating system by hand; accuracy is only as good as whoever traced that sheet that day.",
    newWay:
      "Counts, lengths, areas, and weights are computed by versioned deterministic rules — consistent job to job, estimator to estimator.",
  },
  {
    category: "Defensibility",
    oldWay:
      "After the bid, it's hard to reconstruct why a number is what it is or which detail it came from.",
    newWay:
      "An append-only audit trail ties every quantity to a source sheet and a rule — defensible line by line.",
  },
  {
    category: "Getting better",
    oldWay:
      "Corrections are one-off fixes that live in someone's head and get re-learned on the next job.",
    newWay:
      "Every miss becomes a versioned rule the whole system inherits, so it gets stricter with each job.",
  },
];

const featuredTrades: {
  icon: LucideIcon;
  name: string;
  status: string;
  statusTone: "active" | "progress";
  note: string;
}[] = [
  {
    icon: Boxes,
    name: "Rebar & concrete accessories",
    status: "In validation",
    statusTone: "active",
    note: "The origin trade — validated job by job against real historical estimates.",
  },
  {
    icon: Building2,
    name: "Glazing & glass",
    status: "Early validation",
    statusTone: "progress",
    note: "The same method, instantiated for a second trade and being proven out.",
  },
];

// The method underneath is trade-agnostic — these are a rulebook away,
// built to order for a specific estimator's shop.
const moreTrades: string[] = [
  "Structural steel",
  "HVAC & mechanical",
  "Plumbing & piping",
  "Electrical",
  "Masonry",
  "Demolition",
  "Earthwork",
  "Roofing",
  "Flooring",
  "Painting",
  "Concrete flatwork",
  "Utility & civil",
  "Landscape & irrigation",
  "Paving",
];

const faqs: { id: string; question: string; answer: string }[] = [
  {
    id: "live",
    question: "Is this live software I can log into today?",
    answer:
      "It's in active validation. We're proving the estimating logic against real historical jobs before it ever touches a live bid — so instead of a signup page, early partners work with us hands-on while the system earns its trust job by job.",
  },
  {
    id: "trades",
    question: "What trades does it cover?",
    answer:
      "Rebar and concrete accessories first — that's where the deepest validation lives. Glazing is in early validation, and the underlying method (plan pre-processing, a rules engine, a review workspace, and an audit trail) is trade-agnostic, so new trades are a matter of building out the rulebook.",
  },
  {
    id: "vs-bluebeam",
    question: "How is this different from Bluebeam, PlanSwift, or aSa?",
    answer:
      "Those are where estimators trace and key quantities by hand today — whatever your trade uses. This reads the plan set, proposes every element with its source sheet attached, and computes quantities with deterministic rules — with a human approving or editing each one. It's meant to make that existing workflow faster and more defensible, not to be a black box that replaces the estimator.",
  },
  {
    id: "trust",
    question: "Can I trust the numbers?",
    answer:
      "Every quantity traces back to a source sheet and a versioned rule, and two independent AI takeoffs are cross-examined before either one sees the historical answer. The whole design is built around one line: AI proposes; the estimator decides.",
  },
  {
    id: "invent",
    question: "Does the AI just make up quantities?",
    answer:
      "No. A language model proposes what it sees on the drawing, but counts, lengths, areas, and weights are calculated by versioned deterministic rules — the model never produces the final number itself.",
  },
  {
    id: "start",
    question: "What do you need from me to get started?",
    answer:
      "A plan set and a handful of historical estimates for the same trade. We run the system against those real jobs and adjudicate every disagreement before anything you'd bid on goes live.",
  },
];

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

const toneStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400",
  progress: "bg-amber-500/10 text-amber-400",
  roadmap: "bg-white/[0.06] text-white/50",
};

export default function TakeoffPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6 pt-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-slow absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet/20 blur-[128px]" />
          <div className="animate-float absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-cyan/15 blur-[128px]" />
          <div className="animate-pulse-glow absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-pink/10 blur-[128px]" />
        </div>
        <div className="grid-pattern pointer-events-none absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-6 inline-block rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-violet-400"
          >
            AI Takeoff &amp; Estimating · In Development
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <span className="gradient-text">AI takeoffs and estimates.</span>
            <br />
            <span className="text-white">Bid more. Spend less.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl"
          >
            Accurate quantities in a fraction of the time. AI reads the plan set
            and builds the takeoff — so you bid more jobs, cut hours off every
            estimate, and carry less overhead. For any trade that works off a
            set of plans.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <a
              href="#contact"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet to-purple px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
            >
              <span className="relative z-10">Get on a discovery call</span>
              <ArrowRight
                size={18}
                className="relative z-10 transition-transform group-hover:translate-x-1"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple to-cyan opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
            <Link
              href="/work/takeoff-estimator"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-semibold text-white/80 transition-all hover:border-white/20 hover:text-white"
            >
              See the validation story
            </Link>
          </motion.div>

          {/* Hero stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.95 }}
            className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
          >
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="glass-card rounded-2xl p-5 text-center"
              >
                <p
                  className="gradient-text mb-1 text-2xl font-bold sm:text-3xl"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {stat.value}
                </p>
                <p className="text-xs leading-snug text-white/40">
                  {stat.label}
                </p>
              </div>
            ))}
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
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
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

      {/* ── Differentiators ──────────────────────────────────────── */}
      <section id="how" className="relative px-6 py-24">
        <div className="pointer-events-none absolute left-0 top-1/4 h-[600px] w-[600px] rounded-full bg-violet/5 blur-[128px]" />
        <div className="pointer-events-none absolute bottom-1/4 right-0 h-[500px] w-[500px] rounded-full bg-cyan/5 blur-[128px]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-violet-400">
              Why it&apos;s built this way
            </span>
            <h2
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Fast <span className="gradient-text">without losing</span> the
              defensibility
            </h2>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/50">
              An estimate has to survive scrutiny after the bid. So the speed
              comes from AI reading the sheets — and the trust comes from rules,
              evidence, and a human who has the final say.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {differentiators.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={cardVariants}
                  className="glass-card group relative overflow-hidden rounded-2xl p-8"
                >
                  <div
                    className={`mb-5 inline-flex rounded-xl bg-gradient-to-br ${item.gradient} p-3`}
                  >
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/50">
                    {item.description}
                  </p>
                  <div
                    className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${item.gradient} opacity-0 blur-xl transition-opacity group-hover:opacity-[0.07]`}
                  />
                </motion.div>
              );
            })}
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
              How it runs
            </span>
            <h2
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Plan set in.{" "}
              <span className="gradient-text">Defensible estimate out.</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              Four steps, with a human in the middle of the two that matter
              most.
            </p>
          </motion.div>

          <div className="relative mx-auto max-w-4xl">
            <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-violet/50 via-cyan/50 to-pink/50 md:left-1/2 md:block" />
            <div className="space-y-16">
              {processSteps.map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                      duration: 0.7,
                      delay: idx * 0.1,
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
                      <p className="text-base text-white/50">
                        {step.description}
                      </p>
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

          <p className="mx-auto mt-14 max-w-xl text-center text-sm text-white/30">
            Still in validation — proven against historical jobs before it
            touches a live bid.
          </p>
        </div>
      </section>

      {/* ── Workspace showcase (placeholder mockups) ─────────────── */}
      <section id="workspace" className="relative overflow-hidden px-6 py-24">
        <div className="pointer-events-none absolute left-1/4 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-violet/5 blur-[128px]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-cyan-400">
              Inside the workspace
            </span>
            <h2
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Where the estimator{" "}
              <span className="gradient-text">stays in control</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              The plan set on one side, every extracted element on the other —
              each linked to its evidence and computed by a rule you can name.
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Review workspace mock */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="glass-card overflow-hidden rounded-2xl p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Review workspace
                  </p>
                  <p className="text-xs text-white/40">
                    Approve, edit, or flag every element
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  Audit trail on
                </span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {/* Faux plan viewer */}
                <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="mb-2 text-[10px] uppercase tracking-widest text-white/30">
                    Sheet A-201
                  </p>
                  <svg
                    viewBox="0 0 120 150"
                    className="h-auto w-full"
                    aria-hidden="true"
                  >
                    <rect
                      x="6"
                      y="6"
                      width="108"
                      height="138"
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                    />
                    <line x1="6" y1="46" x2="114" y2="46" stroke="rgba(6,182,212,0.5)" />
                    <line x1="6" y1="92" x2="114" y2="92" stroke="rgba(6,182,212,0.5)" />
                    {Array.from({ length: 10 }).map((_, i) => (
                      <line
                        key={i}
                        x1={14 + i * 10}
                        y1="46"
                        x2={14 + i * 10}
                        y2="92"
                        stroke="rgba(124,58,237,0.45)"
                      />
                    ))}
                    <rect
                      x="30"
                      y="60"
                      width="30"
                      height="18"
                      fill="none"
                      stroke="rgba(244,114,182,0.6)"
                      strokeDasharray="3 2"
                    />
                  </svg>
                </div>
                {/* Faux element list */}
                <div className="col-span-3 space-y-2">
                  {[
                    { label: "Element A-12", detail: "run · 412 lf", ok: true },
                    { label: "Assembly W-2", detail: "face · 268 sf", ok: true },
                    { label: "Connector C-4", detail: "typ. · 96 ea", ok: false },
                    { label: "Corner detail D-1", detail: "std · 48 ea", ok: true },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-white/80">
                          {row.label}
                        </p>
                        <p className="truncate text-[10px] text-white/40">
                          {row.detail} · A-201
                        </p>
                      </div>
                      {row.ok ? (
                        <Check
                          size={14}
                          className="shrink-0 text-emerald-400"
                        />
                      ) : (
                        <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-medium text-amber-400">
                          Flagged
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-[11px] italic text-white/25">
                Representative UI · real screenshots on request
              </p>
            </motion.div>

            {/* Estimate export mock */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-card overflow-hidden rounded-2xl p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Estimate export
                  </p>
                  <p className="text-xs text-white/40">
                    Every quantity carries its evidence
                  </p>
                </div>
                <span className="rounded-full bg-violet/15 px-3 py-1 text-xs font-medium text-violet-300">
                  Traceable
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-[1.6fr_0.7fr_0.7fr_1fr] bg-white/[0.04] px-3 py-2 text-[10px] uppercase tracking-wider text-white/40">
                  <span>Item</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Unit</span>
                  <span className="text-right">Source</span>
                </div>
                {[
                  { item: "Element A-12 — run", qty: "412", wt: "lf", src: "A-201" },
                  { item: "Assembly W-2 — face", qty: "268", wt: "sf", src: "A-202" },
                  { item: "Connector C-4 — typ.", qty: "96", wt: "ea", src: "A-201" },
                  { item: "Accessory set — zone 3", qty: "540", wt: "ea", src: "A-410" },
                  { item: "Corner detail D-1", qty: "48", wt: "ea", src: "A-202" },
                ].map((row) => (
                  <div
                    key={row.item}
                    className="grid grid-cols-[1.6fr_0.7fr_0.7fr_1fr] items-center border-t border-white/5 px-3 py-2 text-xs"
                  >
                    <span className="truncate text-white/80">{row.item}</span>
                    <span className="text-right text-white/60">{row.qty}</span>
                    <span className="text-right text-white/60">{row.wt}</span>
                    <span className="text-right">
                      <span className="rounded bg-cyan/10 px-1.5 py-0.5 text-[10px] text-cyan-300">
                        {row.src}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] italic text-white/25">
                Representative data · rule IDs attach to each line in the real
                export
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Old way vs. here ─────────────────────────────────────── */}
      <section id="compare" className="relative px-6 py-24">
        <div className="pointer-events-none absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan/5 blur-[128px]" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-cyan-400">
              What changes
            </span>
            <h2
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              The old way{" "}
              <span className="gradient-text">vs. the way it works here</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              Same estimator judgment. Less hand-tracing, and a paper trail
              behind every number.
            </p>
          </motion.div>

          <div className="space-y-4">
            {comparisons.map((item, idx) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="glass-card grid grid-cols-1 overflow-hidden rounded-2xl md:grid-cols-[auto_1fr_1fr]"
              >
                <div className="flex items-center border-b border-white/5 bg-white/[0.02] p-6 md:border-b-0 md:border-r">
                  <p className="text-sm font-semibold uppercase tracking-widest text-white/40 md:w-40">
                    {item.category}
                  </p>
                </div>
                <div className="border-b border-white/5 p-6 md:border-b-0 md:border-r">
                  <div className="mb-2 flex items-center gap-2">
                    <X size={15} className="text-red-400/70" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-400/70">
                      Manual today
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/50">
                    {item.oldWay}
                  </p>
                </div>
                <div className="p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <Check size={15} className="text-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Here
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/70">
                    {item.newWay}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mt-16 max-w-2xl text-center"
          >
            <p
              className="gradient-text text-3xl font-bold sm:text-4xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              &ldquo;AI proposes; the estimator decides.&rdquo;
            </p>
          </motion.blockquote>
        </div>
      </section>

      {/* ── Trades ───────────────────────────────────────────────── */}
      <section id="trades" className="relative px-6 py-20">
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-14 text-center"
          >
            <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-violet-400">
              Trades
            </span>
            <h2
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Rebar first,{" "}
              <span className="gradient-text">built to travel</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              We go deep on one trade at a time. The engine underneath — plan
              pre-processing, a rules registry, the review workspace, the audit
              trail — is trade-agnostic, so a new trade is a rulebook, not a
              rewrite.
            </p>
          </motion.div>

          {/* Featured trades */}
          <div className="mb-10 grid gap-6 md:grid-cols-2">
            {featuredTrades.map((trade, idx) => {
              const Icon = trade.icon;
              return (
                <motion.div
                  key={trade.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="glass-card rounded-2xl p-8"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="inline-flex rounded-xl bg-white/[0.05] p-3">
                      <Icon size={22} className="text-white/80" />
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${toneStyles[trade.statusTone]}`}
                    >
                      {trade.status}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {trade.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/50">
                    {trade.note}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Build-on-request grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-2xl p-8"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">
                Built on request
              </p>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/50">
                Scoped to your shop
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {moreTrades.map((trade) => (
                <div
                  key={trade}
                  className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet/60" />
                  <span className="text-sm text-white/70">{trade}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-white/40">
              Don&apos;t see your trade?{" "}
              <a
                href="#contact"
                className="text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
              >
                Tell us what you estimate
              </a>{" "}
              — if it&apos;s on a plan set, the method fits.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Engagement (in place of pricing) ─────────────────────── */}
      <section id="engagement" className="relative px-6 py-20">
        <div className="pointer-events-none absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-violet/8 blur-[128px]" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-3xl p-10 text-center sm:p-14"
          >
            <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-cyan-400">
              How we work
            </span>
            <h2
              className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              No signup page.{" "}
              <span className="gradient-text">A validation partnership.</span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-white/60">
              We take on a trade, run the system against your real historical
              jobs, and adjudicate every disagreement — and it only goes near a
              live bid once the numbers hold up. Pricing is scoped to the trade
              and the work, not a shelf plan.
            </p>
            <div className="mb-10 grid gap-4 text-left sm:grid-cols-3">
              {[
                "Bring a plan set + a few historical estimates",
                "We validate blind against your real jobs",
                "Go live only when it earns your trust",
              ].map((step, i) => (
                <div
                  key={step}
                  className="rounded-xl border border-white/8 bg-white/[0.02] p-5"
                >
                  <p className="gradient-text mb-2 text-lg font-bold">
                    {i + 1}
                  </p>
                  <p className="text-sm text-white/60">{step}</p>
                </div>
              ))}
            </div>
            <a
              href="#contact"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet to-purple px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
            >
              <span className="relative z-10">Talk to us about your trade</span>
              <ArrowRight
                size={18}
                className="relative z-10 transition-transform group-hover:translate-x-1"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple to-cyan opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section id="faq" className="relative px-6 py-20">
        <div className="relative z-10 mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-pink-400">
              FAQ
            </span>
            <h2
              className="text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              The honest <span className="gradient-text">questions</span>
            </h2>
          </motion.div>
          <FaqList items={faqs} />
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
            <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-violet-400">
              Get on a call
            </span>
            <h2
              className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              See it run{" "}
              <span className="gradient-text">on your jobs</span>
            </h2>
            <p className="mx-auto max-w-xl text-lg text-white/50">
              Bring a plan set and a few historical estimates. We&apos;ll show
              you the takeoff — and the evidence behind every number.
            </p>
          </div>
          <div className="glass-card rounded-2xl p-8">
            <ContactForm />
          </div>
          <p className="mt-4 text-center text-sm text-white/30">
            We validate against your real jobs before anything touches a live
            bid.
          </p>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}

/* ── Local FAQ accordion ────────────────────────────────────────── */
function FaqList({
  items,
}: {
  items: { id: string; question: string; answer: string }[];
}) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="glass-card divide-y divide-white/[0.06] rounded-2xl">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="px-6">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="text-base font-medium text-white/90 sm:text-lg">
                {item.question}
              </span>
              <ChevronDown
                size={20}
                className={`shrink-0 text-violet-400 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 text-sm leading-relaxed text-white/50 sm:text-base">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

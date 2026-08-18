"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  ChevronDown,
  Eye,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Printer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/admin/ContactForm";

/* ────────────────────────────────────────────────────────────────
   Content — every claim here is real, drawn from the shipped product
   and delivered reviews. No client names, no fabricated stats,
   ratings, contractor counts, or pricing.
   ──────────────────────────────────────────────────────────────── */

const heroStats: { value: string; label: string }[] = [
  { value: "Evidence-linked", label: "No quantity without a source sheet and a rule" },
  { value: "2 AI estimators", label: "Independent takeoffs, cross-checked on every job" },
  { value: "Same-day", label: "Turnaround on a full takeoff review" },
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
  "Independent cross-check",
  "Same-day turnaround",
  "Append-only audit trail",
  "Human-in-the-loop",
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


// One trade-agnostic engine; each trade brings its own rulebook.
const supportedTrades: string[] = [
  "Rebar & concrete accessories",
  "Structural steel",
  "Glazing & glass",
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
    question: "Is this a working product or a concept?",
    answer:
      "It's a working product. There's a live review workspace where a plan set is read, every extracted element is checked against the sheet it came from, and a takeoff comes out with an audit trail behind every number. We onboard you to your trade and standards rather than pointing you at a generic signup — but the software is real and running today.",
  },
  {
    id: "trades",
    question: "What trades does it cover?",
    answer:
      "Rebar and concrete accessories today, with glazing rolling out. The engine underneath — plan pre-processing, a rules registry, a review workspace, and an audit trail — is trade-agnostic, so a new trade is a matter of building out the rulebook, not a rewrite.",
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
      "Every quantity traces back to a source sheet and a versioned rule, two independent AI takeoffs are cross-checked against each other, and an estimator approves every line. The whole design is built around one line: AI proposes; the estimator decides.",
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
      "A plan set and a few of your past estimates for the trade. We fit the rules to your shop's standards, then you're taking off live jobs with a source sheet and a rule behind every line.",
  },
];




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
            AI Takeoff &amp; Estimating Software
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
              href="#workspace"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-semibold text-white/80 transition-all hover:border-white/20 hover:text-white"
            >
              See the deliverable
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
              The deliverable
            </span>
            <h2
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              A report you can{" "}
              <span className="gradient-text">price straight off</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              Your reviewed estimate on one side, the findings that matter on
              the other — hover a flag and the exact schedule lines light up.
              Every number traces to its sheet; every flag lands on a line.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <ReportMock />
          </motion.div>
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
              Every trade that{" "}
              <span className="gradient-text">works off a plan set</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              Rebar, structural steel, glazing, mechanical, electrical — if
              it&apos;s counted and measured off a drawing set, the engine takes
              it off. Plan pre-processing, the rules registry, the review
              workspace, and the audit trail stay the same; each trade brings
              its own rulebook.
            </p>
          </motion.div>

          {/* Trades grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-2xl p-8"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">
                Trades the engine handles
              </p>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/50">
                One trade-agnostic core
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {supportedTrades.map((trade) => (
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
              Not shelf software.{" "}
              <span className="gradient-text">Fitted to your shop.</span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-white/60">
              We tune the rules registry to your trade and your standards,
              point it at your plan sets, and you&apos;re running takeoffs with
              a source sheet and a rule behind every number. Pricing is scoped
              to the trade and the volume, not a shelf plan.
            </p>
            <div className="mb-10 grid gap-4 text-left sm:grid-cols-3">
              {[
                "Bring a plan set + a few of your estimates",
                "We fit the rules to your trade and standards",
                "You run takeoffs with evidence on every line",
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
            Every quantity comes back tied to a source sheet and the rule that
            produced it.
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

/* ── Faithful mock of the published interactive report ──────────────
   Mirrors the real deliverable's structure — verdict banner, aSa-style
   schedule, and a findings rail hover-synced to the line rows both ways,
   with an APPROVED stamp. Sample data only; no client job. */
type MockLine = {
  ln: number;
  seg: string;
  mark: string;
  func: string;
  size: string;
  qty: number;
  length: string;
  lb: number;
};

type MockFinding = {
  id: string;
  kind: "finding" | "question" | "confirmation";
  severity?: "high" | "medium" | "low";
  lbNote?: string;
  title: string;
  body: string;
  lines: number[];
};

const mockLines: MockLine[] = [
  { ln: 1, seg: "Footings", mark: "F1", func: "cont.", size: "#5", qty: 24, length: "40'-0\"", lb: 1001 },
  { ln: 2, seg: "Footings", mark: "F1", func: "dowel", size: "#4", qty: 96, length: "2'-6\"", lb: 160 },
  { ln: 3, seg: "Walls", mark: "W1", func: "vert.", size: "#5", qty: 148, length: "12'-0\"", lb: 1851 },
  { ln: 4, seg: "Walls", mark: "W1", func: "horiz.", size: "#4", qty: 64, length: "40'-0\"", lb: 1708 },
  { ln: 5, seg: "Slab-on-grade", mark: "S1", func: "mat", size: "#4", qty: 210, length: "20'-0\"", lb: 2803 },
  { ln: 6, seg: "Slab-on-grade", mark: "S1", func: "edge", size: "#5", qty: 36, length: "20'-0\"", lb: 751 },
];

const mockFindings: MockFinding[] = [
  {
    id: "f1",
    kind: "finding",
    severity: "high",
    lbNote: "+1,600 lb",
    title: "W1 verticals keyed at 12\" — elevation calls 6\" o.c.",
    body: "Halving the spacing roughly doubles the W1 vertical count. Worth confirming before the number is priced.",
    lines: [3],
  },
  {
    id: "q1",
    kind: "question",
    lbNote: "≈2,800 lb",
    title: "Is the slab mat in your scope?",
    body: "S1 is the single biggest line — confirm it's yours to furnish and not the GC's.",
    lines: [5],
  },
  {
    id: "c1",
    kind: "confirmation",
    title: "Footing F1 laps check out",
    body: "Class B laps on the #5 top bars match the 40-bar-diameter rule for the keyed f'c.",
    lines: [1, 2],
  },
];

const findingKindMeta: Record<
  MockFinding["kind"],
  { label: string; icon: LucideIcon; accent: string; chip: string }
> = {
  finding: {
    label: "Worth fixing",
    icon: AlertTriangle,
    accent: "text-amber-400",
    chip: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  },
  question: {
    label: "Question for you",
    icon: HelpCircle,
    accent: "text-sky-400",
    chip: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  },
  confirmation: {
    label: "Checked and clean",
    icon: CheckCircle2,
    accent: "text-emerald-400",
    chip: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
};

const severityBadge: Record<"high" | "medium" | "low", string> = {
  high: "border-rose-500/50 bg-rose-500/10 text-rose-300",
  medium: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  low: "border-sky-500/50 bg-sky-500/10 text-sky-300",
};

type Hover = { type: "line"; id: number } | { type: "finding"; id: string } | null;

function ReportMock() {
  const [hover, setHover] = useState<Hover>(null);
  const totalLb = mockLines.reduce((sum, l) => sum + l.lb, 0);
  const segments = mockLines.reduce<string[]>((acc, l) => {
    if (!acc.includes(l.seg)) acc.push(l.seg);
    return acc;
  }, []);

  const lineActive = (ln: number) =>
    hover?.type === "line"
      ? hover.id === ln
      : hover?.type === "finding"
        ? (mockFindings.find((f) => f.id === hover.id)?.lines.includes(ln) ?? false)
        : false;

  const findingActive = (f: MockFinding) =>
    hover?.type === "finding"
      ? hover.id === f.id
      : hover?.type === "line"
        ? f.lines.includes(hover.id)
        : false;

  return (
    <div className="glass-card relative overflow-hidden rounded-2xl">
      {/* APPROVED stamp */}
      <div className="pointer-events-none absolute right-4 top-14 z-20 rotate-[-9deg] sm:right-8">
        <span className="inline-block rounded-md border-2 border-emerald-400/60 px-3 py-1 text-lg font-extrabold uppercase tracking-widest text-emerald-400/70">
          Approved
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Reviewed estimate</p>
            <p className="text-[11px] text-white/40">Sample project · 6 lines</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60">
            <Eye size={13} /> View plans
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60">
            <Printer size={13} /> Print
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* Verdict banner */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="size-3 shrink-0 rounded-full bg-amber-400" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                Priceable — two items to resolve first
              </p>
              <p className="text-xs text-white/45">
                Nothing here blocks a bid; two flags move real weight.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium tabular-nums">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-white/50">
              6 lines reviewed
            </span>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-300">
              1 to fix
            </span>
            <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-sky-300">
              1 question
            </span>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
              1 confirmed correct
            </span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          {/* aSa-style schedule */}
          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="grid grid-cols-[2rem_1fr_2rem_2.2rem_3.4rem_3.6rem] gap-1 bg-white/[0.04] px-3 py-2 text-[10px] uppercase tracking-wider text-white/40">
              <span>Ln</span>
              <span>Mark</span>
              <span>Size</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Length</span>
              <span className="text-right">Weight</span>
            </div>
            {segments.map((seg) => (
              <div key={seg}>
                <div className="border-t border-white/5 bg-white/[0.015] px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">
                  {seg}
                </div>
                {mockLines
                  .filter((l) => l.seg === seg)
                  .map((l) => {
                    const active = lineActive(l.ln);
                    return (
                      <div
                        key={l.ln}
                        onMouseEnter={() => setHover({ type: "line", id: l.ln })}
                        onMouseLeave={() => setHover(null)}
                        className={`grid cursor-default grid-cols-[2rem_1fr_2rem_2.2rem_3.4rem_3.6rem] gap-1 border-t border-white/5 px-3 py-1.5 text-xs tabular-nums transition-colors ${
                          active ? "bg-cyan/10" : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <span className="text-white/35">{l.ln}</span>
                        <span className="truncate text-white/80">
                          {l.mark}{" "}
                          <span className="text-white/40">{l.func}</span>
                        </span>
                        <span className="text-white/60">{l.size}</span>
                        <span className="text-right text-white/60">{l.qty}</span>
                        <span className="text-right text-white/50">{l.length}</span>
                        <span className="text-right font-medium text-white/80">
                          {l.lb.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ))}
            <div className="grid grid-cols-[2rem_1fr_2rem_2.2rem_3.4rem_3.6rem] gap-1 border-t border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold tabular-nums">
              <span className="col-span-4 text-white/50">Total</span>
              <span className="text-right text-white/40">6 ln</span>
              <span className="gradient-text text-right">
                {totalLb.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Findings rail */}
          <div className="space-y-3">
            {mockFindings.map((f) => {
              const meta = findingKindMeta[f.kind];
              const Icon = meta.icon;
              const active = findingActive(f);
              return (
                <div
                  key={f.id}
                  onMouseEnter={() => setHover({ type: "finding", id: f.id })}
                  onMouseLeave={() => setHover(null)}
                  className={`cursor-default rounded-xl border p-3.5 transition-colors ${
                    active
                      ? "border-cyan/40 bg-cyan/[0.06]"
                      : "border-white/8 bg-white/[0.02]"
                  }`}
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Icon size={13} className={meta.accent} />
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${meta.accent}`}
                    >
                      {meta.label}
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                      {f.lbNote ? (
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${meta.chip}`}
                        >
                          {f.lbNote}
                        </span>
                      ) : null}
                      {f.kind === "finding" && f.severity ? (
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${severityBadge[f.severity]}`}
                        >
                          {f.severity}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-snug text-white/85">
                    {f.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/45">
                    {f.body}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {f.lines.map((ln) => (
                      <span
                        key={ln}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums transition-colors ${
                          lineActive(ln)
                            ? "bg-cyan/20 text-cyan-200"
                            : "bg-white/[0.05] text-white/50"
                        }`}
                      >
                        Ln {ln}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-[11px] italic text-white/25">
          Representative of the published report · sample data · hover a finding
          to light up its schedule lines
        </p>
      </div>
    </div>
  );
}

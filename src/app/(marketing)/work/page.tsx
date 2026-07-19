import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CaseStudyGrid from "@/components/work/CaseStudyGrid";
import { caseStudies } from "@/data/case-studies";

export const metadata: Metadata = {
  title: "Case Studies — Triple 3 Labs",
  description:
    "Real AI agents and systems running in production today — voice agents, booking platforms, dynamic pricing, and more, built for real businesses (most of them our own).",
};

const alsoBuilt = [
  {
    title: "Spam Slayer",
    description: "A multi-tenant IMAP spam filter with a hybrid rules-plus-AI pipeline that thinks before it quarantines.",
    blogSlug: "building-spam-slayer",
  },
];

export default function WorkPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />
      <div className="pt-28" />

      {/* Header */}
      <section className="relative px-6 pb-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-violet/10 blur-[128px]" />
          <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan/5 blur-[128px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-violet-400">
            Case Studies
          </span>
          <h1
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Real systems. <span className="gradient-text">Running in real businesses.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            Every system below is live in production today — most of them in
            our own companies first. We build for ourselves before we build
            for you, so we know exactly what breaks and what doesn&apos;t.
          </p>

          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: "12+", label: "Systems in production" },
              { value: "2", label: "Voice agents on the phones 24/7" },
              { value: "75", label: "Properties priced nightly" },
              { value: "6", label: "Companies running these systems" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p
                  className="text-3xl font-bold gradient-text"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="relative px-6 py-12">
        <CaseStudyGrid caseStudies={caseStudies} />
      </section>

      {/* Also built */}
      <section className="relative px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-white/30">
            Also built
          </p>
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            {alsoBuilt.map((item) => (
              <Link
                key={item.blogSlug}
                href={`/blog/${item.blogSlug}`}
                className="glass-card group flex items-start justify-between gap-4 rounded-2xl p-6"
              >
                <div>
                  <h3
                    className="mb-1 text-base font-bold text-white transition-colors group-hover:text-violet-300"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/50">
                    {item.description}
                  </p>
                </div>
                <ArrowUpRight
                  size={18}
                  className="mt-1 flex-shrink-0 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-violet-400"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-violet/10 blur-[128px]" />
          <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-cyan/10 blur-[128px]" />
        </div>

        <div className="glass-card relative z-10 mx-auto max-w-2xl rounded-2xl p-10 text-center">
          <h2
            className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Want something like this{" "}
            <span className="gradient-text">for your business?</span>
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-white/50">
            Tell us about your business and we&apos;ll show you exactly where
            a system like these fits — no pressure, no jargon.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/#contact"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet to-purple px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
            >
              Get Your Free AI Assessment
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/faq"
              className="rounded-full border border-white/10 px-8 py-4 text-base font-semibold text-white/80 transition-all hover:border-violet/40 hover:text-white"
            >
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

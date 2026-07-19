import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { caseStudies, getBySlug } from "@/data/case-studies";

export function generateStaticParams() {
  return caseStudies.map((caseStudy) => ({ slug: caseStudy.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getBySlug(slug);

  if (!caseStudy) {
    return { title: "Case Study — Triple 3 Labs" };
  }

  const title = `${caseStudy.title} — Triple 3 Labs`;
  return {
    title,
    description: caseStudy.summary,
    openGraph: {
      title,
      description: caseStudy.summary,
      url: `https://triple3labs.io/work/${caseStudy.slug}`,
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = getBySlug(slug);

  if (!caseStudy) {
    notFound();
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />
      <div className="pt-28" />

      {/* Hero */}
      <section className="relative px-6 pb-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-violet/10 blur-[128px]" />
          <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan/5 blur-[128px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl">
          <Link
            href="/work"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-white/40 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} />
            All case studies
          </Link>

          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full bg-gradient-to-r ${caseStudy.gradient} px-3 py-1 font-semibold text-white`}
            >
              {caseStudy.industry}
            </span>
            <span className="text-white/40">{caseStudy.client}</span>
            {caseStudy.inDevelopment && (
              <span className="rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-400">
                In Development
              </span>
            )}
          </div>

          {caseStudy.inDevelopment && (
            <p className="mb-4 max-w-2xl text-sm leading-relaxed text-amber-300/70">
              This one&apos;s still being built and validated — not yet a finished, shipped
              system. We&apos;re showing the process, not claiming it&apos;s done.
            </p>
          )}

          <h1
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            {caseStudy.title}
          </h1>

          <p className="mb-6 max-w-2xl text-lg text-white/50">
            {caseStudy.summary}
          </p>

          <div className="flex flex-wrap gap-2">
            {caseStudy.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* The Challenge */}
      <section className="relative px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-white/30">
            The Challenge
          </span>
          <div className="space-y-4">
            {caseStudy.challenge.map((paragraph, idx) => (
              <p key={idx} className="text-lg leading-relaxed text-white/60">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* What We Built */}
      <section className="relative px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-white/30">
            What We Built
          </span>
          <p className="mb-6 text-lg leading-relaxed text-white/60">
            {caseStudy.solution.intro}
          </p>
          <ul className="space-y-4">
            {caseStudy.solution.bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 flex-shrink-0 text-violet-400"
                />
                <span className="leading-relaxed text-white/60">{bullet}</span>
              </li>
            ))}
          </ul>

          {/* Stack chips */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
              The Stack
            </p>
            <div className="flex flex-wrap gap-2">
              {caseStudy.stack.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/60"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="relative px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <span className="mb-6 inline-block text-sm font-medium uppercase tracking-widest text-white/30">
            Results
          </span>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {caseStudy.results.map((result) => (
              <div
                key={result.label}
                className="glass-card rounded-2xl p-5 text-center"
              >
                <p
                  className="mb-1 text-2xl font-bold gradient-text"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {result.value}
                </p>
                <p className="text-xs leading-snug text-white/40">
                  {result.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pull quote */}
      {caseStudy.pullQuote && (
        <section className="relative px-6 py-10">
          <div className="mx-auto max-w-2xl">
            <blockquote className="glass-card relative overflow-hidden rounded-2xl border-l-4 border-l-violet-500/50 p-8">
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${caseStudy.gradient} opacity-[0.06]`}
              />
              <p className="relative z-10 text-xl font-medium italic leading-relaxed text-white/80">
                &ldquo;{caseStudy.pullQuote}&rdquo;
              </p>
            </blockquote>
          </div>
        </section>
      )}

      {/* Read full story */}
      {caseStudy.blogSlug && (
        <section className="relative px-6 py-10 text-center">
          <Link
            href={`/blog/${caseStudy.blogSlug}`}
            className="inline-flex items-center gap-1.5 text-base font-medium text-violet-400 transition-all hover:gap-2.5"
          >
            {caseStudy.blogLinkLabel ?? "Read the full build story"}
            <ArrowRight size={16} />
          </Link>
        </section>
      )}

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
            a system like this fits — no pressure, no jargon.
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
              href="/work"
              className="rounded-full border border-white/10 px-8 py-4 text-base font-semibold text-white/80 transition-all hover:border-violet/40 hover:text-white"
            >
              More case studies
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CaseStudy } from "@/data/case-studies";

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

export default function CaseStudyGrid({
  caseStudies,
}: {
  caseStudies: CaseStudy[];
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2"
    >
      {caseStudies.map((caseStudy) => (
        <motion.div key={caseStudy.slug} variants={cardVariants}>
          <Link href={`/work/${caseStudy.slug}`} className="group block h-full">
            <article className="glass-card relative flex h-full flex-col overflow-hidden rounded-2xl p-8">
              <div
                className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${caseStudy.gradient} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-[0.07]`}
              />

              <div className="relative z-10 flex flex-1 flex-col">
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

                <h2
                  className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-violet-300"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {caseStudy.title}
                </h2>

                <p className="mb-6 flex-1 leading-relaxed text-white/50">
                  {caseStudy.summary}
                </p>

                <div className="mb-6 grid grid-cols-2 gap-3">
                  {caseStudy.results.slice(0, 2).map((result) => (
                    <div
                      key={result.label}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
                    >
                      <p
                        className="gradient-text text-lg font-bold"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {result.value}
                      </p>
                      <p className="mt-1 text-xs leading-snug text-white/40">
                        {result.label}
                      </p>
                    </div>
                  ))}
                </div>

                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-400 transition-all group-hover:gap-2.5">
                  Read case study
                  <ArrowRight size={14} />
                </span>
              </div>
            </article>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}

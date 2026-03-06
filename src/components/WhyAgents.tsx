"use client";

import { motion } from "framer-motion";

export default function WhyAgents() {
  return (
    <section className="relative pt-8 pb-16 px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet mb-6">
            The unfair advantage
          </p>
          <h2
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <span className="text-white">Your best employee</span>
            <br />
            <span className="gradient-text">never quits.</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/50 leading-relaxed">
            <span className="text-white font-semibold">Zero</span> turnover.{" "}
            <span className="text-white font-semibold">Zero</span> training costs.{" "}
            <span className="text-white font-semibold">100%</span> consistency.{" "}
            <span className="text-white font-semibold">24/7</span> availability.
            Our <span className="text-white font-semibold">AI agents</span> show up every single day and deliver top-tier performance — no exceptions.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

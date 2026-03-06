"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-float-slow absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet/20 blur-[128px]" />
        <div className="animate-float absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-cyan/15 blur-[128px]" />
        <div className="animate-pulse-glow absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-pink/10 blur-[128px]" />
      </div>

      {/* Grid pattern overlay */}
      <div className="grid-pattern pointer-events-none absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet/30 bg-violet/10 px-4 py-1.5 text-sm text-violet-300"
        >
          <Sparkles size={14} />
          AI-Powered Business Transformation
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          <span className="gradient-text">Triple 3 Labs</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-6 max-w-2xl text-xl font-medium text-white/80 sm:text-2xl md:text-3xl"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          <span className="gradient-text font-semibold">
            AI Agents + Automations
          </span>
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-white/50 sm:text-lg"
        >
          We design, build, and deploy custom AI agents and automation systems
          that eliminate bottlenecks and supercharge your operations.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="#contact"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet to-purple px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
          >
            <span className="relative z-10">Book a Discovery Call</span>
            <ArrowRight
              size={18}
              className="relative z-10 transition-transform group-hover:translate-x-1"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple to-cyan opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
          <a
            href="#products"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-8 py-4 text-base font-medium text-white/80 transition-all hover:border-white/30 hover:bg-white/5 hover:text-white"
          >
            View Our Work
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-20 flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest text-white/30">
            Scroll to explore
          </span>
          <div className="h-10 w-px bg-gradient-to-b from-violet/50 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}

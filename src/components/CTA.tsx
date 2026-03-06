"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section id="contact" className="relative py-32 px-6">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-violet/10 blur-[128px]" />
        <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-cyan/10 blur-[128px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8 }}
        className="relative z-10 mx-auto max-w-4xl text-center"
      >
        <h2
          className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Ready to{" "}
          <span className="gradient-text">Supercharge</span>
          <br />
          Your Business?
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg text-white/50">
          Let&apos;s talk about how AI agents and automation can transform your
          operations. Book a free discovery call today.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="mailto:hello@triple3labs.com"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet via-purple to-cyan px-10 py-5 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(124,58,237,0.5)]"
          >
            <span className="relative z-10">Book a Discovery Call</span>
            <ArrowRight
              size={20}
              className="relative z-10 transition-transform group-hover:translate-x-1"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan via-violet to-pink opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </a>
        </div>

        <p className="mt-6 text-sm text-white/30">
          No commitment required. Let&apos;s just chat.
        </p>
      </motion.div>
    </section>
  );
}

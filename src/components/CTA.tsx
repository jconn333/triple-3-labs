"use client";

import { motion } from "framer-motion";
import ContactForm from "@/components/admin/ContactForm";

export default function CTA() {
  return (
    <section id="contact" className="relative py-16 px-6">
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
        className="relative z-10 mx-auto max-w-2xl"
      >
        <div className="text-center mb-8">
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-violet-400">
            Free AI Assessment
          </span>
          <h2
            className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Let&apos;s grab a <span className="gradient-text">coffee.</span>
          </h2>
          <p className="mx-auto max-w-xl text-lg text-white/50">
            Tell me about your business — where the hours go, what keeps
            slipping through the cracks — and I&apos;ll show you where AI
            could actually help. And if it can&apos;t, I&apos;ll tell you
            that too.
          </p>
          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-3">
            {[
              "3 real opportunities, mapped",
              "Plain English, no jargon",
              "No pitch — keep the notes either way",
            ].map((promise) => (
              <span
                key={promise}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm text-white/50"
              >
                {promise}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <ContactForm />
        </div>

        <p className="mt-4 text-center text-sm text-white/30">
          Free assessment &middot; No commitment &middot; We&apos;ll get back
          to you within 24 hours.
        </p>
      </motion.div>
    </section>
  );
}

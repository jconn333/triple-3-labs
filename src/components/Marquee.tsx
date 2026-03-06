"use client";

import { motion } from "framer-motion";

const items = [
  "AI Agents",
  "Workflow Automation",
  "Custom Chatbots",
  "Data Pipelines",
  "Process Optimization",
  "Intelligent Systems",
  "API Integrations",
  "AI Strategy",
];

export default function Marquee() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="relative overflow-hidden border-y border-white/5 py-6"
    >
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-[#030014] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-[#030014] to-transparent" />

      <div className="animate-marquee flex whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
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
  );
}

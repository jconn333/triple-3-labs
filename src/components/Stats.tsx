"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "10+", label: "AI Products Built" },
  { value: "50+", label: "Automations Deployed" },
  { value: "99%", label: "Uptime Guarantee" },
  { value: "24/7", label: "AI Agents Running" },
];

export default function Stats() {
  return (
    <section className="relative py-10 px-6">
      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl px-8 py-12"
        >
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="text-center"
              >
                <div
                  className="gradient-text mb-2 text-4xl font-bold sm:text-5xl"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-white/40">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

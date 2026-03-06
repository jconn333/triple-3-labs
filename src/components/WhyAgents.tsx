"use client";

import { motion } from "framer-motion";
import { UserMinus, GraduationCap, TrendingUp, Clock } from "lucide-react";

const painPoints = [
  {
    icon: UserMinus,
    stat: "Zero",
    label: "Turnover",
    detail: "They never quit. Never call in sick. Never leave for a competitor.",
  },
  {
    icon: GraduationCap,
    stat: "Zero",
    label: "Training Costs",
    detail: "No onboarding. No ramp-up time. Deployed and performing on day one.",
  },
  {
    icon: TrendingUp,
    stat: "100%",
    label: "Consistency",
    detail:
      "Every interaction is top-tier. No bad days, no dropped balls, no variance.",
  },
  {
    icon: Clock,
    stat: "24/7",
    label: "Availability",
    detail: "Nights, weekends, holidays — your agents are always on the clock.",
  },
];

export default function WhyAgents() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
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
            Stop bleeding money on hiring cycles, training programs, and
            inconsistent performance. Our AI agents deliver elite-level output
            from day one — and they never stop.
          </p>
        </motion.div>

        {/* Pain point cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {painPoints.map((point, idx) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-card group relative rounded-2xl p-8 hover:border-violet/30 transition-colors duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-violet/10 flex items-center justify-center group-hover:bg-violet/20 transition-colors duration-300">
                    <Icon className="w-6 h-6 text-violet" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span
                        className="gradient-text text-3xl font-bold"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {point.stat}
                      </span>
                      <span className="text-white/60 text-sm font-medium uppercase tracking-wider">
                        {point.label}
                      </span>
                    </div>
                    <p className="text-white/40 leading-relaxed text-sm">
                      {point.detail}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

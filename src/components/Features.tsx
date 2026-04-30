"use client";

import { motion } from "framer-motion";
import { Zap, FileText, Star, UserPlus, CalendarClock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Speed-to-Lead Bot",
    description:
      "Respond to every new lead within seconds — qualify, book, and route them automatically before your competition even sees the inquiry.",
    gradient: "from-violet to-purple",
  },
  {
    icon: FileText,
    title: "Invoice Follow-Up System",
    description:
      "Stop chasing payments. Automated, polite, persistent reminders that recover outstanding invoices and shorten your cash cycle.",
    gradient: "from-cyan to-blue-500",
  },
  {
    icon: Star,
    title: "Review Request Automation",
    description:
      "Turn happy customers into 5-star reviews on autopilot. Triggered at the perfect moment in the customer journey, every time.",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    icon: UserPlus,
    title: "Client Onboarding Sequence",
    description:
      "A polished, end-to-end onboarding flow that collects info, sends welcome materials, and gets new clients live without manual work.",
    gradient: "from-pink to-rose-500",
  },
  {
    icon: CalendarClock,
    title: "Appointment No-Show Recovery",
    description:
      "Smart reminders, easy reschedules, and instant follow-ups that recover missed appointments and protect your calendar revenue.",
    gradient: "from-emerald-400 to-green-600",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Features() {
  return (
    <section id="services" className="relative py-16 px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet/5 blur-[128px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-violet-400">
            What We Build
          </span>
          <h2
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            AI systems that{" "}
            <span className="gradient-text">print money.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            Not flashy. Not theoretical. The boring, consistent automations that move revenue — built for your business in under a week.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="glass-card group relative rounded-2xl p-8"
            >
              {/* Icon */}
              <div
                className={`mb-5 inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-3`}
              >
                <feature.icon size={22} className="text-white" />
              </div>

              <h3 className="mb-3 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/50">
                {feature.description}
              </p>

              {/* Hover glow */}
              <div
                className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 blur-xl transition-opacity group-hover:opacity-5`}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

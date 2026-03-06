"use client";

import { motion } from "framer-motion";
import { Bot, Zap, Workflow, Brain, Layers, LineChart } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Custom AI Agents",
    description:
      "Purpose-built AI agents that handle complex tasks, make decisions, and work 24/7 without fatigue.",
    gradient: "from-violet to-purple",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description:
      "End-to-end automation pipelines that eliminate repetitive tasks and reduce human error to zero.",
    gradient: "from-cyan to-blue-500",
  },
  {
    icon: Brain,
    title: "AI Strategy & Consulting",
    description:
      "Strategic roadmaps to identify high-impact AI opportunities and maximize your ROI.",
    gradient: "from-pink to-rose-500",
  },
  {
    icon: Zap,
    title: "System Integrations",
    description:
      "Seamlessly connect your existing tools, APIs, and databases into one intelligent ecosystem.",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    icon: Layers,
    title: "Full-Stack AI Products",
    description:
      "From concept to deployment — complete AI-powered products built with modern tech stacks.",
    gradient: "from-emerald-400 to-green-600",
  },
  {
    icon: LineChart,
    title: "Analytics & Optimization",
    description:
      "Data-driven insights and continuous optimization to keep your AI systems performing at peak.",
    gradient: "from-violet to-cyan",
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
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Features() {
  return (
    <section id="services" className="relative py-32 px-6">
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
            What We Do
          </span>
          <h2
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Build Smarter.{" "}
            <span className="gradient-text">Scale Faster.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            We combine cutting-edge AI with battle-tested automation to create
            systems that work harder than your competition.
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

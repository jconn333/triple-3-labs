"use client";

import { motion } from "framer-motion";
import { MessageSquare, Cpu, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Discovery",
    description:
      "We dig deep into your operations to identify bottlenecks, repetitive tasks, and high-impact AI opportunities.",
    gradient: "from-violet to-purple",
  },
  {
    number: "02",
    icon: Cpu,
    title: "Build & Iterate",
    description:
      "We design and develop custom AI agents and automation systems, iterating fast with your feedback.",
    gradient: "from-cyan to-blue-500",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Deploy & Optimize",
    description:
      "We deploy to production, monitor performance, and continuously optimize for maximum results.",
    gradient: "from-pink to-rose-500",
  },
];

export default function Process() {
  return (
    <section id="process" className="relative py-32 px-6">
      <div className="pointer-events-none absolute left-0 top-1/3 h-[400px] w-[400px] rounded-full bg-pink/5 blur-[128px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-pink-400">
            How It Works
          </span>
          <h2
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            From Idea to{" "}
            <span className="gradient-text">Production</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            A streamlined process designed to get you results fast.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative mx-auto max-w-4xl">
          {/* Connecting line */}
          <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-violet/50 via-cyan/50 to-pink/50 md:left-1/2 md:block" />

          <div className="space-y-16">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.7,
                  delay: idx * 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`relative flex flex-col items-start gap-6 md:flex-row md:items-center ${
                  idx % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Step content */}
                <div
                  className={`glass-card flex-1 rounded-2xl p-8 ${
                    idx % 2 === 1 ? "md:text-right" : ""
                  }`}
                >
                  <span
                    className={`mb-4 inline-block bg-gradient-to-r ${step.gradient} bg-clip-text text-5xl font-bold text-transparent opacity-30`}
                  >
                    {step.number}
                  </span>
                  <h3 className="mb-3 text-2xl font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="text-base text-white/50">{step.description}</p>
                </div>

                {/* Center dot */}
                <div className="z-10 hidden flex-shrink-0 md:block">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient} shadow-lg`}
                  >
                    <step.icon size={20} className="text-white" />
                  </div>
                </div>

                {/* Spacer for opposite side */}
                <div className="hidden flex-1 md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

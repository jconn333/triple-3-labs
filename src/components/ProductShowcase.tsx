"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Gift,
  Phone,
  ShieldCheck,
  FileSearch,
} from "lucide-react";

interface Product {
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  tags: string[];
  status: "live" | "coming-soon";
  icon: typeof Gift;
  gradient: string;
  image: string;
  bulletColor: string;
}

const products: Product[] = [
  {
    title: "Customer Service Phone Agent",
    subtitle: "AI-powered voice box office",
    description:
      "A conversational AI phone agent for Amish Country Theater that handles live show browsing, ticket inquiries, and booking — all through natural voice calls with SMS ticket link delivery.",
    highlights: [
      "Voice-first AI with ElevenLabs integration",
      "Live ticket inventory from VBO Ticketing",
      "SMS booking links via Twilio",
      "Post-call QA dashboard with trend analysis",
    ],
    tags: ["AI Agent", "Voice AI", "ElevenLabs", "Twilio"],
    status: "live",
    icon: Phone,
    gradient: "from-cyan to-blue-500",
    image: "/products/theater-agent.png",
    bulletColor: "bg-cyan",
  },
  {
    title: "Gift Cardy",
    subtitle: "Gift certificates, beautifully managed",
    description:
      "A full SaaS platform that lets businesses sell, track, and redeem branded digital gift certificates from one powerful dashboard. Stripe-powered payments, real-time analytics, and instant email delivery — set up in minutes.",
    highlights: [
      "Branded online storefront with embeddable checkout",
      "Real-time sales & redemption analytics",
      "Fraud protection with unique codes & audit logs",
      "Instant certificate delivery via email",
    ],
    tags: ["SaaS", "Stripe", "Next.js", "Full-Stack"],
    status: "live",
    icon: Gift,
    gradient: "from-violet to-fuchsia-500",
    image: "/products/gift-cardy.png",
    bulletColor: "bg-violet",
  },
  {
    title: "Spam Slayer",
    subtitle: "Cloud IMAP spam filtering that never sleeps",
    description:
      "A production-grade, multi-tenant IMAP spam filtering SaaS. Connects to existing mailboxes and autonomously filters spam 24/7 using a hybrid rules-plus-AI engine with one-click quarantine recovery.",
    highlights: [
      "Hybrid rules + AI spam detection engine",
      "Always-on IMAP IDLE worker daemon",
      "One-click quarantine & restore",
      "Real-time analytics with cost tracking",
    ],
    tags: ["SaaS", "AI Classification", "IMAP", "Security"],
    status: "live",
    icon: ShieldCheck,
    gradient: "from-emerald-400 to-green-600",
    image: "/products/spam-slayer.png",
    bulletColor: "bg-emerald-400",
  },
  {
    title: "Reservation Reconciler",
    subtitle: "Automated OTA reconciliation for property managers",
    description:
      "Reconciles Booking.com reservation exports against PMS sources (Hostaway & Cloudbeds), automatically detecting 8 types of discrepancies with AI-powered dispute response generation.",
    highlights: [
      "3-tier smart matching algorithm",
      "8 discrepancy types auto-detected",
      "AI dispute response generation (GPT-4o)",
      "Multi-property portfolio management",
    ],
    tags: ["Automation", "Hospitality", "AI", "Reconciliation"],
    status: "live",
    icon: FileSearch,
    gradient: "from-amber-400 to-orange-500",
    image: "/products/ota-reconciler.png",
    bulletColor: "bg-amber-400",
  },
];

function ProductCard({ product, index }: { product: Product; index: number }) {
  const Icon = product.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      className="glass-card group relative overflow-hidden rounded-3xl"
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden aspect-[21/9]">
        <Image
          src={product.image}
          alt={`${product.title} — ${product.subtitle}`}
          fill
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="100vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`inline-flex rounded-xl bg-gradient-to-br ${product.gradient} p-2.5`}
              >
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {product.title}
              </h3>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                Live
              </span>
            </div>
            <p className="mb-2 text-base font-medium text-white/70">
              {product.subtitle}
            </p>
            <p className="mb-5 text-sm leading-relaxed text-white/50">
              {product.description}
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {product.highlights.map((h) => (
                <li
                  key={h}
                  className="flex items-start gap-2 text-sm text-white/40"
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${product.bulletColor}`}
                  />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/40"
              >
                {tag}
              </span>
            ))}
            <button className="mt-2 rounded-full border border-white/10 p-2 transition-all hover:border-violet/50 hover:bg-violet/10">
              <ArrowUpRight size={16} className="text-white/60" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductShowcase() {
  return (
    <section id="products" className="relative py-32 px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute right-0 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-cyan/5 blur-[128px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-cyan-400">
            Our Work
          </span>
          <h2
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Products We&apos;ve{" "}
            <span className="gradient-text">Built</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            Real AI products and automation systems driving results right now.
          </p>
        </motion.div>

        <div className="space-y-8">
          {products.map((product, idx) => (
            <ProductCard key={product.title} product={product} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

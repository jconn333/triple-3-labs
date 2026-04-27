"use client";

import { motion } from "framer-motion";
import { ArrowRight, TreePine, Hotel, UtensilsCrossed, Inbox, CalendarDays, Star, Search, Share2 } from "lucide-react";
import Link from "next/link";

const properties = [
  {
    name: "Amish Country Lodging",
    url: "AmishCountryLodging.com",
    href: "https://www.amishcountrylodging.com",
    description: "Cabin and treehouse rentals in the heart of Holmes County.",
    icon: TreePine,
    gradient: "from-emerald-400 to-green-600",
  },
  {
    name: "Berlin Encore Hotel",
    url: "BerlinEncoreHotel.com",
    href: "https://www.berlinencorehotel.com",
    description: "A boutique hotel in Berlin, Ohio.",
    icon: Hotel,
    gradient: "from-violet to-purple",
  },
  {
    name: "Berlin Resort",
    url: "Berlinresort.net",
    href: "https://www.berlinresort.net",
    description: "Banquet halls and event spaces for weddings, reunions, and more.",
    icon: UtensilsCrossed,
    gradient: "from-cyan to-blue-500",
  },
];

const builtAgents = [
  { icon: Inbox, label: "Inbox triage", description: "Sorts and prioritizes emails across multiple properties" },
  { icon: CalendarDays, label: "Morning briefings", description: "Daily rundown of reservations, tasks, and priorities" },
  { icon: Star, label: "Review monitoring", description: "Watches Google, Yelp, and TripAdvisor — drafts responses" },
  { icon: Search, label: "SEO audits", description: "Weekly site audits and keyword tracking" },
  { icon: Share2, label: "Social media", description: "Schedules and posts content across platforms" },
];

export default function About() {
  return (
    <section className="relative px-6 pt-32 pb-24">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-violet/10 blur-[128px]" />
        <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan/5 blur-[128px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-widest text-violet-400">
            About
          </span>
          <h1
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Built by a business owner,{" "}
            <span className="gradient-text">for business owners.</span>
          </h1>
        </motion.div>

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8 text-lg leading-relaxed text-white/60"
        >
          <p>
            Hey, I&apos;m{" "}
            <span className="font-semibold text-white">Jeff Conn</span>. I&apos;m
            a co-owner of{" "}
            <span className="font-semibold text-white">Five Star Group</span>{" "}
            out here in Holmes County, Ohio &mdash; a holding company that owns
            and operates a few businesses in the area.
          </p>
        </motion.div>

        {/* Property cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="my-10 grid grid-cols-3 gap-4"
        >
          {properties.map((p) => {
            const Icon = p.icon;
            return (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card group block rounded-2xl p-5 transition-all hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${p.gradient} p-2.5`}>
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-white group-hover:text-white/90" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  {p.name}
                </h3>
                <p className="mb-2 text-xs leading-relaxed text-white/40">{p.description}</p>
                <span className="text-xs text-white/25 group-hover:text-white/40">{p.url}</span>
              </a>
            );
          })}
        </motion.div>

        {/* Body copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="space-y-8 text-lg leading-relaxed text-white/60"
        >
          <p>
            I started building AI agents for my own businesses. Stuff like
            sorting through our inboxes, putting together morning briefings,
            keeping an eye on reviews, running SEO checks, posting to social
            media. Nothing flashy &mdash; just taking the tedious stuff off
            our plate so we could spend time on things that matter more.
          </p>
        </motion.div>

        {/* What I built strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="my-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-white/30">
            Running in our own businesses today
          </p>
          <div className="grid grid-cols-2 gap-4">
            {builtAgents.map((agent) => {
              const Icon = agent.icon;
              return (
                <div key={agent.label} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-violet/20 p-1.5">
                    <Icon size={14} className="text-violet-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{agent.label}</p>
                    <p className="text-xs text-white/35">{agent.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Remaining copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="space-y-8 text-lg leading-relaxed text-white/60"
        >
          <p>
            A few friends who run businesses saw what I was doing and asked if
            I could set something up for them too. So I did. Then a couple more
            people asked. It just kind of snowballed from there.
          </p>

          <p>
            That&apos;s basically how{" "}
            <span className="font-semibold text-white">Triple 3 Labs</span>{" "}
            happened. There was no big master plan. I just kept helping people
            and eventually figured I should put a name on it.
          </p>

          {/* Divider */}
          <div className="h-px bg-white/[0.06]" />

          <p>
            I should be upfront &mdash; this is a side project. I&apos;m not
            trying to build some big agency or take on a hundred clients. I work
            with a handful of businesses here in Holmes County and nearby. People
            I know, industries I understand. That&apos;s it.
          </p>

          <p>
            I think that actually matters, though. These AI agents work a lot
            better when the person setting them up gets how your business
            actually runs &mdash; your tools, your customers, the stuff that
            eats up your day. It&apos;s hard to do that from a distance.
          </p>

          <p>
            And just to be clear &mdash; I&apos;m not trying to replace
            anybody on your team. The goal is to take the repetitive stuff
            off their plate so they can do more of the work that actually
            matters.
          </p>

          <p className="text-white/40">
            If any of this sounds interesting and you want to chat about it,
            reach out. No pressure, no sales pitch. Just a conversation.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Link
            href="/#contact"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet to-purple px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
          >
            <span className="relative z-10">Let&apos;s Talk</span>
            <ArrowRight
              size={18}
              className="relative z-10 transition-transform group-hover:translate-x-1"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple to-cyan opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

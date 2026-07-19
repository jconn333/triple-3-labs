"use client";

import Link from "next/link";
import { LogoIcon } from "@/components/Logo";

const columns = [
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Case Studies", href: "/work" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/#contact" },
    ],
  },
  {
    heading: "Services",
    links: [
      { label: "AI Agents", href: "/#agents" },
      { label: "What We Build", href: "/#services" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    heading: "Industries",
    links: [
      { label: "Hospitality", href: "/hospitality" },
      { label: "Home Services", href: "/home-services" },
      { label: "Real Estate", href: "/real-estate" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          {/* Logo + tagline */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <LogoIcon size={32} />
              <span className="text-lg font-bold tracking-tight">
                Triple 3 <span className="gradient-text">Labs</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/40">
              AI agents and automations for small business — built, managed,
              and battle-tested in our own companies first.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.heading}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/30">
                  {col.heading}
                </p>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/40 transition-colors hover:text-white/70"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-white/5 pt-6">
          <p className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} Triple 3 Labs. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

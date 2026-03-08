"use client";

import Link from "next/link";
import { LogoIcon } from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <LogoIcon size={32} />
            <span className="text-lg font-bold tracking-tight">
              Triple 3 <span className="gradient-text">Labs</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex gap-8">
            <Link
              href="/#services"
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              Services
            </Link>
            <Link
              href="/#products"
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              Products
            </Link>
            <Link
              href="/#process"
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              Process
            </Link>
            <Link
              href="/blog"
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              Blog
            </Link>
            <Link
              href="/#contact"
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              Contact
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} Triple 3 Labs. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

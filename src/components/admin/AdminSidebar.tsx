"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Building2,
  ChevronsUpDown,
  FileText,
  Home,
  Kanban,
  LifeBuoy,
  LogOut,
  Moon,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LogoIcon } from "@/components/Logo";
import { cn } from "@/lib/utils/cn";
import { useAdminTheme } from "./AdminFrame";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Extra prefixes that count as "this section" (legacy routes redirect here). */
  match?: string[];
}

const MAIN: NavItem[] = [
  { label: "Home", href: "/admin", icon: Home, match: ["/admin/command", "/admin/dashboard"] },
  { label: "Clients", href: "/admin/clients", icon: Building2, match: ["/admin/accounts"] },
  { label: "Pipeline", href: "/admin/pipeline", icon: Kanban },
  { label: "People", href: "/admin/people", icon: Users, match: ["/admin/contacts"] },
];

const OPS: NavItem[] = [
  { label: "Tickets", href: "/admin/tickets", icon: LifeBuoy },
  { label: "Agents", href: "/admin/agents", icon: Bot, match: ["/admin/mission-control"] },
];

function isActive(pathname: string, item: NavItem) {
  if (item.href === "/admin") {
    return pathname === "/admin" || (item.match ?? []).some((m) => pathname.startsWith(m));
  }
  return pathname.startsWith(item.href) || (item.match ?? []).some((m) => pathname.startsWith(m));
}

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  const Item = ({ item }: { item: NavItem }) => {
    const on = isActive(pathname, item);
    return (
      <li>
        <Link
          href={item.href}
          aria-current={on ? "page" : undefined}
          className={cn(
            "flex h-8 items-center gap-2.5 rounded-[7px] px-2.5 text-sm font-medium transition-colors",
            on ? "bg-accent-soft text-accent-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
          )}
        >
          <item.icon size={16} strokeWidth={1.8} className="shrink-0" />
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <aside className="flex w-[216px] shrink-0 flex-col border-r border-line bg-surface">
      <Link href="/admin" className="flex items-center gap-2.5 px-4 pb-3 pt-4 text-sm font-semibold text-ink">
        <LogoIcon size={22} idPrefix="admin-nav" />
        Triple 3 Labs
      </Link>

      <nav className="flex-1 overflow-y-auto px-2.5">
        <ul className="space-y-0.5">
          {MAIN.map((i) => (
            <Item key={i.href} item={i} />
          ))}
        </ul>
        <p className="mb-1 mt-5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">Operations</p>
        <ul className="space-y-0.5">
          {OPS.map((i) => (
            <Item key={i.href} item={i} />
          ))}
        </ul>
      </nav>

      <AccountMenu userEmail={userEmail} blogActive={pathname.startsWith("/admin/blog")} />
    </aside>
  );
}

function AccountMenu({ userEmail, blogActive }: { userEmail: string; blogActive: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, setTheme } = useAdminTheme();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const item =
    "flex h-8 w-full items-center gap-2.5 rounded-[6px] px-2.5 text-left text-sm text-ink-2 hover:bg-surface-2 hover:text-ink";

  return (
    <div ref={ref} className="relative border-t border-line p-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-[7px] px-2 text-left hover:bg-surface-2",
          (open || blogActive) && "bg-surface-2",
        )}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold uppercase text-accent-ink">
          {userEmail.slice(0, 1) || "?"}
        </span>
        <span className="min-w-0 flex-1 truncate text-sub text-ink-2">{userEmail}</span>
        <ChevronsUpDown size={14} className="shrink-0 text-ink-3" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-2.5 right-2.5 mb-1 rounded-lg border border-line bg-surface p-1 shadow-pop"
        >
          <Link href="/admin/blog" role="menuitem" className={item} onClick={() => setOpen(false)}>
            <FileText size={15} strokeWidth={1.8} /> Blog posts
          </Link>
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
            {theme === "dark" ? "Light theme" : "Dark theme"}
          </button>
          <div className="my-1 border-t border-line" />
          <button type="button" role="menuitem" className={item} onClick={signOut}>
            <LogOut size={15} strokeWidth={1.8} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

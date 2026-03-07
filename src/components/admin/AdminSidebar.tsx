"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoIcon } from "@/components/Logo";
import {
  LayoutDashboard,
  Kanban,
  Users,
  Building2,
  LogOut,
  CreditCard,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Pipeline", href: "/admin/pipeline", icon: Kanban },
  { label: "Contacts", href: "/admin/contacts", icon: Users },
  { label: "Accounts", href: "/admin/accounts", icon: Building2 },
  { label: "Blog Posts", href: "/admin/blog", icon: FileText },
];

const futureItems = [
  { label: "Invoices", href: "/admin/invoices", icon: CreditCard },
];

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-white/5 bg-background">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5">
        <LogoIcon size={28} />
        <span
          className="text-lg font-bold text-white"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Triple 3 <span className="gradient-text">Labs</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">
          Main
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                    isActive
                      ? "bg-violet/10 text-white font-medium"
                      : "text-white/50 hover:bg-white/5 hover:text-white/80"
                  )}
                >
                  <item.icon
                    size={18}
                    className={isActive ? "text-violet" : ""}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Future items (disabled) */}
        <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">
          Coming Soon
        </p>
        <ul className="space-y-1">
          {futureItems.map((item) => (
            <li key={item.href}>
              <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/20 cursor-not-allowed">
                <item.icon size={18} />
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </nav>

      {/* User / Sign Out */}
      <div className="border-t border-white/5 px-4 py-4">
        <div className="mb-2 truncate text-xs text-white/40">{userEmail}</div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

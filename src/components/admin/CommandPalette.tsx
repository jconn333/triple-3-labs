"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Building2, FileText, Home, Kanban, LifeBuoy, Search, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Kbd } from "@/components/ui/Kbd";
import type { Account, Contact, Deal, Ticket } from "@/lib/crm/types";

const OPEN_EVENT = "admin:open-command-palette";
export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

type Item = {
  id: string;
  group: "Pages" | "Clients" | "Deals" | "People" | "Tickets";
  label: string;
  hint?: string;
  href: string;
  icon?: LucideIcon;
};

const PAGES: Item[] = [
  { id: "p-home", group: "Pages", label: "Home", href: "/admin", icon: Home },
  { id: "p-clients", group: "Pages", label: "Clients", href: "/admin/clients", icon: Building2 },
  { id: "p-pipeline", group: "Pages", label: "Pipeline", href: "/admin/pipeline", icon: Kanban },
  { id: "p-people", group: "Pages", label: "People", href: "/admin/people", icon: Users },
  { id: "p-tickets", group: "Pages", label: "Tickets", href: "/admin/tickets", icon: LifeBuoy },
  { id: "p-agents", group: "Pages", label: "Agents", href: "/admin/agents", icon: Bot },
  { id: "p-blog", group: "Pages", label: "Blog posts", href: "/admin/blog", icon: FileText },
];

const money = (n: number | null) =>
  n === null || n === undefined ? null : `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/**
 * ⌘K: find any client, deal, person or ticket — or jump to a page — from anywhere.
 * Records come from the existing list endpoints; nothing new on the server.
 */
export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  // Open via ⌘K / Ctrl+K or the header button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setResults([]);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Search records (debounced). Deals have no server-side search, so filter locally.
  useEffect(() => {
    if (!open) return;
    const needle = q.trim();
    if (!needle) {
      setResults([]);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const qs = encodeURIComponent(needle);
        const [a, c, d, tk] = await Promise.all([
          fetch(`/api/accounts?q=${qs}&limit=8`).then((r) => (r.ok ? r.json() : { accounts: [] })),
          fetch(`/api/contacts?q=${qs}&limit=8`).then((r) => (r.ok ? r.json() : { contacts: [] })),
          fetch(`/api/deals`).then((r) => (r.ok ? r.json() : { deals: [] })),
          fetch(`/api/tickets?status=all&q=${qs}`).then((r) => (r.ok ? r.json() : { tickets: [] })),
        ]);
        if (id !== reqId.current) return;
        const lower = needle.toLowerCase();
        const items: Item[] = [
          ...((a.accounts ?? []) as Account[]).map((x) => ({
            id: `a-${x.id}`,
            group: "Clients" as const,
            label: x.name,
            hint: [x.contact ? `${x.contact.first_name} ${x.contact.last_name}`.trim() : null, x.mrr ? `${money(x.mrr)}/mo` : null, x.status]
              .filter(Boolean)
              .join(" · "),
            href: `/admin/clients/${x.id}`,
          })),
          ...((d.deals ?? []) as Deal[])
            .filter((x) => x.name.toLowerCase().includes(lower) || (x.contact?.company ?? "").toLowerCase().includes(lower))
            .slice(0, 8)
            .map((x) => ({
              id: `d-${x.id}`,
              group: "Deals" as const,
              label: x.name,
              hint: [x.stage?.name, money(x.amount)].filter(Boolean).join(" · "),
              href: `/admin/pipeline?deal=${x.id}`,
            })),
          ...((c.contacts ?? []) as Contact[]).map((x) => ({
            id: `c-${x.id}`,
            group: "People" as const,
            label: `${x.first_name} ${x.last_name}`.trim(),
            hint: [x.company, x.email].filter(Boolean).join(" · "),
            href: `/admin/people/${x.id}`,
          })),
          ...((tk.tickets ?? []) as Ticket[]).slice(0, 6).map((x) => ({
            id: `t-${x.id}`,
            group: "Tickets" as const,
            label: `#${x.ticket_number} ${x.subject}`,
            hint: [x.status.replace(/_/g, " "), x.account?.name].filter(Boolean).join(" · "),
            href: `/admin/tickets/${x.id}`,
          })),
        ];
        setResults(items);
        setActive(0);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 160);
    return () => clearTimeout(t);
  }, [q, open]);

  const pages = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? PAGES.filter((p) => p.label.toLowerCase().includes(n)) : PAGES;
  }, [q]);

  const all = useMemo(() => [...pages, ...results], [pages, results]);

  const go = useCallback(
    (item: Item) => {
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const groups = (["Pages", "Clients", "Deals", "People", "Tickets"] as const)
    .map((g) => ({ g, items: all.filter((i) => i.group === g) }))
    .filter((x) => x.items.length > 0);

  let idx = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-[12vh]"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="w-full max-w-[600px] overflow-hidden rounded-xl border border-line-strong bg-surface shadow-pop"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search size={16} className="shrink-0 text-ink-3" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, all.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const item = all[active];
                if (item) go(item);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="Search clients, deals, people, tickets…"
            aria-label="Search"
            className="h-12 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
          />
          {loading && <span className="text-xs text-ink-3">Searching…</span>}
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1.5">
          {groups.length === 0 && (
            <p className="px-4 py-8 text-center text-sub text-ink-3">
              {loading ? "Searching…" : `No matches for “${q}”.`}
            </p>
          )}
          {groups.map(({ g, items }) => (
            <div key={g}>
              <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{g}</p>
              {items.map((item) => {
                idx += 1;
                const i = idx;
                const on = i === active;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-idx={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm",
                      on ? "bg-accent-soft text-accent-ink" : "text-ink",
                    )}
                  >
                    {Icon ? (
                      <Icon size={15} strokeWidth={1.8} className={cn("shrink-0", on ? "text-accent-ink" : "text-ink-3")} />
                    ) : (
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-px text-[11px]",
                          on ? "bg-surface/60 text-accent-ink" : "bg-surface-2 text-ink-2",
                        )}
                      >
                        {g.replace(/s$/, "")}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                    {item.hint && <span className={cn("ml-auto shrink-0 truncate text-xs", on ? "text-accent-ink/80" : "text-ink-3")}>{item.hint}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-xs text-ink-3">
          <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
          <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
          <span className="flex items-center gap-1"><Kbd>esc</Kbd> close</span>
        </div>
      </div>
    </div>
  );
}

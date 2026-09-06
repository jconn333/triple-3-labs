"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Slots {
  title: HTMLElement | null;
  actions: HTMLElement | null;
  setTitleSlot: (el: HTMLElement | null) => void;
  setActionsSlot: (el: HTMLElement | null) => void;
}

const Ctx = createContext<Slots>({ title: null, actions: null, setTitleSlot: () => {}, setActionsSlot: () => {} });

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitleSlot] = useState<HTMLElement | null>(null);
  const [actions, setActionsSlot] = useState<HTMLElement | null>(null);
  return <Ctx.Provider value={{ title, actions, setTitleSlot, setActionsSlot }}>{children}</Ctx.Provider>;
}

export const usePageHeaderSlots = () => useContext(Ctx);

/**
 * Pages declare their own name, breadcrumb and actions; the top bar renders
 * them. Portals (not state) so actions can re-render freely with page state.
 */
export function PageHeader({
  title,
  crumb,
  actions,
}: {
  title: ReactNode;
  crumb?: { label: string; href: string };
  actions?: ReactNode;
}) {
  const { title: titleSlot, actions: actionsSlot } = useContext(Ctx);

  useEffect(() => {
    if (typeof title === "string") document.title = `${title} · Triple 3 Labs`;
  }, [title]);

  return (
    <>
      {titleSlot &&
        createPortal(
          <h1 className="flex min-w-0 items-center gap-1.5 truncate text-[15px] font-semibold text-ink">
            {crumb && (
              <>
                <Link href={crumb.href} className="font-normal text-ink-3 hover:text-ink">
                  {crumb.label}
                </Link>
                <span className="font-normal text-ink-3">/</span>
              </>
            )}
            <span className="truncate">{title}</span>
          </h1>,
          titleSlot,
        )}
      {actionsSlot && actions && createPortal(<div className="flex items-center gap-2">{actions}</div>, actionsSlot)}
    </>
  );
}

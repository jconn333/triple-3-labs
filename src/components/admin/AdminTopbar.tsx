"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { Kbd } from "@/components/ui/Kbd";
import { usePageHeaderSlots } from "./PageHeader";
import { openCommandPalette } from "./CommandPalette";

export default function AdminTopbar() {
  const { setTitleSlot, setActionsSlot } = usePageHeaderSlots();
  const titleRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitleSlot(titleRef.current);
    setActionsSlot(actionsRef.current);
    return () => {
      setTitleSlot(null);
      setActionsSlot(null);
    };
  }, [setTitleSlot, setActionsSlot]);

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-line bg-surface px-6">
      <div ref={titleRef} className="flex min-w-0 flex-1 items-center" />
      <button
        type="button"
        onClick={openCommandPalette}
        className="hidden h-8 w-64 items-center gap-2 rounded-[7px] border border-line bg-ground px-2.5 text-left text-sub text-ink-3 transition-colors hover:border-line-strong hover:text-ink-2 md:flex"
      >
        <Search size={14} />
        <span className="flex-1">Search or jump to…</span>
        <Kbd>⌘K</Kbd>
      </button>
      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Search"
        className="flex h-8 w-8 items-center justify-center rounded-[7px] text-ink-2 hover:bg-surface-2 md:hidden"
      >
        <Search size={16} />
      </button>
      <div ref={actionsRef} className="flex items-center gap-2 empty:hidden" />
    </header>
  );
}

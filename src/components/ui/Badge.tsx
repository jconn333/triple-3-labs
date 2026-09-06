import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type Tone = "good" | "warn" | "bad" | "neutral" | "accent";

const tones: Record<Tone, string> = {
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  neutral: "bg-surface-2 text-ink-2",
  accent: "bg-accent-soft text-accent-ink",
};

interface BadgeProps {
  tone?: Tone;
  /** Leading status dot — use for lifecycle states (active / onboarding / escalated). */
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
  title?: string;
  children: ReactNode;
}

export function Badge({ tone = "neutral", dot, size = "md", className, title, children }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium",
        size === "md" ? "h-[22px] px-2 text-xs" : "h-5 px-1.5 text-[11px]",
        tones[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** A dashed outline badge for "absent" states (no deal, untracked). */
export function OutlineBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center whitespace-nowrap rounded-full border border-dashed border-line-strong px-2 text-xs text-ink-3",
        className,
      )}
    >
      {children}
    </span>
  );
}

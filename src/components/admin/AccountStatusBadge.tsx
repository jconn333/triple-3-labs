import { cn } from "@/lib/utils/cn";

interface AccountStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { label: string; colors: string }> = {
  active: { label: "Active", colors: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  paused: { label: "Paused", colors: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  churned: { label: "Churned", colors: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

export default function AccountStatusBadge({ status, size = "sm" }: AccountStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, colors: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium capitalize",
        config.colors,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      )}
    >
      {config.label}
    </span>
  );
}

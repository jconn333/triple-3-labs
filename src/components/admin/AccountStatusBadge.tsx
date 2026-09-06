import { StatusBadge } from "@/components/ui";

interface AccountStatusBadgeProps {
  status: string;
  /** Kept for API compatibility with existing callers — always renders at kit "md". */
  size?: "sm" | "md";
}

export default function AccountStatusBadge({ status }: AccountStatusBadgeProps) {
  return <StatusBadge kind="account" value={status} size="md" />;
}

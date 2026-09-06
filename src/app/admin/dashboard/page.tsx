import { redirect } from "next/navigation";
// The old KPI dashboard folded into Home (Sept 2026).
export default function DashboardRedirect() {
  redirect("/admin");
}

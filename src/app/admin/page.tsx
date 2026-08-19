import { redirect } from "next/navigation";

// The Command Center is the admin home; the old dashboard lives at /admin/dashboard.
export default function AdminHome() {
  redirect("/admin/command");
}

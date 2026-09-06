import { redirect } from "next/navigation";
// Accounts became Clients (Sept 2026). Old links keep working.
export default function AccountsRedirect() {
  redirect("/admin/clients");
}

import { redirect } from "next/navigation";
// Contacts became People (Sept 2026). Old links keep working.
export default function ContactsRedirect() {
  redirect("/admin/people");
}

import { redirect } from "next/navigation";
// The Command Center is now Home.
export default function CommandRedirect() {
  redirect("/admin");
}

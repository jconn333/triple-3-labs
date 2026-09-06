import { redirect } from "next/navigation";
// Mission Control became Agents (Sept 2026).
export default function MissionControlRedirect() {
  redirect("/admin/agents");
}

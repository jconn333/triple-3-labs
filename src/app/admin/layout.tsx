import { createClient } from "@/lib/supabase/server";
import AdminFrame from "@/components/admin/AdminFrame";

export const metadata = {
  title: "Triple 3 Labs",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated: only the login page renders here (middleware redirects
  // everything else). It still gets the admin theme scope.
  if (!user) {
    return <div className="admin min-h-screen">{children}</div>;
  }

  return <AdminFrame userEmail={user.email || ""}>{children}</AdminFrame>;
}

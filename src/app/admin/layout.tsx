import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata = {
  title: "Admin | Triple 3 Labs",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not authenticated, render children without admin shell (login page).
  // Middleware handles redirecting unauthenticated users away from other admin routes.
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar userEmail={user.email || ""} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}

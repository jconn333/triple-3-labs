"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/pipeline": "Pipeline",
  "/admin/contacts": "Contacts",
  "/admin/accounts": "Accounts",
  "/admin/blog": "Blog Posts",
  "/admin/blog/new": "New Post",
};

export default function AdminHeader() {
  const pathname = usePathname();

  const title =
    pageTitles[pathname] ||
    (pathname.startsWith("/admin/contacts/") ? "Contact Detail" :
     pathname.startsWith("/admin/accounts/") ? "Account Detail" :
     pathname.startsWith("/admin/blog/") ? "Edit Post" : "Admin");

  return (
    <header className="flex h-16 items-center border-b border-white/5 px-8">
      <h1
        className="text-xl font-bold text-white"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        {title}
      </h1>
    </header>
  );
}

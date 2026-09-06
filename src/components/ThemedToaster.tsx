"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";

// One Toaster for the whole app. The marketing site is dark; the admin is a
// light workspace, so toasts follow the route instead of a fixed theme.
export default function ThemedToaster() {
  const pathname = usePathname();
  const admin = pathname?.startsWith("/admin");
  return (
    <Toaster
      theme={admin ? "light" : "dark"}
      position="bottom-right"
      richColors
      toastOptions={admin ? { style: { fontFamily: "var(--font-geist), system-ui, sans-serif" } } : undefined}
    />
  );
}

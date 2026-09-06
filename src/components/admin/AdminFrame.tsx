"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { PageHeaderProvider } from "./PageHeader";
import CommandPalette from "./CommandPalette";

type Theme = "light" | "dark";
const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "light",
  setTheme: () => {},
});
export const useAdminTheme = () => useContext(ThemeCtx);

const STORAGE_KEY = "admin-theme";

/**
 * The admin workspace: light by default, dark on request (persisted per
 * browser). Everything inside is scoped by the `.admin` class so the marketing
 * site's dark palette never leaks in.
 */
export default function AdminFrame({ userEmail, children }: { userEmail: string; children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light") setThemeState(saved);
    } catch {
      /* private mode etc. — stay light */
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>
      <PageHeaderProvider>
        <div className="admin flex h-screen overflow-hidden" data-theme={theme === "dark" ? "dark" : undefined}>
          <AdminSidebar userEmail={userEmail} />
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminTopbar />
            <main className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[1280px] px-6 py-5">{children}</div>
            </main>
          </div>
          <CommandPalette />
        </div>
      </PageHeaderProvider>
    </ThemeCtx.Provider>
  );
}

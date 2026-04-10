"use client";

import { ReactNode, useEffect, useState } from "react";
import DashboardSidebar from "@/app/components/DashboardSidebar";
import TokenExpiryMonitor from "@/app/components/TokenExpiryMonitor";

type DashboardTheme = "dark" | "light";

const DASHBOARD_THEME_STORAGE_KEY = "feeders_dashboard_theme";

export default function DashboardWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<DashboardTheme>("dark");

  useEffect(() => {
    // Persisting theme keeps visual context stable between visits, which is
    // especially important for productivity dashboards used repeatedly.
    window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <div
      data-dashboard-theme={theme}
      className={`min-h-screen overflow-x-hidden transition-colors ${
        isDark ? "bg-black text-white" : "bg-[#F5F5F7] text-[#0B0B0C]"
      }`}
    >
      {/* Session expiry is monitored at layout level so every dashboard screen
          inherits the same auth-safety behavior without duplicate hooks. */}
      <TokenExpiryMonitor />
      <div
        className={`border-b px-4 py-3 md:hidden ${
          isDark ? "border-white/10 bg-[#060606]" : "border-[#E5E7EB] bg-white"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <span
            className={`truncate text-base font-semibold tracking-tight ${
              isDark ? "text-white" : "text-[#0B0B0C]"
            }`}
          >
            FeedersLab Dashboard
          </span>
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className={`inline-flex h-10 shrink-0 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors ${
              isDark
                ? "border-white/20 bg-black text-white hover:bg-[#151515]"
                : "border-[#E5E7EB] bg-white text-[#0B0B0C] hover:bg-[#F9FAFB]"
            }`}
            aria-expanded={mobileOpen}
            aria-controls="dashboard-mobile-menu"
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-0px)] min-w-0">
        <div
          className={`hidden border-r transition-all duration-300 md:block ${
            isDark
              ? "border-white/10 bg-[#080808]"
              : "border-[#E5E7EB] bg-white"
          } ${sidebarCollapsed ? "w-20" : "w-72"}`}
        >
          <DashboardSidebar
            theme={theme}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
            onToggleTheme={() =>
              setTheme((prev) => (prev === "dark" ? "light" : "dark"))
            }
          />
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/60"
            />
            <div
              id="dashboard-mobile-menu"
              className="absolute left-0 top-0 h-full w-[80vw] max-w-xs flex flex-col"
            >
              <div
                className={`flex items-center justify-end border-b px-3 py-2 ${
                  isDark
                    ? "border-white/10 bg-[#060606]"
                    : "border-[#E5E7EB] bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition-colors ${
                    isDark
                      ? "border-white/20 text-white hover:bg-white/[0.08]"
                      : "border-[#D4D4D8] text-[#111827] hover:bg-[#F3F4F6]"
                  }`}
                >
                  Close
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <DashboardSidebar
                  theme={theme}
                  onNavigate={() => setMobileOpen(false)}
                  onToggleTheme={() =>
                    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
                  }
                />
              </div>
            </div>
          </div>
        ) : null}

        <main className="dashboard-main-canvas w-full min-w-0 flex-1 p-3 sm:p-4 md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}

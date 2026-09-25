"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { FarmerSidebar } from "./FarmerSidebar";

// Separate from DashboardShell on purpose: the admin shell carries admin-only
// search, notifications and nav, and one parameterised component would leave
// admin pieces a single prop away from a farmer screen.
export function FarmerShell({ children, farmerName }: { children: React.ReactNode; farmerName: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full">
      <aside className="hidden w-60 shrink-0 md:block">
        <FarmerSidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <div className="relative h-full">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-full bg-white/10 p-1.5 text-white"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <FarmerSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-w-0 shrink-0 items-center gap-3 bg-background px-4 py-3 md:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-black/5 md:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green-dark text-xs font-semibold text-white">
              {farmerName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden max-w-[10rem] truncate text-sm font-semibold sm:inline" title={farmerName}>
              {farmerName}
            </span>
            <LogoutButton className="px-2" />
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto bg-background p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

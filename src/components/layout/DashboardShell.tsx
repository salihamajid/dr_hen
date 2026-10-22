"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { AgentStatus } from "@/lib/admin/dashboardData";

/**
 * The admin frame, laid out as in the reference: one green band across the full width, and
 * beneath it a menu card beside the page. The band spans everything rather than stopping at
 * the menu, which is what gives the admin area its own identity next to the farmer portal.
 */
export function DashboardShell({
  children,
  adminName,
  agent,
  pendingCount,
}: {
  children: React.ReactNode;
  adminName: string;
  agent: AgentStatus;
  pendingCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <Topbar onMenuClick={() => setMobileOpen(true)} adminName={adminName} pendingCount={pendingCount} />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[248px] shrink-0 overflow-y-auto p-4 pr-0 md:block">
          <Sidebar agent={agent} />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[260px] overflow-y-auto bg-background p-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="mb-2 ml-auto flex rounded-full bg-black/5 p-1.5"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <Sidebar agent={agent} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { Search, Bell, ChevronDown, Menu } from "lucide-react";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="flex min-w-0 items-center gap-3 border-b border-black/5 bg-white px-4 py-3 md:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 hover:bg-black/5 md:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative min-w-0 flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
        <input
          type="search"
          placeholder="Search farmer, flock or disease..."
          className="w-full min-w-0 rounded-full border border-black/10 bg-black/[0.03] py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-green"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative rounded-full p-2 hover:bg-black/5" aria-label="Notifications">
          <Bell className="h-5 w-5 text-black/60" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-red" />
        </button>

        <div className="flex items-center gap-2 rounded-full border border-black/10 py-1 pl-1 pr-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-green-dark text-xs font-semibold text-white">
            A
          </div>
          <span className="hidden text-sm font-medium sm:inline">Admin</span>
          <ChevronDown className="h-4 w-4 text-black/40" />
        </div>
      </div>
    </header>
  );
}

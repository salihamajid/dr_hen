"use client";

import { Search, Bell, Menu } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function Topbar({ onMenuClick, adminName }: { onMenuClick?: () => void; adminName: string }) {
  return (
    <header className="flex min-w-0 shrink-0 items-center gap-3 bg-background px-4 py-3 md:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 hover:bg-black/5 md:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative mx-auto min-w-0 w-full max-w-2xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
        <input
          type="search"
          placeholder="Search farmer, flock or disease..."
          aria-label="Search farmer, flock or disease"
          className="w-full min-w-0 rounded-full border border-black/[0.07] bg-white py-2.5 pl-11 pr-4 text-sm shadow-sm outline-none placeholder:text-black/35 focus:border-brand-green"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button className="relative rounded-full p-2 hover:bg-black/5" aria-label="Notifications">
          <Bell className="h-5 w-5 text-black/55" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-red ring-2 ring-background" />
        </button>

        <div className="flex items-center gap-2 py-1 pl-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green-dark text-xs font-semibold text-white">
            {adminName.charAt(0).toUpperCase()}
          </span>
          <span className="hidden max-w-[10rem] truncate text-sm font-semibold sm:inline" title={adminName}>
            {adminName}
          </span>
        </div>
        <LogoutButton className="px-2" />
      </div>
    </header>
  );
}

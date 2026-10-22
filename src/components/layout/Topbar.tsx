"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

/**
 * The full-width header band. It sits above both the menu and the page, as in the admin
 * reference, so the brand runs the whole width of the screen rather than only the content column.
 */
export function Topbar({
  onMenuClick,
  adminName,
  pendingCount,
}: {
  onMenuClick?: () => void;
  adminName: string;
  /** Things actually waiting for an admin right now. Zero hides the badge rather than showing "0". */
  pendingCount: number;
}) {
  const router = useRouter();

  return (
    <header className="flex shrink-0 items-center gap-3 bg-[#0a6f37] px-4 py-3 text-white md:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 hover:bg-white/10 md:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
        <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-white/25">
          <Image src="/images/dr-hen-v2.jpeg" alt="" fill sizes="40px" className="object-cover object-top" priority />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xl font-extrabold leading-tight tracking-tight">Doctor Hen</span>
        </span>
        <span className="hidden text-sm font-medium text-white/60 sm:inline">poultry app</span>
      </Link>

      {/* A real search, not decoration: it submits to the farmers list, which filters on it. */}
      <form
        action="/farmers"
        className="ml-auto hidden min-w-0 max-w-xs flex-1 items-center md:flex"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q");
          router.push(q ? `/farmers?q=${encodeURIComponent(String(q))}` : "/farmers");
        }}
      >
        <label className="relative w-full">
          <span className="sr-only">Search farmers</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
          <input
            name="q"
            type="search"
            placeholder="Search farmers..."
            className="w-full rounded-full border border-white/20 bg-white/10 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-white/50"
          />
        </label>
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-3">
        <Link href="/dashboard#attention" className="relative rounded-full p-2 hover:bg-white/10" aria-label={`${pendingCount} items need attention`}>
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold ring-2 ring-[#0a6f37]">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </Link>

        <span className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2bb45f] text-xs font-bold uppercase">
            {adminName.slice(0, 2)}
          </span>
          <span className="hidden max-w-[9rem] truncate text-sm font-semibold sm:inline" title={adminName}>
            {adminName}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-white/60 sm:inline" aria-hidden />
        </span>
        <LogoutButton className="px-2 text-white/80 hover:text-white" />
      </div>
    </header>
  );
}

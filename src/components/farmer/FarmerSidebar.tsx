"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bird, Bot, ClipboardList, FileBarChart, LayoutDashboard, SlidersHorizontal } from "lucide-react";
import { FARMER_NAV_ITEMS } from "@/lib/constants";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = { LayoutDashboard, Bell, Bird, Bot, ClipboardList, FileBarChart, SlidersHorizontal };

export function FarmerSidebar({ onNavigate, unreadAlerts = 0 }: { onNavigate?: () => void; unreadAlerts?: number }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sidebar-bg text-white">
      <div className="flex shrink-0 flex-col items-center gap-2 px-5 py-5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white">
          <Image src="/images/dr-hen-v2.jpeg" alt="Dr. Hen" fill sizes="56px" className="object-cover object-top" priority />
        </div>
        <div className="text-center">
          <div className="text-lg font-extrabold leading-tight">Dr. Hen</div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-red">AI Poultry Doctor</div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-1">
        {FARMER_NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-brand-red text-white shadow-sm" : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
              {item.href === "/farmer/alerts" && unreadAlerts > 0 && (
                <span className="ml-auto rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-bold text-white" aria-label={`${unreadAlerts} unread alerts`}>
                  {unreadAlerts > 99 ? "99+" : unreadAlerts}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

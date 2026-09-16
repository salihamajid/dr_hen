"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bird,
  Syringe,
  ShieldPlus,
  MessageSquare,
  FileBarChart,
  BookOpenText,
  Settings,
  MessageCircleHeart,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Bird,
  Syringe,
  ShieldPlus,
  MessageSquare,
  FileBarChart,
  BookOpenText,
  Settings,
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sidebar-bg text-white">
      <div className="flex shrink-0 flex-col items-center gap-2 px-5 py-5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white">
          <Image src="/images/dr-hen.jpeg" alt="Dr. Hen" fill sizes="56px" className="object-cover object-top" priority />
        </div>
        <div className="text-center">
          <div className="text-lg font-extrabold leading-tight">Dr. Hen</div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-red">AI Poultry Doctor</div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-1">
        {NAV_ITEMS.map((item) => {
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
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 p-3">
        <Link
          href="/messages"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 transition-colors hover:bg-white/10"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
            <MessageCircleHeart className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold leading-tight">Need Help?</span>
            <span className="block truncate text-[11px] leading-tight text-white/55">Chat with Dr. Hen</span>
          </span>
        </Link>
      </div>
    </div>
  );
}

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
    <div className="flex h-full flex-col bg-sidebar-bg text-white">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white">
          <Image src="/images/dr-hen.jpeg" alt="Dr. Hen" fill sizes="44px" className="object-cover object-top" />
        </div>
        <div>
          <div className="text-lg font-bold leading-tight">Dr. Hen</div>
          <div className="text-[11px] uppercase tracking-wide text-white/50">AI Poultry Doctor</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-brand-red text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <button className="flex w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-3 text-sm font-medium text-white hover:bg-white/20">
          <MessageCircleHeart className="h-5 w-5" />
          Need Help? Chat with Dr. Hen
        </button>
      </div>
    </div>
  );
}

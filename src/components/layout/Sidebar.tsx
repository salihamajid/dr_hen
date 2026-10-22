"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bird,
  BookOpenText,
  FileBarChart,
  Inbox,
  LayoutDashboard,
  MessageCircleHeart,
  MessageSquare,
  Settings,
  ShieldPlus,
  Syringe,
  Users,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import type { AgentStatus } from "@/lib/admin/dashboardData";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Bird,
  Syringe,
  ShieldPlus,
  MessageSquare,
  MessageCircleHeart,
  FileBarChart,
  BookOpenText,
  Inbox,
  Settings,
};

export function Sidebar({ onNavigate, agent }: { onNavigate?: () => void; agent: AgentStatus }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      <nav className="rounded-2xl border border-black/[0.06] bg-white p-3 shadow-sm">
        <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/35">Menu</p>

        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          // Segment-exact: "/farmers" must not light up for "/farmer".
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`mb-0.5 flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-[13px] font-semibold transition-colors ${
                active ? "bg-[#e3f3e7] text-[#14532d]" : "text-black/60 hover:bg-black/[0.04] hover:text-black/85"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  active ? "bg-[#1f9d4d] text-white" : "text-black/45"
                }`}
              >
                <Icon className="h-[17px] w-[17px]" />
              </span>
              <span className="min-w-0 truncate">{item.label}</span>
              {"badge" in item && item.badge && (
                <span className="ml-auto shrink-0 rounded-md bg-[#2bb45f] px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Not a decoration: "Connected" means Meta credentials are configured and this process
          can actually send. See agentStatus in lib/admin/dashboardData.ts. */}
      <section className="rounded-2xl border border-black/[0.06] bg-white p-3 shadow-sm">
        <h2 className="pb-2 text-[13px] font-bold">WhatsApp AI Agent</h2>
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              agent.connected ? "bg-[#e3f3e7] text-[#1f9d4d]" : "bg-black/[0.05] text-black/35"
            }`}
          >
            <MessageCircleHeart className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold">
              {agent.label}
              <span className={`h-2 w-2 rounded-full ${agent.connected ? "bg-[#2bb45f]" : "bg-black/25"}`} aria-hidden />
            </span>
            <span className="block truncate text-[11px] text-black/45" title={agent.detail}>
              {agent.detail}
            </span>
          </span>
        </div>
      </section>
    </div>
  );
}

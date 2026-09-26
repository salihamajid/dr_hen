import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, FileBarChart, TrendingUp, Skull } from "lucide-react";
import { requireFarmer } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Reports — Dr. Hen" };

const CARDS = [
  { href: "/farmer/reports/mortality", title: "Shift Report: Daily Mortality", body: "Losses over a date range, with a daily chart.", icon: Skull, cta: "View report" },
  { href: "/farmer/reports/growth", title: "Chicks Report: Growth", body: "Actual weight against the expected target.", icon: TrendingUp, cta: "View report" },
  { href: "/farmer/reports/daily", title: "Daily Report", body: "Everything you recorded for one day, in one place.", icon: CalendarDays, cta: "Generate report" },
];

export default async function ReportsHubPage() {
  await requireFarmer();
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <FileBarChart className="h-5 w-5 text-brand-green" aria-hidden />
        <h1 className="text-xl font-bold">Reports</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {CARDS.map(({ href, title, body, icon: Icon, cta }) => (
          <Link key={href} href={href} className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:ring-brand-green">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f5ea] text-brand-green">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-bold leading-tight">{title}</h2>
              <p className="mt-1 text-xs text-black/50">{body}</p>
            </div>
            <span className="mt-auto text-sm font-semibold text-brand-green-dark">{cta} →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

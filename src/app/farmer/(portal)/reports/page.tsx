import Link from "next/link";
import { CalendarDays, FileBarChart, TrendingUp, Skull } from "lucide-react";
import { requireFarmer } from "@/lib/auth/dal";
import { getT, type I18nKey } from "@/lib/i18n";
import { localizedTitle } from "@/lib/i18n/metadata";

export const generateMetadata = () => localizedTitle("title.reports");

const CARDS: { href: string; title: I18nKey; body: I18nKey; icon: typeof Skull; cta: I18nKey }[] = [
  { href: "/farmer/reports/mortality", title: "reports.cardMort", body: "reports.cardMortBody", icon: Skull, cta: "reports.viewReport" },
  { href: "/farmer/reports/growth", title: "reports.cardGrowth", body: "reports.cardGrowthBody", icon: TrendingUp, cta: "reports.viewReport" },
  { href: "/farmer/reports/daily", title: "reports.cardDaily", body: "reports.cardDailyBody", icon: CalendarDays, cta: "reports.generateLink" },
];

export default async function ReportsHubPage() {
  const { language } = await requireFarmer();
  const t = getT(language);
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <FileBarChart className="h-5 w-5 text-brand-green" aria-hidden />
        <h1 className="text-xl font-bold">{t("reports.title")}</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {CARDS.map(({ href, title, body, icon: Icon, cta }) => (
          <Link key={href} href={href} className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:ring-brand-green">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f5ea] text-brand-green">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-bold leading-tight">{t(title)}</h2>
              <p className="mt-1 text-xs text-black/50">{t(body)}</p>
            </div>
            <span className="mt-auto text-sm font-semibold text-brand-green-dark">{t(cta)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

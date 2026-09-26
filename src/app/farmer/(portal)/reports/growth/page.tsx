import Link from "next/link";
import { Activity, Scale, Target } from "lucide-react";
import { GrowthChart } from "@/components/farmer/ReportCharts";
import { ShareBar } from "@/components/farmer/ShareBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { requireFarmer } from "@/lib/auth/dal";
import { getT, type I18nKey } from "@/lib/i18n";
import { localizedTitle } from "@/lib/i18n/metadata";
import { prisma } from "@/lib/prisma";
import { loadReport } from "@/lib/reports/queries";
import { GROWTH_PERIODS } from "@/lib/validators/reportQuery";
import { whatsappChatLink } from "@/lib/whatsapp/businessNumber";

export const generateMetadata = () => localizedTitle("title.reports");
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function GrowthReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { farmerId, language } = await requireFarmer();
  const t = getT(language);
  const sp = await searchParams;

  const flocks = await prisma.flock.findMany({ where: { farmerId }, orderBy: { startDate: "desc" }, select: { id: true, name: true } });
  const flockId = one(sp.flockId) ?? flocks[0]?.id ?? "";
  const rawPeriod = one(sp.period);
  const period = (GROWTH_PERIODS as readonly string[]).includes(rawPeriod ?? "") ? (rawPeriod as (typeof GROWTH_PERIODS)[number]) : "all";

  const [loaded, waLink] = await Promise.all([flockId ? loadReport(farmerId, { type: "growth", flockId, period }) : null, whatsappChatLink()]);
  const report = loaded?.ok && loaded.report.type === "growth" ? loaded.report : null;

  const input = "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-green";
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <Link href="/farmer/reports" className="text-xs text-black/40 hover:underline">{t("reports.back")}</Link>
        <h1 className="mt-1 text-xl font-bold">{t("reports.growthTitle")}</h1>
      </div>

      {flocks.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-black/45 shadow-sm ring-1 ring-black/5">{t("common.addFlockFirst")}</p>
      ) : (
        <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <label className="text-xs font-semibold text-black/60">{t("common.flock")}
            <select name="flockId" defaultValue={flockId} className={`${input} mt-1 block`}>
              {flocks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-black/60">{t("reports.period")}
            <select name="period" defaultValue={period} className={`${input} mt-1 block`}>
              {GROWTH_PERIODS.map((p) => <option key={p} value={p}>{t(`reports.period.${p}` as I18nKey)}</option>)}
            </select>
          </label>
          <button type="submit" className="rounded-xl bg-brand-green-dark px-4 py-2.5 text-sm font-semibold text-white">{t("reports.show")}</button>
        </form>
      )}

      {report && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard icon={Scale} label={report.current ? t("reports.currentWeightDay", { n: report.current.ageDays }) : t("reports.currentWeight")} value={report.current ? `${report.current.grams.toLocaleString("en-IN")} g` : t("reports.noWeightYet")} tint="green" />
            <StatCard icon={Target} label={t("reports.expectedWeight")} value={report.expectedGrams ? `${report.expectedGrams.toLocaleString("en-IN")} g` : report.hasReference ? t("common.na") : t("reports.noReference")} tint="blue" />
            <StatCard icon={Activity} label={t("reports.growthRate")} value={report.status ? t(`growth.${report.status}` as I18nKey) : t("common.na")} tint={report.status === "BELOW_TARGET" ? "red" : report.status === "SLIGHTLY_BELOW" ? "amber" : "green"} />
          </div>

          {!report.current && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{t("reports.noWeightPeriod")}</p>}
          {!report.hasReference && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{t("reports.noRefBreed", { breed: report.flock.breed })}</p>}

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-2 text-base font-bold">{t("reports.progress")}</h2>
            <GrowthChart points={report.points} />
            {report.hasReference && <p className="mt-2 text-[11px] text-black/40">{t("reports.refNote")}</p>}
          </section>
          <ShareBar request={{ type: "growth", flockId, period }} waLink={waLink} />
        </>
      )}
    </div>
  );
}

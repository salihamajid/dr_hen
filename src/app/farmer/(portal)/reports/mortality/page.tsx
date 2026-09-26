import Link from "next/link";
import { Bird, Percent, Skull } from "lucide-react";
import { MortalityChart } from "@/components/farmer/ReportCharts";
import { ShareBar } from "@/components/farmer/ShareBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { requireFarmer } from "@/lib/auth/dal";
import { getT } from "@/lib/i18n";
import { localizedTitle } from "@/lib/i18n/metadata";
import { translateMessage } from "@/lib/i18n/messages";
import { prisma } from "@/lib/prisma";
import { loadReport } from "@/lib/reports/queries";
import { whatsappChatLink } from "@/lib/whatsapp/businessNumber";

export const generateMetadata = () => localizedTitle("title.reports");
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const dayOffset = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

export default async function MortalityReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { farmerId, language } = await requireFarmer();
  const t = getT(language);
  const sp = await searchParams;

  const flocks = await prisma.flock.findMany({ where: { farmerId }, orderBy: { startDate: "desc" }, select: { id: true, name: true } });
  const flockId = one(sp.flockId) ?? flocks[0]?.id ?? "";
  const from = one(sp.from) ?? dayOffset(-13);
  const to = one(sp.to) ?? dayOffset(0);

  const [loaded, waLink] = await Promise.all([
    flockId ? loadReport(farmerId, { type: "mortality", flockId, from, to }) : null,
    whatsappChatLink(),
  ]);
  const report = loaded?.ok && loaded.report.type === "mortality" ? loaded.report : null;
  const problem = loaded && !loaded.ok ? translateMessage(language, loaded.error) : null;
  const entriesWord = report ? (report.entryDays === 1 ? t("dashboard.entry") : t("dashboard.entries")) : "";

  const input = "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-green";
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <Link href="/farmer/reports" className="text-xs text-black/40 hover:underline">{t("reports.back")}</Link>
        <h1 className="mt-1 text-xl font-bold">{t("reports.mortTitle")}</h1>
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
          <label className="text-xs font-semibold text-black/60">{t("reports.from")}
            <input type="date" name="from" defaultValue={from} className={`${input} mt-1 block`} />
          </label>
          <label className="text-xs font-semibold text-black/60">{t("reports.to")}
            <input type="date" name="to" defaultValue={to} className={`${input} mt-1 block`} />
          </label>
          <button type="submit" className="rounded-xl bg-brand-green-dark px-4 py-2.5 text-sm font-semibold text-white">{t("reports.show")}</button>
        </form>
      )}

      {problem && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{problem}</p>}

      {report && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard icon={Bird} label={t("reports.totalBirds")} value={report.totalBirds.toLocaleString("en-IN")} tint="blue" />
            <StatCard icon={Skull} label={t("reports.totalMort", { n: report.entryDays, entries: entriesWord })} value={report.totalDeaths.toLocaleString("en-IN")} tint="red" />
            <StatCard icon={Percent} label={t("reports.mortPct")} value={`${report.percent}%`} tint="amber" />
          </div>
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-2 text-base font-bold">{t("reports.dailyMort")}</h2>
            <MortalityChart days={report.days} />
            <p className="mt-2 text-[11px] text-black/40">{t("reports.blankNote")}</p>
          </section>
          <ShareBar request={{ type: "mortality", flockId, from, to }} waLink={waLink} />
          <p className="text-[11px] text-black/40">{t("reports.monitorNote")}</p>
        </>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Scale, Target } from "lucide-react";
import { GrowthChart } from "@/components/farmer/ReportCharts";
import { ShareBar } from "@/components/farmer/ShareBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { requireFarmer } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { GROWTH_REFERENCE_NOTE, GROWTH_STATUS_LABEL } from "@/lib/reports/growthStandards";
import { loadReport } from "@/lib/reports/queries";
import { GROWTH_PERIODS } from "@/lib/validators/reportQuery";
import { whatsappChatLink } from "@/lib/whatsapp/businessNumber";

export const metadata: Metadata = { title: "Growth report — Dr. Hen" };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const PERIOD_LABEL = { all: "All weeks", "1-4": "Week 1–4", "5-8": "Week 5–8" } as const;

export default async function GrowthReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { farmerId } = await requireFarmer();
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
        <Link href="/farmer/reports" className="text-xs text-black/40 hover:underline">← Reports</Link>
        <h1 className="mt-1 text-xl font-bold">Growth Report</h1>
      </div>

      {flocks.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-black/45 shadow-sm ring-1 ring-black/5">Add a flock first.</p>
      ) : (
        <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <label className="text-xs font-semibold text-black/60">Flock
            <select name="flockId" defaultValue={flockId} className={`${input} mt-1 block`}>
              {flocks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-black/60">Period
            <select name="period" defaultValue={period} className={`${input} mt-1 block`}>
              {GROWTH_PERIODS.map((p) => <option key={p} value={p}>{PERIOD_LABEL[p]}</option>)}
            </select>
          </label>
          <button type="submit" className="rounded-xl bg-brand-green-dark px-4 py-2.5 text-sm font-semibold text-white">Show report</button>
        </form>
      )}

      {report && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard icon={Scale} label={report.current ? `Current Weight · day ${report.current.ageDays}` : "Current Weight"} value={report.current ? `${report.current.grams.toLocaleString("en-IN")} g` : "No weight yet"} tint="green" />
            <StatCard icon={Target} label="Expected Weight" value={report.expectedGrams ? `${report.expectedGrams.toLocaleString("en-IN")} g` : report.hasReference ? "n/a" : "No reference"} tint="blue" />
            <StatCard icon={Activity} label="Growth Rate" value={report.status ? GROWTH_STATUS_LABEL[report.status] : "n/a"} tint={report.status === "BELOW_TARGET" ? "red" : report.status === "SLIGHTLY_BELOW" ? "amber" : "green"} />
          </div>

          {!report.current && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              No weight recorded in this period. Add &quot;Average bird weight&quot; on the Daily Entry screen to see growth here.
            </p>
          )}
          {!report.hasReference && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              There is no expected-weight reference for the breed &quot;{report.flock.breed}&quot;, so only your recorded weights are shown.
            </p>
          )}

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-2 text-base font-bold">Weight progress</h2>
            <GrowthChart points={report.points} />
            {report.hasReference && <p className="mt-2 text-[11px] text-black/40">{GROWTH_REFERENCE_NOTE}</p>}
          </section>
          <ShareBar request={{ type: "growth", flockId, period }} waLink={waLink} />
        </>
      )}
    </div>
  );
}

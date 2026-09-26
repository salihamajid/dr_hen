import type { Metadata } from "next";
import Link from "next/link";
import { ShareBar } from "@/components/farmer/ShareBar";
import { requireFarmer } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { loadReport } from "@/lib/reports/queries";
import { reportRows } from "@/lib/reports/reportText";
import { whatsappChatLink } from "@/lib/whatsapp/businessNumber";

export const metadata: Metadata = { title: "Daily report — Dr. Hen" };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const today = () => new Date().toISOString().slice(0, 10);

export default async function DailyReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { farmerId } = await requireFarmer();
  const sp = await searchParams;

  const flocks = await prisma.flock.findMany({ where: { farmerId }, orderBy: { startDate: "desc" }, select: { id: true, name: true } });
  const flockId = one(sp.flockId) ?? flocks[0]?.id ?? "";
  const date = one(sp.date) ?? today();
  const generate = one(sp.generate) === "1";

  const [loaded, waLink] = await Promise.all([
    generate && flockId ? loadReport(farmerId, { type: "daily", flockId, date }) : null,
    whatsappChatLink(),
  ]);
  const report = loaded?.ok && loaded.report.type === "daily" ? loaded.report : null;
  const problem = loaded && !loaded.ok ? loaded.error : null;
  const view = report ? reportRows(report) : null;

  const input = "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-green";
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <Link href="/farmer/reports" className="text-xs text-black/40 hover:underline">← Reports</Link>
        <h1 className="mt-1 text-xl font-bold">Daily Report</h1>
      </div>

      {flocks.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-black/45 shadow-sm ring-1 ring-black/5">Add a flock first.</p>
      ) : (
        <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <input type="hidden" name="generate" value="1" />
          <label className="text-xs font-semibold text-black/60">Flock
            <select name="flockId" defaultValue={flockId} className={`${input} mt-1 block`}>
              {flocks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-black/60">Date
            <input type="date" name="date" defaultValue={date} className={`${input} mt-1 block`} />
          </label>
          <button type="submit" className="rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white">Generate Report</button>
        </form>
      )}

      {problem && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{problem}</p>}

      {view && report && (
        <>
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-base font-bold">{view.subtitle}</h2>
            <dl className="mt-3 divide-y divide-black/5 text-sm">
              {view.rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2">
                  <dt className="text-black/50">{k}</dt>
                  <dd className="text-right font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            {!report.entry && (
              <p className="mt-3 text-xs text-black/45">
                Record this day on the <Link href="/farmer/daily-entry" className="font-semibold underline">Daily Entry</Link> screen first.
              </p>
            )}
          </section>
          {report.entry && <ShareBar request={{ type: "daily", flockId, date }} waLink={waLink} />}
        </>
      )}
    </div>
  );
}

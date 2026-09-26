import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFarmer } from "@/lib/auth/dal";
import { flockAgeWeeks } from "@/lib/flocks";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Flock details — Dr. Hen" };
export const dynamic = "force-dynamic";

export default async function FlockDetailPage({ params }: { params: Promise<{ flockId: string }> }) {
  const { farmerId } = await requireFarmer();
  const { flockId } = await params;

  // The URL id is only a filter next to the session's farmerId. Another farmer's
  // flock is indistinguishable from one that doesn't exist: both are a 404.
  const flock = await prisma.flock.findFirst({ where: { id: flockId, farmerId } });
  if (!flock) notFound();

  const [totals, recent] = await Promise.all([
    prisma.dailyReport.aggregate({ where: { farmerId, flockId: flock.id }, _sum: { mortalityCount: true }, _count: { _all: true } }),
    prisma.dailyReport.findMany({
      where: { farmerId, flockId: flock.id },
      orderBy: { date: "desc" },
      take: 10,
      select: { id: true, date: true, mortalityCount: true, feedKg: true, waterLiters: true, avgWeightGrams: true },
    }),
  ]);

  const deaths = totals._sum.mortalityCount ?? 0;
  const alive = Math.max(0, flock.sizeCount - deaths);
  const fmt = (n: number) => n.toLocaleString("en-IN");

  const facts: [string, string][] = [
    ["Breed / type", flock.breed],
    ["Age", `${flockAgeWeeks(flock.startDate)} weeks`],
    ["Started", flock.startDate.toLocaleDateString("en-GB", { timeZone: "UTC" })],
    ["Birds placed", fmt(flock.sizeCount)],
    ["Recorded deaths", fmt(deaths)],
    ["Birds remaining (est.)", fmt(alive)],
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <Link href="/farmer/flocks" className="text-xs text-black/40 hover:underline">
          ← All flocks
        </Link>
        <h1 className="mt-1 text-xl font-bold">
          {flock.name}
          {!flock.active && <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-black/50">Inactive</span>}
        </h1>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {facts.map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
            <dt className="text-[11px] text-black/45">{k}</dt>
            <dd className="mt-0.5 text-base font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="text-base font-bold">Recent daily entries</h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-black/45">No daily entries recorded for this flock yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-black/40">
                <tr>
                  <th className="py-1.5 pr-4 font-semibold">Date</th>
                  <th className="py-1.5 pr-4 font-semibold">Deaths</th>
                  <th className="py-1.5 pr-4 font-semibold">Feed (kg)</th>
                  <th className="py-1.5 pr-4 font-semibold">Water (L)</th>
                  <th className="py-1.5 font-semibold">Avg wt (g)</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-black/5">
                    <td className="py-2 pr-4">{r.date.toLocaleDateString("en-GB", { timeZone: "UTC" })}</td>
                    <td className="py-2 pr-4">{r.mortalityCount}</td>
                    <td className="py-2 pr-4">{r.feedKg ?? "—"}</td>
                    <td className="py-2 pr-4">{r.waterLiters ?? "—"}</td>
                    <td className="py-2">{r.avgWeightGrams ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await prisma.dailyReport.findMany({
    orderBy: { date: "desc" },
    take: 50,
    include: { farmer: { select: { id: true, name: true, location: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Reports</h1>

      <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm md:p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-black/40">
              <th className="pb-3 pr-4 font-medium">Farmer</th>
              <th className="pb-3 pr-4 font-medium">Date</th>
              <th className="pb-3 pr-4 font-medium">FCR</th>
              <th className="pb-3 pr-4 font-medium">Avg Weight (g)</th>
              <th className="pb-3 pr-4 font-medium">Mortality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {reports.map((r) => (
              <tr key={r.id}>
                <td className="py-3 pr-4">
                  <Link href={`/farmers/${r.farmer.id}`} className="font-medium hover:underline">
                    {r.farmer.name}
                  </Link>
                  <div className="text-xs text-black/40">{r.farmer.location}</div>
                </td>
                <td className="py-3 pr-4 text-black/60">{new Date(r.date).toLocaleDateString()}</td>
                <td className="py-3 pr-4">{r.fcr?.toFixed(2) ?? "—"}</td>
                <td className="py-3 pr-4">{r.avgWeightGrams?.toFixed(0) ?? "—"}</td>
                <td className="py-3 pr-4">{r.mortalityCount}</td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-black/40">
                  No daily reports yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

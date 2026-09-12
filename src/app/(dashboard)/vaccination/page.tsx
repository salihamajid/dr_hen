import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { TREATMENT_STATUS_COLOR, TREATMENT_STATUS_LABEL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function VaccinationPage() {
  const vaccinations = await prisma.vaccination.findMany({
    orderBy: { scheduledDate: "asc" },
    include: { farmer: { select: { id: true, name: true, location: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Vaccination</h1>

      <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm md:p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-black/40">
              <th className="pb-3 pr-4 font-medium">Farmer</th>
              <th className="pb-3 pr-4 font-medium">Vaccine</th>
              <th className="pb-3 pr-4 font-medium">Scheduled Date</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pr-4 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {vaccinations.map((v) => (
              <tr key={v.id}>
                <td className="py-3 pr-4">
                  <Link href={`/farmers/${v.farmer.id}`} className="font-medium hover:underline">
                    {v.farmer.name}
                  </Link>
                  <div className="text-xs text-black/40">{v.farmer.location}</div>
                </td>
                <td className="py-3 pr-4">{v.vaccineName}</td>
                <td className="py-3 pr-4 text-black/60">{new Date(v.scheduledDate).toLocaleDateString()}</td>
                <td className="py-3 pr-4">
                  <Badge className={TREATMENT_STATUS_COLOR[v.status]}>{TREATMENT_STATUS_LABEL[v.status]}</Badge>
                </td>
                <td className="py-3 pr-4 text-black/60">{v.notes ?? "—"}</td>
              </tr>
            ))}
            {vaccinations.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-black/40">
                  No vaccinations scheduled yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

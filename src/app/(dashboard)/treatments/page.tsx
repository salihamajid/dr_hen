import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { TREATMENT_STATUS_COLOR, TREATMENT_STATUS_LABEL, DISEASE_LABEL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TreatmentsPage() {
  const treatments = await prisma.treatment.findMany({
    orderBy: { createdAt: "desc" },
    include: { farmer: { select: { id: true, name: true, location: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Treatments</h1>

      <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm md:p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-black/40">
              <th className="pb-3 pr-4 font-medium">Farmer</th>
              <th className="pb-3 pr-4 font-medium">Disease</th>
              <th className="pb-3 pr-4 font-medium">Medicines Given</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pr-4 font-medium">Next Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {treatments.map((t) => (
              <tr key={t.id}>
                <td className="py-3 pr-4">
                  <Link href={`/farmers/${t.farmer.id}`} className="font-medium hover:underline">
                    {t.farmer.name}
                  </Link>
                  <div className="text-xs text-black/40">{t.farmer.location}</div>
                </td>
                <td className="py-3 pr-4">{DISEASE_LABEL[t.diseaseCode] ?? t.diseaseCode}</td>
                <td className="py-3 pr-4 text-black/60">{(t.medicinesGiven as string[]).join(", ")}</td>
                <td className="py-3 pr-4">
                  <Badge className={TREATMENT_STATUS_COLOR[t.status]}>{TREATMENT_STATUS_LABEL[t.status]}</Badge>
                </td>
                <td className="py-3 pr-4 text-black/60">
                  {t.nextActionAt ? (
                    <>
                      {t.nextActionNote} — {new Date(t.nextActionAt).toLocaleDateString()}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {treatments.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-black/40">
                  No treatments recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

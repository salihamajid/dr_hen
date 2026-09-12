import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import {
  FARMER_STATUS_COLOR,
  FARMER_STATUS_LABEL,
  TREATMENT_STATUS_COLOR,
  TREATMENT_STATUS_LABEL,
  DISEASE_LABEL,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function FarmerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const farmer = await prisma.farmer.findUnique({
    where: { id },
    include: {
      dailyReports: { orderBy: { date: "desc" }, take: 10 },
      treatments: { orderBy: { createdAt: "desc" } },
      vaccinations: { orderBy: { scheduledDate: "desc" } },
    },
  });

  if (!farmer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{farmer.name}</h1>
          <p className="text-sm text-black/50">
            {farmer.location} · {farmer.breed} · {farmer.flockSize.toLocaleString()} birds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={FARMER_STATUS_COLOR[farmer.status]}>{FARMER_STATUS_LABEL[farmer.status]}</Badge>
          <Link href={`/messages/${farmer.id}`} className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white">
            View Messages
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="WhatsApp" value={farmer.whatsappNumber} />
        <InfoCard label="Number of Sheds" value={String(farmer.numberOfSheds)} />
        <InfoCard label="Flock Age" value={`${farmer.flockAgeWeeks} weeks`} />
        <InfoCard label="Breed" value={farmer.breed} />
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold">Daily Reports</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-black/40">
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 pr-4 font-medium">FCR</th>
                <th className="pb-2 pr-4 font-medium">Avg Weight (g)</th>
                <th className="pb-2 pr-4 font-medium">Mortality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {farmer.dailyReports.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 pr-4">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">{r.fcr?.toFixed(2) ?? "—"}</td>
                  <td className="py-2 pr-4">{r.avgWeightGrams?.toFixed(0) ?? "—"}</td>
                  <td className="py-2 pr-4">{r.mortalityCount}</td>
                </tr>
              ))}
              {farmer.dailyReports.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-black/40">
                    No daily reports yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold">Treatments</h2>
        <ul className="space-y-3">
          {farmer.treatments.map((t) => (
            <li key={t.id} className="rounded-xl border border-black/5 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{DISEASE_LABEL[t.diseaseCode] ?? t.diseaseCode}</span>
                <Badge className={TREATMENT_STATUS_COLOR[t.status]}>{TREATMENT_STATUS_LABEL[t.status]}</Badge>
              </div>
              <p className="mt-1 text-xs text-black/50">
                Medicines: {(t.medicinesGiven as string[]).join(", ")}
              </p>
              {t.nextActionAt && (
                <p className="mt-1 text-xs text-brand-red">
                  Next: {t.nextActionNote} — {new Date(t.nextActionAt).toLocaleDateString()}
                </p>
              )}
            </li>
          ))}
          {farmer.treatments.length === 0 && <p className="text-sm text-black/40">No treatments recorded yet.</p>}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold">Vaccinations</h2>
        <ul className="space-y-2 text-sm">
          {farmer.vaccinations.map((v) => (
            <li key={v.id} className="flex items-center justify-between">
              <span>{v.vaccineName}</span>
              <span className="text-black/50">{new Date(v.scheduledDate).toLocaleDateString()}</span>
            </li>
          ))}
          {farmer.vaccinations.length === 0 && <p className="text-black/40">No vaccinations scheduled yet.</p>}
        </ul>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="text-xs text-black/40">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

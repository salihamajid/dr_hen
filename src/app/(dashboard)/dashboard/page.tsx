import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AnimatedDrHen } from "@/components/dashboard/AnimatedDrHen";
import { HeroBanner } from "@/components/dashboard/HeroBanner";
import { FarmersOverviewTable, issueLabelFor, type FarmerOverviewRow } from "@/components/dashboard/FarmersOverviewTable";
import { TreatmentStatusDonut, type TreatmentStatusDatum } from "@/components/dashboard/TreatmentStatusDonut";
import { CommonDiseasesBarList, type DiseaseShare } from "@/components/dashboard/CommonDiseasesBarList";
import { UpcomingActionsList, type UpcomingAction } from "@/components/dashboard/UpcomingActionsList";
import { SendReminderCTA } from "@/components/dashboard/SendReminderCTA";
import { DISEASE_LABEL } from "@/lib/constants";

// Every figure below is read from Postgres on each request — adding a farmer,
// changing a flock size, or completing a treatment is reflected on the next
// load with no cache to invalidate.
export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Treatment.medicinesGiven is a Json column holding string[]; read it defensively. */
function firstMedicine(value: Prisma.JsonValue): string | null {
  if (!Array.isArray(value)) return null;
  const first = value[0];
  return typeof first === "string" ? first : null;
}

export default async function DashboardPage() {
  const now = new Date();
  // "Overdue" is partly derived: the schema has an explicit OVERDUE status, but
  // a SCHEDULED/IN_PROGRESS treatment whose nextActionAt has passed is overdue
  // in practice too, so both are counted. Splitting this into indexed counts
  // keeps it correct without loading every treatment row into memory.
  const notCompleted = { not: "COMPLETED" } as const;

  const [
    totalFarmers,
    totalBirdsAgg,
    treatmentsGiven,
    messagesSent,
    completedCount,
    inProgressOnTrack,
    scheduledOnTrack,
    flaggedOverdue,
    derivedOverdue,
    treatmentsByDisease,
    upcomingTreatments,
    upcomingVaccinations,
    farmers,
  ] = await Promise.all([
    prisma.farmer.count(),
    prisma.farmer.aggregate({ _sum: { flockSize: true } }),
    prisma.treatment.count(),
    prisma.message.count({ where: { direction: "OUTBOUND" } }),
    prisma.treatment.count({ where: { status: "COMPLETED" } }),
    prisma.treatment.count({
      where: { status: "IN_PROGRESS", OR: [{ nextActionAt: null }, { nextActionAt: { gte: now } }] },
    }),
    prisma.treatment.count({
      where: { status: "SCHEDULED", OR: [{ nextActionAt: null }, { nextActionAt: { gte: now } }] },
    }),
    prisma.treatment.count({ where: { status: "OVERDUE" } }),
    prisma.treatment.count({
      where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] }, nextActionAt: { lt: now } },
    }),
    prisma.treatment.groupBy({ by: ["diseaseCode"], _count: { diseaseCode: true } }),
    prisma.treatment.findMany({
      where: { nextActionAt: { not: null }, status: notCompleted },
      orderBy: { nextActionAt: "asc" },
      take: 5,
      include: { farmer: { select: { name: true } } },
    }),
    prisma.vaccination.findMany({
      where: { status: notCompleted },
      orderBy: { scheduledDate: "asc" },
      take: 5,
      include: { farmer: { select: { name: true } } },
    }),
    prisma.farmer.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { treatments: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);

  const statusData: TreatmentStatusDatum[] = [
    { status: "COMPLETED", count: completedCount },
    { status: "IN_PROGRESS", count: inProgressOnTrack },
    { status: "SCHEDULED", count: scheduledOnTrack },
    { status: "OVERDUE", count: flaggedOverdue + derivedOverdue },
  ];

  const totalDiseaseTreatments = treatmentsByDisease.reduce((sum, t) => sum + t._count.diseaseCode, 0);
  const diseaseShares: DiseaseShare[] = treatmentsByDisease
    .map((t) => ({
      code: t.diseaseCode,
      label: DISEASE_LABEL[t.diseaseCode] ?? t.diseaseCode,
      percent: Math.round((t._count.diseaseCode / totalDiseaseTreatments) * 100),
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);

  const upcomingActions: UpcomingAction[] = [
    ...upcomingTreatments.map((t) => ({
      id: `t-${t.id}`,
      label: t.nextActionNote ?? "Follow-up",
      farmerName: t.farmer.name,
      at: t.nextActionAt as Date,
    })),
    ...upcomingVaccinations.map((v) => ({
      id: `v-${v.id}`,
      label: v.vaccineName,
      farmerName: v.farmer.name,
      at: v.scheduledDate,
    })),
  ]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, 4)
    .map(({ id, label, farmerName, at }) => ({
      id,
      label,
      farmerName,
      date: formatDate(at),
      overdue: at.getTime() < now.getTime(),
    }));

  const farmerRows: FarmerOverviewRow[] = farmers.map((f) => {
    const latest = f.treatments[0];
    const nextActionAt = latest?.nextActionAt ?? null;
    return {
      id: f.id,
      name: f.name,
      location: f.location,
      whatsappNumber: f.whatsappNumber,
      flockSize: f.flockSize,
      status: f.status,
      currentIssue: issueLabelFor(latest?.diseaseCode),
      lastTreatmentLabel: latest ? firstMedicine(latest.medicinesGiven) ?? "Treatment" : "—",
      lastTreatmentDate: latest?.startedAt ? formatDate(latest.startedAt) : "",
      nextActionLabel: nextActionAt ? latest?.nextActionNote ?? "Follow-up" : "—",
      nextActionDate: nextActionAt ? formatDate(nextActionAt) : "",
      nextActionOverdue: nextActionAt ? nextActionAt.getTime() < now.getTime() : false,
    };
  });

  return (
    <div className="flex min-h-0 flex-col gap-3 xl:h-full xl:overflow-hidden">
      {/* Upper region — the character is an overlay here so it can bleed across
          the hero band and the table's left edge, as in the reference. */}
      <div className="relative flex min-h-0 flex-1 flex-col gap-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-[350px] xl:block">
          <AnimatedDrHen className="h-full w-full" priority />
        </div>

        <div className="shrink-0 xl:pl-[300px]">
          <HeroBanner
            totalFarmers={totalFarmers}
            totalBirds={totalBirdsAgg._sum.flockSize ?? 0}
            treatmentsGiven={treatmentsGiven}
            messagesSent={messagesSent}
          />
        </div>

        <div className="relative z-10 min-h-[340px] flex-1 xl:min-h-0 xl:pl-[300px]">
          <FarmersOverviewTable farmers={farmerRows} totalFarmers={totalFarmers} />
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:h-[188px] xl:grid-cols-4">
        <TreatmentStatusDonut data={statusData} />
        <CommonDiseasesBarList data={diseaseShares} />
        <UpcomingActionsList actions={upcomingActions} />
        <SendReminderCTA />
      </div>
    </div>
  );
}

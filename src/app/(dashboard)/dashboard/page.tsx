import { prisma } from "@/lib/prisma";
import { HeroBanner } from "@/components/dashboard/HeroBanner";
import { FarmersOverviewTable, issueLabelFor, type FarmerOverviewRow } from "@/components/dashboard/FarmersOverviewTable";
import { TreatmentStatusDonut, type TreatmentStatusDatum } from "@/components/dashboard/TreatmentStatusDonut";
import { CommonDiseasesBarList, type DiseaseShare } from "@/components/dashboard/CommonDiseasesBarList";
import { UpcomingActionsList, type UpcomingAction } from "@/components/dashboard/UpcomingActionsList";
import { SendReminderCTA } from "@/components/dashboard/SendReminderCTA";
import { DISEASE_LABEL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [farmers, totalBirdsAgg, treatmentsGiven, messagesSent, treatmentsByStatus, treatmentsByDisease, upcoming] =
    await Promise.all([
      prisma.farmer.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { treatments: { orderBy: { createdAt: "desc" }, take: 1 } },
      }),
      prisma.farmer.aggregate({ _sum: { flockSize: true } }),
      prisma.treatment.count(),
      prisma.message.count({ where: { direction: "OUTBOUND" } }),
      prisma.treatment.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.treatment.groupBy({ by: ["diseaseCode"], _count: { diseaseCode: true } }),
      prisma.treatment.findMany({
        where: { nextActionAt: { not: null } },
        orderBy: { nextActionAt: "asc" },
        take: 4,
        include: { farmer: { select: { name: true } } },
      }),
    ]);

  const farmerRows: FarmerOverviewRow[] = farmers.map((f) => {
    const latest = f.treatments[0];
    return {
      id: f.id,
      name: f.name,
      location: f.location,
      whatsappNumber: f.whatsappNumber,
      flockSize: f.flockSize,
      status: f.status,
      currentIssue: issueLabelFor(latest?.diseaseCode),
      lastTreatmentLabel: latest?.startedAt
        ? new Date(latest.startedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "—",
      nextActionLabel: latest?.nextActionAt
        ? new Date(latest.nextActionAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "—",
    };
  });

  const statusData: TreatmentStatusDatum[] = treatmentsByStatus.map((t) => ({
    status: t.status,
    count: t._count.status,
  }));

  const totalDiseaseTreatments = treatmentsByDisease.reduce((sum, t) => sum + t._count.diseaseCode, 0) || 1;
  const diseaseShares: DiseaseShare[] = treatmentsByDisease
    .map((t) => ({
      label: DISEASE_LABEL[t.diseaseCode] ?? t.diseaseCode,
      percent: Math.round((t._count.diseaseCode / totalDiseaseTreatments) * 100),
    }))
    .sort((a, b) => b.percent - a.percent);

  const upcomingActions: UpcomingAction[] = upcoming.map((t) => ({
    id: t.id,
    label: t.nextActionNote ?? "Follow-up",
    farmerName: t.farmer.name,
    date: t.nextActionAt
      ? new Date(t.nextActionAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "",
  }));

  return (
    <div className="space-y-4 md:space-y-6">
      <HeroBanner
        totalFarmers={await prisma.farmer.count()}
        totalBirds={totalBirdsAgg._sum.flockSize ?? 0}
        treatmentsGiven={treatmentsGiven}
        messagesSent={messagesSent}
      />

      <FarmersOverviewTable farmers={farmerRows} />

      <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
        <TreatmentStatusDonut data={statusData} />
        <CommonDiseasesBarList data={diseaseShares} />
        <UpcomingActionsList actions={upcomingActions} />
        <SendReminderCTA />
      </div>
    </div>
  );
}

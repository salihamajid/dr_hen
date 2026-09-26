import type { Metadata } from "next";
import { ReportForm } from "@/components/farmer/ReportForm";
import { requireFarmer } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Daily Entry — Dr. Hen" };
export const dynamic = "force-dynamic";

export default async function DailyEntryPage() {
  const { farmerId } = await requireFarmer();
  const flocks = await prisma.flock.findMany({
    where: { farmerId, active: true },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Daily Entry</h1>
        <p className="text-xs text-black/50">Record today&apos;s feed, water, deaths and temperature. It takes a minute.</p>
      </div>
      <ReportForm mode="daily" flocks={flocks} />
    </div>
  );
}

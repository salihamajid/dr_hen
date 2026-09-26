import type { Metadata } from "next";
import { ReportForm } from "@/components/farmer/ReportForm";
import { requireFarmer } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Attributes — Dr. Hen" };
export const dynamic = "force-dynamic";

export default async function AttributesPage() {
  const { farmerId } = await requireFarmer();
  const flocks = await prisma.flock.findMany({
    where: { farmerId, active: true },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Attributes</h1>
        <p className="text-xs text-black/50">Farm conditions that affect your flock: temperature, humidity, light and ventilation.</p>
      </div>
      <ReportForm mode="attributes" flocks={flocks} />
    </div>
  );
}

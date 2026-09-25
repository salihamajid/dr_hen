import { FarmerShell } from "@/components/farmer/FarmerShell";
import { requireFarmer } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export default async function FarmerPortalLayout({ children }: { children: React.ReactNode }) {
  // Behind src/proxy.ts and DB-verified: a revoked or deleted farmer is bounced here.
  const { farmerId } = await requireFarmer();
  const farmer = await prisma.farmer.findFirst({ where: { id: farmerId }, select: { name: true } });

  return <FarmerShell farmerName={farmer?.name ?? "Farmer"}>{children}</FarmerShell>;
}

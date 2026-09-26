import { redirect } from "next/navigation";
import { FarmerShell } from "@/components/farmer/FarmerShell";
import { requireFarmer } from "@/lib/auth/dal";
import { sweepAlertsIfDue } from "@/lib/alerts/engine";
import { prisma } from "@/lib/prisma";

export default async function FarmerPortalLayout({ children }: { children: React.ReactNode }) {
  // Behind src/proxy.ts and DB-verified: a revoked or deleted farmer is bounced here.
  const { farmerId, language } = await requireFarmer();
  // First login/signup: pick a language before seeing the portal. Stored on the account, so it survives logout.
  if (!language) redirect("/farmer/language");
  // "Nothing was entered" alerts can't fire on a save, so they're checked when the portal opens
  // (throttled per farmer; Render's free plan has no cron).
  await sweepAlertsIfDue(farmerId);

  const [farmer, unreadAlerts] = await Promise.all([
    prisma.farmer.findFirst({ where: { id: farmerId }, select: { name: true } }),
    prisma.alert.count({ where: { farmerId, readAt: null, status: { not: "RESOLVED" } } }),
  ]);

  return (
    <FarmerShell farmerName={farmer?.name ?? "Farmer"} unreadAlerts={unreadAlerts}>
      {children}
    </FarmerShell>
  );
}

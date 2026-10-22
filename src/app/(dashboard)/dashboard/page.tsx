import { AlertTriangle, Bird, ShieldPlus, Users } from "lucide-react";
import { BroadcastCenterCard } from "@/components/admin/BroadcastCenterCard";
import { FarmManagementBars } from "@/components/admin/FarmManagementBars";
import { HealthCarousel } from "@/components/admin/HealthCarousel";
import { KpiCard } from "@/components/admin/KpiCard";
import { RecentAlertsCard } from "@/components/admin/RecentAlertsCard";
import { requireAdmin } from "@/lib/auth/dal";
import { loadAdminDashboard } from "@/lib/admin/dashboardData";

// Read from Postgres on every request, and re-read by itself whenever anything changes —
// see LiveUpdates in the admin layout. Nothing on this page is cached or hardcoded.
export const dynamic = "force-dynamic";

const n = (v: number) => v.toLocaleString("en-IN");

/** "2 critical, 1 moderate" — only the parts that are actually non-zero. */
function alertBreakdown(b: { critical: number; moderate: number; info: number }): string {
  const parts = [
    b.critical > 0 ? `${b.critical} critical` : null,
    b.moderate > 0 ? `${b.moderate} moderate` : null,
    b.info > 0 ? `${b.info} info` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "Nothing open";
}

/** A trend only when there is something real to compare against; otherwise the raw counts. */
function coverageSub(c: { percent: number | null; done: number; due: number; deltaPoints: number | null }): string {
  if (c.percent === null) return "No doses due yet";
  if (c.deltaPoints === null) return `${n(c.done)} of ${n(c.due)} doses due`;
  if (c.deltaPoints === 0) return `${n(c.done)} of ${n(c.due)} doses due`;
  return `${c.deltaPoints > 0 ? "↑ +" : "↓ "}${Math.abs(c.deltaPoints)}% this month`;
}

export default async function DashboardPage() {
  // Re-checked here, not only in the layout: layouts don't re-run on client navigation.
  await requireAdmin();
  const data = await loadAdminDashboard();
  const { kpis } = data;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-[#14532d]">Doctor Hen Admin</h1>
        <p className="text-sm text-black/55">Monitor poultry health, farmers, and AI WhatsApp broadcasts in real time</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Users}
          tone="green"
          label="Total Farmers"
          value={n(kpis.totalFarmers)}
          sub={kpis.newFarmersThisMonth > 0 ? `↑ +${n(kpis.newFarmersThisMonth)} this month` : "No new farms this month"}
          href="/farmers"
        />
        <KpiCard
          icon={Bird}
          tone="white"
          label="Total Flocks"
          value={n(kpis.totalFlocks)}
          sub={kpis.newFlocksThisMonth > 0 ? `+${n(kpis.newFlocksThisMonth)} new flocks` : "No new flocks this month"}
          href="/flocks"
          title="Active flocks only. Counted from when the flock was registered, not when the birds arrived."
        />
        <KpiCard
          icon={AlertTriangle}
          tone="amber"
          label="Active Disease Alerts"
          value={n(kpis.activeAlerts)}
          sub={alertBreakdown(kpis.alertsBySeverity)}
          title="Alerts that are open or acknowledged, across every farm."
        />
        <KpiCard
          icon={ShieldPlus}
          tone="blue"
          label="Vaccination Coverage"
          value={kpis.coverage.percent === null ? "—" : `${kpis.coverage.percent}%`}
          sub={coverageSub(kpis.coverage)}
          href="/vaccination"
          title="Of the vaccinations already due, the share recorded as given. Doses scheduled for the future are excluded."
        />
      </div>

      {/* items-start so the broadcast card keeps its own height instead of being stretched to
          match the taller column beside it. */}
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        <BroadcastCenterCard broadcasts={data.recentBroadcasts} agentConnected={data.agent.connected} />

        <div className="flex flex-col gap-3">
          <HealthCarousel
            flockHealth={data.flockHealth}
            treatmentStatus={data.treatmentStatus}
            diseaseShares={data.diseaseShares}
          />
          <FarmManagementBars bars={data.management} />
          <RecentAlertsCard alerts={data.recentAlerts} />
        </div>
      </div>
    </div>
  );
}

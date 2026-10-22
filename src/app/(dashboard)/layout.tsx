import { DashboardShell } from "@/components/layout/DashboardShell";
import { LiveUpdates } from "@/components/realtime/LiveUpdates";
import { requireAdmin } from "@/lib/auth/dal";
import { loadAdminChrome } from "@/lib/admin/dashboardData";
import { ADMIN_STREAM } from "@/lib/realtime/events";

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Defence in depth behind src/proxy.ts: verified against the DB, so a revoked
  // admin cookie is rejected here even though the proxy (cookie-only) let it through.
  const admin = await requireAdmin();
  // The agent light and the bell count are real readings, so they live beside the session
  // check rather than being passed down from whichever page happens to be open.
  const { agent, pendingForAdmin } = await loadAdminChrome();

  return (
    <DashboardShell adminName={admin.email} agent={agent} pendingCount={pendingForAdmin}>
      {/* One connection for the whole admin area: mounted in the layout so it survives
          navigation between pages instead of reconnecting on every click. */}
      <LiveUpdates stream={ADMIN_STREAM} />
      {children}
    </DashboardShell>
  );
}

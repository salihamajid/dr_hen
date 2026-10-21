import { DashboardShell } from "@/components/layout/DashboardShell";
import { LiveUpdates } from "@/components/realtime/LiveUpdates";
import { requireAdmin } from "@/lib/auth/dal";
import { ADMIN_STREAM } from "@/lib/realtime/events";

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Defence in depth behind src/proxy.ts: verified against the DB, so a revoked
  // admin cookie is rejected here even though the proxy (cookie-only) let it through.
  const admin = await requireAdmin();
  return (
    <DashboardShell adminName={admin.email}>
      {/* One connection for the whole admin area: mounted in the layout so it survives
          navigation between pages instead of reconnecting on every click. */}
      <LiveUpdates stream={ADMIN_STREAM} />
      {children}
    </DashboardShell>
  );
}

import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireAdmin } from "@/lib/auth/dal";

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Defence in depth behind src/proxy.ts: verified against the DB, so a revoked
  // admin cookie is rejected here even though the proxy (cookie-only) let it through.
  const admin = await requireAdmin();
  return <DashboardShell adminName={admin.email}>{children}</DashboardShell>;
}

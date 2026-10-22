import Link from "next/link";
import { AlertTriangle, Bell, Info } from "lucide-react";
import type { RecentAlertRow } from "@/lib/admin/dashboardData";

const SEVERITY = {
  CRITICAL: { icon: AlertTriangle, chip: "bg-[#fdeaea] text-[#e0392b]", word: "Critical" },
  ALERT: { icon: Bell, chip: "bg-[#fdf1dc] text-[#d9901a]", word: "Alert" },
  INFO: { icon: Info, chip: "bg-[#e8f1fd] text-[#2a78d6]", word: "Info" },
} as const;

/**
 * The reference shows "Sent via WhatsApp · Delivered ✓✓" under each alert. Dr. Hen does not
 * push alerts to WhatsApp today — they are raised in the farmer's portal — so writing that
 * would be a claim about a message that was never sent. What we do know is whether the farmer
 * has opened it, which is the more useful fact anyway, and that is what this line says.
 */
export function RecentAlertsCard({ alerts }: { alerts: RecentAlertRow[] }) {
  return (
    <section id="attention" className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <h2 className="pb-2 text-[15px] font-extrabold">Recent Alerts</h2>

      {alerts.length === 0 ? (
        <p className="rounded-xl bg-[#e8f6ec] px-3 py-6 text-center text-xs font-medium text-[#1f7a4d]">
          No open alerts across any farm.
        </p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => {
            const meta = SEVERITY[a.severity];
            const Icon = meta.icon;
            return (
              <li key={a.id}>
                <Link href={`/farmers/${a.farmerId}`} className="flex items-start gap-2.5 rounded-xl p-1.5 hover:bg-black/[0.03]">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.chip}`}>
                    <Icon className="h-[15px] w-[15px]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">{a.title}</span>
                    <span className="block truncate text-[11px] text-black/50">
                      {a.farmName} · {meta.word} · {a.seen ? "Seen by farmer" : "Not opened yet"}
                    </span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-[11px] text-black/40">{a.ago}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

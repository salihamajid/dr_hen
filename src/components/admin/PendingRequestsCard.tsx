import Link from "next/link";
import { ShoppingBag, Stethoscope } from "lucide-react";
import type { PendingRequestRow } from "@/lib/admin/dashboardData";

/**
 * What farmers have asked for from their own dashboard and nobody has answered yet.
 *
 * This card exists because a farmer pressing "Request Vet" expects it to surface where an
 * admin actually looks first. It was previously only on the Requests page and in the bell
 * count, which made a working feature look broken.
 */
export function PendingRequestsCard({
  vetRequests,
  feedOrders,
  vetCount,
  feedCount,
}: {
  vetRequests: PendingRequestRow[];
  feedOrders: PendingRequestRow[];
  vetCount: number;
  feedCount: number;
}) {
  const total = vetCount + feedCount;

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2 pb-2">
        <h2 className="text-[15px] font-extrabold">Farmer Requests</h2>
        <Link href="/requests" className="shrink-0 text-xs font-bold text-[#1f7a4d] hover:underline">
          {total > 0 ? "Answer these" : "View all"} →
        </Link>
      </div>

      {total === 0 ? (
        <p className="rounded-xl bg-[#e8f6ec] px-3 py-6 text-center text-xs font-medium text-[#1f7a4d]">
          No farmer is waiting on you.
        </p>
      ) : (
        <div className="space-y-3">
          <Group
            icon={Stethoscope}
            chip="bg-[#fbe4c6] text-[#b9761a]"
            label="Vet requests"
            count={vetCount}
            rows={vetRequests}
          />
          <Group icon={ShoppingBag} chip="bg-[#ede9fe] text-[#6d4bd8]" label="Feed orders" count={feedCount} rows={feedOrders} />
        </div>
      )}
    </section>
  );
}

function Group({
  icon: Icon,
  chip,
  label,
  count,
  rows,
}: {
  icon: React.ComponentType<{ className?: string }>;
  chip: string;
  label: string;
  count: number;
  rows: PendingRequestRow[];
}) {
  if (count === 0) return null;
  return (
    <div>
      <p className="pb-1 text-[11px] font-bold uppercase tracking-wide text-black/40">
        {label} · {count} waiting
      </p>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={`/farmers/${row.farmerId}`} className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-black/[0.03]">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${chip}`}>
                <Icon className="h-[15px] w-[15px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold">{row.farmName}</span>
                <span className="block truncate text-[11px] text-black/50">{row.detail}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-[11px] text-black/40">{row.ago}</span>
            </Link>
          </li>
        ))}
        {count > rows.length && (
          <li className="ps-1.5 text-[11px] text-black/40">and {count - rows.length} more</li>
        )}
      </ul>
    </div>
  );
}

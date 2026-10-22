import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/dal";
import { RequestQueue, type QueueRow } from "@/components/admin/RequestQueue";
import { timeAgo } from "@/lib/admin/dashboardData";

export const dynamic = "force-dynamic";

/**
 * Where the farmer dashboard's Quick Actions land. Without this page, "Request Vet" and
 * "Order Feed" would write rows nobody ever looks at, which is worse than not having the
 * buttons at all.
 */
export default async function RequestsPage() {
  await requireAdmin();
  const now = new Date();

  const [escalations, orders] = await Promise.all([
    prisma.vetEscalation.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { farmer: { select: { name: true, location: true, whatsappNumber: true } }, fieldVet: { select: { name: true } } },
    }),
    prisma.feedOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { farmer: { select: { name: true, location: true } } },
    }),
  ]);

  const vetRows: QueueRow[] = escalations.map((e) => ({
    id: e.id,
    farmName: e.farmer.name,
    location: e.farmer.location,
    detail: `${e.farmer.whatsappNumber}${e.fieldVet?.name ? ` · ${e.fieldVet.name}` : ""}`,
    status: e.status,
    ago: timeAgo(e.createdAt, now),
  }));

  const feedRows: QueueRow[] = orders.map((o) => ({
    id: o.id,
    farmName: o.farmer.name,
    location: o.farmer.location,
    detail: `${o.bags} bag${o.bags === 1 ? "" : "s"}${o.note ? ` · ${o.note}` : ""}`,
    status: o.status,
    ago: timeAgo(o.createdAt, now),
  }));

  const waitingVets = vetRows.filter((r) => r.status === "PENDING").length;
  const waitingFeed = feedRows.filter((r) => r.status === "REQUESTED").length;

  return (
    <div id="attention" className="flex max-w-4xl flex-col gap-4">
      <header>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[#14532d]">Requests</h1>
        <p className="text-sm text-black/55">
          {waitingVets + waitingFeed === 0
            ? "Nothing is waiting on you."
            : `${waitingVets} vet request${waitingVets === 1 ? "" : "s"} and ${waitingFeed} feed order${waitingFeed === 1 ? "" : "s"} waiting.`}
        </p>
      </header>

      <RequestQueue
        title="Field vet requests"
        rows={vetRows}
        endpoint="/api/vet-escalation"
        options={["PENDING", "CONTACTED", "RESOLVED"]}
        emptyText="No farmer has asked for a vet."
      />

      <RequestQueue
        title="Feed orders"
        rows={feedRows}
        endpoint="/api/feed-orders"
        options={["REQUESTED", "CONFIRMED", "DELIVERED", "CANCELLED"]}
        emptyText="No feed has been ordered."
      />
    </div>
  );
}

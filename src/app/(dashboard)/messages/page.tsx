import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { FARMER_STATUS_COLOR, FARMER_STATUS_LABEL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const farmers = await prisma.farmer.findMany({
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });

  const threads = farmers.filter((f) => f.messages.length > 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Messages</h1>

      <div className="divide-y divide-black/5 rounded-2xl bg-white shadow-sm">
        {threads.map((f) => {
          const last = f.messages[0];
          return (
            <Link
              key={f.id}
              href={`/messages/${f.id}`}
              className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-black/[0.02]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{f.name}</span>
                  <Badge className={FARMER_STATUS_COLOR[f.status]}>{FARMER_STATUS_LABEL[f.status]}</Badge>
                </div>
                <p className="mt-0.5 truncate text-sm text-black/50">{last.textContent ?? `[${last.contentType}]`}</p>
              </div>
              <span className="shrink-0 text-xs text-black/40">{new Date(last.createdAt).toLocaleString()}</span>
            </Link>
          );
        })}

        {threads.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-black/40">
            No conversations yet. Use a farmer&apos;s &quot;Send Intro Video&quot; action or open a thread to simulate an
            incoming message.
          </div>
        )}
      </div>

      {threads.length === 0 && (
        <FirstThreadHint />
      )}
    </div>
  );
}

async function FirstThreadHint() {
  const anyFarmer = await prisma.farmer.findFirst();
  if (!anyFarmer) return null;
  return (
    <Link
      href={`/messages/${anyFarmer.id}`}
      className="block rounded-2xl border border-dashed border-black/20 p-5 text-center text-sm text-black/50 hover:bg-black/[0.02]"
    >
      Open {anyFarmer.name}&apos;s thread to try the &quot;Simulate Incoming Message&quot; demo panel →
    </Link>
  );
}

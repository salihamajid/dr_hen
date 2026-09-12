import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { SimulateIncomingPanel } from "@/components/messages/SimulateIncomingPanel";
import { Badge } from "@/components/ui/Badge";
import { FARMER_STATUS_COLOR, FARMER_STATUS_LABEL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MessageThreadPage({ params }: { params: Promise<{ farmerId: string }> }) {
  const { farmerId } = await params;

  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      vetEscalations: { orderBy: { createdAt: "desc" }, take: 1, include: { fieldVet: true } },
    },
  });

  if (!farmer) notFound();

  const activeEscalation = farmer.vetEscalations.find((e) => e.status !== "RESOLVED");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/messages" className="text-xs text-black/40 hover:underline">
            ← All conversations
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-bold">
            {farmer.name}
            <Badge className={FARMER_STATUS_COLOR[farmer.status]}>{FARMER_STATUS_LABEL[farmer.status]}</Badge>
          </h1>
          <p className="text-xs text-black/50">{farmer.whatsappNumber}</p>
        </div>
      </div>

      {activeEscalation && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          🚨 Escalated to Field Vet{activeEscalation.fieldVet ? ` — ${activeEscalation.fieldVet.name} (${activeEscalation.fieldVet.region})` : ""}.
          Status: {activeEscalation.status}
        </div>
      )}

      <div className="space-y-3 rounded-2xl bg-black/[0.02] p-4">
        {farmer.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {farmer.messages.length === 0 && (
          <p className="py-10 text-center text-sm text-black/40">No messages yet — try the simulate panel below.</p>
        )}
      </div>

      <SimulateIncomingPanel farmerId={farmer.id} />
    </div>
  );
}

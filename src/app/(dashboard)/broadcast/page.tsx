import { FileVideo, MessageSquare, Video } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/dal";
import { loadAdminChrome, timeAgo, type RecentBroadcastRow } from "@/lib/admin/dashboardData";

export const dynamic = "force-dynamic";

const KIND_ICON = { VIDEO: Video, MESSAGE: MessageSquare, TEMPLATE: FileVideo } as const;
const STATUS_CHIP: Record<RecentBroadcastRow["status"], string> = {
  DRAFT: "bg-black/[0.06] text-black/55",
  SENDING: "bg-[#e8f1fd] text-[#2a78d6]",
  SENT: "bg-[#e8f6ec] text-[#1f7a4d]",
  PARTIAL: "bg-[#fdf1dc] text-[#b9761a]",
  FAILED: "bg-[#fdeaea] text-[#c0392b]",
};
const STATUS_WORD: Record<RecentBroadcastRow["status"], string> = {
  DRAFT: "Draft",
  SENDING: "Sending",
  SENT: "Delivered",
  PARTIAL: "Partly delivered",
  FAILED: "Failed",
};

/**
 * The AI Broadcast area. For now it is the honest half: every broadcast Dr. Hen has sent,
 * with the per-farmer delivery counts that Meta's receipts keep up to date. The composer
 * that starts a new broadcast is the next phase; this page exists so the menu item leads
 * somewhere real rather than to a placeholder.
 */
export default async function BroadcastPage() {
  await requireAdmin();
  const [broadcasts, farmerCount, { agent }] = await Promise.all([
    prisma.broadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        kind: true,
        title: true,
        body: true,
        status: true,
        recipientCount: true,
        deliveredCount: true,
        failedCount: true,
        createdAt: true,
        sentAt: true,
        createdBy: { select: { email: true } },
      },
    }),
    prisma.farmer.count(),
    loadAdminChrome(),
  ]);

  const now = new Date();

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <header>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[#14532d]">AI Broadcast</h1>
        <p className="text-sm text-black/55">
          Messages and videos sent to farmers through the WhatsApp number Dr. Hen already uses.
        </p>
      </header>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[13px] font-semibold text-black/55">WhatsApp AI Agent</p>
            <p className="text-lg font-extrabold">
              {agent.label} <span className="text-sm font-medium text-black/45">· {agent.detail}</span>
            </p>
          </div>
          <p className="text-sm text-black/55">
            {farmerCount.toLocaleString("en-IN")} farmer{farmerCount === 1 ? "" : "s"} on record
          </p>
        </div>
        <p className="mt-2 rounded-xl bg-black/[0.03] px-3 py-2 text-xs leading-relaxed text-black/55">
          Sending is built in the next phase. Meta only allows a business-initiated message outside a
          farmer&apos;s 24-hour reply window through an approved template, so the composer has to choose
          between a free-form message and a template per farmer — which is exactly what this page will do.
        </p>
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
        <h2 className="pb-3 text-[15px] font-extrabold">Broadcast history</h2>

        {broadcasts.length === 0 ? (
          <p className="rounded-xl bg-black/[0.03] px-3 py-8 text-center text-sm text-black/45">
            No broadcasts yet. Every send will be listed here with how many farmers received it.
          </p>
        ) : (
          <ul className="divide-y divide-black/[0.06]">
            {broadcasts.map((b) => {
              const Icon = KIND_ICON[b.kind];
              return (
                <li key={b.id} className="flex items-start gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e3f3e7] text-[#1f9d4d]">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-bold">{b.title}</span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${STATUS_CHIP[b.status]}`}>
                        {STATUS_WORD[b.status]}
                      </span>
                    </div>
                    {b.body && <p className="truncate text-xs text-black/50">{b.body}</p>}
                    <p className="text-[11px] text-black/45">
                      {b.deliveredCount.toLocaleString("en-IN")} of {b.recipientCount.toLocaleString("en-IN")} delivered
                      {b.failedCount > 0 && <span className="text-[#c0392b]"> · {b.failedCount.toLocaleString("en-IN")} failed</span>}
                      {b.createdBy?.email && ` · by ${b.createdBy.email}`}
                    </p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-[11px] text-black/40">
                    {timeAgo(b.sentAt ?? b.createdAt, now)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

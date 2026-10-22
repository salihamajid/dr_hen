import Link from "next/link";
import { FileVideo, MessageSquare, Send, Video } from "lucide-react";
import type { RecentBroadcastRow } from "@/lib/admin/dashboardData";

const KIND_ICON = { VIDEO: Video, MESSAGE: MessageSquare, TEMPLATE: FileVideo } as const;

const STATUS_WORD: Record<RecentBroadcastRow["status"], string> = {
  DRAFT: "Draft",
  SENDING: "Sending",
  SENT: "Delivered",
  PARTIAL: "Partly delivered",
  FAILED: "Failed",
};

/**
 * The WhatsApp Broadcast Center, reading the Broadcast table. Every line is a real send:
 * when nothing has been sent, it says so rather than showing an example.
 *
 * The buttons go to the Broadcast page; this card is the summary, not the composer.
 */
export function BroadcastCenterCard({ broadcasts, agentConnected }: { broadcasts: RecentBroadcastRow[]; agentConnected: boolean }) {
  return (
    <section className="overflow-hidden rounded-2xl border-2 border-[#1fa651] bg-white shadow-sm">
      <div className="bg-[#19a84f] px-4 pb-4 pt-3 text-white">
        <span className="inline-block rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold tracking-wide">WhatsApp</span>
        <h2 className="mt-2 flex items-center gap-2 text-[15px] font-extrabold leading-tight">
          <Send className="h-4 w-4 shrink-0" aria-hidden />
          Doctor Hen AI Agent — WhatsApp Broadcast Center
        </h2>
        <p className="mt-1 text-xs text-white/85">Send messages and videos to farmers on the number Dr. Hen already uses.</p>
      </div>

      <div className="p-4">
        <h3 className="pb-2 text-sm font-bold">Recent Broadcasts</h3>

        {broadcasts.length === 0 ? (
          <p className="rounded-xl bg-black/[0.03] px-3 py-6 text-center text-xs text-black/45">
            Nothing has been broadcast yet. Sends will appear here with their delivery counts.
          </p>
        ) : (
          <ul className="space-y-2">
            {broadcasts.map((b) => {
              const Icon = KIND_ICON[b.kind];
              const failed = b.failedCount > 0;
              return (
                <li key={b.id} className="flex items-start gap-3 rounded-xl border border-black/[0.06] bg-white p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e3f3e7] text-[#1f9d4d]">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">{b.title}</span>
                    <span className="block truncate text-[11px] text-black/50">
                      Sent to {b.recipientCount.toLocaleString("en-IN")} farmer{b.recipientCount === 1 ? "" : "s"} · {STATUS_WORD[b.status]}
                    </span>
                    <span className={`mt-0.5 block text-[11px] font-semibold ${failed ? "text-[#c0392b]" : "text-[#1f9d4d]"}`}>
                      {b.deliveredCount.toLocaleString("en-IN")} delivered
                      {failed ? ` · ${b.failedCount.toLocaleString("en-IN")} failed` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-black/40">{b.ago}</span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/broadcast"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#19a84f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#15913f]"
          >
            <Video className="h-4 w-4" aria-hidden />
            Send New Video
          </Link>
          <Link
            href="/broadcast"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#1fa651] px-4 py-2.5 text-sm font-bold text-[#14532d] hover:bg-[#e8f6ec]"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            Send Message
          </Link>
        </div>

        {!agentConnected && (
          <p className="mt-2 text-[11px] text-[#b9761a]">
            WhatsApp is in demo mode, so a broadcast would not reach anyone. Add the Meta credentials to send for real.
          </p>
        )}
      </div>
    </section>
  );
}

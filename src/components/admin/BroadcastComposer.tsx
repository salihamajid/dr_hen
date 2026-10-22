"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send, Video } from "lucide-react";

/**
 * Starts a broadcast on the WhatsApp number Dr. Hen already uses.
 *
 * The audience choice is the honest part. Meta only accepts a free-form message inside the 24
 * hours after a farmer last wrote in; outside that it wants an approved template. So the form
 * makes the admin say which they mean, and explains what happens to the farmers the choice
 * cannot reach, rather than reporting a send that Meta quietly refused.
 */
export function BroadcastComposer({ farmerCount, openWindowCount, canSend }: { farmerCount: number; openWindowCount: number; canSend: boolean }) {
  const router = useRouter();
  const [kind, setKind] = useState<"MESSAGE" | "VIDEO">("MESSAGE");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [audience, setAudience] = useState<"ALL" | "OPEN_WINDOW">("ALL");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const reach = audience === "ALL" ? farmerCount : openWindowCount;
  const unreachable = audience === "ALL" && !templateName ? farmerCount - openWindowCount : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    setSent(null);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title,
          body,
          audience,
          ...(kind === "VIDEO" ? { mediaUrl } : {}),
          ...(templateName ? { templateName } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not start the broadcast.");
        return;
      }
      setSent(`Sending to ${data.broadcast?.recipientCount ?? reach} farmers. The list below updates as Meta replies.`);
      setTitle("");
      setBody("");
      setMediaUrl("");
      // The history and its counters are server-rendered; re-read them.
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const field = "mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#1f9d4d]";

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <h2 className="text-[15px] font-extrabold">New broadcast</h2>

      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="flex gap-2">
          {(["MESSAGE", "VIDEO"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold ${
                kind === k ? "bg-[#19a84f] text-white" : "bg-black/[0.05] text-black/60"
              }`}
            >
              {k === "MESSAGE" ? <MessageSquare className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              {k === "MESSAGE" ? "Message" : "Video"}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            placeholder="Vaccination reminder"
            className={field}
          />
          <span className="text-[11px] text-black/40">For your records — farmers see the message below.</span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Message farmers will read</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={3} maxLength={1000} className={`${field} resize-none`} />
        </label>

        {kind === "VIDEO" && (
          <label className="block">
            <span className="text-sm font-semibold">Video link</span>
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              required
              type="url"
              placeholder="https://..."
              className={field}
            />
            <span className="text-[11px] text-black/40">Meta fetches the file itself, so the link must be public.</span>
          </label>
        )}

        <fieldset>
          <legend className="text-sm font-semibold">Who gets it</legend>
          <label className="mt-1 flex items-start gap-2 text-sm">
            <input type="radio" checked={audience === "ALL"} onChange={() => setAudience("ALL")} className="mt-1" />
            <span>
              Every farmer <span className="text-black/45">({farmerCount})</span>
            </span>
          </label>
          <label className="mt-1 flex items-start gap-2 text-sm">
            <input type="radio" checked={audience === "OPEN_WINDOW"} onChange={() => setAudience("OPEN_WINDOW")} className="mt-1" />
            <span>
              Only farmers who messaged in the last 24 hours <span className="text-black/45">({openWindowCount})</span>
              <span className="block text-[11px] text-black/45">These need no template — Meta accepts a plain message.</span>
            </span>
          </label>
        </fieldset>

        <label className="block">
          <span className="text-sm font-semibold">Approved template name (optional)</span>
          <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} maxLength={120} placeholder="intro_video" className={field} />
          <span className="text-[11px] text-black/40">Used for farmers whose 24-hour window has closed. Without one, they are skipped.</span>
        </label>

        {unreachable > 0 && (
          <p className="rounded-xl bg-[#fdf1dc] px-3 py-2 text-[12px] text-[#8a5a09]">
            {unreachable} of {farmerCount} farmers have not messaged in the last 24 hours. Without a template name, Meta will not deliver to them and
            they will be listed as skipped.
          </p>
        )}

        {!canSend && (
          <p className="rounded-xl bg-[#fdf1dc] px-3 py-2 text-[12px] text-[#8a5a09]">
            WhatsApp is in demo mode, so nothing will actually be delivered. The broadcast will still be recorded.
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-[#fdeaea] px-3 py-2 text-sm font-medium text-[#c0392b]" role="alert">
            {error}
          </p>
        )}
        {sent && (
          <p className="rounded-xl bg-[#e8f6ec] px-3 py-2 text-sm font-medium text-[#1f7a4d]" role="status">
            {sent}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || reach === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#19a84f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#15913f] disabled:opacity-60"
        >
          <Send className="h-4 w-4" aria-hidden />
          {pending ? "Starting…" : `Send to ${reach} farmer${reach === 1 ? "" : "s"}`}
        </button>
      </form>
    </section>
  );
}

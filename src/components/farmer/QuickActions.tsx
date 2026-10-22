"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardPlus, MessageCircle, ShoppingBag, Stethoscope, X } from "lucide-react";
import { useT } from "./I18nProvider";

/**
 * The four Quick Actions from the reference, each of which actually does something:
 *
 *   Log Symptoms   opens the AI assistant, the same pipeline WhatsApp messages run through
 *   Request Vet    files a VetEscalation — the queue the field team already works from
 *   Order Feed     records a FeedOrder for the admin to confirm
 *   WhatsApp       opens the business number Dr. Hen already sends from
 *
 * The two that write go through a short confirm step, because a farmer tapping a tile should
 * not silently summon a vet.
 */
export function QuickActions({ whatsappHref, defaultFeedBags }: { whatsappHref: string | null; defaultFeedBags: number }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState<null | "vet" | "feed">(null);
  const [bags, setBags] = useState(String(defaultFeedBags));
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const tile =
    "flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#e3f3e7] px-3 py-4 text-center text-[13px] font-bold text-[#14532d] transition-transform hover:-translate-y-0.5";

  function close() {
    setOpen(null);
    setError(null);
    setNote("");
  }

  async function submit(kind: "vet" | "feed") {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(kind === "vet" ? "/api/farmer/vet-request" : "/api/farmer/feed-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kind === "vet" ? { note: note || undefined } : { bags, note: note || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("common.networkError"));
        return;
      }
      close();
      setDone(kind === "vet" ? t("qa.vetSent") : t("qa.feedSent"));
      // The dashboard's own activity list and the admin's queue both change, so re-read.
      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <section>
      <h2 className="pb-2 text-[15px] font-extrabold">{t("dash.quickActions")}</h2>

      {done && (
        <p className="mb-2 rounded-xl bg-[#d6f0de] px-3 py-2 text-sm font-semibold text-[#14532d]" role="status">
          {done}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Link href="/farmer/assistant" className={tile}>
          <ClipboardPlus className="h-6 w-6" aria-hidden />
          {t("dash.logSymptoms")}
        </Link>

        <button type="button" onClick={() => setOpen("vet")} className={tile}>
          <Stethoscope className="h-6 w-6" aria-hidden />
          {t("dash.requestVet")}
        </button>

        <button type="button" onClick={() => setOpen("feed")} className={tile}>
          <ShoppingBag className="h-6 w-6" aria-hidden />
          {t("dash.orderFeed")}
        </button>

        {whatsappHref ? (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={tile}>
            <MessageCircle className="h-6 w-6" aria-hidden />
            {t("assistant.chatWhatsapp")}
          </a>
        ) : (
          <span className={`${tile} cursor-not-allowed opacity-50`}>
            <MessageCircle className="h-6 w-6" aria-hidden />
            {t("assistant.chatWhatsapp")}
          </span>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-extrabold">{open === "vet" ? t("qa.vetTitle") : t("qa.feedTitle")}</h3>
              <button type="button" onClick={close} className="rounded-full p-1 hover:bg-black/5" aria-label={t("common.close")}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-black/55">{open === "vet" ? t("qa.vetBody") : t("qa.feedBody")}</p>

            {open === "feed" && (
              <label className="mt-3 block">
                <span className="text-sm font-semibold">{t("qa.bags")}</span>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={bags}
                  onChange={(e) => setBags(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-green"
                />
              </label>
            )}

            <label className="mt-3 block">
              <span className="text-sm font-semibold">{t("qa.note")}</span>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                className="mt-1 w-full resize-none rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-green"
              />
            </label>

            {error && (
              <p className="mt-2 text-sm font-medium text-[#c0392b]" role="alert">
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={close} className="flex-1 rounded-xl bg-black/[0.06] px-4 py-2.5 text-sm font-semibold">
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => submit(open)}
                disabled={pending}
                className="flex-1 rounded-xl bg-brand-green-dark px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {pending ? t("common.pleaseWait") : t("qa.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

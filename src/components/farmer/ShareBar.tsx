"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, MessageCircle } from "lucide-react";
import type { ReportRequest } from "@/lib/validators/reportQuery";
import { useMsg, useT } from "./I18nProvider";

/** Share via WhatsApp (to the farmer's own number) and Download PDF for the report currently on screen. */
export function ShareBar({ request, waLink }: { request: ReportRequest; waLink: string | null }) {
  const router = useRouter();
  const t = useT();
  const msg = useMsg();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "info" | "err"; text: string } | null>(null);
  const [windowClosed, setWindowClosed] = useState(false);

  const pdfHref = `/api/farmer/reports/pdf?${new URLSearchParams(request as unknown as Record<string, string>).toString()}`;

  async function share() {
    if (busy) return;
    setBusy(true);
    setNote(null);
    setWindowClosed(false);
    try {
      const res = await fetch("/api/farmer/reports/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) return router.replace("/farmer/login");
      if (!res.ok) return setNote({ kind: "err", text: data.error ? msg(data.error) : t("share.fail") });
      if (data.windowClosed) {
        setWindowClosed(true);
        return setNote({ kind: "info", text: t("share.windowClosed") });
      }
      setNote({ kind: "ok", text: t("share.sent") });
    } catch {
      setNote({ kind: "err", text: t("common.networkError") });
    } finally {
      setBusy(false);
    }
  }

  const btn = "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold";
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={share} disabled={busy} className={`${btn} bg-[#25d366] text-white hover:bg-[#1fb857] disabled:opacity-60`}>
          <MessageCircle className="h-4 w-4" aria-hidden /> {busy ? t("share.sending") : t("share.whatsapp")}
        </button>
        <a href={pdfHref} className={`${btn} border border-brand-green-dark text-brand-green-dark hover:bg-brand-green-dark hover:text-white`}>
          <Download className="h-4 w-4" aria-hidden /> {t("share.pdf")}
        </a>
      </div>
      {note && (
        <p
          role="status"
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${note.kind === "ok" ? "bg-[#e7f5ea] text-brand-green-dark" : note.kind === "info" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"}`}
        >
          {note.text}{" "}
          {windowClosed && waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
              {t("assistant.chatWhatsapp")}
            </a>
          )}
        </p>
      )}
    </div>
  );
}

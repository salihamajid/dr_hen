"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useT } from "./I18nProvider";
import type { Lang } from "@/lib/i18n";

// First-time chooser (mode "first": Continue goes to the dashboard) and the Settings toggle
// (mode "settings": stays put and refreshes so the whole portal flips language and direction).
export function LanguagePicker({ initial, mode }: { initial: Lang | null; mode: "first" | "settings" }) {
  const router = useRouter();
  const t = useT();
  const [choice, setChoice] = useState<Lang | null>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    if (!choice || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/farmer/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: choice }),
      });
      if (res.status === 401) return router.replace("/farmer/login");
      if (!res.ok) throw new Error();
      if (mode === "first") {
        router.replace("/farmer/dashboard");
      } else {
        setMsg({ ok: true, text: t("settings.saved") });
      }
      router.refresh();
    } catch {
      setMsg({ ok: false, text: t("settings.error") });
    } finally {
      setBusy(false);
    }
  }

  const option = (lang: Lang, label: string) => (
    <button
      type="button"
      key={lang}
      onClick={() => {
        setChoice(lang);
        setMsg(null);
      }}
      aria-pressed={choice === lang}
      className={`flex flex-1 items-center justify-between gap-3 rounded-xl border-2 px-5 py-4 text-lg font-semibold transition ${
        choice === lang ? "border-brand-green-dark bg-[#e7f5ea] text-brand-green-dark" : "border-black/10 bg-white hover:border-black/25"
      }`}
    >
      {label}
      {choice === lang && <Check className="h-5 w-5" aria-hidden />}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {option("EN", t("language.english"))}
        {option("UR", t("language.urdu"))}
      </div>
      <button
        type="button"
        onClick={save}
        disabled={!choice || busy || (mode === "settings" && choice === initial)}
        className="rounded-xl bg-brand-green-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? t("common.saving") : mode === "first" ? t("common.continue") : t("common.save")}
      </button>
      {msg && (
        <p role="status" className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-[#e7f5ea] text-brand-green-dark" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

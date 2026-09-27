"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMsg, useT } from "./I18nProvider";

type Entry = Record<string, string | number | null>;
interface Derived {
  chickAgeDays: number;
  remaining: number;
  birdsPlaced: number;
}

// The farmer's own calendar day, not UTC's (Pakistan is UTC+5).
function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const str = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));
const toInt = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};

/**
 * The Daily Entry screen, laid out like the farm's paper Daily Report: mortality split into a
 * day and a night round, feed counted in bags, and the whole-farm stock at the end.
 *
 * Chick age, total mortality and remaining chicks are shown but never typed. They are worked out
 * from the flock and the saved mortality, so the farmer cannot file figures that contradict
 * each other.
 */
export function DailyEntryForm({ flocks }: { flocks: { id: string; name: string }[] }) {
  const router = useRouter();
  const t = useT();
  const msg = useMsg();

  const [flockId, setFlockId] = useState(flocks[0]?.id ?? "");
  const [date, setDate] = useState(localToday);
  const [loaded, setLoaded] = useState<{ key: string; entry: Entry; derived: Derived | null; exists: boolean } | null>(null);
  const [edits, setEdits] = useState<{ key: string; values: Record<string, string> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  const key = `${flockId}|${date}`;
  const loading = !!flockId && !!date && loaded?.key !== key;

  useEffect(() => {
    if (!flockId || !date) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/farmer/daily-entry?flockId=${encodeURIComponent(flockId)}&date=${encodeURIComponent(date)}`);
        if (res.status === 401) return router.replace("/farmer/login");
        const data = await res.json();
        if (!cancelled && res.ok) setLoaded({ key: `${flockId}|${date}`, entry: data.entry, derived: data.derived ?? null, exists: data.exists });
      } catch {
        /* leave the form empty; saving still works */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [flockId, date, router]);

  const valueOf = (name: string) => (edits?.key === key && name in edits.values ? edits.values[name] : str(loaded?.key === key ? loaded.entry[name] : ""));
  const setValue = (name: string, v: string) => {
    setMessage(null);
    setEdits((prev) => ({ key, values: { ...(prev?.key === key ? prev.values : {}), [name]: v } }));
  };

  // Totals update as the farmer types, so the two rounds always visibly add up.
  const liveTotal = toInt(valueOf("mortalityDay")) + toInt(valueOf("mortalityNight"));
  const savedTotal = Number(loaded?.key === key ? loaded.entry.mortalityCount ?? 0 : 0);
  const remaining = loaded?.key === key && loaded.derived ? Math.max(0, loaded.derived.remaining + savedTotal - liveTotal) : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || loading) return;
    setSaving(true);
    setMessage(null);
    setFieldErrors({});
    const names = ["mortalityDay", "mortalityNight", "feedBags", "avgWeightGrams", "temperatureC", "medicineGiven", "notes", "stockFeedBags", "dieselLitres"];
    const payload: Record<string, string> = { flockId, date };
    for (const name of names) payload[name] = valueOf(name);
    try {
      const res = await fetch("/api/farmer/daily-entry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) return router.replace("/farmer/login");
      if (!res.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setMessage({ kind: "err", text: data.error ? msg(data.error) : t("entry.saveFail") });
        return;
      }
      setLoaded({ key, entry: data.entry, derived: data.derived ?? null, exists: true });
      setEdits(null);
      setMessage({ kind: "ok", text: t("entry.savedEntry") });
    } catch {
      setMessage({ kind: "err", text: t("common.networkError") });
    } finally {
      setSaving(false);
    }
  }

  if (flocks.length === 0) {
    return <p className="rounded-2xl bg-white p-8 text-center text-sm text-black/45 shadow-sm ring-1 ring-black/5">{t("entry.addFlockFirst")}</p>;
  }

  const input = "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-green disabled:opacity-60";
  const err = (name: string) => {
    const e = fieldErrors[name]?.[0];
    return e ? <p className="mt-1 text-xs font-normal text-red-600">{msg(e)}</p> : null;
  };

  const numberField = (name: string, labelKey: Parameters<typeof t>[0], unit: string, opts: { step?: string; required?: boolean } = {}) => (
    <label className="text-xs font-semibold text-black/60">
      {t(labelKey)}
      {unit && <span className="ms-1 font-normal text-black/40">({unit})</span>}
      <input
        name={name}
        type="number"
        inputMode="decimal"
        step={opts.step ?? "1"}
        min={0}
        required={opts.required}
        value={valueOf(name)}
        disabled={loading}
        onChange={(e) => setValue(name, e.target.value)}
        className={`${input} mt-1`}
      />
      {err(name)}
    </label>
  );

  const readOnly = (label: string, value: string) => (
    <div className="rounded-xl bg-[#e7f5ea] px-3 py-2">
      <div className="text-[11px] text-brand-green-dark/70">{label}</div>
      <div className="text-base font-bold text-brand-green-dark">{value}</div>
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-black/60">
            {t("common.flock")}
            <select value={flockId} onChange={(e) => { setFlockId(e.target.value); setMessage(null); }} className={`${input} mt-1`}>
              {flocks.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-black/60">
            {t("common.date")}
            <input type="date" value={date} max={localToday()} onChange={(e) => { setDate(e.target.value); setMessage(null); }} className={`${input} mt-1`} />
          </label>
        </div>

        <p className="mt-3 min-h-4 text-[11px] text-black/40">
          {loading ? t("common.loading") : loaded?.exists ? t("entry.existing") : t("entry.none")}
        </p>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {readOnly(t("entry.chickAge"), loaded?.derived ? `${loaded.derived.chickAgeDays} ${t("unit.days")}` : "—")}
          {readOnly(t("entry.mortalityTotal"), String(liveTotal))}
          {readOnly(t("entry.remaining"), remaining === null ? "—" : remaining.toLocaleString("en-IN"))}
        </div>
        <p className="mt-1.5 text-[11px] text-black/40">{t("entry.workedOut")}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {numberField("mortalityDay", "entry.mortalityDay", t("unit.birds"), { required: true })}
          {numberField("mortalityNight", "entry.mortalityNight", t("unit.birds"), { required: true })}
          {numberField("feedBags", "entry.feedBags", t("unit.bags"), { step: "0.5" })}
          {numberField("avgWeightGrams", "field.avgWeight", t("unit.g"))}
          {numberField("temperatureC", "field.temperature", "°C", { step: "0.1" })}
          <label className="text-xs font-semibold text-black/60">
            {t("field.medicine")}
            <input
              name="medicineGiven"
              type="text"
              maxLength={200}
              value={valueOf("medicineGiven")}
              disabled={loading}
              onChange={(e) => setValue("medicineGiven", e.target.value)}
              className={`${input} mt-1`}
            />
            {err("medicineGiven")}
          </label>
          <label className="text-xs font-semibold text-black/60 sm:col-span-2">
            {t("field.remarks")}
            <textarea
              name="notes"
              rows={3}
              maxLength={1000}
              value={valueOf("notes")}
              disabled={loading}
              onChange={(e) => setValue("notes", e.target.value)}
              className={`${input} mt-1`}
            />
            {err("notes")}
          </label>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="text-base font-bold">{t("entry.stockHeading")}</h2>
        <p className="mb-3 mt-0.5 text-[11px] text-black/45">{t("entry.stockNote")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {numberField("stockFeedBags", "entry.stockFeedBags", t("unit.bags"), { step: "0.5" })}
          {numberField("dieselLitres", "entry.diesel", t("unit.litres"), { step: "0.5" })}
        </div>
      </section>

      {message && (
        <p role="status" className={`rounded-lg px-3 py-2 text-sm ${message.kind === "ok" ? "bg-[#e7f5ea] text-brand-green-dark" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}

      <button type="submit" disabled={saving || loading} className="self-start rounded-xl bg-brand-green-dark px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {saving ? t("common.saving") : t("entry.saveEntry")}
      </button>
    </form>
  );
}

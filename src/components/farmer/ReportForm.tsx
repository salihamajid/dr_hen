"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "daily" | "attributes";
type Entry = Record<string, string | number | null>;
type Field = { name: string; label: string; kind: "number" | "text" | "textarea" | "select"; step?: string; unit?: string; required?: boolean; options?: string[] };

const FIELDS: Record<Mode, Field[]> = {
  daily: [
    { name: "feedKg", label: "Feed used", kind: "number", step: "0.1", unit: "kg" },
    { name: "waterLiters", label: "Water used", kind: "number", step: "0.1", unit: "litres" },
    { name: "mortalityCount", label: "Mortality", kind: "number", step: "1", unit: "birds", required: true },
    { name: "medicineGiven", label: "Medicine given (your record)", kind: "text" },
    { name: "temperatureC", label: "Temperature", kind: "number", step: "0.1", unit: "°C" },
    { name: "notes", label: "Remarks", kind: "textarea" },
  ],
  attributes: [
    { name: "feedKg", label: "Feed intake", kind: "number", step: "0.1", unit: "kg" },
    { name: "waterLiters", label: "Water intake", kind: "number", step: "0.1", unit: "litres" },
    { name: "temperatureC", label: "Temperature", kind: "number", step: "0.1", unit: "°C" },
    { name: "humidityPct", label: "Humidity", kind: "number", step: "1", unit: "%" },
    { name: "lightHours", label: "Light hours", kind: "number", step: "0.5", unit: "hours" },
    { name: "ventilation", label: "Ventilation", kind: "select", options: ["POOR", "AVERAGE", "GOOD"] },
  ],
};

const ENDPOINT: Record<Mode, string> = { daily: "/api/farmer/daily-entry", attributes: "/api/farmer/parameters" };
const SAVE_LABEL: Record<Mode, string> = { daily: "Save Entry", attributes: "Save Parameters" };
const VENT_LABEL: Record<string, string> = { POOR: "Poor", AVERAGE: "Average", GOOD: "Good" };

// The farmer's own calendar day, not UTC's (Pakistan is UTC+5).
function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const str = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function ReportForm({ mode, flocks }: { mode: Mode; flocks: { id: string; name: string }[] }) {
  const router = useRouter();
  const [flockId, setFlockId] = useState(flocks[0]?.id ?? "");
  const [date, setDate] = useState(localToday);
  // Server values for the current (flock, date), keyed so "loading" is derived instead of set in an effect.
  const [loaded, setLoaded] = useState<{ key: string; entry: Entry; exists: boolean } | null>(null);
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
        if (!cancelled && res.ok) setLoaded({ key: `${flockId}|${date}`, entry: data.entry, exists: data.exists });
      } catch {
        /* leave the form empty; saving still works */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [flockId, date, router]);

  const fields = FIELDS[mode];
  const valueOf = (f: Field) => (edits?.key === key && f.name in edits.values ? edits.values[f.name] : str(loaded?.key === key ? loaded.entry[f.name] : ""));
  const setValue = (name: string, v: string) => {
    setMessage(null);
    setEdits((prev) => ({ key, values: { ...(prev?.key === key ? prev.values : {}), [name]: v } }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || loading) return;
    setSaving(true);
    setMessage(null);
    setFieldErrors({});
    const payload: Record<string, string> = { flockId, date };
    for (const f of fields) payload[f.name] = valueOf(f);
    try {
      const res = await fetch(ENDPOINT[mode], { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) return router.replace("/farmer/login");
      if (!res.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setMessage({ kind: "err", text: data.error ?? "Could not save. Please try again." });
        return;
      }
      setLoaded({ key, entry: data.entry, exists: true });
      setEdits(null);
      setMessage({ kind: "ok", text: mode === "daily" ? "Entry saved." : "Parameters saved." });
    } catch {
      setMessage({ kind: "err", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (flocks.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-8 text-center text-sm text-black/45 shadow-sm ring-1 ring-black/5">
        Add a flock first, then you can record daily data.
      </p>
    );
  }

  const input = "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-green disabled:opacity-60";

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-black/60">
          Flock
          <select value={flockId} onChange={(e) => { setFlockId(e.target.value); setMessage(null); }} className={`${input} mt-1`}>
            {flocks.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-black/60">
          Date
          <input type="date" value={date} max={localToday()} onChange={(e) => { setDate(e.target.value); setMessage(null); }} className={`${input} mt-1`} />
        </label>
      </div>

      <p className="mt-3 h-4 text-[11px] text-black/40">
        {loading ? "Loading…" : loaded?.exists ? "Showing what you saved earlier for this day. Saving updates it." : "Nothing saved yet for this day."}
      </p>

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {fields.map((f) => {
          const err = fieldErrors[f.name]?.[0];
          const common = { name: f.name, value: valueOf(f), disabled: loading, className: `${input} mt-1` };
          return (
            <label key={f.name} className={`text-xs font-semibold text-black/60 ${f.kind === "textarea" ? "sm:col-span-2" : ""}`}>
              {f.label}
              {f.unit && <span className="ml-1 font-normal text-black/40">({f.unit})</span>}
              {f.kind === "number" && (
                <input {...common} type="number" inputMode="decimal" step={f.step} min={0} required={f.required} onChange={(e) => setValue(f.name, e.target.value)} />
              )}
              {f.kind === "text" && <input {...common} type="text" maxLength={200} onChange={(e) => setValue(f.name, e.target.value)} />}
              {f.kind === "textarea" && <textarea {...common} rows={3} maxLength={1000} onChange={(e) => setValue(f.name, e.target.value)} />}
              {f.kind === "select" && (
                <select {...common} onChange={(e) => setValue(f.name, e.target.value)}>
                  <option value="">Select…</option>
                  {f.options!.map((o) => (
                    <option key={o} value={o}>{VENT_LABEL[o]}</option>
                  ))}
                </select>
              )}
              {err && <p className="mt-1 text-xs font-normal text-red-600">{err}</p>}
            </label>
          );
        })}
      </div>

      {message && (
        <p role="status" className={`mt-4 rounded-lg px-3 py-2 text-sm ${message.kind === "ok" ? "bg-[#e7f5ea] text-brand-green-dark" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}

      <button type="submit" disabled={saving || loading} className="mt-4 rounded-xl bg-brand-green-dark px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {saving ? "Saving…" : SAVE_LABEL[mode]}
      </button>
    </form>
  );
}

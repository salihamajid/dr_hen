"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface QueueRow {
  id: string;
  farmName: string;
  location: string;
  detail: string;
  status: string;
  ago: string;
}

/**
 * The two queues a farmer's Quick Actions feed into. Changing a status writes through the
 * admin API, and because that endpoint announces on both streams, the farmer's own dashboard
 * shows the new state without anyone telling them to refresh.
 */
export function RequestQueue({
  title,
  rows,
  endpoint,
  options,
  emptyText,
}: {
  title: string;
  rows: QueueRow[];
  endpoint: string;
  /** The states an admin may move a row to, in the order they normally happen. */
  options: string[];
  emptyText: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Could not update that request.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <h2 className="pb-2 text-[15px] font-extrabold">{title}</h2>

      {error && (
        <p className="mb-2 rounded-xl bg-[#fdeaea] px-3 py-2 text-sm text-[#c0392b]" role="alert">
          {error}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-xl bg-black/[0.03] px-3 py-6 text-center text-xs text-black/45">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-black/[0.06]">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{row.farmName}</p>
                <p className="truncate text-[11px] text-black/50">
                  {row.location} · {row.detail} · {row.ago}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={busy === row.id || row.status === option}
                    onClick={() => setStatus(row.id, option)}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-45 ${
                      row.status === option ? "bg-[#1f9d4d] text-white" : "bg-black/[0.06] text-black/65 hover:bg-black/[0.12]"
                    }`}
                  >
                    {option.charAt(0) + option.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

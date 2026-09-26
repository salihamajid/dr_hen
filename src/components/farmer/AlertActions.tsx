"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Action = "acknowledge" | "resolve";

export function AlertActions({ id, status }: { id: string; status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action) {
    if (busy) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/farmer/alerts/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.status === 401) return router.replace("/farmer/login");
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Could not update. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (status === "RESOLVED") return <p className="text-xs text-black/45">Resolved</p>;
  const btn = "rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "OPEN" && (
        <button type="button" onClick={() => run("acknowledge")} disabled={!!busy} className={`${btn} border border-brand-green-dark text-brand-green-dark hover:bg-brand-green-dark hover:text-white`}>
          {busy === "acknowledge" ? "Saving…" : "Acknowledge"}
        </button>
      )}
      <button type="button" onClick={() => run("resolve")} disabled={!!busy} className={`${btn} bg-brand-green-dark text-white`}>
        {busy === "resolve" ? "Saving…" : "Mark resolved"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

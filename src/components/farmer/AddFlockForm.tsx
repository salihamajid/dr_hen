"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

const BREEDS = ["Broiler", "Layer", "Desi", "Cobb 500", "Ross 308", "Hubbard"];

export function AddFlockForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch("/api/farmer/flocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          breed: form.get("breed"),
          sizeCount: form.get("sizeCount"),
          ageWeeks: form.get("ageWeeks"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/farmer/login");
        return;
      }
      if (!res.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setError(data.error ?? "Could not add the flock. Please try again.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        <Plus className="h-4 w-4" aria-hidden /> Add New Flock
      </button>
    );
  }

  const input = "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-green";
  const err = (k: string) => fieldErrors[k]?.[0] && <p className="mt-1 text-xs text-red-600">{fieldErrors[k]![0]}</p>;

  return (
    <form onSubmit={onSubmit} className="w-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold">Add New Flock</h2>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-black/5" aria-label="Cancel">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-black/60">
          Flock name
          <input name="name" required maxLength={60} placeholder="e.g. Flock 2" className={`${input} mt-1`} />
          {err("name")}
        </label>
        <label className="text-xs font-semibold text-black/60">
          Breed / type
          <input name="breed" required maxLength={50} list="flock-breeds" placeholder="e.g. Broiler" className={`${input} mt-1`} />
          <datalist id="flock-breeds">
            {BREEDS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
          {err("breed")}
        </label>
        <label className="text-xs font-semibold text-black/60">
          Number of birds
          <input name="sizeCount" type="number" inputMode="numeric" min={1} max={5000000} required className={`${input} mt-1`} />
          {err("sizeCount")}
        </label>
        <label className="text-xs font-semibold text-black/60">
          Age (weeks)
          <input name="ageWeeks" type="number" inputMode="numeric" min={0} max={200} required defaultValue={0} className={`${input} mt-1`} />
          {err("ageWeeks")}
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-green-dark px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save flock"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-black/5">
          Cancel
        </button>
      </div>
    </form>
  );
}

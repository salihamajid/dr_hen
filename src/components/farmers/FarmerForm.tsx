"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BREEDS = ["Broiler", "Layer", "Desi/Local"];

export function FarmerForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      location: form.get("location"),
      whatsappNumber: form.get("whatsappNumber"),
      flockSize: form.get("flockSize"),
      numberOfSheds: form.get("numberOfSheds"),
      flockAgeWeeks: form.get("flockAgeWeeks"),
      breed: form.get("breed"),
    };

    const res = await fetch("/api/farmers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.error?.formErrors?.[0] ?? "Failed to save farmer");
      return;
    }

    router.push("/farmers");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Farmer Name" name="name" required />
        <Field label="Location" name="location" required />
        <Field label="WhatsApp Number" name="whatsappNumber" placeholder="+92300xxxxxxx" required />
        <Field label="Breed" name="breed" required list="breeds" />
        <Field label="Flock Size" name="flockSize" type="number" required />
        <Field label="Number of Sheds" name="numberOfSheds" type="number" required />
        <Field label="Flock Age (weeks)" name="flockAgeWeeks" type="number" required />
      </div>

      <datalist id="breeds">
        {BREEDS.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-brand-red px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save Farmer"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  list,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  list?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-black/70">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        list={list}
        className="w-full rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-green"
      />
    </label>
  );
}

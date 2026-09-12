"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ContentType = "text" | "image" | "voice";

const SAMPLE_MESSAGES: Record<string, string> = {
  "Urdu (coughing/CRD)": "میرے مرغی کو کھانسی ہو رہی ہے اور سانس لینے میں دقت ہو رہی ہے",
  "Punjabi (droppings/Coccidiosis)": "میڈے مرغی دا گو خونی ہو گیا اے، بہت کمزور وی ہو گیا اے",
  "English (VET escalation)": "VET",
};

export function SimulateIncomingPanel({ farmerId }: { farmerId: string }) {
  const router = useRouter();
  const [contentType, setContentType] = useState<ContentType>("text");
  const [text, setText] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmerId, contentType, text, imageDataUrl: imageDataUrl ?? undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to send");
      }
      setText("");
      setImageDataUrl(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-black/20 bg-amber-50/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold">Simulate Incoming Message (Demo)</h3>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">DEV ONLY</span>
      </div>
      <p className="mb-3 text-xs text-black/50">
        No real WhatsApp connection is needed — this fabricates an inbound message exactly like a real farmer&apos;s
        WhatsApp reply and runs it through the real AI pipeline.
      </p>

      <div className="mb-3 flex gap-2">
        {(["text", "image", "voice"] as ContentType[]).map((t) => (
          <button
            key={t}
            onClick={() => setContentType(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              contentType === t ? "bg-brand-green text-white" : "bg-white text-black/60 hover:bg-black/5"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {contentType === "image" && (
        <input type="file" accept="image/*" onChange={handleFileChange} className="mb-2 block text-xs" />
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          contentType === "voice"
            ? "Type what the voice note says (stands in for a real transcript)…"
            : contentType === "image"
              ? "Optional caption for the photo…"
              : "Type the farmer's message (Urdu, Punjabi, or English)…"
        }
        rows={2}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-green"
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {Object.entries(SAMPLE_MESSAGES).map(([label, sample]) => (
          <button
            key={label}
            onClick={() => setText(sample)}
            className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] text-black/60 hover:bg-black/5"
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <button
        onClick={handleSend}
        disabled={sending || (!text && !imageDataUrl)}
        className="mt-3 rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send as Farmer"}
      </button>
    </div>
  );
}

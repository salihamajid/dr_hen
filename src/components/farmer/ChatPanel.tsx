"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Send, X } from "lucide-react";
import { MessageBubble } from "@/components/messages/MessageBubble";

type Msg = Parameters<typeof MessageBubble>[0]["message"];

// Phone photos are several MB; downscale so the request stays small and Gemini
// still gets a clear picture.
async function downscale(file: File, maxSide = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function ChatPanel({ initialMessages }: { initialMessages: Msg[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setImage(await downscale(file));
      setError(null);
    } catch {
      setError("Could not read that photo. Please try another one.");
    }
  }

  async function send() {
    if (sending || (!text.trim() && !image)) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/farmer/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() || undefined, imageDataUrl: image ?? undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/farmer/login");
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? "Could not send. Please try again.");
      setMessages(data.messages);
      setText("");
      setImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-[60vh] min-h-[16rem] space-y-3 overflow-y-auto rounded-2xl bg-black/[0.02] p-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-black/40">
            Describe your birds&apos; symptoms or send a photo. Dr. Hen will help.
          </p>
        )}
        {sending && <p className="text-xs italic text-black/40">Dr. Hen is thinking…</p>}
        <div ref={endRef} />
      </div>

      {image && (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Photo to send" className="max-h-28 rounded-lg" />
          <button
            type="button"
            onClick={() => setImage(null)}
            className="absolute -right-2 -top-2 rounded-full bg-black/70 p-1 text-white"
            aria-label="Remove photo"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-end gap-2">
        <label className="cursor-pointer rounded-xl bg-white p-3 text-black/55 shadow-sm ring-1 ring-black/5 hover:bg-black/5" aria-label="Attach photo">
          <ImagePlus className="h-5 w-5" />
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" />
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Type your message (Urdu, Punjabi or English)…"
          rows={2}
          maxLength={2000}
          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-green"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || (!text.trim() && !image)}
          className="flex items-center gap-1.5 rounded-xl bg-brand-red px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </div>
      <p className="text-[11px] text-black/40">Type VET to reach our Field Vet team directly.</p>
    </div>
  );
}

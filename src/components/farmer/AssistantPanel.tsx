import Image from "next/image";
import { Bot, MessageCircle } from "lucide-react";
import type { T } from "@/lib/i18n";

/**
 * The two chat routes, side by side as in the reference. "Chat with AI Assistant" is the in-app
 * chat; "Chat on WhatsApp" is a plain wa.me link to the number Dr. Hen already sends from, so it
 * needs no second WhatsApp connection or webhook.
 */
export function AssistantPanel({ aiChatHref, whatsappHref, t }: { aiChatHref: string | null; whatsappHref: string | null; t: T }) {
  const base =
    "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5";
  const disabled = "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold cursor-not-allowed bg-black/5 text-black/40";

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#eafaf0] ring-2 ring-brand-green/20">
          <Image src="/images/dr-hen-v2.jpeg" alt="" aria-hidden fill sizes="56px" className="object-cover object-top" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold leading-tight">{t("assistant.greeting")}</h2>
          <p className="mt-0.5 text-sm text-black/55">{t("assistant.askAnything")}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {aiChatHref ? (
          <a href={aiChatHref} className={`${base} bg-brand-green-dark text-white hover:bg-brand-green`}>
            <Bot className="h-4 w-4" aria-hidden /> {t("assistant.chatAi")}
          </a>
        ) : (
          <button type="button" disabled className={disabled}>
            <Bot className="h-4 w-4" aria-hidden /> {t("assistant.chatAi")}
          </button>
        )}
        {whatsappHref ? (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`${base} bg-[#25d366] text-white hover:bg-[#1fb857]`}>
            <MessageCircle className="h-4 w-4" aria-hidden /> {t("assistant.chatWhatsapp")}
          </a>
        ) : (
          <button type="button" disabled className={disabled}>
            <MessageCircle className="h-4 w-4" aria-hidden /> {t("assistant.whatsappUnavailable")}
          </button>
        )}
      </div>
    </section>
  );
}

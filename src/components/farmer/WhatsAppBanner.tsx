import { ArrowRight, MessageCircle } from "lucide-react";
import type { T } from "@/lib/i18n";

/**
 * The green WhatsApp band from the reference.
 *
 * The button is a plain wa.me link to the number Dr. Hen already sends from — the same number
 * the webhook listens on — so talking here opens the farmer's 24-hour window and every reply
 * runs through the existing AI pipeline. No second WhatsApp connection, and no in-app chat
 * pretending to be WhatsApp.
 */
export function WhatsAppBanner({ href, t }: { href: string | null; t: T }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#25a95a] to-[#17833f] p-5 text-white shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
          <MessageCircle className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold leading-tight sm:text-xl">{t("dash.waTitle")}</h2>
          <p className="mt-1 text-sm text-white/85">{t("dash.waSub")}</p>
        </div>

        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#14532d] shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {t("dash.waCta")}
            {/* Mirrors with the text in Urdu rather than always pointing right. */}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          </a>
        ) : (
          // No dead button: without a dialable business number there is nothing to open.
          <span className="shrink-0 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white/80">
            {t("assistant.whatsappUnavailable")}
          </span>
        )}
      </div>
    </section>
  );
}

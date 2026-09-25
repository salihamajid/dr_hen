import { Bot, MessageCircle } from "lucide-react";

/**
 * The two chat routes side by side. "Chat with AI Assistant" is the in-app chat
 * (a later phase, so it renders disabled until it exists); "Chat on WhatsApp" is a
 * plain wa.me link to the clinic number, so it needs no second WhatsApp connection
 * or webhook.
 */
export function AssistantPanel({ aiChatHref, whatsappHref }: { aiChatHref: string | null; whatsappHref: string | null }) {
  const base = "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors";
  const disabled = `${base} cursor-not-allowed bg-black/5 text-black/40`;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f5ea] text-brand-green">
          <Bot className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-bold leading-tight">Dr. Hen Assistant</h2>
          <p className="text-xs text-black/50">Ask any poultry question, any time.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {aiChatHref ? (
          <a href={aiChatHref} className={`${base} bg-brand-green-dark text-white hover:bg-brand-green`}>
            <Bot className="h-4 w-4" aria-hidden /> Chat with AI Assistant
          </a>
        ) : (
          <button type="button" disabled className={disabled}>
            <Bot className="h-4 w-4" aria-hidden /> Chat with AI Assistant · soon
          </button>
        )}
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${base} bg-[#25d366] text-white hover:bg-[#1fb857]`}
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> Chat on WhatsApp
          </a>
        ) : (
          <button type="button" disabled className={disabled}>
            <MessageCircle className="h-4 w-4" aria-hidden /> Chat on WhatsApp · unavailable
          </button>
        )}
      </div>
    </section>
  );
}

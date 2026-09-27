"use client";

import { useRef } from "react";
import Image from "next/image";
import { Bot, MessageCircle, X } from "lucide-react";

const SRC = "/images/dr-hen-doctor.jpg";

export interface PortraitLabels {
  alt: string;
  open: string;
  close: string;
  greeting: string;
  ask: string;
  chatAi: string;
  chatWhatsapp: string;
}

/**
 * The Dr. Hen portrait in the dashboard hero. Tapping it opens his assistant card — the greeting
 * and the two ways to reach him — rather than a bigger copy of the picture.
 *
 * Built on the native <dialog>: showModal() already gives a focus trap, Escape-to-close and inert
 * page content, which a hand-rolled overlay would have to reimplement. The artwork is square on a
 * white field, so object-cover fills the round frame edge to edge with no blending.
 */
export function DrHenPortrait({ labels, aiChatHref, whatsappHref }: { labels: PortraitLabels; aiChatHref: string | null; whatsappHref: string | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  const button = "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm";

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={labels.open}
        title={labels.open}
        className="relative block h-full w-full overflow-hidden rounded-full bg-white shadow-lg ring-4 ring-white/25 transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
      >
        <Image src={SRC} alt={labels.alt} fill sizes="(min-width: 1024px) 256px, (min-width: 640px) 208px, 176px" priority className="object-cover" />
      </button>

      <dialog
        ref={dialog}
        // A click that lands on the dialog itself came from the backdrop, not the card.
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
        className="m-auto w-[min(92vw,26rem)] max-w-none rounded-3xl bg-transparent p-0 backdrop:bg-black/60"
      >
        <div className="relative rounded-3xl bg-white p-6 text-center shadow-xl">
          <button
            type="button"
            onClick={close}
            aria-label={labels.close}
            className="absolute end-3 top-3 rounded-full p-1.5 text-black/40 transition-colors hover:bg-black/5 hover:text-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>

          <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full bg-[#eafaf0] ring-4 ring-[#e7f5ea]">
            <Image src={SRC} alt="" aria-hidden fill sizes="96px" className="object-cover" />
          </div>

          <h2 className="mt-4 text-xl font-extrabold">{labels.greeting}</h2>
          <p className="mt-1 text-sm text-black/55">{labels.ask}</p>

          <div className="mt-5 grid gap-2.5">
            {aiChatHref && (
              <a href={aiChatHref} className={`${button} bg-brand-green-dark text-white hover:bg-brand-green`}>
                <Bot className="h-4 w-4" aria-hidden /> {labels.chatAi}
              </a>
            )}
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`${button} bg-[#25d366] text-white hover:bg-[#1fb857]`}>
                <MessageCircle className="h-4 w-4" aria-hidden /> {labels.chatWhatsapp}
              </a>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}

"use client";

import { useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";

const SRC = "/images/dr-hen-doctor.jpg";

/**
 * The Dr. Hen portrait in the dashboard hero, and the larger view it opens.
 *
 * Built on the native <dialog>: showModal() already gives a focus trap, Escape-to-close and
 * inert page content, which a hand-rolled overlay would have to reimplement. The artwork is
 * square on a white field, so object-cover fills the round frame edge to edge with no blending.
 */
export function DrHenPortrait({ alt, openLabel, closeLabel }: { alt: string; openLabel: string; closeLabel: string }) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={openLabel}
        title={openLabel}
        className="relative block h-full w-full cursor-zoom-in overflow-hidden rounded-full bg-white shadow-lg ring-4 ring-white/25 transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
      >
        <Image
          src={SRC}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 256px, (min-width: 640px) 208px, 176px"
          priority
          className="object-cover"
        />
      </button>

      <dialog
        ref={dialog}
        // A click that lands on the dialog itself came from the backdrop, not the picture.
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto w-[min(90vw,34rem)] max-w-none rounded-3xl bg-transparent p-0 backdrop:bg-black/70"
      >
        <div className="relative">
          <Image src={SRC} alt={alt} width={720} height={720} className="h-auto w-full rounded-3xl bg-white" />
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label={closeLabel}
            className="absolute end-3 top-3 rounded-full bg-black/55 p-2 text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </dialog>
    </>
  );
}

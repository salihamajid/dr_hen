import Image from "next/image";

/**
 * The Dr. Hen character, animated with CSS keyframes (defined in globals.css)
 * rather than a JS animation library — every motion here is a simple infinite
 * loop, which CSS does natively and without shipping a runtime or forcing this
 * into a client component.
 *
 * Deliberately NOT implemented: eye blinking and wing waving. The only Dr. Hen
 * asset is a flat, opaque JPEG, so the eyes and wing can't be isolated as
 * layers — faking them would mean drawing artificial eyes over the artwork,
 * which looks worse than not doing it. Supply a transparent PNG (ideally with
 * the wing on its own layer) via `src` and those become possible.
 */
export function AnimatedDrHen({
  src = "/images/dr-hen-v2.jpeg",
  alt = "Dr. Hen, your AI poultry doctor",
  className = "",
  priority = false,
}: {
  src?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`dr-hen-enter relative [perspective:900px] ${className}`}>
      <div className="dr-hen-float absolute inset-0 [transform-style:preserve-3d]">
        <div className="dr-hen-breathe relative h-full w-full">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 1280px) 320px, (min-width: 1024px) 260px, 0px"
            priority={priority}
            /* The source JPEG has an opaque near-white studio background.
               Multiply blends that into the light page background instead of
               showing a hard rectangle; a transparent PNG would remove the
               need for this entirely. */
            className="object-contain object-bottom mix-blend-multiply drop-shadow-[0_18px_22px_rgba(15,30,19,0.18)]"
          />
        </div>
      </div>

      {/* Ground contact shadow — grounds the character so it reads as a 3D
          figure standing in the page rather than a flat cut-out. */}
      <div
        aria-hidden
        className="dr-hen-shadow absolute bottom-1 left-1/2 h-4 w-3/5 -translate-x-1/2 rounded-[50%] bg-[#0f1e13] blur-md"
      />
    </div>
  );
}

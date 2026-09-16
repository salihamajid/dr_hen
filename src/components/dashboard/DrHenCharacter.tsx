import Image from "next/image";

/**
 * The Dr. Hen character artwork in the dashboard hero.
 *
 * Intentionally static. The source is an opaque JPEG on a white background, and
 * `mix-blend-multiply` is what makes that background disappear into the page —
 * but blending only applies within the element's stacking context, and any
 * wrapper carrying a CSS `transform` (as float/breathe animations do) creates
 * one, which trapped the blend and left a visible white rectangle around the
 * character. No transform here means the background blends away cleanly.
 *
 * Supply a transparent PNG via `src` and the blend mode stops being necessary.
 */
export function DrHenCharacter({
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
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1280px) 300px, 0px"
        priority={priority}
        className="object-contain object-top mix-blend-multiply"
      />
    </div>
  );
}

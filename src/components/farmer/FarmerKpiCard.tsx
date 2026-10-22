import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const TINTS = {
  green: { chip: "bg-[#d6f0de] text-[#1f7a4d]", value: "text-[#14532d]", sub: "text-[#1f7a4d]" },
  amber: { chip: "bg-[#fbe4c6] text-[#b9761a]", value: "text-[#b9761a]", sub: "text-[#b9761a]" },
  red: { chip: "bg-[#fbd9d7] text-[#c0392b]", value: "text-[#c0392b]", sub: "text-[#c0392b]" },
  slate: { chip: "bg-black/[0.06] text-black/45", value: "text-black/70", sub: "text-black/45" },
} as const;

/**
 * A headline figure as the farmer reference draws it: the icon in a soft circle on the start
 * side, the label above the number, and a plain-language line under it.
 *
 * Logical properties throughout (start/end, not left/right) so the card mirrors itself in Urdu.
 */
export function FarmerKpiCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  tint = "green",
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Small word beside the number, like "birds" or "Days". */
  unit?: string;
  sub?: string;
  tint?: keyof typeof TINTS;
  href?: string;
}) {
  const t = TINTS[tint];
  const body = (
    <>
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${t.chip}`}>
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-black/60">{label}</span>
        <span className="flex items-baseline gap-1.5">
          <span className={`truncate text-[28px] font-extrabold leading-tight tracking-tight ${t.value}`}>{value}</span>
          {unit && <span className="shrink-0 text-sm font-semibold text-black/45">{unit}</span>}
        </span>
        {sub && <span className={`block truncate text-xs font-medium ${t.sub}`}>{sub}</span>}
      </span>
    </>
  );

  const className =
    "flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition-shadow" + (href ? " hover:shadow-md" : "");
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

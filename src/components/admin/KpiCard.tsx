import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const TONES = {
  green: { card: "bg-[#e8f6ec] border-[#9ad6b0]", chip: "bg-[#1f9d4d] text-white", value: "text-[#14532d]", sub: "text-[#1f7a4d]" },
  white: { card: "bg-white border-black/[0.07]", chip: "bg-[#e8f1fd] text-[#2a78d6]", value: "text-[#14231d]", sub: "text-black/45" },
  amber: { card: "bg-[#fdf1dc] border-[#f0b95e]", chip: "bg-[#f0901e] text-white", value: "text-[#8a5a09]", sub: "text-[#b9761a]" },
  blue: { card: "bg-gradient-to-br from-[#7fd0ef] to-[#4aa9dd] border-[#4aa9dd]", chip: "bg-white/85 text-[#1b4f8f]", value: "text-[#0d3a63]", sub: "text-[#0d3a63]/75" },
} as const;

/**
 * One headline figure. `sub` is where the honesty lives: it always says what the number is
 * made of, and the card never invents a trend it cannot compute — see the coverage KPI, which
 * falls back to raw counts when there is no month to compare against.
 */
export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  href,
  title,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tone: keyof typeof TONES;
  href?: string;
  /** The precise definition, on hover, for any figure that is derived rather than counted. */
  title?: string;
}) {
  const t = TONES[tone];
  const body = (
    <>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.chip}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-black/55">{label}</span>
        <span className={`block truncate text-[30px] font-extrabold leading-tight tracking-tight ${t.value}`}>{value}</span>
        {sub && <span className={`block truncate text-xs font-medium ${t.sub}`}>{sub}</span>}
      </span>
    </>
  );

  const className = `flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition-shadow ${t.card} ${href ? "hover:shadow-md" : ""}`;
  return href ? (
    <Link href={href} className={className} title={title}>
      {body}
    </Link>
  ) : (
    <div className={className} title={title}>
      {body}
    </div>
  );
}

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const TINTS = {
  green: { card: "bg-[#e7f5ea]", chip: "bg-white text-[#1f7a4d]", value: "text-[#14532d]" },
  blue: { card: "bg-[#e8f1fd]", chip: "bg-white text-[#2a78d6]", value: "text-[#1b4f8f]" },
  red: { card: "bg-[#fdeaea]", chip: "bg-white text-[#e0392b]", value: "text-[#9b2420]" },
  amber: { card: "bg-[#fdf3e0]", chip: "bg-white text-[#d98a12]", value: "text-[#8a5a09]" },
} as const;

/**
 * Farmer summary tile. Separate from the admin StatCard because it carries a sub-line and an
 * optional link, and because the admin dashboard's tiles must keep their own look.
 */
export function FarmerStatCard({
  icon: Icon,
  label,
  value,
  sub,
  tint,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tint: keyof typeof TINTS;
  href?: string;
}) {
  const s = TINTS[tint];
  const body = (
    <>
      <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${s.chip}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className={`truncate text-[28px] font-extrabold leading-none tracking-tight ${s.value}`}>{value}</div>
      <div className="mt-1.5 truncate text-sm font-semibold text-black/70">{label}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-black/45">{sub}</div>}
    </>
  );

  const className = `flex min-w-0 flex-col rounded-2xl p-5 ${s.card} ${href ? "transition-transform hover:-translate-y-0.5" : ""}`;
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

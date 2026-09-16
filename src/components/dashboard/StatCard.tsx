import type { LucideIcon } from "lucide-react";

const TINTS = {
  red: { card: "bg-[#fdeaea]", icon: "text-[#e0392b]" },
  green: { card: "bg-[#e7f5ea]", icon: "text-[#1f7a4d]" },
  blue: { card: "bg-[#e8f1fd]", icon: "text-[#2a78d6]" },
  amber: { card: "bg-[#fdf3e0]", icon: "text-[#d98a12]" },
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tint: keyof typeof TINTS;
}) {
  return (
    <div className={`flex min-w-0 flex-col justify-center rounded-2xl px-4 py-3 ${TINTS[tint].card}`}>
      <Icon className={`mb-1.5 h-6 w-6 shrink-0 ${TINTS[tint].icon}`} aria-hidden />
      <div className="truncate text-2xl font-extrabold leading-tight tracking-tight">{value}</div>
      <div className="truncate text-xs font-medium text-black/55">{label}</div>
    </div>
  );
}

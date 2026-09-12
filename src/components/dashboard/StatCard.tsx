import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tint: "red" | "green" | "blue" | "amber";
}) {
  const tintClasses: Record<typeof tint, string> = {
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tintClasses[tint]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-xl font-bold leading-tight">{value}</div>
        <div className="truncate text-xs text-black/50">{label}</div>
      </div>
    </div>
  );
}

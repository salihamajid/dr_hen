import type { ManagementBar } from "@/lib/admin/dashboardData";

// Amber for the one bar where a HIGH number is bad news. A single colour for all three would
// read "20% pending is poor", when it is the opposite.
const BAR_COLOR: Record<string, string> = {
  "Pending Reports": "#d9901a",
};
const DEFAULT_BAR = "#22a447";

export function FarmManagementBars({ bars }: { bars: ManagementBar[] }) {
  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <h2 className="pb-3 text-[15px] font-extrabold">Farm Management Status</h2>

      <ul className="space-y-2.5">
        {bars.map((bar) => (
          <li key={bar.label} className="flex items-center gap-3" title={`${bar.definition} (${bar.detail})`}>
            <span className="w-[38%] shrink-0 truncate text-[13px] font-medium text-black/70">{bar.label}</span>
            <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-black/[0.07]">
              <span
                className="block h-full rounded-full"
                // No minimum width: a sliver at 0% reads as a rendering fault rather than a zero.
                style={{ width: `${bar.percent}%`, backgroundColor: BAR_COLOR[bar.label] ?? DEFAULT_BAR }}
              />
            </span>
            <span className="w-11 shrink-0 text-right text-[13px] font-bold tabular-nums">{bar.percent}%</span>
          </li>
        ))}
      </ul>

      {/* Each of these is derived, not counted, so the page says what it means rather than
          leaving an admin to guess at a percentage. */}
      <p className="pt-2.5 text-[10px] leading-snug text-black/35">{bars.map((b) => `${b.label}: ${b.detail}`).join(" · ")}</p>
    </section>
  );
}

import { Syringe } from "lucide-react";
import type { VaccinationRow } from "@/lib/farmer/dashboardData";
import type { T } from "@/lib/i18n";

const STATE = {
  DONE: { chip: "bg-[#d6f0de] text-[#1f7a4d]", icon: "bg-[#d6f0de] text-[#1f7a4d]", key: "dash.done" },
  UPCOMING: { chip: "bg-[#fbe4c6] text-[#b9761a]", icon: "bg-[#e8f1fd] text-[#2a78d6]", key: "dash.upcoming" },
  OVERDUE: { chip: "bg-[#fbd9d7] text-[#c0392b]", icon: "bg-[#fbd9d7] text-[#c0392b]", key: "dash.overdue" },
} as const;

/** The farm's own vaccinations, soonest first, with anything late at the top. */
export function VaccinationSchedule({ rows, t }: { rows: VaccinationRow[]; t: T }) {
  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <h2 className="pb-2 text-[15px] font-extrabold">{t("dash.vaccSchedule")}</h2>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-black/[0.03] px-3 py-6 text-center text-xs text-black/45">{t("dash.noVaccScheduled")}</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => {
            const meta = STATE[r.state];
            return (
              <li key={r.id} className="flex items-start gap-2.5">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.icon}`}>
                  <Syringe className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold">
                    {r.name}
                    {r.state === "UPCOMING" && r.daysAway !== null && (
                      <span className="font-medium text-black/55">
                        {" — "}
                        {r.daysAway === 0 ? t("dash.dueToday") : t("dash.dueInDays", { n: r.daysAway })}
                      </span>
                    )}
                    {r.state === "OVERDUE" && r.daysAway !== null && (
                      <span className="font-medium text-[#c0392b]">{` — ${t("dash.overdueDays", { n: Math.abs(r.daysAway) })}`}</span>
                    )}
                  </span>
                  <span className="block truncate text-[11px] text-black/50">
                    {r.date} · {r.flockName || t("dash.allFlocks")}
                  </span>
                </span>
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${meta.chip}`}>{t(meta.key)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

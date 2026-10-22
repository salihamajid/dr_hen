"use client";

import { Cell, Pie, PieChart } from "recharts";
import type { HealthBand } from "@/lib/farmer/dashboardData";
import { useT } from "./I18nProvider";

const COLORS = { healthy: "#22a447", mild: "#f0a81e", atRisk: "#e0392b" } as const;

/**
 * Birds, not flocks. A farmer thinks in birds, so each flock contributes its living birds to
 * one band, decided by whatever is open against that flock.
 *
 * Fixed-size chart rather than ResponsiveContainer: the responsive one measures from a resize
 * observer that has not fired on first paint, which leaves the ring blank on load.
 */
export function FlockHealthDonut({ health, percent }: { health: HealthBand; percent: number | null }) {
  const t = useT();
  const fmt = (n: number) => n.toLocaleString("en-IN");

  const rows = [
    { key: "healthy", label: t("dashboard.healthy"), value: health.healthyBirds, color: COLORS.healthy },
    { key: "mild", label: t("dash.mild"), value: health.mildBirds, color: COLORS.mild },
    { key: "atRisk", label: t("dash.atRisk"), value: health.atRiskBirds, color: COLORS.atRisk },
  ];
  const total = rows.reduce((s, r) => s + r.value, 0);
  const slices = total === 0 ? [{ key: "none", value: 1, color: "#eceeed" }] : rows.filter((r) => r.value > 0);

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <h2 className="pb-2 text-[15px] font-extrabold">{t("dash.healthStatus")}</h2>

      <div className="flex items-center gap-4">
        <div className="relative h-[150px] w-[150px] shrink-0">
          <PieChart width={150} height={150}>
            <Pie
              data={slices}
              dataKey="value"
              cx={74}
              cy={74}
              innerRadius={46}
              outerRadius={70}
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="#fff"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.key} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold leading-none tabular-nums text-[#14532d]">{percent === null ? "—" : `${percent}%`}</span>
            <span className="mt-0.5 text-[10px] text-black/45">{t("dashboard.healthy")}</span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="truncate text-black/65">{r.label}</span>
              </span>
              <span className="shrink-0 font-bold tabular-nums" style={{ color: r.color }}>
                {total === 0 ? "—" : `${Math.round((r.value / total) * 100)}%`}
                <span className="ms-1.5 text-xs font-medium text-black/45">{fmt(r.value)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="pt-2 text-[10px] leading-snug text-black/35">{t("dash.healthNote")}</p>
    </section>
  );
}

"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { DISEASE_LABEL, TREATMENT_STATUS_LABEL } from "@/lib/constants";
import type { DiseaseShare, FlockHealth, TreatmentStatusDatum } from "@/lib/admin/dashboardData";

const HEALTH_COLORS = { healthy: "#22a447", atRisk: "#f0a81e", sick: "#e0392b" } as const;
const STATUS_COLORS: Record<TreatmentStatusDatum["status"], string> = {
  COMPLETED: "#22a447",
  IN_PROGRESS: "#3b8fe0",
  SCHEDULED: "#f5a623",
  OVERDUE: "#ff3b30",
};
const DISEASE_COLORS = ["#e0392b", "#3b8fe0", "#22a447", "#f5a623", "#8b5cf6"];

/**
 * The reference's health card carries three pager dots. They are three real views: how the
 * flocks stand, how treatments are going, and what is going around. Keeping all three means
 * the redesign loses none of the analytics the old dashboard showed.
 */
export function HealthCarousel({
  flockHealth,
  treatmentStatus,
  diseaseShares,
}: {
  flockHealth: FlockHealth;
  treatmentStatus: TreatmentStatusDatum[];
  diseaseShares: DiseaseShare[];
}) {
  const [slide, setSlide] = useState(0);
  const titles = ["Flock Health Overview", "Treatment Status", "Common Diseases"];

  return (
    <section className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <h2 className="pb-1 text-[15px] font-extrabold">{titles[slide]}</h2>

      <div className="min-h-[150px] flex-1">
        {slide === 0 && <FlockHealthSlide data={flockHealth} />}
        {slide === 1 && <TreatmentSlide data={treatmentStatus} />}
        {slide === 2 && <DiseaseSlide data={diseaseShares} />}
      </div>

      <div className="flex justify-center gap-1.5 pt-2">
        {titles.map((title, i) => (
          <button
            key={title}
            onClick={() => setSlide(i)}
            aria-label={title}
            aria-current={i === slide}
            className={`h-2 rounded-full transition-all ${i === slide ? "w-5 bg-[#1f9d4d]" : "w-2 bg-black/15 hover:bg-black/30"}`}
          />
        ))}
      </div>
    </section>
  );
}

function Donut({ rows, centre, caption }: { rows: { key: string; label: string; value: number; color: string }[]; centre: string; caption: string }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  // Recharts draws nothing at all for an all-zero dataset, so show one grey ring instead of
  // an empty box, and let the centre label carry the real (zero) total.
  const chartRows = total === 0 ? [{ key: "none", label: "No data", value: 1, color: "#eceeed" }] : rows.filter((r) => r.value > 0);

  return (
    <div className="flex items-center gap-3">
      {/* Fixed size rather than ResponsiveContainer: the container measures itself from a
          resize observer, which has not fired on first paint, so the ring came out blank. */}
      <div className="relative h-[140px] w-[140px] shrink-0">
        <PieChart width={140} height={140}>
          <Pie
            data={chartRows}
            dataKey="value"
            nameKey="label"
            cx={69}
            cy={69}
            innerRadius={42}
            outerRadius={64}
            paddingAngle={chartRows.length > 1 ? 2 : 0}
            stroke="#fff"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {chartRows.map((r) => (
              <Cell key={r.key} fill={r.color} />
            ))}
          </Pie>
          {total > 0 && <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgba(11,11,11,0.1)", fontSize: 12 }} />}
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold leading-none tabular-nums">{centre}</span>
          <span className="mt-0.5 text-[10px] text-black/40">{caption}</span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="truncate text-black/65">{r.label}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums" style={{ color: r.color }}>
              {total === 0 ? "—" : `${Math.round((r.value / total) * 100)}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FlockHealthSlide({ data }: { data: FlockHealth }) {
  const healthyPct = data.total === 0 ? "—" : `${Math.round((data.healthy / data.total) * 100)}%`;
  return (
    <>
      <Donut
        centre={healthyPct}
        caption="healthy"
        rows={[
          { key: "healthy", label: `Healthy · ${data.healthy}`, value: data.healthy, color: HEALTH_COLORS.healthy },
          { key: "atRisk", label: `At Risk · ${data.atRisk}`, value: data.atRisk, color: HEALTH_COLORS.atRisk },
          { key: "sick", label: `Sick · ${data.sick}`, value: data.sick, color: HEALTH_COLORS.sick },
        ]}
      />
      <p className="pt-1.5 text-[10px] leading-snug text-black/35">
        {data.total} active flock{data.total === 1 ? "" : "s"}. Sick = an open critical alert, or a farm under treatment or escalated. Information-only
        alerts, such as a missed entry, do not count against health.
      </p>
    </>
  );
}

function TreatmentSlide({ data }: { data: TreatmentStatusDatum[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <>
      <Donut
        centre={total.toLocaleString("en-IN")}
        caption="treatments"
        rows={data.map((d) => ({
          key: d.status,
          label: `${TREATMENT_STATUS_LABEL[d.status]} · ${d.count}`,
          value: d.count,
          color: STATUS_COLORS[d.status],
        }))}
      />
      <p className="pt-1.5 text-[10px] leading-snug text-black/35">Every treatment on record, by the stage it has reached.</p>
    </>
  );
}

function DiseaseSlide({ data }: { data: DiseaseShare[] }) {
  if (data.length === 0) return <p className="flex h-full items-center text-xs text-black/40">No diagnoses recorded yet.</p>;
  return (
    <>
      <ul className="space-y-2 py-1">
        {data.map((d, i) => (
          <li key={d.code} className="flex items-center gap-2">
            <span className="w-[40%] shrink-0 truncate text-xs text-black/65" title={DISEASE_LABEL[d.code] ?? d.code}>
              {DISEASE_LABEL[d.code] ?? d.code}
            </span>
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
              <span
                className="block h-full rounded-full"
                style={{ width: `${Math.max(d.percent, 2)}%`, backgroundColor: DISEASE_COLORS[i % DISEASE_COLORS.length] }}
              />
            </span>
            <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums text-black/70">{d.percent}%</span>
          </li>
        ))}
      </ul>
      <p className="pt-1 text-[10px] leading-snug text-black/35">Share of all recorded treatments, by diagnosis.</p>
    </>
  );
}

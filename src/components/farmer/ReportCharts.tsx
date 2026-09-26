"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useT } from "./I18nProvider";

export function MortalityChart({ days }: { days: { date: string; deaths: number | null }[] }) {
  const t = useT();
  const data = days.map((d) => ({ label: d.date.slice(5), deaths: d.deaths }));
  return (
    // Charts stay left-to-right even in Urdu: dates run in one direction and numbers read the same.
    <div className="h-64 w-full" dir="ltr" role="img" aria-label={t("reports.chartMort")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [v ?? t("reports.noEntryTip"), t("reports.tooltipDeaths")]} />
          <Bar dataKey="deaths" fill="#1f7a4d" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GrowthChart({ points }: { points: { ageDays: number; actual: number | null; expected: number | null }[] }) {
  const t = useT();
  return (
    <div className="h-64 w-full" dir="ltr" role="img" aria-label={t("reports.chartWeight")}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="ageDays" tick={{ fontSize: 11 }} label={{ value: t("reports.ageDays"), position: "insideBottom", offset: -2, fontSize: 11 }} height={36} />
          <YAxis tick={{ fontSize: 11 }} unit=" g" width={56} />
          <Tooltip />
          <Legend verticalAlign="top" height={24} />
          <Line type="monotone" dataKey="expected" name={t("reports.legendExpected")} stroke="#9ca3af" strokeDasharray="5 4" dot={false} connectNulls />
          <Line type="monotone" dataKey="actual" name={t("reports.legendActual")} stroke="#ff3b30" strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

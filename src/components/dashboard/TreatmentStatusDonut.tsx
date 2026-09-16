"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export interface TreatmentStatusDatum {
  status: "COMPLETED" | "IN_PROGRESS" | "SCHEDULED" | "OVERDUE";
  count: number;
}

const STATUS_META: Record<TreatmentStatusDatum["status"], { label: string; color: string }> = {
  COMPLETED: { label: "Completed", color: "#22a447" },
  IN_PROGRESS: { label: "In Progress", color: "#3b8fe0" },
  SCHEDULED: { label: "Scheduled", color: "#f5a623" },
  OVERDUE: { label: "Overdue", color: "#ff3b30" },
};

const ORDER: TreatmentStatusDatum["status"][] = ["COMPLETED", "IN_PROGRESS", "SCHEDULED", "OVERDUE"];

export function TreatmentStatusDonut({ data }: { data: TreatmentStatusDatum[] }) {
  const byStatus = Object.fromEntries(data.map((d) => [d.status, d.count]));
  const rows = ORDER.map((status) => ({ status, count: byStatus[status] ?? 0 }));
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  // Recharts draws nothing for an all-zero dataset, so feed it one neutral
  // slice and let the centre label show the real total (0).
  const chartRows = total === 0 ? [{ status: "COMPLETED" as const, count: 1 }] : rows;

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <h3 className="mb-2 shrink-0 text-sm font-bold">Treatment Status</h3>
      <div className="flex min-h-0 flex-1 items-center gap-3">
        <div className="relative h-full min-h-0 w-[38%] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartRows}
                dataKey="count"
                nameKey="status"
                innerRadius="62%"
                outerRadius="92%"
                paddingAngle={total > 0 && rows.filter((r) => r.count > 0).length > 1 ? 3 : 0}
                stroke="#fff"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {chartRows.map((r) => (
                  <Cell key={r.status} fill={total === 0 ? "#eceeed" : STATUS_META[r.status].color} />
                ))}
              </Pie>
              {total > 0 && (
                <Tooltip
                  formatter={(value, _name, entry) => [
                    value,
                    STATUS_META[(entry?.payload as TreatmentStatusDatum)?.status]?.label ?? "",
                  ]}
                  contentStyle={{ borderRadius: 8, border: "1px solid rgba(11,11,11,0.1)", fontSize: 12 }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-lg font-extrabold leading-none tabular-nums">{total.toLocaleString("en-IN")}</div>
            <div className="text-[10px] text-black/40">Total</div>
          </div>
        </div>

        <ul className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 text-xs">
          {rows.map((r) => (
            <li key={r.status} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5 text-black/65">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_META[r.status].color }}
                />
                <span className="truncate">{STATUS_META[r.status].label}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{r.count.toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

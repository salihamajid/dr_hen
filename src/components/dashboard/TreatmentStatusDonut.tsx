"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export interface TreatmentStatusDatum {
  status: "COMPLETED" | "IN_PROGRESS" | "SCHEDULED" | "OVERDUE";
  count: number;
}

const STATUS_META: Record<TreatmentStatusDatum["status"], { label: string; color: string }> = {
  COMPLETED: { label: "Completed", color: "#0ca30c" },
  IN_PROGRESS: { label: "In Progress", color: "#2a78d6" },
  SCHEDULED: { label: "Scheduled", color: "#fab219" },
  OVERDUE: { label: "Overdue", color: "#d03b3b" },
};

const ORDER: TreatmentStatusDatum["status"][] = ["COMPLETED", "IN_PROGRESS", "SCHEDULED", "OVERDUE"];

export function TreatmentStatusDonut({ data }: { data: TreatmentStatusDatum[] }) {
  const byStatus = Object.fromEntries(data.map((d) => [d.status, d.count]));
  const rows = ORDER.map((status) => ({ status, count: byStatus[status] ?? 0 }));
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-bold">Treatment Status</h3>
      <div className="flex items-center gap-4">
        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="count"
                nameKey="status"
                innerRadius={44}
                outerRadius={64}
                paddingAngle={rows.filter((r) => r.count > 0).length > 1 ? 3 : 0}
                stroke="#fff"
                strokeWidth={2}
              >
                {rows.map((r) => (
                  <Cell key={r.status} fill={STATUS_META[r.status].color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, entry) => [
                  value,
                  STATUS_META[(entry?.payload as TreatmentStatusDatum)?.status]?.label ?? "",
                ]}
                contentStyle={{ borderRadius: 8, border: "1px solid rgba(11,11,11,0.1)", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xl font-extrabold leading-none">{total}</div>
            <div className="text-[10px] text-black/40">Total</div>
          </div>
        </div>

        <ul className="flex-1 space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.status} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-black/70">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_META[r.status].color }} />
                {STATUS_META[r.status].label}
              </span>
              <span className="font-semibold tabular-nums">{r.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

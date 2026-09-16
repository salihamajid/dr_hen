export interface DiseaseShare {
  code: string;
  label: string;
  percent: number;
}

const DISEASE_COLOR: Record<string, string> = {
  COCCIDIOSIS: "#ff3b30",
  ND: "#3b8fe0",
  CRD: "#22a447",
  IB: "#f5a623",
  AI_H9: "#8b5cf6",
};

const FALLBACK_COLOR = "#b6bcb9";

export function CommonDiseasesBarList({ data }: { data: DiseaseShare[] }) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <h3 className="mb-2 shrink-0 text-sm font-bold">Common Diseases</h3>

      {data.length === 0 ? (
        <p className="flex flex-1 items-center text-xs text-black/40">No disease data yet.</p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col justify-center gap-2 overflow-y-auto">
          {data.map((d) => (
            <li key={d.code} className="flex items-center gap-2">
              <span className="w-[42%] shrink-0 truncate text-xs text-black/65" title={d.label}>
                {d.label}
              </span>
              <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.max(d.percent, 2)}%`,
                    backgroundColor: DISEASE_COLOR[d.code] ?? FALLBACK_COLOR,
                  }}
                />
              </span>
              <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-black/70">
                {d.percent}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

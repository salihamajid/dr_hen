export interface DiseaseShare {
  label: string;
  percent: number;
}

const BAR_COLOR = "#256abf";

export function CommonDiseasesBarList({ data }: { data: DiseaseShare[] }) {
  const maxPercent = Math.max(...data.map((d) => d.percent), 1);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold">Common Diseases</h3>
      <ul className="space-y-3">
        {data.map((d) => (
          <li key={d.label}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-medium text-black/70">{d.label}</span>
              <span className="font-semibold tabular-nums text-black/80">{d.percent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-black/5">
              <div
                className="h-2 rounded-full"
                style={{ width: `${(d.percent / maxPercent) * 100}%`, backgroundColor: BAR_COLOR }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

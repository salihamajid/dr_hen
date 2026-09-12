import { CalendarClock } from "lucide-react";

export interface UpcomingAction {
  id: string;
  label: string;
  farmerName: string;
  date: string;
}

export function UpcomingActionsList({ actions }: { actions: UpcomingAction[] }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold">
        <CalendarClock className="h-4 w-4 text-black/40" />
        Upcoming Actions
      </h3>
      <ul className="space-y-3 text-sm">
        {actions.length === 0 && <li className="text-black/40">No upcoming actions.</li>}
        {actions.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-2">
            <span className="text-black/70">
              {a.label} - {a.farmerName}
            </span>
            <span className="shrink-0 font-medium text-brand-red">{a.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

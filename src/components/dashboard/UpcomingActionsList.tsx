import { CalendarClock } from "lucide-react";

export interface UpcomingAction {
  id: string;
  label: string;
  farmerName: string;
  date: string;
  overdue: boolean;
}

export function UpcomingActionsList({ actions }: { actions: UpcomingAction[] }) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <h3 className="mb-2 flex shrink-0 items-center gap-1.5 text-sm font-bold">
        <CalendarClock className="h-4 w-4 text-black/40" aria-hidden />
        Upcoming Actions
      </h3>

      {actions.length === 0 ? (
        <p className="flex flex-1 items-center text-xs text-black/40">No upcoming actions.</p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto text-xs">
          {actions.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-black/70">
                {a.label} — {a.farmerName}
              </span>
              <span className={`shrink-0 font-medium ${a.overdue ? "text-brand-red" : "text-black/50"}`}>{a.date}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

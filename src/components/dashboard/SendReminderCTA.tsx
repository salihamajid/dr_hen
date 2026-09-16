import Link from "next/link";
import { ChevronRight, Phone } from "lucide-react";

export function SendReminderCTA() {
  return (
    <section className="flex h-full min-h-0 flex-col justify-between rounded-2xl bg-gradient-to-br from-brand-green-dark to-brand-green p-4 text-white shadow-sm">
      <div className="min-h-0">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Phone className="h-4 w-4" aria-hidden />
          </span>
          <h3 className="text-base font-extrabold leading-tight">
            Send Reminder
            <br />
            to Farmers
          </h3>
        </div>
        <p className="mt-2 line-clamp-2 text-xs text-white/75">
          Keep your farmers on track with automated SMS / WhatsApp reminders.
        </p>
      </div>

      <Link
        href="/messages"
        className="mt-3 flex shrink-0 items-center justify-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand-green-dark transition-colors hover:bg-white/90"
      >
        Send Message
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </section>
  );
}

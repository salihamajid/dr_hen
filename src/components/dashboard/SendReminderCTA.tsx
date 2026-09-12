import { Phone } from "lucide-react";

export function SendReminderCTA() {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-brand-green-dark to-brand-green p-5 text-white shadow-sm">
      <div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <Phone className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-base font-bold">Send Reminder to Farmers</h3>
        <p className="mt-1 text-sm text-white/80">
          Keep your farmers on track with automated SMS / WhatsApp reminders.
        </p>
      </div>
      <button className="mt-4 flex items-center justify-center gap-1 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-brand-green-dark hover:bg-white/90">
        Send Message →
      </button>
    </div>
  );
}

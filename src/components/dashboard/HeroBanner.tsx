import { Users, Bird, Syringe, MessageSquare } from "lucide-react";
import { StatCard } from "./StatCard";
import { DrHenMascot } from "./DrHenMascot";

export function HeroBanner({
  totalFarmers,
  totalBirds,
  treatmentsGiven,
  messagesSent,
}: {
  totalFarmers: number;
  totalBirds: number;
  treatmentsGiven: number;
  messagesSent: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white p-5 shadow-sm md:p-8">
      <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center lg:grid-cols-[260px_1fr]">
        <div className="relative order-2 mx-auto h-56 w-48 shrink-0 md:order-1 md:h-64 md:w-full">
          <DrHenMascot className="h-full w-full" />

          <div className="animate-dr-hen-pop absolute -top-1 right-0 max-w-[180px] rounded-2xl rounded-br-sm bg-white px-3.5 py-2.5 text-xs font-medium leading-snug shadow-lg md:right-2">
            <span className="font-bold text-brand-green-dark">Hello! I&apos;m Dr. Hen 👋</span>
            <br />
            Your AI Poultry Doctor. Let&apos;s keep your flock healthy!
            <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-white" />
          </div>
        </div>

        <div className="order-1 md:order-2">
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
            Healthy Flocks
            <br />
            Stronger Farmers
          </h1>
          <p className="mt-1 text-sm text-black/50">AI powered poultry care for a healthier tomorrow</p>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Users} label="Total Farmers" value={totalFarmers.toLocaleString()} tint="red" />
            <StatCard icon={Bird} label="Total Birds" value={totalBirds.toLocaleString()} tint="green" />
            <StatCard icon={Syringe} label="Treatments Given" value={treatmentsGiven.toLocaleString()} tint="blue" />
            <StatCard icon={MessageSquare} label="Messages Sent" value={messagesSent.toLocaleString()} tint="amber" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-green-dark to-brand-green px-6 py-5 text-white">
        <div>
          <div className="text-lg font-bold">Prevent · Treat · Grow</div>
          <div className="text-sm text-white/80">Smarter Poultry Management</div>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg">→</div>
      </div>
    </div>
  );
}

import Image from "next/image";
import { ArrowRight, Users, Bird, Syringe, MessageSquare } from "lucide-react";
import { StatCard } from "./StatCard";

/**
 * Top band of the dashboard: headline, the four live stat cards, and the
 * "Prevent · Treat · Grow" feature card. The Dr. Hen character is NOT rendered
 * here — the page positions it as an overlay so it can bleed across this band
 * and the farmers table below, the way the reference design does.
 *
 * Every number is passed in from the page's Prisma queries; nothing here is
 * static.
 */
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
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] xl:items-center">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold leading-[1.1] tracking-tight 2xl:text-[34px]">
            Healthy Flocks
            <br />
            Stronger Farmers
          </h1>
          <p className="mt-1.5 text-sm text-black/50">AI powered poultry care for a healthier tomorrow</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatCard icon={Users} label="Total Farmers" value={totalFarmers.toLocaleString("en-IN")} tint="red" />
          <StatCard icon={Bird} label="Total Birds" value={totalBirds.toLocaleString("en-IN")} tint="green" />
          <StatCard icon={Syringe} label="Treatments Given" value={treatmentsGiven.toLocaleString("en-IN")} tint="blue" />
          <StatCard icon={MessageSquare} label="Messages Sent" value={messagesSent.toLocaleString("en-IN")} tint="amber" />
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <div aria-hidden className="hidden xl:block" />
        <PreventTreatGrowCard />
      </div>
    </div>
  );
}

function PreventTreatGrowCard() {
  return (
    <section className="relative flex h-[92px] items-center justify-between overflow-hidden rounded-2xl bg-brand-green-dark px-5 text-white shadow-sm">
      <Image
        src="/images/dr-hen.jpeg"
        alt=""
        aria-hidden
        fill
        sizes="(min-width: 1280px) 620px, 100vw"
        className="object-cover object-[20%_35%] opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-green-dark/40 via-brand-green-dark/85 to-brand-green-dark" />

      <div className="relative ml-auto text-right">
        <h2 className="text-xl font-extrabold leading-[1.15] 2xl:text-2xl">
          Prevent
          <br />
          Treat · Grow
        </h2>
        <p className="mt-0.5 text-xs text-white/75">Smarter Poultry Management</p>
      </div>
      <span
        aria-hidden
        className="relative ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/35"
      >
        <ArrowRight className="h-5 w-5" />
      </span>
    </section>
  );
}

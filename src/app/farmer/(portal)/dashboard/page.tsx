import Image from "next/image";
import { HeartPulse, Layers, ShieldPlus, Wheat } from "lucide-react";
import { FarmerKpiCard } from "@/components/farmer/FarmerKpiCard";
import { FlockHealthDonut } from "@/components/farmer/FlockHealthDonut";
import { QuickActions } from "@/components/farmer/QuickActions";
import { RecentActivities } from "@/components/farmer/RecentActivities";
import { VaccinationSchedule } from "@/components/farmer/VaccinationSchedule";
import { WhatsAppBanner } from "@/components/farmer/WhatsAppBanner";
import { requireFarmer } from "@/lib/auth/dal";
import { loadFarmerDashboard } from "@/lib/farmer/dashboardData";
import { getT, type I18nKey, type T } from "@/lib/i18n";
import { localizedTitle } from "@/lib/i18n/metadata";
import { whatsappChatLink } from "@/lib/whatsapp/businessNumber";

export const generateMetadata = () => localizedTitle("title.dashboard");
export const dynamic = "force-dynamic";

/** Greeting for the farmer's own morning, not the server's: Pakistan runs UTC+5 all year. */
function greetingKey(): I18nKey {
  const hour = (new Date().getUTCHours() + 5) % 24;
  if (hour < 12) return "dashboard.goodMorning";
  if (hour < 17) return "dashboard.goodAfternoon";
  return "dashboard.goodEvening";
}

/** The health word that goes under the percentage. */
function healthWord(percent: number | null, t: T): string {
  if (percent === null) return t("dash.noFlocksYet");
  if (percent >= 95) return t("dash.excellentStatus");
  if (percent >= 80) return t("dash.goodStatus");
  return t("dash.needsCare");
}

export default async function FarmerDashboardPage() {
  // The only source of farmerId on this page: the verified session, never the request.
  const { farmerId, language } = await requireFarmer();
  const t = getT(language);
  const locale = language === "UR" ? "ur-PK" : "en-GB";

  const [data, waLink] = await Promise.all([loadFarmerDashboard(farmerId), whatsappChatLink()]);
  const fmt = (n: number) => n.toLocaleString("en-IN");
  const needCare = data.health.mildBirds + data.health.atRiskBirds;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header className="flex items-center gap-3">
        <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-[#1f9d4d]/25">
          <Image src="/images/dr-hen-doctor.jpg" alt="" fill sizes="48px" className="object-cover object-top" priority />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold leading-tight tracking-tight text-[#14532d] sm:text-3xl">
            {t(greetingKey())}, {data.farmName}
          </h1>
          <p className="truncate text-sm text-black/55">{t("dashboard.welcomeLine")}</p>
        </div>
      </header>

      <section>
        <h2 className="pb-2 text-[15px] font-extrabold">{t("dash.topKpis")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FarmerKpiCard
            icon={Layers}
            label={t("dash.myFlockSize")}
            value={fmt(data.liveBirds)}
            unit={t("unit.birds")}
            sub={data.flockCount === 0 ? t("dash.noFlocksYet") : t("dash.ofPlaced", { n: fmt(data.placedBirds) })}
            href="/farmer/flocks"
          />
          <FarmerKpiCard
            icon={HeartPulse}
            label={t("dash.flockHealth")}
            value={data.healthPercent === null ? "—" : `${data.healthPercent}%`}
            sub={needCare > 0 ? t("dash.birdsNeedCare", { n: fmt(needCare) }) : healthWord(data.healthPercent, t)}
            tint={data.healthPercent === null ? "slate" : data.healthPercent >= 95 ? "green" : data.healthPercent >= 80 ? "amber" : "red"}
            href="/farmer/alerts"
          />
          <FarmerKpiCard
            icon={Wheat}
            label={t("dash.feedStock")}
            value={data.feed.daysLeft !== null ? fmt(data.feed.daysLeft) : data.feed.bags !== null ? fmt(Math.round(data.feed.bags)) : "—"}
            unit={data.feed.daysLeft !== null ? t("dash.daysWord") : data.feed.bags !== null ? t("qa.bags") : undefined}
            sub={
              data.feed.bags === null
                ? t("dash.recordStock")
                : data.feed.daysLeft === null
                  ? t("dash.needEntriesForDays")
                  : t("dash.bagsLeft", { bags: fmt(Math.round(data.feed.bags)), kg: fmt(data.feed.kg ?? 0) })
            }
            tint={data.feed.daysLeft !== null && data.feed.daysLeft <= 3 ? "red" : data.feed.bags === null ? "slate" : "green"}
            href="/farmer/daily-entry"
          />
          <FarmerKpiCard
            icon={ShieldPlus}
            label={t("dash.vaccinationDue")}
            value={
              !data.nextVaccination || data.nextVaccination.daysAway === null
                ? "—"
                : data.nextVaccination.daysAway === 0
                  ? t("dash.dueToday")
                  : fmt(Math.abs(data.nextVaccination.daysAway))
            }
            unit={data.nextVaccination && (data.nextVaccination.daysAway ?? 0) !== 0 ? t("dash.daysWord") : undefined}
            sub={data.nextVaccination ? data.nextVaccination.name : t("dash.askUsToSchedule")}
            tint={!data.nextVaccination ? "slate" : data.nextVaccination.state === "OVERDUE" ? "red" : "amber"}
          />
        </div>
      </section>

      <WhatsAppBanner href={waLink} t={t} />

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        <FlockHealthDonut health={data.health} percent={data.healthPercent} />
        <VaccinationSchedule rows={data.vaccinations} t={t} />
      </div>

      <RecentActivities rows={data.activities} t={t} lang={language ?? "EN"} locale={locale} />

      {/* Default order sized to this farm's own week of feed use, so the number in the box is
          already roughly right rather than an arbitrary 10. */}
      <QuickActions
        whatsappHref={waLink}
        defaultFeedBags={Math.max(10, Math.ceil((data.feed.averageBagsPerDay ?? 2) * 7))}
      />
    </div>
  );
}

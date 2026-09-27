import { Bell, Bird, ClipboardList, Layers } from "lucide-react";
import { AssistantPanel } from "@/components/farmer/AssistantPanel";
import { FarmerHero } from "@/components/farmer/FarmerHero";
import { FarmerStatCard } from "@/components/farmer/FarmerStatCard";
import { requireFarmer } from "@/lib/auth/dal";
import { getT, type I18nKey, type T } from "@/lib/i18n";
import { localizedTitle } from "@/lib/i18n/metadata";
import { prisma } from "@/lib/prisma";
import { whatsappChatLink } from "@/lib/whatsapp/businessNumber";

export const generateMetadata = () => localizedTitle("title.dashboard");
export const dynamic = "force-dynamic";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const weekAgo = () => new Date(Date.now() - WEEK_MS);

/** Greeting for the farmer's own morning, not the server's: Pakistan runs UTC+5 all year. */
function greetingKey(): I18nKey {
  const hour = (new Date().getUTCHours() + 5) % 24;
  if (hour < 12) return "dashboard.goodMorning";
  if (hour < 17) return "dashboard.goodAfternoon";
  return "dashboard.goodEvening";
}

export default async function FarmerDashboardPage() {
  // The only source of farmerId on this page: the verified session, never the request.
  const { farmerId, language } = await requireFarmer();
  const t: T = getT(language);
  const weekStart = weekAgo();

  const [farmer, flocks, activeAlerts, week, waLink] = await Promise.all([
    prisma.farmer.findFirst({ where: { id: farmerId }, select: { name: true, location: true } }),
    prisma.flock.aggregate({ where: { farmerId, active: true }, _count: { _all: true }, _sum: { sizeCount: true } }),
    prisma.alert.count({ where: { farmerId, status: "OPEN" } }),
    prisma.dailyReport.aggregate({
      where: { farmerId, date: { gte: weekStart } },
      _count: { _all: true },
      _sum: { mortalityCount: true },
    }),
    whatsappChatLink(),
  ]);

  const fmt = (n: number) => n.toLocaleString("en-IN");
  const flockCount = flocks._count._all;
  const entries = week._count._all;
  const deaths = week._sum.mortalityCount ?? 0;
  const flockWord = t(flockCount === 1 ? "dashboard.flockWord" : "dashboard.flocksWord");
  const entriesWord = t(entries === 1 ? "dashboard.entry" : "dashboard.entries");
  // A week counts as healthy only when nothing is waiting for the farmer's attention.
  const healthy = activeAlerts === 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <FarmerHero greeting={t(greetingKey())} name={farmer?.name ?? ""} t={t} whatsappHref={waLink} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FarmerStatCard
          icon={Layers}
          label={t("dashboard.myFlocks")}
          value={fmt(flockCount)}
          sub={flockCount === 0 ? t("dashboard.addFirstFlock") : undefined}
          tint="green"
          href="/farmer/flocks"
        />
        <FarmerStatCard
          icon={Bird}
          label={t("dashboard.totalBirds")}
          value={fmt(flocks._sum.sizeCount ?? 0)}
          sub={flockCount > 0 ? t("dashboard.acrossFlocks", { n: flockCount, flocks: flockWord }) : undefined}
          tint="blue"
          href="/farmer/flocks"
        />
        <FarmerStatCard
          icon={Bell}
          label={t("dashboard.activeAlerts")}
          value={fmt(activeAlerts)}
          sub={activeAlerts > 0 ? t("dashboard.openAlerts", { n: activeAlerts }) : t("dashboard.allClear")}
          tint={activeAlerts > 0 ? "red" : "green"}
          href="/farmer/alerts"
        />
        <FarmerStatCard
          icon={ClipboardList}
          label={t("dashboard.weekReport")}
          value={entries === 0 ? t("dashboard.noEntriesYet") : healthy ? t("dashboard.healthy") : t("dashboard.needsAttention")}
          sub={entries === 0 ? t("dashboard.recordToday") : t("dashboard.deathsThisWeek", { n: fmt(deaths), e: entries, entries: entriesWord })}
          tint={entries === 0 || !healthy ? "amber" : "green"}
          href={entries === 0 ? "/farmer/daily-entry" : "/farmer/reports"}
        />
      </div>

      <AssistantPanel aiChatHref="/farmer/assistant" whatsappHref={waLink} t={t} />
    </div>
  );
}

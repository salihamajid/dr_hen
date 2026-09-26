import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertActions } from "@/components/farmer/AlertActions";
import { SeverityBadge } from "@/components/farmer/AlertBadge";
import { requireFarmer } from "@/lib/auth/dal";
import { getT, type I18nKey } from "@/lib/i18n";
import { localizedTitle } from "@/lib/i18n/metadata";
import { prisma } from "@/lib/prisma";

export const generateMetadata = () => localizedTitle("title.alerts");
export const dynamic = "force-dynamic";

const METRIC_KEYS = new Set(["deaths", "birdsRemaining", "percent", "threshold", "latestPercent", "series", "temperatureC", "week", "min", "max", "date"]);

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { farmerId, language } = await requireFarmer();
  const t = getT(language);
  const { id } = await params;

  // id from the URL is a filter next to the session's farmerId; someone else's alert is a 404.
  const alert = await prisma.alert.findFirst({ where: { id, farmerId }, include: { flock: { select: { id: true, name: true } } } });
  if (!alert) notFound();

  // Opening an alert marks it read.
  if (!alert.readAt) await prisma.alert.updateMany({ where: { id, farmerId, readAt: null }, data: { readAt: new Date() } });

  const metrics = (alert.metrics && typeof alert.metrics === "object" ? Object.entries(alert.metrics as Record<string, unknown>) : []) as [string, string | number][];
  const isMortality = alert.code.startsWith("MORTALITY");
  const ur = language === "UR";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <Link href="/farmer/alerts" className="text-xs text-black/40 hover:underline">{t("alerts.back")}</Link>
        <div className="mt-2 flex items-start gap-3">
          <SeverityBadge severity={alert.severity} label={t(`severity.${alert.severity}`)} />
          <h1 className="text-lg font-bold leading-snug">{ur ? alert.titleUr : alert.titleEn}</h1>
        </div>
        <p className="mt-1 text-[11px] text-black/45">
          {alert.flock?.name ?? t("alerts.allFlocks")} · {alert.createdAt.toLocaleString("en-GB", { timeZone: "UTC" })} UTC
        </p>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <p className="text-sm leading-relaxed">{ur ? alert.bodyUr : alert.bodyEn}</p>
        {metrics.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {metrics.map(([k, v]) => (
              <div key={k} className="rounded-xl bg-black/[0.03] px-3 py-2">
                <dt className="text-[11px] text-black/45">{METRIC_KEYS.has(k) ? t(`metric.${k}` as I18nKey) : k}</dt>
                <dd className="text-sm font-bold">{String(v)}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href="/farmer/assistant" className="rounded-xl bg-brand-green-dark px-4 py-2 text-sm font-semibold text-white">{t("alerts.askAi")}</Link>
        {alert.flock && (
          <Link href={`/farmer/flocks/${alert.flock.id}`} className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-black/5">{t("alerts.viewFlock")}</Link>
        )}
        {isMortality && (
          <Link href={alert.flock ? `/farmer/reports/mortality?flockId=${alert.flock.id}` : "/farmer/reports/mortality"} className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-black/5">{t("alerts.mortReport")}</Link>
        )}
        {alert.code === "MISSED_ENTRY" && (
          <Link href="/farmer/daily-entry" className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-black/5">{t("alerts.openDaily")}</Link>
        )}
      </div>

      <AlertActions id={alert.id} status={alert.status} />
      <p className="text-[11px] text-black/40">{t("alerts.basedOn")}</p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertActions } from "@/components/farmer/AlertActions";
import { SeverityBadge } from "@/components/farmer/AlertBadge";
import { requireFarmer } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Alert — Dr. Hen" };
export const dynamic = "force-dynamic";

const METRIC_LABEL: Record<string, string> = {
  deaths: "Deaths",
  birdsRemaining: "Birds remaining",
  percent: "Mortality %",
  threshold: "Alert level %",
  latestPercent: "Latest mortality %",
  series: "Last 3 days",
  temperatureC: "Temperature °C",
  week: "Flock week",
  min: "Range from °C",
  max: "Range to °C",
  date: "Date",
};

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { farmerId } = await requireFarmer();
  const { id } = await params;

  // id from the URL is a filter next to the session's farmerId; someone else's alert is a 404.
  const alert = await prisma.alert.findFirst({ where: { id, farmerId }, include: { flock: { select: { id: true, name: true } } } });
  if (!alert) notFound();

  // Opening an alert marks it read.
  if (!alert.readAt) await prisma.alert.updateMany({ where: { id, farmerId, readAt: null }, data: { readAt: new Date() } });

  const metrics = (alert.metrics && typeof alert.metrics === "object" ? Object.entries(alert.metrics as Record<string, unknown>) : []) as [string, string | number][];
  const isMortality = alert.code.startsWith("MORTALITY");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <Link href="/farmer/alerts" className="text-xs text-black/40 hover:underline">← All alerts</Link>
        <div className="mt-2 flex items-start gap-3">
          <SeverityBadge severity={alert.severity} />
          <h1 className="text-lg font-bold leading-snug">{alert.titleEn}</h1>
        </div>
        <p className="mt-1 text-[11px] text-black/45">
          {alert.flock?.name ?? "All flocks"} · {alert.createdAt.toLocaleString("en-GB", { timeZone: "UTC" })} UTC
        </p>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <p className="text-sm leading-relaxed">{alert.bodyEn}</p>
        {metrics.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {metrics.map(([k, v]) => (
              <div key={k} className="rounded-xl bg-black/[0.03] px-3 py-2">
                <dt className="text-[11px] text-black/45">{METRIC_LABEL[k] ?? k}</dt>
                <dd className="text-sm font-bold">{String(v)}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href="/farmer/assistant" className="rounded-xl bg-brand-green-dark px-4 py-2 text-sm font-semibold text-white">Ask the AI Assistant</Link>
        {alert.flock && (
          <Link href={`/farmer/flocks/${alert.flock.id}`} className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-black/5">View flock</Link>
        )}
        {isMortality && (
          <Link href={alert.flock ? `/farmer/reports/mortality?flockId=${alert.flock.id}` : "/farmer/reports/mortality"} className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-black/5">Mortality report</Link>
        )}
        {alert.code === "MISSED_ENTRY" && (
          <Link href="/farmer/daily-entry" className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-black/5">Open Daily Entry</Link>
        )}
      </div>

      <AlertActions id={alert.id} status={alert.status} />
      <p className="text-[11px] text-black/40">This alert is based on your recorded data. It does not replace a veterinary assessment.</p>
    </div>
  );
}

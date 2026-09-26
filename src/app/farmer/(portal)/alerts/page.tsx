import type { Metadata } from "next";
import Link from "next/link";
import { BellRing } from "lucide-react";
import { SeverityBadge } from "@/components/farmer/AlertBadge";
import { requireFarmer } from "@/lib/auth/dal";
import { getT } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Alerts — Dr. Hen" };
export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const { farmerId, language } = await requireFarmer();
  const t = getT(language);

  const alerts = await prisma.alert.findMany({
    where: { farmerId },
    // Unresolved first, then newest.
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    select: { id: true, severity: true, status: true, titleEn: true, createdAt: true, readAt: true, flock: { select: { name: true } } },
  });
  const open = alerts.filter((a) => a.status !== "RESOLVED");
  const resolved = alerts.filter((a) => a.status === "RESOLVED");

  const row = (a: (typeof alerts)[number]) => (
    <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <SeverityBadge severity={a.severity} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${a.readAt ? "font-medium" : "font-bold"}`}>{a.titleEn}</p>
        <p className="text-[11px] text-black/45">
          {a.flock?.name ?? t("alerts.allFlocks")} · {a.createdAt.toLocaleDateString("en-GB", { timeZone: "UTC" })}
          {a.status === "ACKNOWLEDGED" && ` · ${t("alerts.acknowledged")}`}
        </p>
      </div>
      <Link href={`/farmer/alerts/${a.id}`} className="rounded-xl border border-brand-green-dark px-3 py-1.5 text-xs font-semibold text-brand-green-dark hover:bg-brand-green-dark hover:text-white">
        {t("common.view")}
      </Link>
    </li>
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <BellRing className="h-5 w-5 text-brand-green" aria-hidden />
        <h1 className="text-xl font-bold">{t("alerts.title")}</h1>
      </div>

      {alerts.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-black/45 shadow-sm ring-1 ring-black/5">
          {t("alerts.empty")}
        </p>
      ) : (
        <>
          {open.length > 0 && <ul className="flex flex-col gap-2">{open.map(row)}</ul>}
          {resolved.length > 0 && (
            <>
              <h2 className="mt-2 text-sm font-semibold text-black/50">{t("alerts.resolvedHeading")}</h2>
              <ul className="flex flex-col gap-2 opacity-70">{resolved.map(row)}</ul>
            </>
          )}
        </>
      )}
      <p className="text-[11px] text-black/40">{t("alerts.disclaimer")}</p>
    </div>
  );
}

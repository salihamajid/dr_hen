import Link from "next/link";
import { ShareBar } from "@/components/farmer/ShareBar";
import { requireFarmer } from "@/lib/auth/dal";
import { getT } from "@/lib/i18n";
import { localizedTitle } from "@/lib/i18n/metadata";
import { translateMessage } from "@/lib/i18n/messages";
import { prisma } from "@/lib/prisma";
import { loadReport } from "@/lib/reports/queries";
import { buildReport } from "@/lib/reports/reportText";
import { whatsappChatLink } from "@/lib/whatsapp/businessNumber";

export const generateMetadata = () => localizedTitle("title.reports");
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const today = () => new Date().toISOString().slice(0, 10);

export default async function DailyReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { farmerId, language } = await requireFarmer();
  const t = getT(language);
  const sp = await searchParams;

  const date = one(sp.date) ?? today();
  const generate = one(sp.generate) === "1";

  const [flockCount, loaded, waLink] = await Promise.all([
    prisma.flock.count({ where: { farmerId, active: true } }),
    generate ? loadReport(farmerId, { type: "daily", date }) : null,
    whatsappChatLink(),
  ]);
  const report = loaded?.ok && loaded.report.type === "daily" ? loaded.report : null;
  const problem = loaded && !loaded.ok ? translateMessage(language, loaded.error) : null;
  const view = report ? buildReport(report, t) : null;
  const anyEntry = report?.sheds.some((s) => s.hasEntry) ?? false;

  const input = "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-green";
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <Link href="/farmer/reports" className="text-xs text-black/40 hover:underline">{t("reports.back")}</Link>
        <h1 className="mt-1 text-xl font-bold">{t("reports.dailyTitle")}</h1>
        <p className="text-xs text-black/50">{t("reports.dailyPickDate")}</p>
      </div>

      {flockCount === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-black/45 shadow-sm ring-1 ring-black/5">{t("reports.noShedsYet")}</p>
      ) : (
        <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <input type="hidden" name="generate" value="1" />
          <label className="text-xs font-semibold text-black/60">{t("common.date")}
            <input type="date" name="date" defaultValue={date} className={`${input} mt-1 block`} />
          </label>
          <button type="submit" className="rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white">{t("reports.generate")}</button>
        </form>
      )}

      {problem && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{problem}</p>}

      {view && report && (
        <>
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <header className="border-b border-black/5 px-5 py-4">
              <h2 className="text-base font-bold">{view.title}</h2>
              <p className="text-xs text-black/50">{view.subtitle}</p>
              <p className="text-xs text-black/45">{t("rep.farmName")}: {report.farmName}</p>
            </header>

            {view.sections.map((section) => (
              <div key={section.heading} className="border-b border-black/5 last:border-0">
                {section.heading && (
                  <h3 className="bg-[#e7f5ea] px-5 py-2 text-sm font-bold text-brand-green-dark">{section.heading}</h3>
                )}
                <dl className="divide-y divide-black/5 px-5 text-sm">
                  {section.rows.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-2">
                      <dt className="text-black/50">{k}</dt>
                      <dd className="text-end font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}

            <footer className="space-y-1 px-5 py-3">
              {view.footnotes.map((note) => (
                <p key={note} className="text-[11px] text-black/40">{note}</p>
              ))}
            </footer>
          </section>

          {!anyEntry && (
            <p className="text-xs text-black/45">
              {t("reports.recordFirstPre")}
              <Link href="/farmer/daily-entry" className="font-semibold underline">{t("reports.recordFirstLink")}</Link>
              {t("reports.recordFirstPost")}
            </p>
          )}
          {anyEntry && <ShareBar request={{ type: "daily", date }} waLink={waLink} />}
        </>
      )}
    </div>
  );
}

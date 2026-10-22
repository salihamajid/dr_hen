import { BellOff, CheckCircle2, ClipboardList, ShoppingBag, Stethoscope, Syringe } from "lucide-react";
import type { ActivityRow } from "@/lib/farmer/dashboardData";
import type { I18nKey, Lang, T } from "@/lib/i18n";

const ICON = {
  ENTRY: { icon: ClipboardList, chip: "bg-[#e8f1fd] text-[#2a78d6]" },
  VACCINATION: { icon: Syringe, chip: "bg-[#d6f0de] text-[#1f7a4d]" },
  ALERT_CLEARED: { icon: BellOff, chip: "bg-[#d6f0de] text-[#1f7a4d]" },
  VET: { icon: Stethoscope, chip: "bg-[#fbe4c6] text-[#b9761a]" },
  FEED_ORDER: { icon: ShoppingBag, chip: "bg-[#ede9fe] text-[#6d4bd8]" },
} as const;

const VET_STATE: Record<string, I18nKey> = {
  PENDING: "act.vetPending",
  CONTACTED: "act.vetContacted",
  RESOLVED: "act.vetResolved",
};
const FEED_STATE: Record<string, I18nKey> = {
  REQUESTED: "act.feedRequested",
  CONFIRMED: "act.feedConfirmed",
  DELIVERED: "act.feedDelivered",
  CANCELLED: "act.feedCancelled",
};

/**
 * What has actually happened on this farm, drawn from records the farmer already keeps —
 * daily entries, vaccinations, vet requests, feed orders, alerts that cleared. Nobody is
 * asked to log a chore twice just to fill this panel.
 *
 * Each row arrives as a kind plus its numbers, so the sentence is built here in the farmer's
 * own language instead of being fixed in English in the database.
 */
export function RecentActivities({ rows, t, lang, locale }: { rows: ActivityRow[]; t: T; lang: Lang; locale: string }) {
  const when = (at: Date) =>
    at.toLocaleDateString(locale, { day: "numeric", month: "short" }) + " · " + at.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });

  function lines(row: ActivityRow): { title: string; detail: string } {
    switch (row.kind) {
      case "ENTRY":
        return {
          title: row.flockName ? t("act.entry", { flock: row.flockName }) : t("act.entryNoFlock"),
          detail: t("act.nDeaths", { n: row.count ?? 0 }),
        };
      case "VACCINATION":
        return { title: t("act.vaccGiven", { name: row.name ?? "" }), detail: when(row.at) };
      case "ALERT_CLEARED":
        // The alert's own wording, frozen in both languages when it fired.
        return { title: t("act.alertCleared"), detail: (lang === "UR" ? row.textUr : row.textEn) ?? "" };
      case "VET":
        return { title: t("act.vetRequested"), detail: t(VET_STATE[row.state ?? "PENDING"] ?? "act.vetPending") };
      case "FEED_ORDER":
        return { title: t("act.feedOrdered", { n: row.count ?? 0 }), detail: t(FEED_STATE[row.state ?? "REQUESTED"] ?? "act.feedRequested") };
    }
  }

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <h2 className="pb-2 text-[15px] font-extrabold">{t("dash.recentActivities")}</h2>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-black/[0.03] px-3 py-6 text-center text-xs text-black/45">{t("dash.noActivity")}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const meta = ICON[row.kind];
            const Icon = meta.icon;
            const { title, detail } = lines(row);
            return (
              <li key={row.id} className="flex items-start gap-2.5">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.chip}`}>
                  {row.kind === "ALERT_CLEARED" ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold">{title}</span>
                  <span className="block truncate text-[11px] text-black/50">
                    {when(row.at)}
                    {detail && ` · ${detail}`}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

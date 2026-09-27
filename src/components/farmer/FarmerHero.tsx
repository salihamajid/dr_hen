import { Check } from "lucide-react";
import { DrHenPortrait } from "./DrHenPortrait";
import type { I18nKey, T } from "@/lib/i18n";

const FEATURES: I18nKey[] = ["dashboard.f1", "dashboard.f2", "dashboard.f3", "dashboard.f4", "dashboard.f5"];

/**
 * The farmer's welcome banner: a greeting, then the green "always with you" panel beside the
 * Dr. Hen portrait, which opens a larger view when tapped.
 */
export function FarmerHero({ greeting, name, t }: { greeting: string; name: string; t: T }) {
  return (
    <section className="overflow-hidden rounded-3xl bg-brand-green-dark text-white shadow-sm">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/70">
            {greeting}
            <span aria-hidden> 👋</span>
          </p>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{name}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
            {t("dashboard.welcomeLine")}
            <br className="hidden sm:block" /> {t("dashboard.welcomeLine2")}
          </p>

          <div className="mt-6 rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-sm">
            <h2 className="text-base font-bold sm:text-lg">{t("dashboard.alwaysWithYou")}</h2>
            <ul className="mt-3 grid gap-2.5">
              {FEATURES.map((key) => (
                <li key={key} className="flex items-start gap-2.5 text-sm text-white/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#b6f0c9] text-brand-green-dark">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="min-w-0">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto h-44 w-44 shrink-0 sm:h-52 sm:w-52 lg:h-64 lg:w-64">
          <DrHenPortrait alt={t("dashboard.drHenAlt")} openLabel={t("dashboard.enlarge")} closeLabel={t("common.close")} />
        </div>
      </div>
    </section>
  );
}

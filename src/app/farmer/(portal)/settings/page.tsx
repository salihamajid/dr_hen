import type { Metadata } from "next";
import { LanguagePicker } from "@/components/farmer/LanguagePicker";
import { requireFarmer } from "@/lib/auth/dal";
import { getT } from "@/lib/i18n";

export const metadata: Metadata = { title: "Settings — Dr. Hen" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { language } = await requireFarmer();
  const t = getT(language);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="text-xl font-bold">{t("settings.title")}</h1>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="text-base font-bold">{t("settings.languageHeading")}</h2>
        <p className="mb-4 mt-1 text-xs text-black/50">{t("settings.languageHelp")}</p>
        <LanguagePicker initial={language} mode="settings" />
      </section>
    </div>
  );
}

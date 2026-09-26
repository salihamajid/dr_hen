import Image from "next/image";
import { redirect } from "next/navigation";
import { LanguagePicker } from "@/components/farmer/LanguagePicker";
import { requireFarmer } from "@/lib/auth/dal";
import { getT } from "@/lib/i18n";
import { localizedTitle } from "@/lib/i18n/metadata";
import { getRequestLang } from "@/lib/i18n/server";

export const generateMetadata = () => localizedTitle("title.language");
export const dynamic = "force-dynamic";

// Shown once, right after the first login or signup, before the portal shell. It lives outside
// the (portal) group on purpose: that layout redirects here when no language is chosen yet.
export default async function LanguageChooserPage() {
  const { language } = await requireFarmer();
  if (language) redirect("/farmer/dashboard");
  // No saved choice yet, so this is the language picked on the login/signup page (or English).
  const lang = await getRequestLang();
  const t = getT(lang);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5">
          <Image src="/images/dr-hen-v2.jpeg" alt={t("brand.name")} fill sizes="64px" className="object-cover object-top" priority />
        </div>
        <h1 className="text-2xl font-extrabold">{t("language.title")}</h1>
        <p className="text-sm text-black/50">{t("language.subtitle")}</p>
      </div>
      <LanguagePicker initial={lang} mode="first" />
    </main>
  );
}

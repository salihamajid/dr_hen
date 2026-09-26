import { Noto_Naskh_Arabic } from "next/font/google";
import { I18nProvider } from "@/components/farmer/I18nProvider";
import { currentFarmer } from "@/lib/auth/dal";
import { dirFor } from "@/lib/i18n";

// Geist has no Arabic-script glyphs, so Urdu needs its own font. It is scoped to the farmer
// area and not preloaded, so English users and the admin screens never download it.
const urduFont = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--font-urdu", display: "swap", preload: false });

export default async function FarmerLayout({ children }: { children: React.ReactNode }) {
  // Wraps every /farmer/* page, including login and signup where nobody is signed in yet (-> English).
  const farmer = await currentFarmer();
  const lang = farmer?.language ?? "EN";

  return (
    <div
      lang={lang === "UR" ? "ur" : "en"}
      dir={dirFor(lang)}
      className={`${urduFont.variable} h-full ${lang === "UR" ? "font-[family-name:var(--font-urdu)]" : ""}`}
    >
      <I18nProvider lang={lang}>{children}</I18nProvider>
    </div>
  );
}

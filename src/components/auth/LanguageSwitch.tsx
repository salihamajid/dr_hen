"use client";

import { useRouter } from "next/navigation";
import { useLang } from "@/components/farmer/I18nProvider";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";

// English / اردو switch for the login and signup pages, where nobody is signed in yet, so the
// choice is kept in a small cookie. After login the farmer's saved language takes over.
function storeLanguage(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageSwitch() {
  const router = useRouter();
  const current = useLang();

  function choose(lang: Lang) {
    if (lang === current) return;
    storeLanguage(lang);
    router.refresh();
  }

  const pill = (lang: Lang, label: string) => (
    <button
      type="button"
      key={lang}
      onClick={() => choose(lang)}
      aria-pressed={current === lang}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        current === lang ? "bg-brand-green-dark text-white" : "text-black/55 hover:bg-black/5"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div dir="ltr" className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] p-1">
      {pill("EN", "English")}
      {pill("UR", "اردو")}
    </div>
  );
}

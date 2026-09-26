import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { FarmerAuthShell } from "@/components/auth/AuthShell";
import { FarmerLoginForm } from "@/components/auth/FarmerLoginForm";
import { currentFarmer } from "@/lib/auth/dal";
import { ADMIN_LOGIN, FARMER_HOME, FARMER_SIGNUP } from "@/lib/auth/paths";
import { getT } from "@/lib/i18n";
import { getRequestLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getT(await getRequestLang())("title.farmerLogin") };
}

export default async function FarmerLoginPage() {
  // The DB-verified lookup, not the raw cookie: a signed-but-revoked cookie would
  // otherwise bounce login -> dashboard -> login forever.
  if (await currentFarmer()) redirect(FARMER_HOME);
  const t = getT(await getRequestLang());

  return (
    <FarmerAuthShell
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSub")}
      footer={
        <>
          <p>
            {t("auth.noAccount")}{" "}
            <Link href={FARMER_SIGNUP} className="font-semibold text-brand-green-dark hover:underline">
              {t("auth.signUp")}
            </Link>
          </p>
          <p>
            <Link
              href={ADMIN_LOGIN}
              className="inline-flex items-center gap-1.5 text-xs text-black/45 hover:text-black/70"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden />
              {t("auth.adminLogin")}
            </Link>
          </p>
        </>
      }
    >
      <FarmerLoginForm />
    </FarmerAuthShell>
  );
}

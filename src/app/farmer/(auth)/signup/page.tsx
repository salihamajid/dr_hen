import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FarmerAuthShell } from "@/components/auth/AuthShell";
import { FarmerSignupForm } from "@/components/auth/FarmerSignupForm";
import { currentFarmer } from "@/lib/auth/dal";
import { FARMER_HOME, FARMER_LOGIN } from "@/lib/auth/paths";
import { getT } from "@/lib/i18n";
import { getRequestLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getT(await getRequestLang())("title.signup") };
}

export default async function FarmerSignupPage() {
  if (await currentFarmer()) redirect(FARMER_HOME);
  const t = getT(await getRequestLang());

  return (
    <FarmerAuthShell
      title={t("auth.signupTitle")}
      subtitle={t("auth.signupSub")}
      footer={
        <p>
          {t("auth.haveAccount")}{" "}
          <Link href={FARMER_LOGIN} className="font-semibold text-brand-green-dark hover:underline">
            {t("auth.logIn")}
          </Link>
        </p>
      }
    >
      <FarmerSignupForm />
    </FarmerAuthShell>
  );
}

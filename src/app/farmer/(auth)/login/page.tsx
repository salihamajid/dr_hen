import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { FarmerAuthShell } from "@/components/auth/AuthShell";
import { FarmerLoginForm } from "@/components/auth/FarmerLoginForm";
import { currentFarmer } from "@/lib/auth/dal";
import { ADMIN_LOGIN, FARMER_HOME, FARMER_SIGNUP } from "@/lib/auth/paths";

export const metadata: Metadata = { title: "Farmer login — Dr. Hen" };

export default async function FarmerLoginPage() {
  // The DB-verified lookup, not the raw cookie: a signed-but-revoked cookie would
  // otherwise bounce login -> dashboard -> login forever.
  if (await currentFarmer()) redirect(FARMER_HOME);

  return (
    <FarmerAuthShell
      title="Welcome Back, Farmer!"
      subtitle="Login to get expert poultry guidance with Dr. Hen"
      footer={
        <>
          <p>
            Don&apos;t have an account?{" "}
            <Link href={FARMER_SIGNUP} className="font-semibold text-brand-green-dark hover:underline">
              Sign Up
            </Link>
          </p>
          <p>
            <Link
              href={ADMIN_LOGIN}
              className="inline-flex items-center gap-1.5 text-xs text-black/45 hover:text-black/70"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden />
              Admin Login
            </Link>
          </p>
        </>
      }
    >
      <FarmerLoginForm />
    </FarmerAuthShell>
  );
}

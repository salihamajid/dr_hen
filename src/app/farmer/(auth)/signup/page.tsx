import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FarmerAuthShell } from "@/components/auth/AuthShell";
import { FarmerSignupForm } from "@/components/auth/FarmerSignupForm";
import { currentFarmer } from "@/lib/auth/dal";
import { FARMER_HOME, FARMER_LOGIN } from "@/lib/auth/paths";

export const metadata: Metadata = { title: "Create your account — Dr. Hen" };

export default async function FarmerSignupPage() {
  if (await currentFarmer()) redirect(FARMER_HOME);

  return (
    <FarmerAuthShell
      title="Create your account"
      subtitle="Register your farm to get expert poultry guidance"
      footer={
        <p>
          Already have an account?{" "}
          <Link href={FARMER_LOGIN} className="font-semibold text-brand-green-dark hover:underline">
            Log in
          </Link>
        </p>
      }
    >
      <FarmerSignupForm />
    </FarmerAuthShell>
  );
}

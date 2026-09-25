import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAuthShell } from "@/components/auth/AuthShell";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { currentAdmin } from "@/lib/auth/dal";
import { ADMIN_HOME, FARMER_LOGIN } from "@/lib/auth/paths";

export const metadata: Metadata = { title: "Admin login — Dr. Hen" };

// Admin only. There is intentionally no sign-up link, page, or API: the single
// admin account is created by `npm run db:seed:admin`.
export default async function AdminLoginPage() {
  if (await currentAdmin()) redirect(ADMIN_HOME);

  return (
    <AdminAuthShell
      title="Admin login"
      subtitle="Sign in to manage farmers, flocks and treatments."
      footer={
        <p>
          Are you a farmer?{" "}
          <Link href={FARMER_LOGIN} className="font-semibold text-brand-green-dark hover:underline">
            Log in here
          </Link>
        </p>
      }
    >
      <AdminLoginForm />
    </AdminAuthShell>
  );
}

import { redirect } from "next/navigation";
import { currentAdmin, currentFarmer } from "@/lib/auth/dal";
import { ADMIN_HOME, FARMER_HOME, FARMER_LOGIN } from "@/lib/auth/paths";

// Session-based entry point. The Android app opens this URL, so signed-out visitors
// land on the farmer login (admins reach /login directly).
export default async function Home() {
  if (await currentAdmin()) redirect(ADMIN_HOME);
  if (await currentFarmer()) redirect(FARMER_HOME);
  redirect(FARMER_LOGIN);
}

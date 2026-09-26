import { cookies } from "next/headers";
import { currentFarmer } from "@/lib/auth/dal";
import { LANG_COOKIE, isLang, type Lang } from "./index";

/**
 * The language for the current request: a signed-in farmer's saved choice, otherwise the
 * cookie set by the switch on the login/signup pages, otherwise English.
 */
export async function getRequestLang(): Promise<Lang> {
  const farmer = await currentFarmer();
  if (farmer?.language) return farmer.language;
  const fromCookie = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(fromCookie) ? fromCookie : "EN";
}

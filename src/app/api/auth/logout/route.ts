import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/dal";
import { expiredSessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";
import { jsonError } from "@/lib/auth/http";
import { ADMIN_LOGIN, FARMER_LOGIN } from "@/lib/auth/paths";

// POST only, and only with a JSON Content-Type: a GET link (or an <img src>) must
// not be able to sign people out, and neither should a cross-site <form> post.
export async function POST(req: NextRequest) {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return jsonError(415, "Content-Type must be application/json");
  }

  const session = await getSession();
  const res = NextResponse.json({ ok: true, redirect: session?.role === "ADMIN" ? ADMIN_LOGIN : FARMER_LOGIN });
  res.cookies.set(SESSION_COOKIE, "", expiredSessionCookieOptions());
  return res;
}

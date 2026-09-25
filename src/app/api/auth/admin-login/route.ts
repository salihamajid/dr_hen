import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { adminLoginSchema } from "@/lib/validators/auth";
import { jsonError, parseJsonBody } from "@/lib/auth/http";
import { clearAttempts, clientIp, isLimited, recordAttempt, retryAfterSeconds } from "@/lib/auth/rateLimit";
import { ADMIN_HOME } from "@/lib/auth/paths";

const MAX_PER_IP = 40;
const MAX_PER_ACCOUNT = 8;

export async function POST(req: NextRequest) {
  try {
    const body = await parseJsonBody(req, adminLoginSchema);
    if (!body.ok) return body.response;
    const { email, password } = body.data;

    const ipKey = `admin-ip:${clientIp(req)}`;
    const accountKey = `admin-acct:${email}`;
    if (isLimited(ipKey, MAX_PER_IP) || isLimited(accountKey, MAX_PER_ACCOUNT)) {
      const res = jsonError(429, "Too many failed attempts. Please wait a while and try again.");
      res.headers.set("Retry-After", String(Math.max(retryAfterSeconds(ipKey), retryAfterSeconds(accountKey))));
      return res;
    }

    // role: "ADMIN" in the WHERE is what keeps a farmer account unreachable from
    // here even with a correct password — not an `if` that could be forgotten.
    const user = await prisma.user.findFirst({ where: { email, role: "ADMIN" } });
    // Runs a real bcrypt compare (against a decoy) even when there is no such user,
    // so an unknown email costs the same time as a wrong password.
    const valid = await verifyPassword(password, user?.passwordHash);

    if (!user || !valid) {
      recordAttempt(ipKey);
      recordAttempt(accountKey);
      return jsonError(401, "Invalid email or password");
    }

    clearAttempts(accountKey);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = await createSessionToken({ sub: user.id, role: "ADMIN", fid: null, ver: user.tokenVersion });
    const res = NextResponse.json({ ok: true, redirect: ADMIN_HOME });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    console.error("[auth] admin-login failed:", err);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}

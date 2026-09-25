import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  SHORT_SESSION_SECONDS,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { farmerLoginSchema } from "@/lib/validators/auth";
import { jsonError, parseJsonBody } from "@/lib/auth/http";
import { clearAttempts, clientIp, isLimited, recordAttempt, retryAfterSeconds } from "@/lib/auth/rateLimit";
import { FARMER_HOME } from "@/lib/auth/paths";

const MAX_PER_IP = 40;
const MAX_PER_ACCOUNT = 8;

export async function POST(req: NextRequest) {
  try {
    const body = await parseJsonBody(req, farmerLoginSchema);
    if (!body.ok) return body.response;
    const { phone, password, remember } = body.data;

    const ipKey = `farmer-ip:${clientIp(req)}`;
    const accountKey = `farmer-acct:${phone}`;
    if (isLimited(ipKey, MAX_PER_IP) || isLimited(accountKey, MAX_PER_ACCOUNT)) {
      const res = jsonError(429, "Too many failed attempts. Please wait a while and try again.");
      res.headers.set("Retry-After", String(Math.max(retryAfterSeconds(ipKey), retryAfterSeconds(accountKey))));
      return res;
    }

    const user = await prisma.user.findFirst({ where: { phone, role: "FARMER" } });
    const valid = await verifyPassword(password, user?.passwordHash);

    // A FARMER user with no farm cannot act on anything, so treat it as unusable.
    if (!user || !valid || !user.farmerId) {
      recordAttempt(ipKey);
      recordAttempt(accountKey);
      return jsonError(401, "Invalid phone number or password");
    }

    clearAttempts(accountKey);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const lifetimeSeconds = remember ? SESSION_MAX_AGE_SECONDS : SHORT_SESSION_SECONDS;
    const token = await createSessionToken({
      sub: user.id,
      role: "FARMER",
      fid: user.farmerId,
      ver: user.tokenVersion,
      lifetimeSeconds,
    });
    const res = NextResponse.json({ ok: true, redirect: FARMER_HOME });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(lifetimeSeconds));
    return res;
  } catch (err) {
    console.error("[auth] farmer-login failed:", err);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}

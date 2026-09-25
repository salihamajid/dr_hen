import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { farmerSignupSchema } from "@/lib/validators/auth";
import { jsonError, parseJsonBody } from "@/lib/auth/http";
import { clientIp, isLimited, recordAttempt, retryAfterSeconds } from "@/lib/auth/rateLimit";
import { FARMER_HOME } from "@/lib/auth/paths";

// Public and creates rows, so every attempt counts (not just failures): otherwise
// a script could fill the Farmer table with junk at the speed of the network.
const MAX_SIGNUPS_PER_IP = 10;

const ALREADY_REGISTERED = "This phone number is already registered. Please contact your Dr. Hen representative.";

export async function POST(req: NextRequest) {
  try {
    const ipKey = `signup-ip:${clientIp(req)}`;
    if (isLimited(ipKey, MAX_SIGNUPS_PER_IP)) {
      const res = jsonError(429, "Too many sign-up attempts. Please try again later.");
      res.headers.set("Retry-After", String(retryAfterSeconds(ipKey)));
      return res;
    }

    const body = await parseJsonBody(req, farmerSignupSchema);
    if (!body.ok) return body.response;
    const { phone, password, name, location, breed, flockSize, numberOfSheds, flockAgeWeeks } = body.data;
    recordAttempt(ipKey);

    const passwordHash = await hashPassword(password);
    const startDate = new Date(Date.now() - flockAgeWeeks * 7 * 24 * 60 * 60 * 1000);

    let farmer;
    try {
      // One nested create is one atomic transaction: a farm can never exist without
      // its login, or a login without its farm. The first Flock is created here too,
      // because the Daily Entry flock picker would otherwise be empty for a new farmer.
      farmer = await prisma.farmer.create({
        data: {
          name,
          location,
          whatsappNumber: phone,
          breed,
          flockSize,
          numberOfSheds,
          flockAgeWeeks,
          flocks: { create: { name: "Flock 1", breed, sizeCount: flockSize, ageWeeks: flockAgeWeeks, startDate } },
          user: { create: { phone, passwordHash, role: "FARMER" } },
        },
        select: { id: true, user: { select: { id: true, tokenVersion: true } } },
      });
    } catch (err) {
      // Unique violation on Farmer.whatsappNumber or User.phone. This is also what
      // closes the race between two simultaneous signups for the same number.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return jsonError(409, ALREADY_REGISTERED);
      }
      throw err;
    }

    const token = await createSessionToken({
      sub: farmer.user!.id,
      role: "FARMER",
      fid: farmer.id,
      ver: farmer.user!.tokenVersion,
    });
    const res = NextResponse.json({ ok: true, redirect: FARMER_HOME }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    console.error("[auth] farmer-signup failed:", err);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}

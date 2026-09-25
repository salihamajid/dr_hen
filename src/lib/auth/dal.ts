import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken, type SessionClaims } from "./session";

// The real enforcement boundary. src/proxy.ts only does optimistic, cookie-only
// checks (it runs on every request including <Link> prefetches, so it must never
// hit the database) and is explicitly not a security boundary. Every protected
// page and route handler must come through here.
//
// RULES for anything under /farmer or /api/farmer:
//   1. farmerId comes ONLY from these helpers — never from a body, query string
//      or URL segment.
//   2. A client-supplied id is FILTERED into the query
//      (findFirst({ where: { id, farmerId } })), never fetched and then compared.
//   3. Writes use updateMany/deleteMany with farmerId in the where, assert
//      count === 1, and answer 404 (not 403) so a row's existence isn't confirmed.

/** Signature-checked claims only — no database. Do not use this to authorise anything. */
export const getSession = cache(async (): Promise<SessionClaims | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
});

export interface AdminContext {
  userId: string;
}

export interface FarmerContext {
  userId: string;
  farmerId: string;
  language: "EN" | "UR" | null;
}

/**
 * The verified admin, or null. Unlike getSession this confirms the account still
 * exists and the token hasn't been revoked (tokenVersion bumped). Login pages use
 * it to decide whether to bounce an already-signed-in user: going by the raw
 * cookie instead would loop forever on a validly-signed but revoked one.
 */
export const currentAdmin = cache(async (): Promise<AdminContext | null> => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, role: true, tokenVersion: true },
  });
  if (!user || user.role !== "ADMIN" || user.tokenVersion !== session.ver) return null;
  return { userId: user.id };
});

export const currentFarmer = cache(async (): Promise<FarmerContext | null> => {
  const session = await getSession();
  if (!session || session.role !== "FARMER" || !session.fid) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, role: true, tokenVersion: true, farmerId: true, language: true },
  });
  if (!user || user.role !== "FARMER" || user.tokenVersion !== session.ver) return null;
  // The token's farm must be the account's farm right now, not just when it was issued.
  if (!user.farmerId || user.farmerId !== session.fid) return null;

  return { userId: user.id, farmerId: user.farmerId, language: user.language };
});

/** For admin pages. Redirects to /login. */
export async function requireAdmin(): Promise<AdminContext> {
  return (await currentAdmin()) ?? redirect("/login");
}

/** For farmer pages. Redirects to /farmer/login. */
export async function requireFarmer(): Promise<FarmerContext> {
  return (await currentFarmer()) ?? redirect("/farmer/login");
}

type ApiResult<T> = ({ ok: true } & T) | { ok: false; response: NextResponse };

function unauthorized(): NextResponse {
  // JSON 401, never a redirect: an APK fetch that follows a redirect to an HTML
  // login page and then tries to parse it as JSON is a miserable class of bug.
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** For farmer route handlers: `const auth = await requireFarmerApi(); if (!auth.ok) return auth.response;` */
export async function requireFarmerApi(): Promise<ApiResult<FarmerContext>> {
  const farmer = await currentFarmer();
  return farmer ? { ok: true, ...farmer } : { ok: false, response: unauthorized() };
}

export async function requireAdminApi(): Promise<ApiResult<AdminContext>> {
  const admin = await currentAdmin();
  return admin ? { ok: true, ...admin } : { ok: false, response: unauthorized() };
}

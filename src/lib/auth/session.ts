import { SignJWT, jwtVerify } from "jose";

// Deliberately free of next/headers so src/proxy.ts can import verifySessionToken
// too. Anything that needs the request's cookie store lives in dal.ts.

export const SESSION_COOKIE = "dr_hen_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
// "Keep me logged in" unchecked. The proxy refresh must re-issue a token with its
// ORIGINAL lifetime (exp - iat), or a 1-day session would quietly become 30 days.
export const SHORT_SESSION_SECONDS = 60 * 60 * 24;

export type SessionRole = "ADMIN" | "FARMER";

export interface SessionClaims {
  /** User.id */
  sub: string;
  role: SessionRole;
  /** Farmer.id for FARMER sessions, null for ADMIN. Lets requireFarmer() skip a lookup. */
  fid: string | null;
  /** User.tokenVersion at issue time — bumping the DB value revokes this token. */
  ver: number;
  iat: number;
  exp: number;
}

// Evaluated lazily, not at import: a module-load throw would fail `next build`
// while it collects page data in an environment without the secret.
function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return new TextEncoder().encode(secret);

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set to at least 32 characters in production.");
  }
  // Dev only. A forgeable secret in production would let anyone mint an admin session.
  return new TextEncoder().encode("dev-only-insecure-session-secret-do-not-deploy");
}

export async function createSessionToken(claims: {
  sub: string;
  role: SessionRole;
  fid: string | null;
  ver: number;
  lifetimeSeconds?: number;
}) {
  return new SignJWT({ role: claims.role, fid: claims.fid, ver: claims.ver })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${claims.lifetimeSeconds ?? SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

/** Returns the claims, or null for anything invalid, expired, tampered or malformed. Never throws on bad input. */
export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const { sub, role, fid, ver, iat, exp } = payload as Record<string, unknown>;

    if (typeof sub !== "string" || !sub) return null;
    if (role !== "ADMIN" && role !== "FARMER") return null;
    if (typeof ver !== "number" || typeof iat !== "number" || typeof exp !== "number") return null;
    if (fid !== null && typeof fid !== "string") return null;
    // A FARMER token with no farm is meaningless, and an ADMIN token must not carry one.
    if (role === "FARMER" && !fid) return null;
    if (role === "ADMIN" && fid) return null;

    return { sub, role, fid: (fid as string | null) ?? null, ver, iat, exp };
  } catch (err) {
    // A missing production secret is a deployment bug, not a bad token — surface it
    // instead of silently logging every user out.
    if (err instanceof Error && err.message.startsWith("SESSION_SECRET")) throw err;
    return null;
  }
}

export function sessionCookieOptions(maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    // Conditional: a Secure cookie is dropped over http://localhost, which would
    // make local login silently fail.
    secure: process.env.NODE_ENV === "production",
    // Lax so the Capacitor WebView's first-party navigation to server.url keeps
    // the cookie; Strict would drop it on the redirect after login.
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function expiredSessionCookieOptions() {
  return { ...sessionCookieOptions(), maxAge: 0 };
}

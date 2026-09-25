import { NextResponse, type NextRequest } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
  type SessionClaims,
} from "@/lib/auth/session";
import { ADMIN_HOME, ADMIN_LOGIN, FARMER_HOME, FARMER_LOGIN } from "@/lib/auth/paths";

// First line of defence only. It reads the signed cookie and NEVER touches the
// database (it runs on every request, including <Link> prefetches), so it can't
// see revocation. Real enforcement is the DAL (src/lib/auth/dal.ts) in every
// page/handler that reads data.

// Segment-exact on purpose: "/farmers" (admin) starts with "/farmer" (portal).
function isUnder(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(base + "/");
}

const PUBLIC_EXACT = new Set([ADMIN_LOGIN, FARMER_LOGIN, "/farmer/signup", "/"]);

function isPublic(pathname: string) {
  return (
    PUBLIC_EXACT.has(pathname) ||
    // Meta calls the webhook with no cookie; it authenticates by HMAC signature instead.
    pathname === "/api/whatsapp/webhook" ||
    isUnder(pathname, "/api/auth")
  );
}

function isApi(pathname: string) {
  return isUnder(pathname, "/api");
}

// Re-issue with the SAME lifetime once half of it has gone, so a 1-day
// (not "remember me") session doesn't silently become a 30-day one.
async function refreshedToken(claims: SessionClaims) {
  const lifetime = claims.exp - claims.iat;
  const remaining = claims.exp - Math.floor(Date.now() / 1000);
  if (remaining > lifetime / 2) return null;
  const token = await createSessionToken({
    sub: claims.sub,
    role: claims.role,
    fid: claims.fid,
    ver: claims.ver,
    lifetimeSeconds: lifetime,
  });
  return { token, lifetime };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = raw ? await verifySessionToken(raw) : null;

  const farmerPortal = isUnder(pathname, "/farmer");
  const farmerApi = isUnder(pathname, "/api/farmer");
  const needsRole = farmerPortal || farmerApi ? "FARMER" : "ADMIN";

  if (!claims) {
    if (isApi(pathname)) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    return NextResponse.redirect(new URL(needsRole === "FARMER" ? FARMER_LOGIN : ADMIN_LOGIN, request.url));
  }

  if (claims.role !== needsRole) {
    if (isApi(pathname)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL(claims.role === "ADMIN" ? ADMIN_HOME : FARMER_HOME, request.url));
  }

  const response = NextResponse.next();
  const refreshed = await refreshedToken(claims);
  if (refreshed) response.cookies.set(SESSION_COOKIE, refreshed.token, sessionCookieOptions(refreshed.lifetime));
  return response;
}

export const config = {
  // Everything except Next internals and static files in /public (the intro video
  // must stay fetchable by Meta with no cookie).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|videos/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|txt|html)$).*)"],
};

import bcrypt from "bcryptjs";

// Deliberately NOT importing "server-only": prisma/seedAdmin.ts runs this under
// tsx, where that guard would throw. Nothing here is reachable from a client
// bundle anyway — only route handlers and scripts import it.

// bcryptjs is pure JS (no native binary, no node-gyp on Render) and roughly 3-4x
// slower than native bcrypt. Cost 12 is ~1s per login on Render's free CPU, so 10.
const COST = 10;

// Verifying against this when a user isn't found makes "unknown account" cost the
// same bcrypt time as "wrong password", so response timing can't be used to
// discover which accounts exist.
const DECOY_HASH = bcrypt.hashSync("dr-hen-timing-decoy", COST);

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  const matches = await bcrypt.compare(plain, hash ?? DECOY_HASH);
  return hash ? matches : false;
}

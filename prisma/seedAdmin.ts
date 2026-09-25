// Creates THE admin account. There is deliberately no admin sign-up page or API —
// this script is the only way an ADMIN user comes into existence.
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a long passphrase' npm run db:seed:admin
//
// Credentials come from the environment (or .env) so the password never appears
// in git, in shell history files you commit, or in any log output. This script
// never prints it.

import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file (e.g. on Render, where variables are injected) — that's fine.
}

const MIN_PASSWORD_LENGTH = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must both be set (in the environment or .env).");
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("ADMIN_EMAIL is not a valid email address.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const prisma = new PrismaClient();
  try {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });

    // Exactly one admin, ever. Refusing here (rather than adding a second) means a
    // typo'd ADMIN_EMAIL can't quietly create a spare account nobody knows about.
    const other = admins.find((a) => a.email !== email);
    if (other) {
      throw new Error(
        `An admin account already exists for a different email (${other.email}). ` +
          "This app allows exactly one admin. Delete that row in the database first if you really mean to replace it."
      );
    }

    const existing = admins[0];

    if (!existing) {
      await prisma.user.create({
        data: { email, passwordHash: await hashPassword(password), role: "ADMIN" },
      });
      console.log(`Created admin account for ${email}.`);
      return;
    }

    // Re-running with unchanged credentials must be a true no-op. Rewriting the
    // hash and bumping tokenVersion every run would log the admin out each time.
    if (await verifyPassword(password, existing.passwordHash)) {
      console.log(`Admin account for ${email} already exists with this password — nothing to change.`);
      return;
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash: await hashPassword(password), tokenVersion: { increment: 1 } },
    });
    console.log(`Updated the password for ${email}. All existing admin sessions were invalidated.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

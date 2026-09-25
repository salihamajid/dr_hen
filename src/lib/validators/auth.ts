import { z } from "zod";
import { normalizePhone } from "@/lib/auth/phone";
import { farmerInputSchema } from "./farmer";

const phone = z
  .string()
  .trim()
  .refine((v) => normalizePhone(v) !== null, {
    message: "Enter a valid phone number, e.g. 0300 1234567 or +92 300 1234567",
  })
  .transform((v) => normalizePhone(v) as string);

// bcrypt only ever reads the first 72 BYTES, so a longer password would silently
// have its tail ignored. Count bytes, not characters — Urdu characters are 2-3.
const newPassword = z
  .string()
  .min(8, "Use at least 8 characters")
  .refine((v) => new TextEncoder().encode(v).length <= 72, { message: "That password is too long" });

// Login only bounds the size of the input; the real check is the hash comparison.
const loginPassword = z.string().min(1, "Enter your password").max(200);

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")).pipe(z.string().max(254)),
  password: loginPassword,
});

export const farmerLoginSchema = z.object({
  phone,
  password: loginPassword,
  // "Keep me logged in": 30-day session when true (the default), 1 day when false.
  remember: z.boolean().default(true),
});

// Reuses the existing admin-side farmer schema so the two entry points can't drift
// on what a valid farm looks like, then tightens the bounds: this one is exposed to
// the public internet rather than a logged-in admin.
export const farmerSignupSchema = farmerInputSchema.omit({ whatsappNumber: true, status: true }).extend({
  name: z.string().trim().min(1, "Enter your name").max(100),
  location: z.string().trim().min(1, "Enter your location").max(100),
  breed: z.string().trim().min(1, "Enter a breed").max(50),
  flockSize: z.coerce.number().int().positive("Enter a number above 0").max(5_000_000),
  numberOfSheds: z.coerce.number().int().positive("Enter a number above 0").max(1_000),
  flockAgeWeeks: z.coerce.number().int().nonnegative().max(200),
  phone,
  password: newPassword,
});

export type FarmerSignupInput = z.infer<typeof farmerSignupSchema>;

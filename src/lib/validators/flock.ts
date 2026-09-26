import { z } from "zod";

// Server-side truth for "Add New Flock". farmerId is deliberately NOT a field:
// it comes from the session, so a request can never create a flock for someone else.
export const flockCreateSchema = z.object({
  name: z.string().trim().min(1, "Enter a flock name").max(60),
  breed: z.string().trim().min(1, "Enter a breed").max(50),
  sizeCount: z.coerce.number().int("Enter a whole number").positive("Enter a number above 0").max(5_000_000),
  ageWeeks: z.coerce.number().int("Enter a whole number").nonnegative("Age can't be negative").max(200),
});

export type FlockCreateInput = z.infer<typeof flockCreateSchema>;

export const MAX_FLOCKS_PER_FARMER = 50;

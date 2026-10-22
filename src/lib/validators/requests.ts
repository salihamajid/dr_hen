import { z } from "zod";

// The two things a farmer can ask for from the dashboard. Neither carries a farmerId: that
// comes from the session, so a request can never be filed against someone else's farm.
// Neither carries a status either — a farmer may raise a request, not mark it handled.

export const vetRequestSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

/** One lorry-load is well under this; the ceiling is only here to bound nonsense. */
export const MAX_FEED_BAGS = 2000;

export const feedOrderSchema = z.object({
  bags: z.coerce.number().int("Enter a whole number of bags").positive("Enter a number above 0").max(MAX_FEED_BAGS),
  note: z.string().trim().max(500).optional(),
});

/** Open requests a farm may hold at once, so a stuck button can't flood the admin queue. */
export const MAX_OPEN_REQUESTS = 5;

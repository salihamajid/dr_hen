import { z } from "zod";

// What an admin may set when starting a broadcast. Counters and status are NOT fields:
// they are written from what actually happened, never from the request.
export const broadcastSchema = z
  .object({
    kind: z.enum(["MESSAGE", "VIDEO"]),
    title: z.string().trim().min(1, "Give this broadcast a title").max(120),
    body: z.string().trim().min(1, "Write the message farmers will read").max(1000),
    mediaUrl: z.string().trim().url("Enter a full https:// link to the video").max(500).optional(),
    /** An approved Meta template, used for farmers whose 24-hour window has closed. */
    templateName: z.string().trim().max(120).optional(),
    /** ALL is every farmer; OPEN_WINDOW is only those Meta will accept a free-form message for. */
    audience: z.enum(["ALL", "OPEN_WINDOW"]),
  })
  .refine((b) => b.kind !== "VIDEO" || !!b.mediaUrl, {
    message: "A video broadcast needs a video link",
    path: ["mediaUrl"],
  });

export type BroadcastInput = z.infer<typeof broadcastSchema>;

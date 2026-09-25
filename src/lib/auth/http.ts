import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

export function jsonError(status: number, error: string, fieldErrors?: Record<string, string[] | undefined>) {
  return NextResponse.json({ error, ...(fieldErrors ? { fieldErrors } : {}) }, { status });
}

const MAX_BODY_BYTES = 16 * 1024;

/**
 * Parses and validates a JSON body. Requiring an application/json Content-Type
 * matters beyond tidiness: a cross-site <form enctype="text/plain"> can smuggle a
 * JSON-looking body without a CORS preflight, but cannot set this header.
 */
export async function parseJsonBody<S extends z.ZodType>(
  req: NextRequest,
  schema: S
): Promise<{ ok: true; data: z.output<S> } | { ok: false; response: NextResponse }> {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { ok: false, response: jsonError(415, "Content-Type must be application/json") };
  }
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return { ok: false, response: jsonError(413, "Request is too large") };
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: jsonError(400, "Request body is not valid JSON") };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(400, "Please check the highlighted fields.", z.flattenError(parsed.error).fieldErrors),
    };
  }
  return { ok: true, data: parsed.data };
}

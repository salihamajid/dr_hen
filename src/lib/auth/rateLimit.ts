// In-memory failure counter for login/signup. Render runs one long-lived Node
// process, so a Map is enough; behind several instances each would count
// separately, which is weaker but still bounds guessing per instance.

interface Bucket {
  count: number;
  resetAt: number;
}

export const WINDOW_MS = 15 * 60 * 1000;

const globalForLimiter = globalThis as unknown as { __drHenLimiter?: Map<string, Bucket> };
// On globalThis so dev-mode hot reloads don't quietly reset every counter.
const buckets = (globalForLimiter.__drHenLimiter ??= new Map<string, Bucket>());

function live(key: string, now: number): Bucket | undefined {
  const bucket = buckets.get(key);
  if (bucket && bucket.resetAt <= now) {
    buckets.delete(key);
    return undefined;
  }
  return bucket;
}

export function isLimited(key: string, max: number, now = Date.now()): boolean {
  return (live(key, now)?.count ?? 0) >= max;
}

export function retryAfterSeconds(key: string, now = Date.now()): number {
  const bucket = live(key, now);
  return bucket ? Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) : 1;
}

export function recordAttempt(key: string, now = Date.now()): void {
  const bucket = live(key, now);
  if (bucket) {
    bucket.count += 1;
    return;
  }
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
}

export function clearAttempts(key: string): void {
  buckets.delete(key);
}

/** The app sits behind Cloudflare on Render: prefer its header, else the proxy-appended (last) forwarded address. */
export function clientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",").pop()!.trim();
  return "unknown";
}

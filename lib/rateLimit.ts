import { NextRequest } from "next/server";

/**
 * Minimal in-memory rate limiter. It's per-server-instance (not shared
 * across a multi-instance deployment), which is a real limitation — but
 * it's zero-dependency, has no external moving parts to fail, and still
 * stops a single abusive client or script from hammering the write
 * endpoints. If this is ever deployed across multiple instances behind a
 * load balancer, swap this for a shared store (e.g. Redis/Upstash).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically clear stale buckets so this map can't grow forever.
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function getClientKey(req: NextRequest): string {
  // Best-effort client identifier. Behind most hosts/proxies this header
  // is set; falling back to a constant just means everyone shares one
  // bucket, which is still safe (fails closed, not open).
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/**
 * Returns true if the request is allowed, false if it should be rejected
 * with 429. `limit` requests are allowed per `windowMs`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  sweep();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

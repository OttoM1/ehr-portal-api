import type { Context, Next } from 'hono';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

export async function rateLimit(c: Context, next: Next) {
  const portal = c.get('portal');
  const key = portal.patientId;
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS - bucket.count);
  c.header('X-RateLimit-Limit', String(MAX_REQUESTS));
  c.header('X-RateLimit-Remaining', String(remaining));
  c.header('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > MAX_REQUESTS) {
    return c.json(
      {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMITED',
        requestId: portal.requestId,
      },
      429
    );
  }

  await next();
}

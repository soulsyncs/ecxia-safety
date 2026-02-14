// Simple in-memory rate limiter for Edge Functions
// No external dependencies (no Redis/Upstash required)
// Note: Each Edge Function instance has its own memory, so this provides
// per-instance rate limiting. For distributed rate limiting, use Upstash.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

/**
 * Check rate limit for a given key.
 * @param key - Unique identifier (e.g., IP address, LINE user ID)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { allowed: boolean, remaining: number, retryAfterMs: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}

/** Extract client IP from request headers */
export function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
}

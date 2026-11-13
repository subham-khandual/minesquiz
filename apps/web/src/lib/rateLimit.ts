/**
 * Lightweight, high-performance in-memory rate limiter for Next.js App Router API routes.
 * Tracks requests per IP and per identifier (e.g. email) with sliding-window expiry.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface CooldownRecord {
  lastRequestAt: number;
}

// Global runtime maps to persist across hot-reloads and route invocations
declare global {
  var __RATE_LIMIT_STORE__: Map<string, RateLimitRecord> | undefined;
  var __COOLDOWN_STORE__: Map<string, CooldownRecord> | undefined;
}

if (!globalThis.__RATE_LIMIT_STORE__) {
  globalThis.__RATE_LIMIT_STORE__ = new Map<string, RateLimitRecord>();
}
if (!globalThis.__COOLDOWN_STORE__) {
  globalThis.__COOLDOWN_STORE__ = new Map<string, CooldownRecord>();
}

const rateLimitStore = globalThis.__RATE_LIMIT_STORE__;
const cooldownStore = globalThis.__COOLDOWN_STORE__;

/**
 * Periodically purge stale entries to prevent memory leaks (every 5 minutes)
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
    for (const [key, record] of cooldownStore.entries()) {
      if (now - record.lastRequestAt > 3600000) {
        cooldownStore.delete(key);
      }
    }
  }, 300000).unref?.();
}

/**
 * Extract reliable client IP address from standard reverse-proxy headers
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();
  return '127.0.0.1';
}

/**
 * Rate limit check: returns whether the request is allowed within the window
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      retryAfterSeconds: windowSeconds,
    };
  }

  if (record.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    retryAfterSeconds,
  };
}

/**
 * Cooldown check: ensures minimum seconds between consecutive actions (e.g. OTP resend)
 */
export function checkCooldown(
  key: string,
  cooldownSeconds: number
): { allowed: boolean; remainingSeconds: number } {
  const now = Date.now();
  const cooldownMs = cooldownSeconds * 1000;
  const record = cooldownStore.get(key);

  if (!record) {
    cooldownStore.set(key, { lastRequestAt: now });
    return { allowed: true, remainingSeconds: 0 };
  }

  const elapsedMs = now - record.lastRequestAt;
  if (elapsedMs < cooldownMs) {
    const remainingSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
    return { allowed: false, remainingSeconds };
  }

  cooldownStore.set(key, { lastRequestAt: now });
  return { allowed: true, remainingSeconds: 0 };
}

/**
 * Reset / clear rate limit counter for a key upon successful action (e.g. successful login)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

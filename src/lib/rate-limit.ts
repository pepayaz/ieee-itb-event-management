interface RateLimitRecord {
  attempts: number[];
}

// Penyimpanan in-memory sederhana untuk sliding window rate limiter.
// Batasan: data hilang saat restart proses dan tidak terbagi antar instance.
const store = new Map<string, RateLimitRecord>();

export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  remaining: number;
}

export function checkRateLimit(
  key: string,
  maxAttempts: number = LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  windowMs: number = LOGIN_RATE_LIMIT_WINDOW_MS,
  now: number = Date.now(),
): RateLimitResult {
  const record = store.get(key);

  if (!record) {
    return { allowed: true, remaining: maxAttempts };
  }

  record.attempts = record.attempts.filter(
    (timestamp) => now - timestamp < windowMs,
  );

  if (record.attempts.length === 0) {
    store.delete(key);
    return { allowed: true, remaining: maxAttempts };
  }

  if (record.attempts.length >= maxAttempts) {
    const oldest = record.attempts[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000),
    );

    return { allowed: false, retryAfterSeconds, remaining: 0 };
  }

  return {
    allowed: true,
    remaining: maxAttempts - record.attempts.length,
  };
}

export function recordFailedAttempt(
  key: string,
  now: number = Date.now(),
  windowMs: number = LOGIN_RATE_LIMIT_WINDOW_MS,
): void {
  const record = store.get(key) ?? { attempts: [] };

  record.attempts = record.attempts.filter(
    (timestamp) => now - timestamp < windowMs,
  );
  record.attempts.push(now);
  store.set(key, record);
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}

export function clearRateLimitStore(): void {
  store.clear();
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "127.0.0.1";
}

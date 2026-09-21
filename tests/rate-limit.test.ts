import { beforeEach, describe, expect, it } from "vitest";

import {
  checkRateLimit,
  clearRateLimitStore,
  getClientIp,
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  LOGIN_RATE_LIMIT_WINDOW_MS,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it("allows initial attempts with maximum remaining capacity", () => {
    const result = checkRateLimit("127.0.0.1:admin");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(LOGIN_RATE_LIMIT_MAX_ATTEMPTS);
  });

  it("decrements remaining attempts after failed attempts", () => {
    const key = "127.0.0.1:admin";

    recordFailedAttempt(key);
    recordFailedAttempt(key);

    const result = checkRateLimit(key);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
  });

  it("blocks the sixth attempt after five failed attempts within the window", () => {
    const key = "127.0.0.1:admin";
    const now = 1_000_000;

    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(key, now + i * 1000);
    }

    const result = checkRateLimit(key, 5, LOGIN_RATE_LIMIT_WINDOW_MS, now + 6000);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets attempts when resetRateLimit is called", () => {
    const key = "127.0.0.1:admin";

    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(key);
    }

    expect(checkRateLimit(key).allowed).toBe(false);

    resetRateLimit(key);

    const afterReset = checkRateLimit(key);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(LOGIN_RATE_LIMIT_MAX_ATTEMPTS);
  });

  it("expires attempts outside the sliding window", () => {
    const key = "127.0.0.1:admin";
    const startTime = 100_000;

    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(key, startTime);
    }

    // 16 menit kemudian (melewati window 15 menit)
    const afterWindow = startTime + LOGIN_RATE_LIMIT_WINDOW_MS + 60_000;
    const result = checkRateLimit(key, 5, LOGIN_RATE_LIMIT_WINDOW_MS, afterWindow);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(LOGIN_RATE_LIMIT_MAX_ATTEMPTS);
  });

  it("extracts client IP correctly from headers", () => {
    const headers1 = new Headers({ "x-forwarded-for": "203.0.113.195, 70.41.3.18" });
    expect(getClientIp(headers1)).toBe("203.0.113.195");

    const headers2 = new Headers({ "x-real-ip": "198.51.100.1" });
    expect(getClientIp(headers2)).toBe("198.51.100.1");

    const headers3 = new Headers();
    expect(getClientIp(headers3)).toBe("127.0.0.1");
  });
});

import { describe, it, expect } from "vitest";
import { enforceRateLimit, getClientIp } from "../server/rate-limit";

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const req = new Request("https://example.com/api/test", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("https://example.com/api/test", {
      headers: { "x-real-ip": "203.0.113.9" },
    });
    expect(getClientIp(req)).toBe("203.0.113.9");
  });

  it("returns 'unknown' when no proxy headers exist", () => {
    const req = new Request("https://example.com/api/test");
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("enforceRateLimit (fail-open)", () => {
  it("allows requests when Upstash env vars are not configured", async () => {
    // Test env has no UPSTASH_REDIS_REST_URL/KV_REST_API_URL — the limiter
    // must fail open (return null = proceed) rather than block the feature.
    const req = new Request("https://example.com/api/test", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.7" },
    });
    const result = await enforceRateLimit(req, "test-route", {
      perMinute: 1,
      perHour: 1,
    });
    expect(result).toBeNull();
  });
});

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createLogger } from "@lib/logger";

const log = createLogger("rate-limit");

/**
 * Shared sliding-window rate limiter for the paid API routes (Anthropic, Azure TTS).
 *
 * Backed by Upstash Redis via REST (serverless-safe — state is shared across
 * function instances and survives deploys, unlike an in-memory Map).
 *
 * Fail-open by design: if the Upstash env vars are not configured, or Redis is
 * unreachable, requests are ALLOWED and a warning is logged. This lets the code
 * ship before the Vercel↔Upstash integration is connected, and keeps a Redis
 * outage from taking the AI features down with it.
 *
 * Env (either naming works — Upstash marketplace integration injects UPSTASH_*,
 * legacy Vercel KV injects KV_*):
 *   UPSTASH_REDIS_REST_URL   | KV_REST_API_URL
 *   UPSTASH_REDIS_REST_TOKEN | KV_REST_API_TOKEN
 */

interface RouteLimits {
  perMinute: number;
  perHour: number;
}

interface LimiterPair {
  minute: Ratelimit;
  hour: Ratelimit;
}

// Per-instance cache shared across limiters — blocks repeat offenders without
// a Redis round-trip while a function instance stays warm.
const ephemeralCache = new Map<string, number>();

const limiterCache = new Map<string, LimiterPair | null>();
let warnedDisabled = false;

/**
 * Read an env var at RUNTIME.
 *
 * Vite statically inlines `import.meta.env.X` at build time — so a secret added
 * to Vercel *after* a build (or reused via build cache) gets baked in as
 * `undefined` and the limiter silently fails open. On Vercel's Node serverless
 * runtime, `process.env` holds the deployment's live env vars and is never
 * inlined for server routes, so it is the reliable source. `import.meta.env`
 * (dynamic key → not inlined) stays as a local-dev fallback.
 */
function readEnv(name: string): string | undefined {
  const fromProcess =
    typeof process !== "undefined" ? process.env?.[name] : undefined;
  return fromProcess ?? (import.meta.env[name] as string | undefined);
}

function getRedis(): Redis | null {
  const url = readEnv("UPSTASH_REDIS_REST_URL") ?? readEnv("KV_REST_API_URL");
  const token =
    readEnv("UPSTASH_REDIS_REST_TOKEN") ?? readEnv("KV_REST_API_TOKEN");
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function getLimiters(route: string, limits: RouteLimits): LimiterPair | null {
  const cached = limiterCache.get(route);
  if (cached !== undefined) return cached;

  const redis = getRedis();
  if (!redis) {
    if (!warnedDisabled) {
      log.warn(
        "Upstash env vars not set — rate limiting is DISABLED (fail-open). Connect the Upstash integration to enable it.",
      );
      warnedDisabled = true;
    }
    limiterCache.set(route, null);
    return null;
  }

  const pair: LimiterPair = {
    minute: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limits.perMinute, "60 s"),
      prefix: `rl:${route}:min`,
      ephemeralCache,
    }),
    hour: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limits.perHour, "3600 s"),
      prefix: `rl:${route}:hr`,
      ephemeralCache,
    }),
  };
  limiterCache.set(route, pair);
  return pair;
}

/** Best-effort client IP behind Vercel's proxy. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Enforce per-minute AND per-hour caps for this route/IP.
 * Returns a 429 Response when over limit, or null when the request may proceed
 * (including fail-open when the limiter is unconfigured or Redis errors).
 */
export async function enforceRateLimit(
  request: Request,
  route: string,
  limits: RouteLimits,
): Promise<Response | null> {
  const limiters = getLimiters(route, limits);
  if (!limiters) return null;

  const ip = getClientIp(request);
  try {
    const [minute, hour] = await Promise.all([
      limiters.minute.limit(ip),
      limiters.hour.limit(ip),
    ]);

    if (minute.success && hour.success) return null;

    const blockedBy = minute.success ? hour : minute;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((blockedBy.reset - Date.now()) / 1000),
    );
    log.warn("Rate limit exceeded", { route, ip });
    return new Response(
      JSON.stringify({ error: "Too many requests — please slow down." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSec),
        },
      },
    );
  } catch (err) {
    // Redis outage must not take the feature down — allow and log.
    log.error("Rate limit check failed — allowing request (fail-open)", {
      route,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

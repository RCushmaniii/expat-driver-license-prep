import * as Sentry from "@sentry/astro";

// Server-side init runs in the Vercel Node runtime, where process.env is
// available at request time — no build-time inlining needed.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || "development",
  tracesSampleRate: 0.2,
});

import * as Sentry from "@sentry/astro";

// DSN and environment are inlined at build time via Vite `define` in
// astro.config.mjs. The browser bundle cannot read the non-public SENTRY_DSN /
// VERCEL_ENV at runtime, so they must be baked in during the build — this
// mirrors what the @sentry/astro integration did before the options were moved
// out of astro.config.mjs.
Sentry.init({
  dsn: __SENTRY_DSN__,
  environment: __SENTRY_ENVIRONMENT__,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
});

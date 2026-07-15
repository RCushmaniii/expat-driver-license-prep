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
  // Errors thrown by scripts the browser injects into our pages. These are not
  // reachable from our bundle and nothing user-facing breaks, but they arrive
  // as unhandled rejections on the page and each one otherwise burns a session
  // replay against the quota.
  ignoreErrors: [
    // DuckDuckGo's iOS/macOS browser injects user scripts that call its native
    // message broker. When the page origin isn't allowlisted for the feature
    // being invoked, the broker rejects with BrokerError.policyRestriction,
    // whose errorDescription is the literal string "invalid origin".
    // See duckduckgo/apple-browsers UserScriptMessaging.swift.
    "invalid origin",
    // Benign layout notification the spec requires browsers to fire; not a fault.
    "ResizeObserver loop",
  ],
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
});

/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ANTHROPIC_API_KEY: string;
  readonly SENTRY_DSN: string;
  readonly SENTRY_AUTH_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Injected at build time via Vite `define` in astro.config.mjs and consumed by
// sentry.client.config.ts.
declare const __SENTRY_DSN__: string;
declare const __SENTRY_ENVIRONMENT__: string;

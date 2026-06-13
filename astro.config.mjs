import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sentry from "@sentry/astro";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://getexpatdrive.com",
  output: "static",
  adapter: vercel(),
  integrations: [
    react(),
    // Runtime SDK options (dsn, environment, sample rates) live in
    // sentry.client.config.ts / sentry.server.config.ts. Only build-time
    // source-map upload config belongs here.
    sentry({
      sourceMapsUploadOptions: {
        enabled: !!process.env.SENTRY_AUTH_TOKEN,
        org: "cushlabsai",
        project: "expat-driver-license-prep",
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
    sitemap({
      filter: (page) => !page.includes("/404") && !page.includes("/progress"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Inline the (public-by-design) Sentry DSN and deploy environment into the
    // client bundle at build time. The browser cannot read the non-public
    // SENTRY_DSN / VERCEL_ENV at runtime, so they are baked in here and
    // consumed by sentry.client.config.ts.
    define: {
      __SENTRY_DSN__: JSON.stringify(process.env.SENTRY_DSN ?? ""),
      __SENTRY_ENVIRONMENT__: JSON.stringify(
        process.env.VERCEL_ENV || "development",
      ),
    },
  },
});

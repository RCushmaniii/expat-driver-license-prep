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
    sentry({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV || "development",
      tracesSampleRate: 0.2,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
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
  },
});

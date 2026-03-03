import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://getexpatdrive.com",
  output: "static",
  adapter: vercel(),
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes("/404") && !page.includes("/progress"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

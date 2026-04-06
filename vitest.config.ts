import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@lib": resolve(__dirname, "src/lib"),
      "@components": resolve(__dirname, "src/components"),
      "@layouts": resolve(__dirname, "src/layouts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
});

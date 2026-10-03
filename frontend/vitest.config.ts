import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "server-only": path.resolve(__dirname, "test/server-only-stub.ts"),
    },
  },
  test: {
    env: {
      NEXT_PUBLIC_SANITY_API_VERSION: "2026-08-02",
      NEXT_PUBLIC_SITE_URL: "https://example.test",
      NEXT_PUBLIC_SANITY_DATASET: "test",
      NEXT_PUBLIC_SANITY_PROJECT_ID: "test-project",
      NEXT_PUBLIC_SITE_NAME: "Example Company",
      OG_IMAGE_SECRET: "test-only-og-image-secret",
    },
    environment: "jsdom",
    include: ["**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "server-only": resolve(__dirname, "./__test__/mocks/server-only.ts"),
      "next/headers": resolve(__dirname, "./__test__/mocks/next-headers.ts"),
      "@": resolve(__dirname, "./src"),
      "@test": resolve(__dirname, "./__test__"),
      // The real collab server, so the writer seam is tested against the thing
      // it talks to in production rather than a stand-in.
      "@collab": resolve(__dirname, "../collab/src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});

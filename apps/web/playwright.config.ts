import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./__test__/e2e",
  fullyParallel: false,
  workers: 1,
});

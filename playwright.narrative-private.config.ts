import { defineConfig } from "@playwright/test";
import base from "./playwright.private.config";
process.env.ETB_EPISODE_PRIVATE = "1";
export default defineConfig({
  ...base,
  testDir: "tests/narrative-e2e",
  testMatch: "author.spec.ts",
  timeout: 900000,
  outputDir: "test-results/narrative-private-e2",
});

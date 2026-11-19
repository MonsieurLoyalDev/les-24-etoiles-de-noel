import { defineConfig } from "@playwright/test";
import production from "./playwright.production.config";
process.env.ETB_PRODUCTION_DAYS ??= "13,14,15,16";
process.env.ETB_PRODUCTION_LAST_DAY ??= "16";
export default defineConfig({
  ...production,
  outputDir:
    process.env.ETB_PRODUCTION_RESULTS_DIR ?? "test-results/production-lot-c",
});

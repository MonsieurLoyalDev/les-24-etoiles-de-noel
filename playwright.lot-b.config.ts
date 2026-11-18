import { defineConfig } from "@playwright/test";
import production from "./playwright.production.config";
process.env.ETB_PRODUCTION_DAYS ??= "7,8,9,10,11,12";
process.env.ETB_PRODUCTION_LAST_DAY ??= "12";
export default defineConfig({
  ...production,
  outputDir:
    process.env.ETB_PRODUCTION_RESULTS_DIR ?? "test-results/production-lot-b",
});

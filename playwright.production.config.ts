import { defineConfig } from "@playwright/test";
import base from "./playwright.private.config";
// Private sources and personal screenshots are local only, never CI artifacts.
if (process.env.CI && process.env.ETB_PRODUCTION_SOURCE_DIR)
  throw Error("Scénarios originaux interdits dans la CI publique.");
export default defineConfig({
  ...base,
  testDir: "tests/production-e2e",
  timeout: 900000,
  outputDir:
    process.env.ETB_PRODUCTION_RESULTS_DIR ??
    "test-results/production-technical",
  use: { ...base.use, screenshot: "off", trace: "off", video: "off" },
  projects: [
    { name: "pc", use: { viewport: { width: 1920, height: 1080 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        reducedMotion: "reduce",
      },
    },
  ],
});

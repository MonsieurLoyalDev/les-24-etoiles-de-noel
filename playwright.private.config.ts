import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testDir: "tests/private-e2e",
  outputDir: "test-results/private-e1",
  use: { ...base.use, baseURL: "http://127.0.0.1:5191" },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 5191 --strictPort",
    url: "http://127.0.0.1:5191",
    reuseExistingServer: false,
  },
});

import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testDir: "tests/narrative-e2e",
  testMatch: ["author.spec.ts", "compat.spec.ts"],
  timeout: 900000,
  outputDir: "test-results/narrative-author",
  use: {
    ...base.use,
    baseURL: "http://127.0.0.1:5192",
    launchOptions: { args: ["--disable-webgl"] },
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5192 --strictPort",
    url: "http://127.0.0.1:5192",
    reuseExistingServer: false,
    env: { VITE_APP_MODE: "demo" },
  },
});

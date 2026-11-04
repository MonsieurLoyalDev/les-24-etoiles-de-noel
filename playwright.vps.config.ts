import { defineConfig } from "@playwright/test";
if (
  !process.env.CI ||
  !/^https:\/\/127\.0\.0\.1:\d+$/.test(process.env.ETB_TEST_HTTPS_URL ?? "")
)
  throw Error("VPS browser fixtures require the CI-owned local HTTPS server");
export default defineConfig({
  testDir: "tests/vps-e2e",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.ETB_TEST_HTTPS_URL,
    ignoreHTTPSErrors: true,
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
  },
  projects: [
    { name: "https-desktop", use: { viewport: { width: 1280, height: 800 } } },
    {
      name: "https-mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});

import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.mjs"],
    // Bound PNG/hash/PGlite work on CI and while browser validation is running.
    maxWorkers: 2,
  },
});

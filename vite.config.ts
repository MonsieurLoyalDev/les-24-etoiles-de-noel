import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
// @ts-expect-error Build-only JavaScript module, not part of the browser.
import { publicConfig } from "./ops/lib/public-config.mjs";
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const secure =
    command === "build" &&
    (mode === "private" ||
      (process.env.VITE_APP_MODE ?? env.VITE_APP_MODE) === "supabase");
  const info =
    command === "build" ? publicConfig({ ...env, ...process.env }) : null;
  return {
    define: {
      "import.meta.env.VITE_APP_MODE": JSON.stringify(
        secure ? "supabase" : (env.VITE_APP_MODE ?? "demo"),
      ),
    },
    plugins: [
      react(),
      ...(secure
        ? [
            {
              name: "private-public-assets",
              closeBundle() {
                const assets = JSON.parse(
                  readFileSync("ops/public-assets.json", "utf8"),
                ) as string[];
                for (const asset of assets) {
                  if (
                    !/^public\/assets\/[a-zA-Z0-9_./-]+\.png$/.test(asset) ||
                    asset.includes("..")
                  )
                    throw Error("Invalid public asset allowlist");
                  const dest = asset.replace(/^public\//, "dist/");
                  mkdirSync(dirname(dest), { recursive: true });
                  copyFileSync(asset, dest);
                }
                writeFileSync("dist/build-info.json", JSON.stringify(info));
              },
            },
          ]
        : []),
    ],
    publicDir: secure ? false : "public",
    build: {
      rollupOptions: { output: { manualChunks: { phaser: ["phaser"] } } },
    },
  };
});

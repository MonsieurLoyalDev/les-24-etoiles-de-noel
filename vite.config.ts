import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { OutputOptions, OutputBundle } from "rollup";
// @ts-expect-error Build-only JavaScript module, not part of the browser.
import { publicConfig } from "./ops/lib/public-config.mjs";
// @ts-expect-error Build-only JavaScript module.
import { assertPublicAssets } from "./ops/lib/private-assets.mjs";
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
      ...(mode === "e2e" && !secure ? { "import.meta.env.DEV": "true" } : {}),
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
              generateBundle(_options: OutputOptions, bundle: OutputBundle) {
                for (const entry of Object.values(bundle))
                  if (entry.type === "chunk")
                    for (const [id, module] of Object.entries(entry.modules)) {
                      const path = id.replaceAll("\\", "/");
                      if (
                        module.renderedLength > 0 &&
                        (/\/src\/advent\/(demo|demoApi)\.ts$/.test(path) ||
                            /\/src\/narrative\/author\.ts$/.test(path) ||
                          path.includes("/tests/"))
                      )
                        throw Error(
                          "Demo surprise or test fixture module in private build",
                        );
                    }
              },
              closeBundle() {
                const assets = assertPublicAssets(
                  process.cwd(),
                  JSON.parse(readFileSync("ops/public-assets.json", "utf8")),
                ) as string[];
                for (const asset of assets) {
                  if (
                    (!/^public\/assets\/[a-zA-Z0-9_./-]+\.png$/.test(asset) &&
                      !/^public\/assets\/validated\/fonts\/(Marcellus-Regular|Nunito-Regular|Nunito-Bold)\.ttf$/.test(
                        asset,
                      )) ||
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

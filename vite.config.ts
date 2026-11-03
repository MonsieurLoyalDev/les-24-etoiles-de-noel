import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync } from "node:fs";
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const secure =
    command === "build" &&
    (mode === "private" ||
      (process.env.VITE_APP_MODE ?? env.VITE_APP_MODE) === "supabase");
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
                cpSync("public/assets", "dist/assets", { recursive: true });
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

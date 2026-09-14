/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` is only "/engine-lab/" for production builds — the exact path this
// app's built output is copied to under the sibling Next.js app's public/
// directory (see scripts/sync-engine-lab.mjs at the repo root), so its own
// asset references resolve correctly once mounted there. `npm run dev`
// still serves from "/" so EngineLab is independently runnable on its own
// (http://localhost:5173) exactly as before — this app's own dev/build/test
// workflow is unaffected by how the host app happens to mount it.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/engine-lab/" : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
}));

#!/usr/bin/env node
/**
 * Builds EngineLab (apps/engine-lab) as its own independent project — its
 * own package.json, its own node_modules, its own `npm run build` — then
 * copies the resulting static bundle into public/engine-lab/ so the root
 * Next.js route (app/page.tsx) can mount it. This is asset copying only:
 * EngineLab's source is never imported into the Next.js app, and this
 * script never modifies anything under apps/engine-lab.
 *
 * Run standalone: `node scripts/sync-engine-lab.mjs`
 * Run automatically before every `npm run build` at the repo root.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, cpSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const engineLabDir = path.join(repoRoot, "apps/engine-lab");
const distDir = path.join(engineLabDir, "dist");
const publicTarget = path.join(repoRoot, "public/engine-lab");

if (!existsSync(path.join(engineLabDir, "node_modules"))) {
  console.log("[sync-engine-lab] apps/engine-lab/node_modules missing — running npm install");
  execFileSync("npm", ["install"], { cwd: engineLabDir, stdio: "inherit" });
}

console.log("[sync-engine-lab] building apps/engine-lab (its own independent build)");
execFileSync("npm", ["run", "build"], { cwd: engineLabDir, stdio: "inherit" });

if (!existsSync(distDir)) {
  throw new Error(`[sync-engine-lab] expected build output at ${distDir}, found nothing`);
}

console.log(`[sync-engine-lab] syncing ${distDir} -> ${publicTarget}`);
rmSync(publicTarget, { recursive: true, force: true });
mkdirSync(publicTarget, { recursive: true });
cpSync(distDir, publicTarget, { recursive: true });

console.log("[sync-engine-lab] done");

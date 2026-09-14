import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The root route mounts EngineLab — an independently built, independently
 * versioned static app (apps/engine-lab). This is asset hosting, not code
 * integration: EngineLab's own React tree boots entirely client-side from
 * its own bundled JS/CSS, exactly as it does under `vite preview`. Nothing
 * from apps/engine-lab's source is imported here.
 *
 * The exact script/stylesheet filenames are content-hashed by Vite and
 * change on every EngineLab rebuild, so they're read from the synced
 * public/engine-lab/index.html at request time (see
 * scripts/sync-engine-lab.mjs) rather than hardcoded — this page never goes
 * stale relative to whatever was last synced.
 */

function readEngineLabAssets(): { script: string; stylesheet?: string } {
  const indexHtmlPath = path.join(process.cwd(), "public/engine-lab/index.html");
  let html: string;
  try {
    html = readFileSync(indexHtmlPath, "utf-8");
  } catch {
    throw new Error(
      `EngineLab build not found at ${indexHtmlPath}. Run "node scripts/sync-engine-lab.mjs" ` +
      `(or "npm run build", which does this automatically) before building/starting this app.`,
    );
  }
  const scriptMatch = html.match(/<script[^>]*\ssrc="([^"]+)"[^>]*>/);
  const stylesheetMatch = html.match(/<link[^>]*\srel="stylesheet"[^>]*\shref="([^"]+)"[^>]*>/);
  if (!scriptMatch) throw new Error(`Could not find EngineLab's entry script in ${indexHtmlPath}`);
  return { script: scriptMatch[1], stylesheet: stylesheetMatch?.[1] };
}

export default function Home() {
  const { script, stylesheet } = readEngineLabAssets();
  return (
    <>
      {stylesheet && <link rel="stylesheet" href={stylesheet} />}
      {/*
        No #root div is rendered here on purpose. EngineLab's own bootstrap
        (apps/engine-lab/src/main.tsx) creates its own mount point and
        appends it to <body> itself. A div rendered here would be part of
        Next's server-rendered/hydrated tree, and EngineLab mutating it
        after load races Next's hydration pass and gets reverted as a
        perceived mismatch (React error #418) — a div EngineLab creates
        itself, once the page has already loaded, was never part of that
        tree, so nothing can "hydrate" it away.
      */}
      <script type="module" src={script} />
    </>
  );
}

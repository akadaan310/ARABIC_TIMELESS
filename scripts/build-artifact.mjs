/**
 * Bundles the standalone build into one self-contained HTML file.
 *
 * The Artifact CSP blocks every external request, so the JS, the CSS and the
 * whole lexicon are inlined. esbuild handles the TypeScript and tree-shakes
 * the engine down to what the two screens actually reach.
 *
 *   node scripts/build-artifact.mjs
 */
import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const out = await build({
  entryPoints: ["artifact/app.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  write: false,
  legalComments: "none",
});
const js = out.outputFiles[0].text;
const css = await readFile("artifact/style.css", "utf8");
const data = await readFile("artifact/data.json", "utf8");

const esc = (s) => s.replace(/<\/script/gi, "<\\/script");

const html = `<style>
${css}</style>
<script>window.__ARABIC_DATA__=${esc(data)};</script>
<script>${esc(js)}</script>
`;

await writeFile("artifact/index.html", html);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(
  `js ${kb(js.length)}  css ${kb(css.length)}  data ${kb(data.length)}\n` +
  `page ${kb(html.length)} raw, ${kb(gzipSync(html, { level: 9 }).length)} gzipped`,
);

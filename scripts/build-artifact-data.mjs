/**
 * Trims the lexical bundles into one payload small enough to inline in a
 * single-file page.
 *
 * The server build ships 1.7 MB across three files because it can afford to.
 * A page a phone has to download cannot, so this keeps only what the two
 * screens actually read:
 *
 *   roots   → display, count, glosses, and a pre-lowercased search blob that
 *             folds in the glosses of every lemma on the root, so root search
 *             still works without shipping lemmas.json at all
 *   surface → root, lemma, gloss only; part of speech and verb form are
 *             dropped because nothing in the artifact reads them
 *
 *   node scripts/build-artifact-data.mjs
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const DATA = path.join(process.cwd(), "lib", "data");
const OUT = path.join(process.cwd(), "artifact");

const roots = JSON.parse(await readFile(path.join(DATA, "roots.json"), "utf8"));
const lemmas = JSON.parse(await readFile(path.join(DATA, "lemmas.json"), "utf8"));
const surface = JSON.parse(await readFile(path.join(DATA, "surface.json"), "utf8"));

// root → every gloss of every lemma built on it
const byRoot = new Map();
for (const e of Object.values(lemmas)) {
  if (!e.r) continue;
  const a = byRoot.get(e.r);
  if (a) a.push(...e.g);
  else byRoot.set(e.r, [...e.g]);
}

const R = {};
for (const [k, v] of Object.entries(roots)) {
  if (k.length !== 3) continue; // the composer only builds on triliterals
  const searchable = [...v.g, ...(byRoot.get(k) ?? [])]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z ]+/g, " ")
    .split(/\s+/)
    .filter((w, i, a) => w.length > 2 && a.indexOf(w) === i)
    .join(" ");
  R[k] = { d: v.d, n: v.n, g: v.g.slice(0, 6), s: searchable };
}

const S = {};
for (const [k, v] of Object.entries(surface)) {
  const [root, lemma, , , gloss] = v;
  S[k] = [root || "", lemma || "", gloss || ""];
}

const payload = { roots: R, surface: S };
const json = JSON.stringify(payload);

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, "data.json"), json);

const { gzipSync } = await import("node:zlib");
console.log(
  `roots ${Object.keys(R).length}, surface ${Object.keys(S).length}\n` +
    `raw ${(json.length / 1024).toFixed(0)} KB, gzip ${(gzipSync(json, { level: 9 }).length / 1024).toFixed(0)} KB`,
);

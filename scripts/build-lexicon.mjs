/**
 * Builds the lexical bundles the passage engine reads.
 *
 * Two open sources, joined on token position:
 *
 *   1. Quranic Arabic Corpus morphology (v0.4, via mustafa0x/quran-morphology)
 *      — root, lemma, part of speech and verb form for all 130k tokens.
 *   2. quranwbw word-by-word data — English gloss and transliteration per token.
 *
 * Joining them derives something neither carries alone: for each root, the set
 * of English glosses of every word built on it. That is the root's semantic
 * field, read off the data rather than hand-authored.
 *
 * Both sources descend from the Quranic Arabic Corpus and are GPL-licensed.
 * See lib/data/ATTRIBUTION.md.
 *
 *   node scripts/build-lexicon.mjs
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "lib", "data");
const CACHE = path.join(process.cwd(), ".lexicon-cache");

const MORPH_URL =
  "https://cdn.jsdelivr.net/gh/mustafa0x/quran-morphology@master/quran-morphology.txt";
const WBW_URL = (n) =>
  `https://cdn.jsdelivr.net/gh/qazasaz/quranwbw@master/surahs/data/${n}.json`;

// --- helpers ---------------------------------------------------------------

const TASHKIL = /[\u064B-\u0652\u0640\u06DF-\u06ED\u08F0-\u08FF]/g;
const DAGGER = /\u0670/g; // superscript (dagger) alef

function fold(s) {
  return s
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")
    .replace(/\u0624/g, "\u0648")
    .replace(/\u0626/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0649/g, "\u064A")
    .replace(/[^\u0621-\u064A]/g, "");
}

/** Strip diacritics and fold written variants to base letters. */
function normalize(s) {
  return fold((s || "").replace(DAGGER, "").replace(TASHKIL, ""));
}

/**
 * Quranic orthography writes a superscript alef where modern Arabic writes a
 * full alef -- the Book is spelled both ways. Indexing both is what lets a
 * pasted modern passage find a Quranic entry at all.
 */
function variants(s) {
  const bare = normalize(s);
  const spelled = fold((s || "").replace(DAGGER, "\u0627").replace(TASHKIL, ""));
  return spelled && spelled !== bare ? [bare, spelled] : [bare];
}

async function cached(name, url, asJson = false) {
  const file = path.join(CACHE, name);
  if (existsSync(file)) {
    const raw = await readFile(file, "utf8");
    return asJson ? JSON.parse(raw) : raw;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const text = await res.text();
  await mkdir(CACHE, { recursive: true });
  await writeFile(file, text);
  return asJson ? JSON.parse(text) : text;
}

async function pooled(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}

// --- 1. morphology ---------------------------------------------------------

console.log("fetching morphology …");
const morph = await cached("quran-morphology.txt", MORPH_URL);

/** loc "s:a:w:seg" → segments */
const tokens = new Map(); // "s:a:w" → { segs: [...] }
let morphLines = 0;

for (const line of morph.split("\n")) {
  if (!line.trim()) continue;
  const [loc, form, pos, feats = ""] = line.split("\t");
  const parts = loc.split(":");
  if (parts.length < 4) continue;
  morphLines++;
  const key = `${parts[0]}:${parts[1]}:${parts[2]}`;
  const root = /ROOT:([^|]+)/.exec(feats)?.[1];
  const lemma = /LEM:([^|]+)/.exec(feats)?.[1];
  const vf = /VF:([^|]+)/.exec(feats)?.[1];
  const seg = { form, pos, feats, root, lemma, vf };
  if (!tokens.has(key)) tokens.set(key, { segs: [] });
  tokens.get(key).segs.push(seg);
}
console.log(`  ${morphLines} segments over ${tokens.size} tokens`);

// --- 2. word-by-word glosses ----------------------------------------------

console.log("fetching word-by-word glosses (114 surahs) …");
const surahs = Array.from({ length: 114 }, (_, i) => i + 1);
const wbw = await pooled(surahs, 8, async (n) => {
  try {
    return [n, await cached(`wbw-${n}.json`, WBW_URL(n), true)];
  } catch (e) {
    console.warn(`  surah ${n}: ${e.message}`);
    return [n, null];
  }
});

/** "s:a:w" → { gloss, translit, arabic } ; "s:a" → english translation */
const glosses = new Map();
const ayahs = new Map();
let glossCount = 0;

for (const [n, data] of wbw) {
  if (!data) continue;
  for (const [ayah, payload] of Object.entries(data)) {
    if (payload?.a?.g) ayahs.set(`${n}:${ayah}`, payload.a.g);
    const ws = payload?.w ?? [];
    ws.forEach((w, i) => {
      glosses.set(`${n}:${ayah}:${i + 1}`, {
        gloss: w.e ?? "",
        translit: w.d ?? "",
        arabic: w.c ?? "",
      });
      glossCount++;
    });
  }
}
console.log(`  ${glossCount} glossed words, ${ayahs.size} ayah translations`);

// --- 3. join ---------------------------------------------------------------

const roots = new Map();   // root → { count, glosses:Map, lemmas:Set, forms:Set }
const lemmas = new Map();  // lemma → { root, count, glosses:Map, pos }
const surface = new Map(); // normalized surface → { root, lemma, pos, gloss }

const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);

for (const [key, tok] of tokens) {
  const g = glosses.get(key);
  // the segment carrying the root is the lexical core of the token
  const core = tok.segs.find((s) => s.root) ?? tok.segs.find((s) => s.lemma);
  if (!core) continue;

  const rootKey = core.root ? normalize(core.root) : null;
  const lemKey = core.lemma ? normalize(core.lemma) : null;
  const gloss = (g?.gloss ?? "").trim();

  if (rootKey) {
    if (!roots.has(rootKey)) {
      roots.set(rootKey, { count: 0, glosses: new Map(), lemmas: new Set(), display: core.root });
    }
    const r = roots.get(rootKey);
    r.count++;
    if (gloss) bump(r.glosses, gloss);
    if (core.lemma) r.lemmas.add(core.lemma);
  }

  if (lemKey) {
    if (!lemmas.has(lemKey)) {
      lemmas.set(lemKey, { root: rootKey, count: 0, glosses: new Map(), pos: core.pos, display: core.lemma });
    }
    const l = lemmas.get(lemKey);
    l.count++;
    if (gloss) bump(l.glosses, gloss);
  }

  // the whole written token, in every spelling, so pasted text can find it
  const joined = tok.segs.map((s) => s.form).join("");
  for (const whole of variants(joined)) {
    if (whole && !surface.has(whole)) {
      surface.set(whole, {
        root: rootKey ?? undefined,
        lemma: lemKey ?? undefined,
        pos: core.pos,
        vf: core.vf ? Number(core.vf) : undefined,
        gloss: gloss || undefined,
      });
    }
  }
}

// keep the most frequent glosses per entry, cleaned
const topGlosses = (m, n = 14) =>
  [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g.replace(/^\(|\)$/g, "").trim())
    .filter((g, i, a) => g && a.indexOf(g) === i)
    .slice(0, n);

const rootsOut = {};
for (const [k, v] of roots) {
  rootsOut[k] = {
    d: v.display,
    n: v.count,
    g: topGlosses(v.glosses, 14),
    l: [...v.lemmas].slice(0, 12),
  };
}

const lemmasOut = {};
for (const [k, v] of lemmas) {
  lemmasOut[k] = { d: v.display, r: v.root ?? null, n: v.count, g: topGlosses(v.glosses, 6), p: v.pos };
}

const surfaceOut = {};
for (const [k, v] of surface) {
  surfaceOut[k] = [v.root ?? "", v.lemma ?? "", v.pos ?? "", v.vf ?? 0, v.gloss ?? ""];
}

await mkdir(OUT, { recursive: true });
const write = async (name, data) => {
  const json = JSON.stringify(data);
  await writeFile(path.join(OUT, name), json);
  console.log(`  ${name}  ${(json.length / 1024).toFixed(0)} KB`);
};

console.log("writing bundles …");
await write("roots.json", rootsOut);
await write("lemmas.json", lemmasOut);
await write("surface.json", surfaceOut);

console.log(
  `\ndone — ${Object.keys(rootsOut).length} roots, ${Object.keys(lemmasOut).length} lemmas, ${Object.keys(surfaceOut).length} surface forms`,
);

/**
 * Access to the derived lexical bundles.
 *
 * Server-side only — the bundles are ~1.3 MB and there is no reason to send
 * them to a phone. The passage route resolves a passage once and hands back
 * only what that passage needed.
 *
 * See lib/data/ATTRIBUTION.md for sources and licensing.
 */

import rootsJson from "../data/roots.json";
import lemmasJson from "../data/lemmas.json";
import surfaceJson from "../data/surface.json";

export interface RootEntry {
  /** display form, as the corpus spells it */
  d: string;
  /** occurrences in the corpus */
  n: number;
  /** English glosses, most frequent first — the root's semantic field */
  g: string[];
  /** lemmas built on this root */
  l: string[];
}

export interface LemmaEntry {
  d: string;
  r: string | null;
  n: number;
  g: string[];
  p: string;
}

/** [root, lemma, pos, verbForm, gloss] */
export type SurfaceEntry = [string, string, string, number, string];

const ROOTS = rootsJson as unknown as Record<string, RootEntry>;
const LEMMAS = lemmasJson as unknown as Record<string, LemmaEntry>;
const SURFACE = surfaceJson as unknown as Record<string, SurfaceEntry>;

export const rootCount = () => Object.keys(ROOTS).length;
export const lemmaCount = () => Object.keys(LEMMAS).length;
export const surfaceCount = () => Object.keys(SURFACE).length;

export const getRoot = (r: string): RootEntry | undefined => ROOTS[r];
export const getLemma = (l: string): LemmaEntry | undefined => LEMMAS[l];

export const allRoots = (): string[] => Object.keys(ROOTS);

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

/**
 * Proclitics that attach to the front of a word in ordinary writing. Stripping
 * them is what lets a modern passage resolve — والكتاب is كتاب with two of them.
 * Longest first, so بال is tried before ب.
 */
const PROCLITICS = [
  "وبال", "فبال", "وكال", "بال", "كال", "فال", "وال", "لل",
  "ال", "و", "ف", "ب", "ك", "ل", "س",
];

/** Enclitics — attached pronouns. */
const ENCLITICS = ["هما", "كما", "هن", "كن", "هم", "كم", "نا", "ها", "ه", "ك", "ي"];

export interface Resolution {
  entry: SurfaceEntry;
  /** what was stripped to find it */
  stripped: { prefix: string; suffix: string };
  /** the form that actually matched */
  matched: string;
}

/**
 * Find a written form in the lexicon, stripping clitics if the bare form is
 * not there. Returns null rather than a guess — an unresolved word is a fact
 * about the lexicon's coverage, not about the text.
 */
export function lookup(word: string): Resolution | null {
  const direct = SURFACE[word];
  if (direct) return { entry: direct, stripped: { prefix: "", suffix: "" }, matched: word };

  for (const p of PROCLITICS) {
    if (!word.startsWith(p) || word.length - p.length < 2) continue;
    const rest = word.slice(p.length);
    const hit = SURFACE[rest];
    if (hit) return { entry: hit, stripped: { prefix: p, suffix: "" }, matched: rest };

    for (const s of ENCLITICS) {
      if (!rest.endsWith(s) || rest.length - s.length < 2) continue;
      const core = rest.slice(0, -s.length);
      const h2 = SURFACE[core];
      if (h2) return { entry: h2, stripped: { prefix: p, suffix: s }, matched: core };
    }
  }

  for (const s of ENCLITICS) {
    if (!word.endsWith(s) || word.length - s.length < 2) continue;
    const core = word.slice(0, -s.length);
    const hit = SURFACE[core];
    if (hit) return { entry: hit, stripped: { prefix: "", suffix: s }, matched: core };
  }

  return null;
}

/** Every lemma built on a root, with its glosses — the fibre, from real data. */
export function fibreOf(root: string): { lemma: string; gloss: string[]; n: number }[] {
  const r = ROOTS[root];
  if (!r) return [];
  return r.l
    .map((display) => {
      const key = Object.keys(LEMMAS).find((k) => LEMMAS[k].d === display);
      const e = key ? LEMMAS[key] : undefined;
      return { lemma: display, gloss: e?.g ?? [], n: e?.n ?? 0 };
    })
    .sort((a, b) => b.n - a.n);
}

/** Roots whose written skeleton matches — used by the teleport channels. */
export function rootsMatching(predicate: (root: string, e: RootEntry) => boolean, cap = 60): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(ROOTS)) {
    if (predicate(k, v)) {
      out.push(k);
      if (out.length >= cap) break;
    }
  }
  return out;
}

/** A word of the corpus with the same value — used by the isopsephy operation. */
export function surfaceEntries(): [string, SurfaceEntry][] {
  return Object.entries(SURFACE);
}

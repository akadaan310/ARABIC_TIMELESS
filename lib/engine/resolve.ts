/**
 * Passage resolution — server side.
 *
 * Takes a bare passage from the kernel and fills in everything the lexicon
 * knows, plus the candidate pools the substitution operations need. Runs once
 * per passage; after this the client has everything and every operation is
 * instant and offline.
 *
 * "server-only" is deliberate: the bundles are ~1.3 MB and there is no reason
 * to ship them to a phone.
 */

import "server-only";

import { buildPassage, statsOf, type Passage, type PassageWord } from "./passage";
import { parseWord } from "./text";
import { weightOf } from "./layers/band3";
import {
  lookup, getRoot, getLemma, surfaceEntries, rootCount, lemmaCount, surfaceCount,
} from "./lexdata";

// ---------------------------------------------------------------------------
// Indexes, built once
// ---------------------------------------------------------------------------

let SKELETON_INDEX: Map<string, string[]> | null = null;
let WEIGHT_INDEX: Map<number, string[]> | null = null;

function indexes() {
  if (SKELETON_INDEX && WEIGHT_INDEX) return { skel: SKELETON_INDEX, wt: WEIGHT_INDEX };
  const skel = new Map<string, string[]>();
  const wt = new Map<number, string[]>();
  for (const [form] of surfaceEntries()) {
    if (form.length < 2 || form.length > 9) continue;
    const w = parseWord(form);
    if (w.letters.length === 0) continue;
    const s = w.skeleton;
    const v = weightOf(w.letters);
    const a = skel.get(s);
    if (a) { if (a.length < 24) a.push(form); } else skel.set(s, [form]);
    const b = wt.get(v);
    if (b) { if (b.length < 24) b.push(form); } else wt.set(v, [form]);
  }
  SKELETON_INDEX = skel;
  WEIGHT_INDEX = wt;
  return { skel, wt };
}

/** Permutations of a root that are themselves roots in the corpus. */
function taqlibOf(root: string): { root: string; glosses: string[] }[] {
  const ls = [...root];
  if (ls.length !== 3) return [];
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
  ];
  const out: { root: string; glosses: string[] }[] = [];
  for (const p of perms) {
    const cand = p.map((i) => ls[i]).join("");
    if (cand === root) continue;
    const e = getRoot(cand);
    if (e) out.push({ root: e.d, glosses: e.g.slice(0, 3) });
  }
  return out.sort((a, b) => b.glosses.length - a.glosses.length);
}

// ---------------------------------------------------------------------------

export interface ResolveOptions {
  /** include the pools the substitution operations need */
  pools?: boolean;
}

export function resolvePassage(
  raw: string,
  title?: string,
  options: ResolveOptions = { pools: true },
): Passage {
  const p = buildPassage(raw, title);
  const { skel, wt } = options.pools ? indexes() : { skel: null, wt: null };

  for (const w of p.words) {
    const hit = lookup(w.norm);
    if (hit) {
      const [root, lemma, pos, vf, gloss] = hit.entry;
      const rootEntry = root ? getRoot(root) : undefined;
      const lemmaEntry = lemma ? getLemma(lemma) : undefined;
      const lex: PassageWord["lex"] = {
        root: root || undefined,
        rootDisplay: rootEntry?.d ?? (root || undefined),
        rootGlosses: rootEntry?.g,
        rootCount: rootEntry?.n,
        lemma: lemma || undefined,
        lemmaDisplay: lemmaEntry?.d ?? (lemma || undefined),
        gloss: gloss || undefined,
        pos: pos || undefined,
        vf: vf || undefined,
      };
      if (hit.stripped.prefix) lex.prefix = hit.stripped.prefix;
      if (hit.stripped.suffix) lex.suffix = hit.stripped.suffix;
      w.lex = lex;
      if (root) w.taqlib = taqlibOf(root);
    }

    if (skel && wt) {
      w.sameSkeleton = (skel.get(w.skeleton) ?? []).filter((f) => f !== w.norm).slice(0, 12);
      w.sameWeight = (wt.get(w.weight) ?? []).filter((f) => f !== w.norm).slice(0, 12);
    }
  }

  p.stats = statsOf(p.words, p.sentences);
  return p;
}

export const lexiconStats = () => ({
  roots: rootCount(),
  lemmas: lemmaCount(),
  forms: surfaceCount(),
});

/**
 * Teleportation — structural addressing.
 *
 * Surah Al-Naml describes the throne arriving "before your glance returns to
 * you", and the one who does it is described as having knowledge of the Book.
 * The computational content of that image is exact: movement by knowledge of
 * structure rather than by traversal. A scan crosses the corpus word by word;
 * an index arrives.
 *
 * So every observable in the engine can serve as an address space. Index the
 * corpus by any reading — skeleton, weight, profile, root — and every word
 * sharing that reading is reachable in one step, at a cost independent of how
 * large the corpus is.
 */

import type { Word } from "./types";
import { parseWord, profileOf } from "./text";
import { getLexicon } from "./lexicon";
import { weightOf } from "./layers/band3";
import { candidateRoots } from "./patterns";

export type Channel = "skeleton" | "weight" | "profile" | "root" | "multiset";

export const CHANNELS: { id: Channel; label: string; ar: string; note: string }[] = [
  { id: "skeleton", label: "Same skeleton", ar: "الرسم", note: "words the page cannot tell apart" },
  { id: "weight",   label: "Same weight",   ar: "الوزن", note: "words that add to the same number" },
  { id: "profile",  label: "Same profile",  ar: "الهيئة", note: "words that break into the same runs" },
  { id: "root",     label: "Same root",     ar: "الجذر", note: "the fibre — one meaning-core, many patterns" },
  { id: "multiset", label: "Same letters",  ar: "الحروف", note: "anagrams — the permutation orbit" },
];

export interface Index {
  channel: Channel;
  /** address → the words that live at it */
  buckets: Map<string, string[]>;
  /** how many words were indexed */
  size: number;
}

const addressOf = (channel: Channel, w: Word): string[] => {
  switch (channel) {
    case "skeleton": return [w.skeleton];
    case "weight":   return [String(weightOf(w.letters))];
    case "profile":  return [profileOf(w).join(",")];
    case "multiset": return [[...w.letters].sort().join("")];
    case "root":     return candidateRoots(w.letters).map((r) => r.join(""));
  }
};

const CACHE = new Map<string, Index>();

/** Build (and cache) an index of the active lexicon on one channel. */
export function buildIndex(channel: Channel): Index {
  const lex = getLexicon();
  const key = `${lex.name}:${channel}`;
  const cached = CACHE.get(key);
  if (cached) return cached;

  const buckets = new Map<string, string[]>();
  let size = 0;
  for (const entry of lex.words()) {
    const w = parseWord(entry);
    if (w.letters.length === 0) continue;
    size++;
    for (const addr of addressOf(channel, w)) {
      buckets.set(addr, [...(buckets.get(addr) ?? []), entry]);
    }
  }
  const index: Index = { channel, buckets, size };
  CACHE.set(key, index);
  return index;
}

export interface Jump {
  channel: Channel;
  address: string;
  destinations: string[];
  /** counts a scan would need */
  scanCost: number;
  /** counts the index needs — one, whatever the corpus size */
  indexCost: number;
}

/** Jump from a word to everything sharing its reading on one channel. */
export function teleport(word: Word, channel: Channel): Jump[] {
  const index = buildIndex(channel);
  const here = word.letters.join("");
  return addressOf(channel, word).map((address) => ({
    channel,
    address,
    destinations: (index.buckets.get(address) ?? []).filter((d) => d !== here),
    scanCost: index.size,
    indexCost: 1,
  }));
}

/** Every channel at once — the full set of exits from a word. */
export function allExits(word: Word): Jump[] {
  return CHANNELS.flatMap((c) => teleport(word, c.id)).filter(
    (j) => j.destinations.length > 0,
  );
}

export const clearIndexCache = () => CACHE.clear();

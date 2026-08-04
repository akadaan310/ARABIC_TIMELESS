/**
 * The passage model.
 *
 * The dotless kernel works on letters and words. This is the layer above it:
 * a composition, split into sentences and words, each word carrying both its
 * kernel analysis (skeleton, slots, weight, profile) and its lexical identity
 * (root, lemma, gloss) where the lexicon can supply one.
 *
 * Resolution happens once, on the server, because the lexicon is large. After
 * that every operation in operations.ts runs on the resolved passage with no
 * further lookups — which is what makes the interaction instant.
 */

import type { Word } from "./types";
import { parseWord, degree, arity, profileOf } from "./text";
import { weightOf } from "./layers/band3";

// ---------------------------------------------------------------------------
// Normalisation — must match scripts/build-lexicon.mjs exactly
// ---------------------------------------------------------------------------

const TASHKIL = /[ً-ْـ۟-ࣰۭ-ࣿ]/g;
const DAGGER = /ٰ/g;

const foldLetters = (s: string) =>
  s
    .replace(/[آأإٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^ء-ي]/g, "");

export const normalizeForLookup = (s: string) =>
  foldLetters(s.replace(DAGGER, "").replace(TASHKIL, ""));

export const spelledVariant = (s: string) =>
  foldLetters(s.replace(DAGGER, "ا").replace(TASHKIL, ""));

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export interface Lex {
  root?: string;
  rootDisplay?: string;
  rootGlosses?: string[];
  rootCount?: number;
  lemma?: string;
  lemmaDisplay?: string;
  gloss?: string;
  pos?: string;
  /** verb form, I–X */
  vf?: number;
  /** clitics stripped to find the entry */
  prefix?: string;
  suffix?: string;
}

export interface PassageWord {
  /** exactly as written, with any diacritics */
  raw: string;
  /** normalised, for lookup and for the kernel */
  norm: string;
  index: number;
  sentence: number;
  skeleton: string;
  degree: number;
  arity: number;
  weight: number;
  profile: number[];
  lex?: Lex;
  /** other real words sharing this word's skeleton */
  sameSkeleton?: string[];
  /** other real words of the same abjad value */
  sameWeight?: string[];
  /** roots reachable by permuting this word's radicals, that are real roots */
  taqlib?: { root: string; glosses: string[] }[];
}

export interface Sentence {
  index: number;
  raw: string;
  words: PassageWord[];
  weight: number;
  degree: number;
}

export interface Passage {
  raw: string;
  title?: string;
  sentences: Sentence[];
  words: PassageWord[];
  stats: PassageStats;
}

export interface PassageStats {
  words: number;
  letters: number;
  sentences: number;
  /** how many words the lexicon could identify */
  resolved: number;
  /** distinct roots present */
  roots: number;
  /** the whole passage's joint reading count, as a base-2 magnitude */
  bits: number;
  weight: number;
  /** words whose skeleton determines them completely */
  determined: number;
}

// ---------------------------------------------------------------------------
// Splitting
// ---------------------------------------------------------------------------

const SENTENCE_BREAK = /(?<=[.!?؟۔]|[۝][٠-٩۰-۹]*|\n)/u;

export function splitSentences(text: string): string[] {
  return text
    .split(SENTENCE_BREAK)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function splitWords(text: string): string[] {
  return text
    .split(/[\s،؛؟.,;:!?()[\]{}"'«»۝ -⁯-]+/u)
    .map((w) => w.trim())
    .filter(Boolean);
}

/**
 * Build a passage without the lexicon. Everything the kernel can say is
 * available here; the lexical fields are filled in by the resolver.
 */
export function buildPassage(raw: string, title?: string): Passage {
  const sentences: Sentence[] = [];
  const words: PassageWord[] = [];
  let wi = 0;

  splitSentences(raw).forEach((sRaw, si) => {
    const sWords: PassageWord[] = [];
    for (const token of splitWords(sRaw)) {
      const norm = normalizeForLookup(token);
      if (!norm) continue;
      const w: Word = parseWord(norm);
      if (w.letters.length === 0) continue;
      const pw: PassageWord = {
        raw: token,
        norm,
        index: wi++,
        sentence: si,
        skeleton: w.skeleton,
        degree: degree(w),
        arity: arity(w),
        weight: weightOf(w.letters),
        profile: profileOf(w),
      };
      sWords.push(pw);
      words.push(pw);
    }
    if (sWords.length === 0) return;
    sentences.push({
      index: si,
      raw: sRaw,
      words: sWords,
      weight: sWords.reduce((a, w) => a + w.weight, 0),
      degree: sWords.reduce((a, w) => a * w.degree, 1),
    });
  });

  return { raw, title, sentences, words, stats: statsOf(words, sentences) };
}

export function statsOf(words: PassageWord[], sentences: Sentence[]): PassageStats {
  const roots = new Set(words.map((w) => w.lex?.root).filter(Boolean) as string[]);
  return {
    words: words.length,
    letters: words.reduce((a, w) => a + w.norm.length, 0),
    sentences: sentences.length,
    resolved: words.filter((w) => w.lex?.root).length,
    roots: roots.size,
    // joint degree overflows fast on a long passage, so carry it in bits
    bits: words.reduce((a, w) => a + Math.log2(Math.max(w.degree, 1)), 0),
    weight: words.reduce((a, w) => a + w.weight, 0),
    determined: words.filter((w) => w.degree === 1).length,
  };
}

/** Render a passage back to text from a per-word replacement. */
export const render = (words: PassageWord[], map: (w: PassageWord) => string): string =>
  words.map(map).filter(Boolean).join(" ");

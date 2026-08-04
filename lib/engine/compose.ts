/**
 * Composition — writing by function application.
 *
 * Ordinary writing recalls words. Composing here applies a pattern to a root
 * and gets a word back, so a line is assembled out of operations rather than
 * out of memory. That is what the architecture makes possible: the pattern
 * library is a function library, and a composition is a sequence of calls.
 *
 * Client-safe. Roots arrive from the API; everything here is pure.
 */

import { parseWord, degree, arity, profileOf } from "./text";
import { weightOf } from "./layers/band3";
import { PATTERNS, PATTERN_BY_ID, applyPattern, type Pattern } from "./patterns";
import { UNMOVED, CLASS_OF } from "./alphabet";

export interface RootOption {
  /** normalised, three radicals */
  root: string;
  /** as the corpus spells it */
  display: string;
  glosses: string[];
  count: number;
}

export interface Piece {
  id: string;
  /** the written word */
  word: string;
  root: string;
  rootDisplay: string;
  patternId: string;
  patternName: string;
  meaning: string;
  /** a literal word typed rather than built */
  literal?: boolean;
}

export interface PieceMetrics {
  skeleton: string;
  weight: number;
  degree: number;
  arity: number;
  profile: number[];
  /** written only from the six letters alone in their shape classes */
  unmoved: boolean;
}

export function metricsOf(word: string): PieceMetrics {
  const w = parseWord(word);
  return {
    skeleton: w.skeleton,
    weight: weightOf(w.letters),
    degree: degree(w),
    arity: arity(w),
    profile: profileOf(w),
    unmoved: w.letters.length > 0 && w.letters.every((l) => (CLASS_OF[l]?.length ?? 1) === 1),
  };
}

export function buildPiece(root: RootOption, patternId: string): Piece | null {
  const pattern: Pattern | undefined = PATTERN_BY_ID[patternId];
  const radicals = [...root.root].slice(0, 3);
  if (!pattern || radicals.length < 3) return null;
  const word = applyPattern(pattern, radicals);
  if (!word) return null;
  return {
    id: `${root.root}:${patternId}:${Math.random().toString(36).slice(2, 7)}`,
    word,
    root: root.root,
    rootDisplay: root.display,
    patternId,
    patternName: pattern.name,
    meaning: pattern.meaning,
  };
}

export function literalPiece(word: string): Piece {
  return {
    id: `lit:${word}:${Math.random().toString(36).slice(2, 7)}`,
    word,
    root: "",
    rootDisplay: "",
    patternId: "",
    patternName: "typed",
    meaning: "written directly rather than built",
    literal: true,
  };
}

// ---------------------------------------------------------------------------
// Composition-level readout
// ---------------------------------------------------------------------------

export interface CompositionStats {
  words: number;
  letters: number;
  weight: number;
  /** total openness of the line, in bits */
  bits: number;
  determined: number;
  skeleton: string;
  profile: number[];
  roots: number;
  /** every word drawn only from the unmoved six */
  allUnmoved: boolean;
}

export function statsOfComposition(pieces: Piece[]): CompositionStats {
  const ms = pieces.map((p) => metricsOf(p.word));
  return {
    words: pieces.length,
    letters: pieces.reduce((a, p) => a + parseWord(p.word).letters.length, 0),
    weight: ms.reduce((a, m) => a + m.weight, 0),
    bits: ms.reduce((a, m) => a + Math.log2(Math.max(m.degree, 1)), 0),
    determined: ms.filter((m) => m.degree === 1).length,
    skeleton: ms.map((m) => m.skeleton).join(" "),
    profile: pieces.flatMap((p) => profileOf(parseWord(p.word))),
    roots: new Set(pieces.map((p) => p.root).filter(Boolean)).size,
    allUnmoved: ms.length > 0 && ms.every((m) => m.unmoved),
  };
}

export const renderComposition = (pieces: Piece[]) =>
  pieces.map((p) => p.word).join(" ");

// ---------------------------------------------------------------------------
// Constraints — the modes you can compose under
// ---------------------------------------------------------------------------

export type ConstraintId = "free" | "weight" | "unmoved" | "oneRoot" | "determined";

export interface Constraint {
  id: ConstraintId;
  name: { en: string; ar: string };
  note: string;
  /** does a candidate word satisfy the constraint? */
  admits(word: string, ctx: { pieces: Piece[]; target?: number; root?: string }): boolean;
  /** how the line is doing against it */
  status(pieces: Piece[], ctx: { target?: number; root?: string }): {
    ok: boolean;
    label: string;
  };
}

export const CONSTRAINTS: Constraint[] = [
  {
    id: "free",
    name: { en: "Free", ar: "مطلق" },
    note: "Any root, any pattern. The whole library is open.",
    admits: () => true,
    status: (p) => ({ ok: true, label: `${p.length} ${p.length === 1 ? "word" : "words"}` }),
  },
  {
    id: "weight",
    name: { en: "To a weight", ar: "إلى وزن" },
    note: "Compose a line that adds to a chosen number. The abjad total is a constraint you can write toward — which is how a chronogram is made.",
    admits: (word, { pieces, target }) => {
      if (!target) return true;
      const now = pieces.reduce((a, p) => a + metricsOf(p.word).weight, 0);
      return now + metricsOf(word).weight <= target;
    },
    status: (pieces, { target }) => {
      const now = pieces.reduce((a, p) => a + metricsOf(p.word).weight, 0);
      if (!target) return { ok: true, label: `${now.toLocaleString()}` };
      const gap = target - now;
      return {
        ok: gap === 0,
        label:
          gap === 0
            ? `exactly ${target.toLocaleString()}`
            : gap > 0
              ? `${now.toLocaleString()} — ${gap.toLocaleString()} short`
              : `${now.toLocaleString()} — ${Math.abs(gap).toLocaleString()} over`,
      };
    },
  },
  {
    id: "unmoved",
    name: { en: "Unmoved letters only", ar: "الحروف الثابتة" },
    note: `Write using only ${UNMOVED.join(" ")} — the six letters alone in their shape classes. Every word comes out with degree 1: dotless, and still completely unambiguous.`,
    admits: (word) => metricsOf(word).unmoved,
    status: (pieces) => {
      const bad = pieces.filter((p) => !metricsOf(p.word).unmoved);
      return {
        ok: bad.length === 0,
        label: bad.length === 0 ? "zero ambiguity" : `${bad.length} outside the six`,
      };
    },
  },
  {
    id: "oneRoot",
    name: { en: "One root", ar: "جذر واحد" },
    note: "Build a whole line out of a single root by putting it through different patterns. The clearest demonstration that patterns are functions.",
    admits: (_word, { pieces, root }) => {
      const fixed = root ?? pieces[0]?.root;
      return !fixed || pieces.length === 0 || true;
    },
    status: (pieces) => {
      const roots = new Set(pieces.map((p) => p.root).filter(Boolean));
      return {
        ok: roots.size <= 1,
        label: roots.size <= 1 ? `one root, ${pieces.length} words` : `${roots.size} roots`,
      };
    },
  },
  {
    id: "determined",
    name: { en: "Fully determined", ar: "محكم" },
    note: "Every word must be pinned down by its skeleton alone — degree 1. A line that survives losing every dot without losing a single reading.",
    admits: (word) => metricsOf(word).degree === 1,
    status: (pieces) => {
      const open = pieces.filter((p) => metricsOf(p.word).degree > 1);
      return {
        ok: open.length === 0,
        label: open.length === 0 ? "nothing left open" : `${open.length} still open`,
      };
    },
  },
];

export const CONSTRAINT_BY_ID: Record<string, Constraint> = Object.fromEntries(
  CONSTRAINTS.map((c) => [c.id, c]),
);

// ---------------------------------------------------------------------------
// Suggestion
// ---------------------------------------------------------------------------

export interface Suggestion {
  root: RootOption;
  pattern: Pattern;
  word: string;
  weight: number;
  degree: number;
  /** why this one is being offered */
  reason: string;
}

/**
 * Offer (root, pattern) pairs that satisfy the active constraint. For the
 * weight mode this is the interesting case: it solves backward from a number
 * to the words that reach it.
 */
export function suggest(
  roots: RootOption[],
  constraint: ConstraintId,
  ctx: { pieces: Piece[]; target?: number; patterns?: string[] },
  cap = 24,
): Suggestion[] {
  const pool = (ctx.patterns?.length
    ? ctx.patterns.map((id) => PATTERN_BY_ID[id]).filter(Boolean)
    : PATTERNS) as Pattern[];

  const out: Suggestion[] = [];
  const perRoot = new Map<string, number>();
  const seen = new Set<string>();
  const now = ctx.pieces.reduce((a, p) => a + metricsOf(p.word).weight, 0);
  const need = ctx.target ? ctx.target - now : null;

  // At most this many words from any one root, so a single high-frequency
  // root cannot fill the whole palette.
  const PER_ROOT = constraint === "oneRoot" ? cap : 2;

  for (const root of roots) {
    const radicals = [...root.root].slice(0, 3);
    if (radicals.length < 3) continue;
    for (const pattern of pool) {
      if ((perRoot.get(root.root) ?? 0) >= PER_ROOT) break;
      const word = applyPattern(pattern, radicals);
      if (!word || !plausible(word) || seen.has(word)) continue;
      const m = metricsOf(word);

      if (constraint === "unmoved" && !m.unmoved) continue;
      if (constraint === "determined" && m.degree !== 1) continue;
      if (constraint === "weight" && need !== null && m.weight !== need) continue;

      seen.add(word);
      perRoot.set(root.root, (perRoot.get(root.root) ?? 0) + 1);
      out.push({
        root,
        pattern,
        word,
        weight: m.weight,
        degree: m.degree,
        reason:
          constraint === "weight" && need !== null
            ? `lands exactly on ${need.toLocaleString()}`
            : constraint === "unmoved"
              ? "drawn only from the six"
              : constraint === "determined"
                ? "degree 1"
                : pattern.meaning,
      });
      if (out.length >= cap) return out;
    }
  }
  return out;
}

/**
 * Reject shapes that are artefacts of normalisation rather than words.
 *
 * Hamza folds to alef during lookup, so a root beginning with a hamza — أله,
 * أمر — will produce a doubled alef whenever a pattern prefixes one. That is a
 * fact about the fold, not about Arabic, so it should not be offered.
 */
export function plausible(word: string): boolean {
  if (/اا/.test(word)) return false;
  if (/(.)\1\1/.test(word)) return false;
  return word.length >= 2;
}

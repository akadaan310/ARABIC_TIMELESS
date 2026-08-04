/**
 * The engine's core contracts.
 *
 * Two abstractions carry the whole architecture:
 *
 *   Observable — a reading a layer produces from a string.
 *   Transform  — an operation a layer defines on a string.
 *
 * Layer 14's invariance table is the cross-product of every registered
 * Observable with every registered Transform, computed at runtime rather
 * than tabulated. That is the discovery mechanism: register a new
 * Observable and the table extends itself, and if its invariance row
 * differs from every existing row, the engine reports a genuinely new
 * channel (spec/14-composition.md §14.5).
 */

import type { Position } from "./alphabet";

// ---------------------------------------------------------------------------
// Cost (Layer 16)
// ---------------------------------------------------------------------------

/** Hand-cost, denominated in human effort. See spec/16-hand.md §16.2. */
export interface HandCost {
  /** marks the surface receives */
  marks: number;
  /** discrete comparisons, additions or tallies */
  counts: number;
  /** items that must be in memory simultaneously */
  held: number;
}

export const cost = (marks: number, counts: number, held: number): HandCost => ({
  marks, counts, held,
});

export const addCost = (...cs: HandCost[]): HandCost => ({
  marks: cs.reduce((a, c) => a + c.marks, 0),
  counts: cs.reduce((a, c) => a + c.counts, 0),
  held: Math.max(0, ...cs.map((c) => c.held)),
});

export const ZERO_COST: HandCost = { marks: 0, counts: 0, held: 0 };

// ---------------------------------------------------------------------------
// Bands
// ---------------------------------------------------------------------------

export type Band = 0 | 1 | 2 | 3 | 4 | 5;

export const BANDS: Record<Band, { en: string; ar: string; subject: string }> = {
  0: { en: "The Inherited", ar: "الموروث", subject: "Today's definition, set aside" },
  1: { en: "The Alphabet Alone", ar: "الحرف وحده", subject: "No words, no text, no context" },
  2: { en: "The Skeleton", ar: "الرسم", subject: "What the skeleton is, as an object" },
  3: { en: "Transformation", ar: "التحويل", subject: "What can be done to a string" },
  4: { en: "Structure", ar: "البنية", subject: "Invariants, functions, and how layers sit together" },
  5: { en: "Execution", ar: "التنفيذ", subject: "The cost model, the body, and what survives" },
};

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

/** One letter of a word, with everything positional resolved. */
export interface Glyph {
  /** the base letter, after normalization */
  letter: string;
  /** as originally written, before folding hamza and variants */
  surface: string;
  /** tashkīl attached to this letter, in order */
  marks: string[];
  position: Position;
  /** the skeleton glyph this letter collapses onto in this position */
  skeleton: string;
  /** the letters this skeleton could carry here — the slot's domain */
  domain: string[];
  index: number;
}

export interface Word {
  /** as the user typed it */
  raw: string;
  /** normalized letters, marks stripped */
  letters: string[];
  glyphs: Glyph[];
  /** the rasm — what survives the projection */
  skeleton: string;
  /** true if the input carried any tashkīl */
  voweled: boolean;
}

// ---------------------------------------------------------------------------
// Observables and Transforms
// ---------------------------------------------------------------------------

export interface Observable<T = unknown> {
  id: string;
  layer: number;
  label: { en: string; ar: string };
  /** what this reading discards, stated plainly */
  discards: string;
  compute(word: Word): T;
  /** stable string form, for invariance comparison */
  serialize(value: T): string;
  /** human-readable form, for display */
  display(value: T): string;
  cost(word: Word): HandCost;
}

export interface Transform {
  id: string;
  layer: number;
  label: { en: string; ar: string };
  invertible: boolean;
  /** rng is supplied so randomized transforms are reproducible */
  apply(word: Word, rng: Rng): Word;
  cost(word: Word): HandCost;
}

export type Rng = () => number;

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------

export interface LayerReading {
  observableId: string;
  label: { en: string; ar: string };
  display: string;
  value: unknown;
  cost: HandCost;
}

export interface LayerResult {
  layer: number;
  readings: LayerReading[];
  /** findings the layer wants surfaced — computed, never canned */
  notes: string[];
  cost: HandCost;
}

export interface Layer {
  id: number;
  slug: string;
  name: { en: string; ar: string };
  band: Band;
  /** the layer's core statement, from the spec */
  statement: string;
  observables: Observable[];
  transforms: Transform[];
  analyze(word: Word): LayerResult;
}

// ---------------------------------------------------------------------------
// Candidate collapse (Layers 5, 6)
// ---------------------------------------------------------------------------

export type FilterId =
  | "lexical" | "segmental" | "morphological"
  | "prosodic" | "syntactic" | "semantic" | "intentional";

export interface FilterStep {
  id: FilterId;
  label: { en: string; ar: string };
  /** cost rank from spec/06-collapse.md §6.1 */
  rank: number;
  before: number;
  after: number;
  removed: string[];
  cost: HandCost;
  /** true if this filter is unavailable for this input and was skipped */
  skipped: boolean;
  skipReason?: string;
}

export type Terminal = "determined" | "corrupt" | "intended";

export interface Collapse {
  skeleton: string;
  /** the full candidate set before any filter */
  initial: string[];
  /** capped when the degree is very large; the true degree is `degree` */
  degree: number;
  truncated: boolean;
  steps: FilterStep[];
  survivors: string[];
  terminal: Terminal;
  /** the word actually written, if it survived — the ground truth */
  target: string;
  targetSurvived: boolean;
  totalCost: HandCost;
}

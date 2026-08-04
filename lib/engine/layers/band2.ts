/**
 * Band II — The Skeleton (Layers 4–7).
 *
 * spec/04-void.md, spec/05-superposition.md, spec/06-collapse.md, spec/07-segment.md
 */

import { isClosed, CLOSED, CLASS_OF } from "../alphabet";
import type { Layer, Word } from "../types";
import { cost } from "../types";
import { makeLayer, observable, perLetter, free } from "./helpers";
import { arity, degree, bitsWithheld, slots, profileOf, expand } from "../text";

// ---------------------------------------------------------------------------
// Layer 4 — The Void
// ---------------------------------------------------------------------------

export const layer4: Layer = makeLayer({
  id: 4,
  slug: "void",
  band: 2,
  name: { en: "The Void", ar: "الفراغ" },
  statement: "The unwritten distinction is an addressable slot. A variable, not an absence.",
  observables: [
    observable<string>({
      id: "skeleton",
      layer: 4,
      label: { en: "Skeleton", ar: "الرسم" },
      discards: "every distinction the i'jām dots carry",
      compute: (w) => w.skeleton,
      serialize: (v) => v,
      display: (v) => v,
      cost: (w) => perLetter(w),
    }),
    observable<number>({
      id: "arity",
      layer: 4,
      label: { en: "Arity", ar: "عدد المواضع" },
      discards: "which positions are open — keeps only how many",
      compute: arity,
      serialize: String,
      display: (v) => `${v} free ${v === 1 ? "variable" : "variables"}`,
      cost: (w) => perLetter(w, 2),
    }),
    observable<number>({
      id: "degree",
      layer: 4,
      label: { en: "Degree", ar: "الدرجة" },
      discards: "which bindings — keeps only how many exist",
      compute: degree,
      serialize: String,
      display: (v) => `${v.toLocaleString()} bindings`,
      cost: (w) => perLetter(w),
    }),
  ],
  transforms: [],
  notes: (word) => {
    const d = degree(word);
    const a = arity(word);
    const bits = bitsWithheld(word);
    const out = [
      a === 0
        ? `This word declares no slots at all: every letter is alone in its shape class, so the skeleton determines it completely.`
        : `${a} ${a === 1 ? "position is" : "positions are"} unbound. The skeleton is not missing information — it is holding ${a} ${a === 1 ? "variable" : "variables"} open.`,
    ];
    if (d > 1) {
      out.push(
        `Degree ${d.toLocaleString()} — the skeleton withholds ${bits.toFixed(4)} bits, exactly and measurably.`,
      );
    }
    const widest = slots(word).sort((x, y) => y.domain.length - x.domain.length)[0];
    if (widest) {
      out.push(
        `The widest slot is at position ${widest.index + 1}, with ${widest.domain.length} candidates: ${widest.domain.join(" ")}. That is the position worth marking first.`,
      );
    }
    return out;
  },
});

// ---------------------------------------------------------------------------
// Layer 5 — Superposition
// ---------------------------------------------------------------------------

export const layer5: Layer = makeLayer({
  id: 5,
  slug: "superposition",
  band: 2,
  name: { en: "Superposition", ar: "الاحتمال" },
  statement: "A skeleton denotes a set of words, never one. Multiplicity is a value, not a defect.",
  observables: [
    observable<number>({
      id: "cardinality",
      layer: 5,
      label: { en: "Candidate set", ar: "المجموعة" },
      discards: "which candidates — keeps only how many",
      compute: (w) => degree(w),
      serialize: String,
      display: (v) => `${v.toLocaleString()} candidates`,
      cost: (w) => cost(0, degree(w), 2),
    }),
  ],
  transforms: [],
  notes: (word) => {
    const d = degree(word);
    if (d === 1) {
      return [
        `The candidate set has one member: this word sits at the bottom of the lattice already. Nothing was left open.`,
      ];
    }
    const { truncated } = expand(word);
    return [
      `This skeleton denotes ${d.toLocaleString()} words. It has not failed to denote one — it has succeeded in denoting ${d.toLocaleString()}.`,
      `Writing is choosing a height in the lattice: marking every distinction puts the text at the bottom, marking none puts it at the top, and marking some puts it exactly where the writer intends.`,
      truncated ? `The set is capped for display; the degree above is the true count.` : ``,
    ].filter(Boolean);
  },
});

// ---------------------------------------------------------------------------
// Layer 6 — Collapse
//
// The filter pipeline lives in collapse.ts, because it needs the lexicon and
// the pattern library. This layer surfaces the result.
// ---------------------------------------------------------------------------

export const layer6: Layer = makeLayer({
  id: 6,
  slug: "collapse",
  band: 2,
  name: { en: "Collapse", ar: "الترجيح" },
  statement: "Reading is an act performed on the text, not a thing received from it.",
  observables: [],
  transforms: [],
  notes: () => [
    `Seven filters, cheapest first: lexical, segmental, morphological, prosodic, syntactic, semantic, intentional. Each is a filter on the candidate set; apply in order and iterate to a fixed point.`,
    `Three terminal states, all meaningful: one candidate is determined, zero is corrupt, and more than one — stable — is ambiguity that was available to the writer and left standing.`,
  ],
});

// ---------------------------------------------------------------------------
// Layer 7 — Segment
// ---------------------------------------------------------------------------

export const layer7: Layer = makeLayer({
  id: 7,
  slug: "segment",
  band: 2,
  name: { en: "Segment", ar: "الوصل والفصل" },
  statement: "The closed letters cut every word into visible chunks. The chunk profile is a signature independent of the letters.",
  observables: [
    observable<number[]>({
      id: "profile",
      layer: 7,
      label: { en: "Profile", ar: "الهيئة" },
      discards: "every distinction among the open letters, and which of the six closed",
      compute: profileOf,
      serialize: (v) => v.join(","),
      display: (v) => `(${v.join(", ")})`,
      cost: (w) => perLetter(w, 2),
    }),
    observable<number>({
      id: "chunkCount",
      layer: 7,
      label: { en: "Chunks", ar: "عدد القطع" },
      discards: "the run lengths — keeps only how many runs",
      compute: (w) => profileOf(w).length,
      serialize: String,
      display: (v) => `${v} connected ${v === 1 ? "run" : "runs"}`,
      cost: (w) => perLetter(w),
    }),
  ],
  transforms: [],
  notes: (word) => {
    const p = profileOf(word);
    const closed = word.letters.filter(isClosed);
    const out = [
      `Profile (${p.join(", ")}) — this word is legible as a shape from across a room, before a single letter resolves.`,
    ];
    if (closed.length === 0) {
      out.push(`No closed letters, so the whole word is one run. The profile channel tells you nothing here — and costs nothing to have asked.`);
    } else {
      out.push(
        `The breaks are forced by ${closed.join(" ")}. Because the six closed letters form a union of complete shape classes, this profile survives every skeleton-preserving substitution.`,
      );
    }
    return out;
  },
});

export const band2Layers = [layer4, layer5, layer6, layer7];

/** Exposed for Layer 14 — the closed set as a union of whole classes. */
export function closedIsUnionOfClasses(): boolean {
  const classes = new Set<string>();
  for (const l of CLOSED) classes.add(CLASS_OF[l].join(""));
  const union = new Set<string>();
  for (const key of classes) for (const l of key) union.add(l);
  return union.size === CLOSED.size && [...union].every((l) => CLOSED.has(l));
}

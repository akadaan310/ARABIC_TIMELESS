/**
 * Band V — Execution (Layers 16–20).
 *
 * spec/16-hand.md, spec/17-articulation.md, spec/18-memory.md,
 * spec/19-damage.md, spec/20-invariance.md
 */

import {
  ARTICULATION, POINTS, ZONES, ALPHABET_SIZE, CLASSES_MEDIAL, UNMOVED,
  HIJAI, CLASS_OF,
} from "../alphabet";
import type { Layer, Word } from "../types";
import { cost } from "../types";
import { makeLayer, observable, perLetter, free } from "./helpers";
import { degree, bitsWithheld, arity, profileOf } from "../text";
import { weightOf, silentSubgroupOrder, medialSilentSubgroupOrder, footOrbits, rootSpace } from "./band3";
import { orderPermutation } from "./band1";
import { closedIsUnionOfClasses } from "./band2";
import { abstractWord } from "../patterns";

// ---------------------------------------------------------------------------
// Layer 16 — The Hand
// ---------------------------------------------------------------------------

export const layer16: Layer = makeLayer({
  id: 16,
  slug: "hand",
  band: 5,
  name: { en: "The Hand", ar: "اليد" },
  statement: "The realizability test: what can be done with no instrument at all.",
  observables: [
    observable<number>({
      id: "expansionMarks",
      layer: 16,
      label: { en: "Cost of expansion", ar: "كلفة النشر" },
      discards: "nothing — this is a measurement",
      compute: (w) => degree(w) * w.letters.length,
      serialize: String,
      display: (v) => `${v.toLocaleString()} marks to write the candidate set out`,
      cost: () => free,
    }),
  ],
  transforms: [],
  notes: (word) => {
    const expansion = degree(word) * word.letters.length;
    return [
      `The apparatus is three things: a hand, a surface, and a memory. Nothing in the architecture requires more.`,
      `Writing this word's candidate set out costs ${expansion.toLocaleString()} marks. Filtering it costs none — which is why the reading procedure filters rather than enumerates.`,
      `Costs are denominated in marks, counts and items held, not in machine steps. That is why the filter ordering is correct permanently rather than currently: the price of a profile does not fall when the tools improve.`,
    ];
  },
});

// ---------------------------------------------------------------------------
// Layer 17 — Articulation
// ---------------------------------------------------------------------------

export const pointOf = (letter: string) => POINTS[ARTICULATION[letter] ?? 0];

export const articulationPath = (word: Word): number[] =>
  word.letters.map((l) => ARTICULATION[l] ?? 0);

/** Letters produced at the same point — an adjacency class. */
export const sharingPoint = (letter: string): string[] =>
  HIJAI.filter((l) => ARTICULATION[l] === ARTICULATION[letter]);

export const layer17: Layer = makeLayer({
  id: 17,
  slug: "articulation",
  band: 5,
  name: { en: "Articulation", ar: "المخارج" },
  statement: "The body as address space.",
  observables: [
    observable<number[]>({
      id: "path",
      layer: 17,
      label: { en: "Articulatory path", ar: "مسار المخارج" },
      discards: "everything about the written letter — keeps only where it is made",
      compute: articulationPath,
      serialize: (v) => v.join(","),
      display: (v) => v.join(" → "),
      cost: (w) => perLetter(w),
    }),
  ],
  transforms: [],
  notes: (word) => {
    const path = articulationPath(word);
    const zones = word.letters.map((l) => ZONES[pointOf(l).zone].en);
    const span = path.length ? Math.max(...path) - Math.min(...path) : 0;
    return [
      `A third ordering of the alphabet, after the two conventional ones — and this one is discovered rather than decided. It is read off the body, so two people separated by a thousand years derive the same table.`,
      `This word travels ${zones.join(" → ")}, a span of ${span} points from its deepest sound to its most forward.`,
      `Shape class and articulation point cross-cut: the tooth letters share one shape and scatter across four points, while ط د ت share a point and scatter across three shapes. Neither predicts the other, which makes this a genuinely independent channel.`,
    ];
  },
});

// ---------------------------------------------------------------------------
// Layer 18 — Memory
// ---------------------------------------------------------------------------

export const layer18: Layer = makeLayer({
  id: 18,
  slug: "memory",
  band: 5,
  name: { en: "Memory", ar: "الحفظ" },
  statement: "The skeleton is a compression format.",
  observables: [
    observable<number>({
      id: "bitsWithheld",
      layer: 18,
      label: { en: "Bits withheld", ar: "البتات المحجوبة" },
      discards: "which bindings — keeps only how much was not stored",
      compute: bitsWithheld,
      serialize: (v) => v.toFixed(4),
      display: (v) => `${v.toFixed(4)} bits`,
      cost: (w) => perLetter(w),
    }),
  ],
  transforms: [],
  notes: (word) => {
    const bits = bitsWithheld(word);
    const aligns = abstractWord(word.letters);
    const out = [
      bits > 0
        ? `The skeleton stores ${bits.toFixed(4)} bits fewer than the word, and reconstructs the difference by computation. That is a compression format, and the ratio is calculable in advance.`
        : `This word's skeleton withholds nothing: it is stored losslessly, at the bottom of the lattice.`,
    ];
    if (aligns.length > 0) {
      const a = aligns[0];
      out.push(
        `Held as root ${a.root.join("–")} plus pattern ${a.pattern.name}, this word costs two items of memory instead of ${word.letters.length}. The pattern library is held once and serves every word built on it.`,
      );
    }
    out.push(
      `Every projection in the architecture turns out to be a compression scheme, and not one of them was designed for storage. A projection with stated loss is precisely what a compression scheme is.`,
    );
    return out;
  },
});

// ---------------------------------------------------------------------------
// Layer 19 — Damage
// ---------------------------------------------------------------------------

export type DamageClass =
  | "substitution-across" | "substitution-within" | "deletion"
  | "insertion" | "transposition" | "demarking" | "vocalic";

export const DAMAGE_LABELS: Record<DamageClass, { en: string; ar: string }> = {
  "substitution-across": { en: "Substitution, across classes", ar: "تصحيف بين الرسوم" },
  "substitution-within": { en: "Substitution, within a class", ar: "تصحيف داخل الرسم" },
  "deletion":            { en: "Deletion", ar: "سقط" },
  "insertion":           { en: "Insertion", ar: "زيادة" },
  "transposition":       { en: "Transposition", ar: "قلب" },
  "demarking":           { en: "Demarking", ar: "إهمال" },
  "vocalic":             { en: "Vocalic error", ar: "تحريف" },
};

export const layer19: Layer = makeLayer({
  id: 19,
  slug: "damage",
  band: 5,
  name: { en: "Damage", ar: "التصحيف" },
  statement: "The layers are error-correcting codes for one another.",
  observables: [],
  transforms: [],
  notes: (word) => [
    `Each channel is blind to a different corruption, and no damage class is invisible to all of them. That is the robustness result, and it is read straight off the invariance table.`,
    `Demarking moves a text up the lattice rather than sideways: a lost mark unbinds a slot, so the candidate set grows and the true reading stays inside it. Losing a mark degrades a text; it does not falsify one.`,
    `A substitution moves sideways instead — to a different singleton — and produces a text that is confidently, silently wrong. That is the damage class the skeleton cannot see and the weight can.`,
  ],
});

// ---------------------------------------------------------------------------
// Layer 20 — Invariance
// ---------------------------------------------------------------------------

export interface Constant {
  label: string;
  value: string;
  layer: number;
  method: string;
}

/** Every checkable constant, computed at call time. spec/20-invariance.md §20.2. */
export function constants(): Constant[] {
  const perm = orderPermutation();
  const orbits = footOrbits();
  const tri = rootSpace(3);
  const quin = rootSpace(5);
  return [
    { label: "Letters", value: String(ALPHABET_SIZE), layer: 0, method: "count" },
    { label: "Shape classes, medial", value: String(Object.keys(CLASSES_MEDIAL).length), layer: 0, method: "group the letters by skeleton" },
    { label: "Bits withheld by a tooth", value: Math.log2(5).toFixed(4), layer: 4, method: "log₂ of the class size" },
    { label: "Order of the abjadī↔hijāʾī permutation", value: String(perm.order), layer: 3, method: `lcm of the cycle lengths ${perm.cycleLengths.join(", ")}` },
    { label: "Letters fixed by that permutation", value: perm.fixed.join(", "), layer: 3, method: "tabulate and compare" },
    { label: "Fixed points of reflection", value: ALPHABET_SIZE % 2 === 0 ? "none" : "one", layer: 3, method: `${ALPHABET_SIZE} is even` },
    { label: "Order of the silent subgroup", value: silentSubgroupOrder().toLocaleString(), layer: 8, method: "product of the factorials of the universal classes — silent in every position" },
    { label: "Order of the medial-only silent subgroup", value: medialSilentSubgroupOrder().toLocaleString(), layer: 8, method: "product of the factorials of the medial classes — silent medially, visible finally" },
    { label: "Rotation orbits of the eight feet", value: String(orbits.length), layer: 11, method: "rotate each binary word" },
    { label: "Triliteral root orbits", value: tri.orbits.toLocaleString(), layer: 9, method: "28 · 27 · 26 ÷ 6" },
    { label: "Quinqueliteral root orbits", value: quin.orbits.toLocaleString(), layer: 9, method: "28 · 27 · 26 · 25 · 24 ÷ 120" },
    { label: "Closed set is a union of whole classes", value: String(closedIsUnionOfClasses()), layer: 14, method: "compare the union against the closed set" },
    { label: "The unmoved sub-alphabet", value: UNMOVED.join(" "), layer: 15, method: "take the singleton classes" },
  ];
}

export const layer20: Layer = makeLayer({
  id: 20,
  slug: "invariance",
  band: 5,
  name: { en: "Invariance", ar: "الثابت" },
  statement: "What survives all nineteen. The fixed point of the architecture.",
  observables: [
    observable<number>({
      id: "length",
      layer: 20,
      label: { en: "Length", ar: "الطول" },
      discards: "everything but the count",
      compute: (w) => w.letters.length,
      serialize: String,
      display: (v) => `${v} letters`,
      cost: (w) => perLetter(w),
    }),
  ],
  transforms: [],
  notes: () => [
    `Length is invariant under every transformation in the architecture — the one row of the table that never changes.`,
    `The invariants are derivable rather than transmitted. A person handed nothing but the twenty-eight letters could rebuild every layer above from scratch, with a hand, a surface, a mouth and attention.`,
    `That is a stronger claim than durability. A durable thing survives because it was protected; this survives because losing it does not matter.`,
  ],
});

export const band5Layers = [layer16, layer17, layer18, layer19, layer20];

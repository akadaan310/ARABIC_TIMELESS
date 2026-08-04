/**
 * Band I — The Alphabet Alone (Layers 1–3), plus Layer 0.
 *
 * spec/01-stroke.md, spec/02-face.md, spec/03-order.md
 */

import {
  MOTION, STROKES, PRESENTATION, HIJAI, ABJADI, HIJAI_INDEX, ABJADI_INDEX,
  ALPHABET_SIZE, CLASSES_MEDIAL, CLOSED, valence, isClosed,
} from "../alphabet";
import type { Layer, Word } from "../types";
import { cost } from "../types";
import { makeLayer, observable, transform, perLetter, free } from "./helpers";
import { wordFromLetters } from "../text";

// ---------------------------------------------------------------------------
// Layer 0 — The Inherited
// ---------------------------------------------------------------------------

export const layer0: Layer = makeLayer({
  id: 0,
  slug: "inherited",
  band: 0,
  name: { en: "The Inherited", ar: "الطبقة الموروثة" },
  statement:
    "Everything today's definition contains, compressed to one layer. The floor of the building, not the building.",
  observables: [
    observable<number>({
      id: "classCount",
      layer: 0,
      label: { en: "Shape classes", ar: "عدد الرسوم" },
      discards: "which letters fall in which class",
      compute: () => Object.keys(CLASSES_MEDIAL).length,
      serialize: String,
      display: (v) => `${v} classes over ${ALPHABET_SIZE} letters`,
      cost: () => free,
    }),
  ],
  transforms: [],
  notes: () => [
    `${ALPHABET_SIZE} letters collapse onto ${Object.keys(CLASSES_MEDIAL).length} shape classes in medial position.`,
    `${CLOSED.size} letters refuse a leftward connection: ${[...CLOSED].join(" ")}`,
  ],
});

// ---------------------------------------------------------------------------
// Layer 1 — The Stroke
// ---------------------------------------------------------------------------

const strokeCount = (word: Word) =>
  word.letters.reduce((a, l) => a + (MOTION[l]?.strokes.length ?? 0), 0);

const liftCount = (word: Word) =>
  word.letters.reduce((a, l) => a + (MOTION[l]?.lifts ?? 0), 0);

const dotCount = (word: Word) =>
  word.letters.reduce((a, l) => a + (MOTION[l]?.dots ?? 0), 0);

export const layer1: Layer = makeLayer({
  id: 1,
  slug: "stroke",
  band: 1,
  name: { en: "The Stroke", ar: "الحرف كحركة" },
  statement: "A letter is not a shape. It is a recorded gesture. The shape is residue.",
  observables: [
    observable<number>({
      id: "strokeCount",
      layer: 1,
      label: { en: "Stroke number", ar: "عدد الحركات" },
      discards: "which strokes — keeps only how many",
      compute: strokeCount,
      serialize: String,
      display: (v) => `${v} atomic strokes`,
      cost: (w) => perLetter(w),
    }),
    observable<number>({
      id: "liftCount",
      layer: 1,
      label: { en: "Lift number", ar: "عدد الرفعات" },
      discards: "where the hand lifted — keeps only how often",
      compute: liftCount,
      serialize: String,
      display: (v) => `${v} pen-lifts`,
      cost: (w) => perLetter(w),
    }),
    observable<number>({
      id: "dotCount",
      layer: 1,
      label: { en: "Marks added", ar: "عدد النقط" },
      discards: "which letters carry the dots",
      compute: dotCount,
      serialize: String,
      display: (v) => `${v} i'jām dots — added, not drawn`,
      cost: (w) => perLetter(w),
    }),
  ],
  transforms: [],
  notes: (word) => {
    const s = strokeCount(word);
    const l = liftCount(word);
    const d = dotCount(word);
    return [
      `The skeleton of this word is ${s} strokes and ${l} lifts — two integers derived from motion alone, owing nothing to abjad.`,
      d > 0
        ? `${d} dots sit on top of that motion. They are marks, not strokes: erase them and the hand-path is unchanged.`
        : `This word carries no dots at all. Its written form and its skeleton are the same object.`,
    ];
  },
});

export const strokeInventory = STROKES;

// ---------------------------------------------------------------------------
// Layer 2 — The Face
// ---------------------------------------------------------------------------

/** The four faces of a letter, rendered from the Unicode presentation forms. */
export function facesOf(letter: string): { position: string; form: string | null; fed: [boolean, boolean] }[] {
  const p = PRESENTATION[letter];
  if (!p) return [];
  return [
    { position: "isolated", form: p[0], fed: [false, false] },
    { position: "final",    form: p[1], fed: [true, false] },
    { position: "initial",  form: p[2], fed: [false, true] },
    { position: "medial",   form: p[3], fed: [true, true] },
  ];
}

export const layer2: Layer = makeLayer({
  id: 2,
  slug: "face",
  band: 1,
  name: { en: "The Face", ar: "المقام" },
  statement: "A letter is not an atom. It is a function of its neighbours.",
  observables: [
    observable<number[]>({
      id: "valence",
      layer: 2,
      label: { en: "Valence vector", ar: "التكافؤ" },
      discards: "the shape — keeps only the connection count",
      compute: (w) => w.letters.map(valence),
      serialize: (v) => v.join(""),
      display: (v) => v.join(" · "),
      cost: (w) => perLetter(w),
    }),
    observable<string[]>({
      id: "faces",
      layer: 2,
      label: { en: "Faces", ar: "المقامات" },
      discards: "nothing — the face map is total",
      compute: (w) => w.glyphs.map((g) => g.position),
      serialize: (v) => v.join(","),
      display: (v) => v.join(" · "),
      cost: (w) => cost(0, w.letters.length * 2, 1),
    }),
  ],
  transforms: [],
  notes: (word) => {
    const closed = word.letters.filter(isClosed);
    return [
      `Each of the four faces is one row of a two-input truth table: right point fed or starved, left point fed or starved.`,
      closed.length > 0
        ? `${closed.length} closed ${closed.length === 1 ? "letter" : "letters"} here (${closed.join(" ")}) — each terminates a run and forces its neighbour's face.`
        : `No closed letters: every letter in this word connects on both sides, so the whole word is one unbroken run.`,
    ];
  },
});

// ---------------------------------------------------------------------------
// Layer 3 — The Order
// ---------------------------------------------------------------------------

export const hijaiAddress = (l: string) => (HIJAI_INDEX[l] ?? -1) + 1;
export const abjadiAddress = (l: string) => (ABJADI_INDEX[l] ?? -1) + 1;

/** Reflect position n to 29 − n. An involution with no fixed points. */
export const reflectLetter = (l: string): string => {
  const i = HIJAI_INDEX[l];
  return i === undefined ? l : HIJAI[ALPHABET_SIZE - 1 - i];
};

/** Step n places around the ring. */
export const shiftLetter = (l: string, k: number): string => {
  const i = HIJAI_INDEX[l];
  if (i === undefined) return l;
  return HIJAI[(((i + k) % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE];
};

/** The interval sequence — a word's shape in address space. */
export const intervals = (word: Word): number[] =>
  word.letters.slice(1).map((l, i) => hijaiAddress(l) - hijaiAddress(word.letters[i]));

/**
 * The abjadī↔hijāʾī permutation: cycle structure and order.
 * Computed, not tabulated — spec/03-order.md §3.1.
 */
export function orderPermutation() {
  const perm = ABJADI.map((c) => HIJAI_INDEX[c]);
  const seen = new Set<number>();
  const cycles: number[][] = [];
  for (let i = 0; i < ALPHABET_SIZE; i++) {
    if (seen.has(i)) continue;
    const cyc: number[] = [];
    let j = i;
    while (!seen.has(j)) {
      seen.add(j);
      cyc.push(j);
      j = perm[j];
    }
    cycles.push(cyc);
  }
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const order = cycles.reduce((acc, c) => (acc * c.length) / gcd(acc, c.length), 1);
  return {
    cycles,
    cycleLengths: cycles.map((c) => c.length).sort((a, b) => a - b),
    order,
    fixed: cycles.filter((c) => c.length === 1).map((c) => HIJAI[c[0]]),
  };
}

export const layer3: Layer = makeLayer({
  id: 3,
  slug: "order",
  band: 1,
  name: { en: "The Order", ar: "الترتيب" },
  statement: "The alphabet is not a bag. It is an addressable ring.",
  observables: [
    observable<number[]>({
      id: "hijaiAddresses",
      layer: 3,
      label: { en: "Addresses (hijāʾī)", ar: "المواقع الهجائية" },
      discards: "nothing — addressing is a bijection",
      compute: (w) => w.letters.map(hijaiAddress),
      serialize: (v) => v.join(","),
      display: (v) => v.join(" · "),
      cost: (w) => perLetter(w),
    }),
    observable<number[]>({
      id: "intervals",
      layer: 3,
      label: { en: "Interval sequence", ar: "المسافات" },
      discards: "one letter's worth — give any single letter back and the word returns",
      compute: intervals,
      serialize: (v) => v.join(","),
      display: (v) => (v.length ? v.map((n) => (n > 0 ? `+${n}` : `${n}`)).join(" ") : "—"),
      cost: (w) => perLetter(w, 2),
    }),
  ],
  transforms: [
    transform({
      id: "reflect",
      layer: 3,
      label: { en: "Reflect", ar: "الانعكاس" },
      invertible: true,
      apply: (w) => wordFromLetters(w.letters.map(reflectLetter)),
      cost: (w) => perLetter(w),
    }),
    transform({
      id: "shift1",
      layer: 3,
      label: { en: "Shift by one", ar: "الإزاحة" },
      invertible: true,
      apply: (w) => wordFromLetters(w.letters.map((l) => shiftLetter(l, 1))),
      cost: (w) => perLetter(w),
    }),
  ],
  notes: () => {
    const p = orderPermutation();
    return [
      `Every letter carries two addresses — one in each canonical order — so the alphabet is a 28-point set in a two-dimensional space.`,
      `The permutation between the orders has cycle type (${p.cycleLengths.join(", ")}) and order ${p.order}: apply it ${p.order} times and every letter is home. It fixes only ${p.fixed.join(" and ")}.`,
      `Reflection sends n to ${ALPHABET_SIZE + 1} − n. It is an involution, and because ${ALPHABET_SIZE} is even it has no fixed points at all.`,
    ];
  },
});

export const band1Layers = [layer0, layer1, layer2, layer3];

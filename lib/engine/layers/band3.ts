/**
 * Band III — Transformation (Layers 8–11).
 *
 * spec/08-substitution.md, spec/09-permutation.md, spec/10-weight.md, spec/11-pulse.md
 */

import {
  ABJAD_VALUE, CLASSES_MEDIAL, CLASSES_UNIVERSAL, CLASS_OF, ALPHABET_SIZE,
  SHORT_VOWELS, TANWIN, SUKUN, SHADDA, LONG_VOWELS,
} from "../alphabet";
import type { Layer, Word } from "../types";
import { cost } from "../types";
import { makeLayer, observable, transform, perLetter, free, shuffled } from "./helpers";
import { wordFromLetters } from "../text";
import { shiftLetter } from "./band1";

// ---------------------------------------------------------------------------
// Layer 8 — Substitution
// ---------------------------------------------------------------------------

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

const orderOf = (classes: Record<string, string[]>) =>
  Object.values(classes).reduce((acc, c) => acc * factorial(c.length), 1);

/**
 * The subgroup that preserves the skeleton in MEDIAL position: the direct
 * product of the symmetric groups on the medial classes. 92,160.
 */
export function medialSilentSubgroupOrder(): number {
  return orderOf(CLASSES_MEDIAL);
}

/**
 * The subgroup that is silent in EVERY position — the one that genuinely
 * leaves the page unchanged. 4,608.
 *
 * Because ن and ي leave the tooth in final and isolated position, a
 * substitution swapping ب↔ن is silent medially and visible finally. The
 * universally silent classes are the common refinement, so this subgroup is
 * strictly smaller than the medial one. Silence is position-dependent, and
 * the engine found that before the prose did.
 */
export function silentSubgroupOrder(): number {
  return orderOf(CLASSES_UNIVERSAL);
}

/** The number of ways to pick one letter from each medial class — a different question. */
export function oneFromEachClass(): number {
  return Object.values(CLASSES_MEDIAL).reduce((acc, c) => acc * c.length, 1);
}

/**
 * A random substitution drawn from the universally silent subgroup — it
 * permutes letters within classes that hold in every position, so the
 * skeleton is preserved wherever the letter falls.
 */
export function silentSubstitution(rng: () => number): Record<string, string> {
  const map: Record<string, string> = {};
  for (const members of Object.values(CLASSES_UNIVERSAL)) {
    const target = shuffled(members, rng);
    members.forEach((l, i) => { map[l] = target[i]; });
  }
  return map;
}

/** A substitution silent only in medial position — kept so the contrast is demonstrable. */
export function medialSilentSubstitution(rng: () => number): Record<string, string> {
  const map: Record<string, string> = {};
  for (const members of Object.values(CLASSES_MEDIAL)) {
    const target = shuffled(members, rng);
    members.forEach((l, i) => { map[l] = target[i]; });
  }
  return map;
}

export const layer8: Layer = makeLayer({
  id: 8,
  slug: "substitution",
  band: 3,
  name: { en: "Substitution", ar: "الإبدال" },
  statement: "Change which letters, keep the order.",
  observables: [],
  transforms: [
    transform({
      id: "silent",
      layer: 8,
      label: { en: "Silent substitution", ar: "الإبدال الصامت" },
      invertible: true,
      apply: (w, rng) => {
        const map = silentSubstitution(rng);
        return wordFromLetters(w.letters.map((l) => map[l] ?? l));
      },
      cost: (w) => perLetter(w),
    }),
    transform({
      id: "shift3",
      layer: 8,
      label: { en: "Shift by three", ar: "إزاحة ثلاثية" },
      invertible: true,
      apply: (w) => wordFromLetters(w.letters.map((l) => shiftLetter(l, 3))),
      cost: (w) => perLetter(w),
    }),
  ],
  notes: (word) => {
    const universal = silentSubgroupOrder();
    const medial = medialSilentSubgroupOrder();
    const local = word.letters.reduce(
      (a, l) => a * factorial((CLASSES_UNIVERSAL[Object.keys(CLASSES_UNIVERSAL).find((k) => CLASSES_UNIVERSAL[k].includes(l)) ?? ""] ?? [l]).length),
      1,
    );
    return [
      `The silent subgroup has order ${universal.toLocaleString()} — that many substitutions rewrite every text in the language and leave every page looking exactly as it did, in every position.`,
      `Silence is position-dependent. ${medial.toLocaleString()} substitutions preserve the skeleton in medial position, but ن and ي leave the tooth when they fall final, so a swap of ب↔ن is silent in the middle of a word and visible at its end. Only the common refinement is silent everywhere.`,
      local > 1
        ? `Restricted to this word's letters, ${local.toLocaleString()} silent substitutions leave its skeleton untouched.`
        : `Every letter here is alone in its universal class, so no silent substitution can move this word at all.`,
    ];
  },
});

// ---------------------------------------------------------------------------
// Layer 9 — Permutation
// ---------------------------------------------------------------------------

/** Root-space size: ordered roots and unordered orbits, for k distinct radicals. */
export function rootSpace(k: number): { ordered: number; orbits: number } {
  let ordered = 1;
  for (let i = 0; i < k; i++) ordered *= ALPHABET_SIZE - i;
  return { ordered, orbits: ordered / factorial(k) };
}

export const layer9: Layer = makeLayer({
  id: 9,
  slug: "permutation",
  band: 3,
  name: { en: "Permutation", ar: "التقليب" },
  statement: "Change the order, keep the letters. The exact orthogonal complement of Layer 8.",
  observables: [
    observable<string>({
      id: "multiset",
      layer: 9,
      label: { en: "Letter multiset", ar: "مجموعة الحروف" },
      discards: "order — keeps only which letters, and how many of each",
      compute: (w) => [...w.letters].sort().join(""),
      serialize: (v) => v,
      display: (v) => [...v].join(" "),
      cost: (w) => perLetter(w, 2),
    }),
  ],
  transforms: [
    transform({
      id: "permute",
      layer: 9,
      label: { en: "Permute", ar: "التقليب" },
      invertible: true,
      apply: (w, rng) => wordFromLetters(shuffled(w.letters, rng)),
      cost: (w) => cost(w.letters.length, w.letters.length, 2),
    }),
    transform({
      id: "reverse",
      layer: 9,
      label: { en: "Reverse", ar: "القلب" },
      invertible: true,
      apply: (w) => wordFromLetters([...w.letters].reverse()),
      cost: (w) => cost(w.letters.length, w.letters.length, 2),
    }),
  ],
  notes: (word) => {
    const n = word.letters.length;
    const distinct = new Set(word.letters).size;
    const tri = rootSpace(3);
    return [
      `Substitution changes which letters and keeps the order. Permutation changes the order and keeps the letters. Neither is derivable from the other, which is why both earn layers.`,
      `This word has ${n} positions and ${distinct} distinct letters — an orbit of at most ${factorial(n).toLocaleString()} orderings, of which the language uses very few. The sparsity is itself data.`,
      `The whole triliteral root space is ${tri.ordered.toLocaleString()} ordered roots, ${tri.orbits.toLocaleString()} orbits. Countable, and countable by hand.`,
    ];
  },
});

// ---------------------------------------------------------------------------
// Layer 10 — Weight
// ---------------------------------------------------------------------------

export const weightOf = (letters: string[]): number =>
  letters.reduce((a, l) => a + (ABJAD_VALUE[l] ?? 0), 0);

/** Collapse a value digit-wise to a single figure. */
export function reduceValue(n: number): number {
  while (n > 9) n = String(n).split("").reduce((a, d) => a + Number(d), 0);
  return n;
}

export const layer10: Layer = makeLayer({
  id: 10,
  slug: "weight",
  band: 3,
  name: { en: "Weight", ar: "الوزن العددي" },
  statement: "Every string carries a number; every number carries back to strings.",
  observables: [
    observable<number>({
      id: "weight",
      layer: 10,
      label: { en: "Weight", ar: "الوزن" },
      discards: "order — a sum does not care about it",
      compute: (w) => weightOf(w.letters),
      serialize: String,
      display: (v) => v.toLocaleString(),
      cost: (w) => perLetter(w),
    }),
    observable<number>({
      id: "reduction",
      layer: 10,
      label: { en: "Reduction", ar: "الرد" },
      discards: "all but the digit sum",
      compute: (w) => reduceValue(weightOf(w.letters)),
      serialize: String,
      display: String,
      cost: (w) => perLetter(w),
    }),
  ],
  transforms: [],
  notes: (word) => {
    const w = weightOf(word.letters);
    const parts = word.letters.map((l) => `${l} ${ABJAD_VALUE[l] ?? 0}`).join(" + ");
    return [
      `${parts} = ${w.toLocaleString()}`,
      `The abjad values separate exactly the letters the skeleton merges — ب is 2, ت is 400, ث is 500, ن is 50, ي is 10, and all five share the tooth. Weight recovers precisely what shape discards.`,
      `Weight is invariant under permutation, so it can never distinguish a word from its anagram. That blindness is exactly complementary to the skeleton's, which is why stacking the two multiplies.`,
    ];
  },
});

// ---------------------------------------------------------------------------
// Layer 11 — Pulse
// ---------------------------------------------------------------------------

export const FEET: { name: string; binary: string }[] = [
  { name: "فعولن",   binary: "11010" },
  { name: "فاعلن",   binary: "10110" },
  { name: "مفاعيلن", binary: "1101010" },
  { name: "مستفعلن", binary: "1010110" },
  { name: "فاعلاتن", binary: "1011010" },
  { name: "مفعولات", binary: "1010101" },
  { name: "متفاعلن", binary: "1110110" },
  { name: "مفاعلتن", binary: "1101110" },
];

const rotations = (s: string) => new Set([...s].map((_, i) => s.slice(i) + s.slice(0, i)));

/** Group the feet into rotation orbits — computed, not tabulated. */
export function footOrbits(): string[][] {
  const seen = new Set<string>();
  const orbits: string[][] = [];
  for (const f of FEET) {
    if (seen.has(f.name)) continue;
    const rots = rotations(f.binary);
    const fam = FEET.filter((g) => rots.has(g.binary)).map((g) => g.name);
    fam.forEach((n) => seen.add(n));
    orbits.push(fam);
  }
  return orbits;
}

/**
 * Scan a voweled word into its binary pulse.
 * Returns null when the input carries no tashkīl — the channel is genuinely
 * unavailable rather than empty, and the engine says so rather than guessing.
 */
export function scan(word: Word): string | null {
  if (!word.voweled) return null;
  let out = "";
  for (const g of word.glyphs) {
    const hasShadda = g.marks.includes(SHADDA);
    const vowel = g.marks.find((m) => SHORT_VOWELS.has(m));
    const tanwin = g.marks.find((m) => TANWIN.has(m));
    const hasSukun = g.marks.includes(SUKUN);

    if (hasShadda) out += "0";
    if (vowel) out += "1";
    else if (hasSukun) out += "0";
    else if (LONG_VOWELS.has(g.letter)) out += "0";
    else if (!tanwin) out += "1";
    if (tanwin) out += "10";
  }
  return out;
}

export const layer11: Layer = makeLayer({
  id: 11,
  slug: "pulse",
  band: 3,
  name: { en: "Pulse", ar: "النبض" },
  statement: "Every string carries a binary rhythm, separable from its letters.",
  observables: [
    observable<string | null>({
      id: "pulse",
      layer: 11,
      label: { en: "Pulse", ar: "النبض" },
      discards: "every letter — keeps only whether each position moves",
      compute: scan,
      serialize: (v) => v ?? "∅",
      display: (v) => v ?? "unavailable — the input carries no tashkīl",
      cost: (w) => perLetter(w),
    }),
  ],
  transforms: [],
  notes: (word) => {
    const orbits = footOrbits();
    const p = scan(word);
    const out = [
      `The eight feet fall into exactly ${orbits.length} rotation orbits: ${orbits.map((o) => o.join(" ↔ ")).join(" | ")}. The metres are orbits of a cyclic group, not a list that was compiled.`,
    ];
    out.push(
      p
        ? `This word scans to ${p} — ${[...p].filter((c) => c === "1").length} moving, ${[...p].filter((c) => c === "0").length} still.`
        : `No tashkīl in the input, so the pulse cannot be read. The skeleton omits vowels entirely, which is exactly why this channel is independent of every other one — and why it goes silent when the vowels do.`,
    );
    return out;
  },
});

export const band3Layers = [layer8, layer9, layer10, layer11];

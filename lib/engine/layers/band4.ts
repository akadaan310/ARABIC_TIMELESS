/**
 * Band IV — Structure (Layers 12–15).
 *
 * spec/12-root.md, spec/13-pattern.md, spec/14-composition.md, spec/15-symmetry.md
 *
 * Layer 14's invariance table is computed in ../invariance.ts, which runs
 * every registered transform against every registered observable. It lives
 * there rather than here so that adding a layer extends the table without
 * touching this file.
 */

import { UNMOVED, CLASS_OF, LONG_VOWELS } from "../alphabet";
import type { Layer, Word } from "../types";
import { cost } from "../types";
import { makeLayer, observable, perLetter, free } from "./helpers";
import { candidateRoots, abstractWord, fibre } from "../patterns";
import { getLexicon } from "../lexicon";
import { closedIsUnionOfClasses } from "./band2";

// ---------------------------------------------------------------------------
// Layer 12 — Root
// ---------------------------------------------------------------------------

/** Roots this word could be built on, best-known first. */
export function rootsOf(word: Word): { root: string[]; known: boolean }[] {
  const lex = getLexicon();
  return candidateRoots(word.letters)
    .map((root) => ({ root, known: lex.hasRoot(root) }))
    .sort((a, b) => Number(b.known) - Number(a.known));
}

/** The bare consonantal residue — the inner skeleton, with long vowels stripped. */
export const consonantalResidue = (word: Word): string[] =>
  word.letters.filter((l) => !LONG_VOWELS.has(l));

export const layer12: Layer = makeLayer({
  id: 12,
  slug: "root",
  band: 4,
  name: { en: "Root", ar: "الجذر" },
  statement: "The consonantal invariant under vocalic change.",
  observables: [
    observable<string>({
      id: "residue",
      layer: 12,
      label: { en: "Consonantal residue", ar: "البقية الصامتة" },
      discards: "the long vowels the written skeleton still shows",
      compute: (w) => consonantalResidue(w).join(""),
      serialize: (v) => v,
      display: (v) => [...v].join(" ") || "—",
      cost: (w) => perLetter(w, 3),
    }),
  ],
  transforms: [],
  notes: (word) => {
    const roots = rootsOf(word);
    const known = roots.filter((r) => r.known);
    const out = [
      `There are two skeletons here, one inside the other. The written skeleton still shows the long vowels; the root does not. Different erasures, different invariants.`,
    ];
    if (roots.length === 0) {
      out.push(`No pattern in the library aligns to this word, so no root can be extracted from its shape alone.`);
    } else if (known.length > 0) {
      out.push(
        `${known.length} of ${roots.length} candidate ${roots.length === 1 ? "root is" : "roots are"} in the lexicon: ${known.map((r) => r.root.join("–")).join(", ")}.`,
      );
    } else {
      out.push(
        `${roots.length} candidate ${roots.length === 1 ? "root" : "roots"} by alignment (${roots.slice(0, 4).map((r) => r.root.join("–")).join(", ")}), none of them in the seed lexicon — which narrows nothing and declares nothing.`,
      );
    }
    return out;
  },
});

// ---------------------------------------------------------------------------
// Layer 13 — Pattern
// ---------------------------------------------------------------------------

export const layer13: Layer = makeLayer({
  id: 13,
  slug: "pattern",
  band: 4,
  name: { en: "Pattern", ar: "القالب" },
  statement: "A pattern is a function from root to word.",
  observables: [
    observable<number>({
      id: "alignments",
      layer: 13,
      label: { en: "Alignments", ar: "المطابقات" },
      discards: "which patterns — keeps only how many align",
      compute: (w) => abstractWord(w.letters).length,
      serialize: String,
      display: (v) => `${v} ${v === 1 ? "pattern aligns" : "patterns align"}`,
      cost: (w) => perLetter(w, 4),
    }),
  ],
  transforms: [],
  notes: (word) => {
    const aligns = abstractWord(word.letters);
    if (aligns.length === 0) {
      return [
        `No pattern in the library aligns to this word. That is a real finding: a word that fits no pattern is either outside the library's coverage or structurally broken.`,
      ];
    }
    const first = aligns[0];
    const family = fibre(first.root).slice(0, 6);
    return [
      `Abstraction recovers the function from the output: ${aligns.map((a) => a.pattern.name).slice(0, 5).join("، ")}${aligns.length > 5 ? " …" : ""}.`,
      `Reading ${first.pattern.name} against root ${first.root.join("–")} — ${first.pattern.meaning}.`,
      `One root, many patterns: ${family.map((f) => f.word).join("، ")} — the pattern's meaning holds across every argument it accepts, which is what makes it a function rather than a habit.`,
    ];
  },
});

// ---------------------------------------------------------------------------
// Layer 14 — Composition
// ---------------------------------------------------------------------------

export const layer14: Layer = makeLayer({
  id: 14,
  slug: "composition",
  band: 4,
  name: { en: "Composition", ar: "التركيب" },
  statement: "Which operations commute, and which do not.",
  observables: [],
  transforms: [],
  notes: () => [
    `The invariance table is computed by running every registered transform against every registered observable. Add a layer and the table extends itself.`,
    closedIsUnionOfClasses()
      ? `Derived theorem, verified: the six closed letters form a union of complete shape classes. A silent substitution permutes within classes, so it can never move a letter from open to closed — which is why the profile survives every skeleton-preserving substitution.`
      : `The closed set is NOT a union of complete shape classes — the profile's invariance under silent substitution does not hold.`,
    `Stack filters whose invariance rows differ; skip filters whose rows match. That is the rule the reading procedure's ordering rests on.`,
  ],
});

// ---------------------------------------------------------------------------
// Layer 15 — Symmetry
// ---------------------------------------------------------------------------

export const isPalindrome = (letters: string[]): boolean =>
  letters.length > 1 && letters.every((l, i) => l === letters[letters.length - 1 - i]);

/** True when every letter is alone in its shape class — Layer 15's unmoved alphabet. */
export const isUnmovable = (word: Word): boolean =>
  word.letters.length > 0 && word.letters.every((l) => (CLASS_OF[l]?.length ?? 1) === 1);

export const layer15: Layer = makeLayer({
  id: 15,
  slug: "symmetry",
  band: 4,
  name: { en: "Symmetry", ar: "التناظر" },
  statement: "Fixed points under every transformation defined above.",
  observables: [
    observable<string>({
      id: "fixedUnder",
      layer: 15,
      label: { en: "Fixed under", ar: "الثابت تحت" },
      discards: "nothing — this is a test, not a projection",
      compute: (w) => {
        const f: string[] = [];
        if (isPalindrome(w.letters)) f.push("reversal");
        if (isUnmovable(w)) f.push("silent substitution");
        return f.join(", ") || "none";
      },
      serialize: (v) => v,
      display: (v) => v,
      cost: (w) => perLetter(w, 2),
    }),
  ],
  transforms: [],
  notes: (word) => {
    const out: string[] = [];
    if (isPalindrome(word.letters)) {
      out.push(`This word is a palindrome — fixed under reversal, and therefore immune to transposition as a damage mode. It carries its own check: read it backward and compare.`);
    }
    if (isUnmovable(word)) {
      out.push(`Every letter here is drawn from ${UNMOVED.join(" ")} — the six alone in their classes. This word is fixed under the entire silent subgroup, so its skeleton determines it completely.`);
    }
    if (out.length === 0) {
      out.push(`This word is fixed under none of the transformations above, so it moves under all of them. Symmetry is redundancy that costs nothing to store, and this word has none of it.`);
    }
    out.push(`The six unmoved letters are ${UNMOVED.join(" ")} — a sub-alphabet in which the dotless script carries no ambiguity at all.`);
    return out;
  },
});

export const band4Layers = [layer12, layer13, layer14, layer15];

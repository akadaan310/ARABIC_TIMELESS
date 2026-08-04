/**
 * Passage operations — the SDK over the dotless kernel.
 *
 * Each operation rewrites or reads a whole composition, and most of them hand
 * back **readable Arabic**: the same passage seen through one transformation.
 * That is the point. An operation that returned a table would be analysis; an
 * operation that returns Arabic is the language doing something to itself.
 *
 * Every operation also reports what it *preserved*, because that is the part
 * Layer 14 makes interesting — an operation is characterised as much by its
 * invariants as by its effect.
 *
 * All of this is pure and runs on an already-resolved passage, so it is
 * instant and works offline.
 */

import type { Passage, PassageWord } from "./passage";
import { render } from "./passage";
import { parseWord, degree, profileOf } from "./text";
import { weightOf } from "./layers/band3";
import { PATTERNS, PATTERN_BY_ID, applyPattern, type Pattern } from "./patterns";
import { CLASSES_UNIVERSAL, ALPHABET_SIZE, HIJAI, HIJAI_INDEX } from "./alphabet";
import { mulberry32, shuffled } from "./layers/helpers";

export type Scope = "letter" | "word" | "sentence" | "passage";
export type Kind = "reduce" | "rewrite" | "reveal";

export interface WordChange {
  from: string;
  to: string;
  changed: boolean;
  /** why this word came out the way it did */
  note?: string;
  /** true when the operation had no data for this word and left it alone */
  unresolved?: boolean;
}

export interface OpResult {
  id: string;
  /** the rendered Arabic, when the operation produces Arabic */
  text: string;
  changes: WordChange[];
  summary: string;
  /** what the operation left untouched */
  preserved: string[];
  /** what it destroyed */
  lost: string[];
  /** how many words the operation could actually act on */
  coverage: { acted: number; total: number };
}

export interface Operation {
  id: string;
  name: { en: string; ar: string };
  scope: Scope;
  kind: Kind;
  /** does the output read as Arabic? */
  readable: boolean;
  /** which layer of the kernel this operation is the passage-level form of */
  layer: number;
  note: string;
  /** options this operation accepts, if any */
  options?: { id: string; label: string; values: { id: string; label: string }[] };
  apply(p: Passage, option?: string): OpResult;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const result = (
  id: string,
  changes: WordChange[],
  summary: string,
  preserved: string[],
  lost: string[],
): OpResult => ({
  id,
  text: changes.map((c) => c.to).filter(Boolean).join(" "),
  changes,
  summary,
  preserved,
  lost,
  coverage: { acted: changes.filter((c) => c.changed).length, total: changes.length },
});

const keep = (w: PassageWord, note?: string): WordChange => ({
  from: w.norm,
  to: w.norm,
  changed: false,
  unresolved: true,
  note,
});

// ---------------------------------------------------------------------------
// A — reductions
// ---------------------------------------------------------------------------

const toRoots: Operation = {
  id: "roots",
  name: { en: "To roots", ar: "إلى الجذور" },
  scope: "passage",
  kind: "reduce",
  readable: true,
  layer: 12,
  note: "Replace every word with the root beneath it. What is left is the passage's meaning-skeleton — still Arabic, and radically shorter.",
  apply(p) {
    const changes = p.words.map((w) =>
      w.lex?.rootDisplay
        ? { from: w.norm, to: w.lex.rootDisplay, changed: true, note: w.lex.rootGlosses?.[0] }
        : keep(w, "no root in the lexicon"),
    );
    const roots = new Set(changes.filter((c) => c.changed).map((c) => c.to));
    return result(
      "roots",
      changes,
      `${p.words.length} words reduce to ${roots.size} distinct roots. Everything inflection was carrying is gone; everything the passage is *about* survives.`,
      ["the semantic core", "word order"],
      ["inflection", "pattern", "person, number, case"],
    );
  },
};

const toLemmas: Operation = {
  id: "lemmas",
  name: { en: "To dictionary forms", ar: "إلى المفردات" },
  scope: "word",
  kind: "reduce",
  readable: true,
  layer: 13,
  note: "Every word in the form a dictionary would list it under — one step less abstract than the root.",
  apply(p) {
    const changes = p.words.map((w) =>
      w.lex?.lemmaDisplay
        ? { from: w.norm, to: w.lex.lemmaDisplay, changed: w.lex.lemmaDisplay !== w.norm, note: w.lex.gloss }
        : keep(w, "unresolved"),
    );
    return result(
      "lemmas",
      changes,
      `The passage in citation form. Case, mood and attached particles fall away; the choice of pattern stays, which is what separates this from the root reduction.`,
      ["pattern", "lexical identity"],
      ["case", "mood", "clitics"],
    );
  },
};

const toSkeleton: Operation = {
  id: "skeleton",
  name: { en: "To the rasm", ar: "إلى الرسم" },
  scope: "letter",
  kind: "reduce",
  readable: true,
  layer: 4,
  note: "The passage as the earliest manuscripts carry it — every distinguishing dot removed.",
  apply(p) {
    const changes = p.words.map((w) => ({
      from: w.norm,
      to: w.skeleton,
      changed: w.skeleton !== w.norm,
      note: w.degree > 1 ? `${w.degree} readings` : "determined",
    }));
    const bits = p.stats.bits;
    return result(
      "skeleton",
      changes,
      `Written this way the passage is 2^${bits.toFixed(1)} different passages at once — ${bits.toFixed(1)} bits the page declines to store, and reconstructs by computation.`,
      ["the letters' shapes", "word length", "segment profile"],
      ["which letter each tooth is"],
    );
  },
};

// ---------------------------------------------------------------------------
// B — re-patterning: same roots, a different function applied
// ---------------------------------------------------------------------------

const REPATTERN_CHOICES = [
  "agent", "patient", "place", "placeFem", "instrument", "quality",
  "masdarII", "masdarX", "X", "II", "V", "VII", "pluralA",
];

const rePattern: Operation = {
  id: "repattern",
  name: { en: "Re-pattern", ar: "إعادة القولبة" },
  scope: "passage",
  kind: "rewrite",
  readable: true,
  layer: 13,
  note: "Keep every root and put all of them through one pattern. A passage of agents, or of places, or of requests — built from exactly the same material.",
  options: {
    id: "pattern",
    label: "pattern",
    values: REPATTERN_CHOICES.map((id) => ({
      id,
      label: `${PATTERN_BY_ID[id]?.name ?? id} — ${PATTERN_BY_ID[id]?.meaning ?? ""}`,
    })),
  },
  apply(p, option = "agent") {
    const pat: Pattern = PATTERN_BY_ID[option] ?? PATTERN_BY_ID.agent;
    const changes = p.words.map((w) => {
      const root = w.lex?.root;
      if (!root || root.length < 3) return keep(w, "needs a three-radical root");
      const built = applyPattern(pat, [...root].slice(0, 3));
      return {
        from: w.norm,
        to: built,
        changed: built !== w.norm,
        note: w.lex?.rootGlosses?.[0],
      };
    });
    return result(
      "repattern",
      changes,
      `Every root put through ${pat.name} — ${pat.meaning}. One function applied across a whole passage, and the output is still Arabic. This is the clearest thing the language does that a written script is not supposed to be able to do.`,
      ["the roots", "word order", "word count"],
      ["the original patterns", "meaning as written"],
    );
  },
};

// ---------------------------------------------------------------------------
// C — substitutions: the page changes, or conspicuously does not
// ---------------------------------------------------------------------------

const silentSwap: Operation = {
  id: "silent",
  name: { en: "Silent substitution", ar: "الإبدال الصامت" },
  scope: "letter",
  kind: "rewrite",
  readable: true,
  layer: 8,
  note: "Swap every letter for another with the same skeletal shape. The words all change and the page does not.",
  apply(p) {
    const rng = mulberry32(0x5eed);
    const map: Record<string, string> = {};
    for (const members of Object.values(CLASSES_UNIVERSAL)) {
      const target = shuffled(members, rng);
      members.forEach((l, i) => { map[l] = target[i]; });
    }
    const changes = p.words.map((w) => {
      const to = [...w.norm].map((l) => map[l] ?? l).join("");
      return { from: w.norm, to, changed: to !== w.norm, note: parseWord(to).skeleton };
    });
    const before = p.words.map((w) => w.skeleton).join(" ");
    const after = changes.map((c) => parseWord(c.to).skeleton).join(" ");
    const identical = before === after;
    return result(
      "silent",
      changes,
      identical
        ? `Every letter replaced, and the skeleton of the passage is byte-for-byte what it was. A reader with only the page in front of them cannot detect that this happened — the weight, however, moved from ${p.stats.weight.toLocaleString()} to ${changes.reduce((a, c) => a + weightOf([...c.to]), 0).toLocaleString()}.`
        : `The skeleton shifted, which means the substitution left the universally silent subgroup somewhere in this passage.`,
      ["the skeleton", "the segment profile", "word lengths"],
      ["every word's identity", "the weight"],
    );
  },
};

const sameSkeletonSwap: Operation = {
  id: "sameSkeleton",
  name: { en: "Same skeleton, other words", ar: "الجناس الخطي" },
  scope: "word",
  kind: "rewrite",
  readable: true,
  layer: 5,
  note: "Replace each word with a different real word the page cannot tell apart from it. The rasm is unchanged; the passage says something else.",
  apply(p) {
    const changes = p.words.map((w) => {
      const alts = (w.sameSkeleton ?? []).filter((a) => a !== w.norm);
      if (alts.length === 0) return keep(w, "nothing else in the corpus shares its skeleton");
      const pick = alts[0];
      return { from: w.norm, to: pick, changed: true, note: `both written ${w.skeleton}` };
    });
    const acted = changes.filter((c) => c.changed).length;
    return result(
      "sameSkeleton",
      changes,
      `${acted} of ${p.words.length} words swapped for a different real word with an identical skeleton. Undot the result and it is indistinguishable from the original — which is what the candidate set means when it is populated with words that actually exist.`,
      ["the skeleton", "the profile"],
      ["the meaning", "the weight"],
    );
  },
};

const sameWeightSwap: Operation = {
  id: "sameWeight",
  name: { en: "Same weight, other words", ar: "التعادل العددي" },
  scope: "word",
  kind: "rewrite",
  readable: true,
  layer: 10,
  note: "Replace each word with a different real word of identical abjad value. The passage changes completely and its total does not move at all.",
  apply(p) {
    const changes = p.words.map((w) => {
      const alts = (w.sameWeight ?? []).filter((a) => a !== w.norm);
      if (alts.length === 0) return keep(w, `nothing else in the corpus weighs ${w.weight}`);
      return { from: w.norm, to: alts[0], changed: true, note: `both weigh ${w.weight.toLocaleString()}` };
    });
    const after = changes.reduce((a, c) => a + weightOf([...c.to]), 0);
    return result(
      "sameWeight",
      changes,
      `Total before ${p.stats.weight.toLocaleString()}, total after ${after.toLocaleString()}${
        after === p.stats.weight ? " — exactly preserved" : ""
      }. Every word that could be exchanged was, and the number the passage adds up to did not move.`,
      ["the abjad total", "word count"],
      ["the skeleton", "the meaning"],
    );
  },
};

// ---------------------------------------------------------------------------
// D — reorderings
// ---------------------------------------------------------------------------

const taqlibOp: Operation = {
  id: "taqlib",
  name: { en: "Permute the radicals", ar: "التقليب" },
  scope: "word",
  kind: "rewrite",
  readable: true,
  layer: 9,
  note: "Reorder each root's letters and keep the orderings that are themselves real roots. Al-Khalīl's method, applied to a whole passage.",
  apply(p) {
    const changes = p.words.map((w) => {
      const opts = w.taqlib ?? [];
      if (opts.length === 0) return keep(w, "no permutation of its root is used");
      const t = opts[0];
      return { from: w.norm, to: t.root, changed: true, note: t.glosses[0] };
    });
    const acted = changes.filter((c) => c.changed).length;
    return result(
      "taqlib",
      changes,
      `${acted} words landed on a different root that the language actually uses. The rest fell into the neglected part of the space — and which orderings are used and which are not is itself the data.`,
      ["the letters of each root", "word count"],
      ["the order of the radicals", "the meaning"],
    );
  },
};

const reverseOp: Operation = {
  id: "reverse",
  name: { en: "Reverse each word", ar: "القلب" },
  scope: "word",
  kind: "rewrite",
  readable: true,
  layer: 9,
  note: "Read every word backward. Weight survives untouched; the skeleton does not.",
  apply(p) {
    const changes = p.words.map((w) => {
      const to = [...w.norm].reverse().join("");
      return {
        from: w.norm,
        to,
        changed: to !== w.norm,
        note: to === w.norm ? "palindrome — fixed" : undefined,
      };
    });
    const pal = changes.filter((c) => !c.changed).length;
    return result(
      "reverse",
      changes,
      `Weight is invariant under this — a sum does not care about order, so the passage still totals ${p.stats.weight.toLocaleString()}. The profile is not invariant, and ${pal} ${pal === 1 ? "word is" : "words are"} palindromes the operation could not move at all.`,
      ["the weight", "the letter multiset", "word lengths"],
      ["the skeleton", "the profile", "readability"],
    );
  },
};

const shiftOp: Operation = {
  id: "shift",
  name: { en: "Shift the alphabet", ar: "الإزاحة" },
  scope: "letter",
  kind: "rewrite",
  readable: false,
  layer: 3,
  note: "Move every letter n places around the ring. The interval structure survives exactly — the passage transposes the way music does.",
  options: {
    id: "k",
    label: "places",
    values: [1, 2, 3, 7, 14].map((n) => ({ id: String(n), label: `+${n}` })),
  },
  apply(p, option = "1") {
    const k = Number(option) || 1;
    const shift = (l: string) => {
      const i = HIJAI_INDEX[l];
      return i === undefined ? l : HIJAI[(i + k) % ALPHABET_SIZE];
    };
    const changes = p.words.map((w) => ({
      from: w.norm,
      to: [...w.norm].map(shift).join(""),
      changed: true,
    }));
    return result(
      "shift",
      changes,
      `Every letter moved ${k} ${k === 1 ? "place" : "places"} around a 28-point ring. The interval sequence of every word is untouched, which is why this is transposition rather than encryption — the shape in address space is identical, only the starting point moved.`,
      ["the interval sequence", "word lengths"],
      ["readability", "the skeleton", "the weight"],
    );
  },
};

// ---------------------------------------------------------------------------
// E — reveals
// ---------------------------------------------------------------------------

const glossOp: Operation = {
  id: "gloss",
  name: { en: "Interlinear", ar: "الترجمة" },
  scope: "word",
  kind: "reveal",
  readable: false,
  layer: 6,
  note: "What each word is, word by word, from the corpus.",
  apply(p) {
    const changes = p.words.map((w) =>
      w.lex?.gloss
        ? { from: w.norm, to: w.lex.gloss, changed: true, note: w.lex.rootDisplay }
        : keep(w, "unresolved"),
    );
    return result(
      "gloss",
      changes,
      `${p.stats.resolved} of ${p.words.length} words carry a gloss from the corpus. The rest are outside its coverage, and the engine says so rather than guessing.`,
      ["everything — this reads, it does not rewrite"],
      [],
    );
  },
};

const openness: Operation = {
  id: "openness",
  name: { en: "Openness map", ar: "خريطة الفراغ" },
  scope: "passage",
  kind: "reveal",
  readable: false,
  layer: 4,
  note: "How many readings each word's skeleton admits, and which words the skeleton pins down absolutely.",
  apply(p) {
    const changes = p.words.map((w) => ({
      from: w.norm,
      to: String(w.degree),
      changed: true,
      note: w.degree === 1 ? "determined" : `${w.arity} open`,
    }));
    return result(
      "openness",
      changes,
      `${p.stats.determined} of ${p.words.length} words are fully determined by their skeleton alone. The passage as a whole carries ${p.stats.bits.toFixed(1)} bits of openness — the widest word admits ${Math.max(...p.words.map((w) => w.degree)).toLocaleString()} readings by itself.`,
      ["everything"],
      [],
    );
  },
};

const weightMap: Operation = {
  id: "weightmap",
  name: { en: "Weight map", ar: "خريطة الوزن" },
  scope: "sentence",
  kind: "reveal",
  readable: false,
  layer: 10,
  note: "The number under every word, and what each sentence adds to.",
  apply(p) {
    const changes = p.words.map((w) => ({
      from: w.norm,
      to: w.weight.toLocaleString(),
      changed: true,
    }));
    const per = p.sentences.map((s) => s.weight);
    return result(
      "weightmap",
      changes,
      `The passage totals ${p.stats.weight.toLocaleString()}${
        per.length > 1 ? `, across sentences of ${per.map((n) => n.toLocaleString()).join(", ")}` : ""
      }. None of this is written anywhere on the page, and all of it is fully determined by what is.`,
      ["everything"],
      [],
    );
  },
};

// ---------------------------------------------------------------------------

export const OPERATIONS: Operation[] = [
  toSkeleton, toRoots, toLemmas,
  rePattern,
  sameSkeletonSwap, sameWeightSwap, silentSwap,
  taqlibOp, reverseOp, shiftOp,
  glossOp, openness, weightMap,
];

export const OP_BY_ID: Record<string, Operation> = Object.fromEntries(
  OPERATIONS.map((o) => [o.id, o]),
);

export const OP_GROUPS: { kind: Kind; label: string; ar: string; note: string }[] = [
  { kind: "reduce", label: "Reduce", ar: "التجريد", note: "strip the passage to something underneath it" },
  { kind: "rewrite", label: "Rewrite", ar: "التحويل", note: "the same passage, transformed — still Arabic" },
  { kind: "reveal", label: "Reveal", ar: "الكشف", note: "read what the page does not show" },
];

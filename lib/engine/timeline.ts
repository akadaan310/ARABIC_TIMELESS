/**
 * Time travel — movement along the marking timeline.
 *
 * Surah Al-Kahf is the sura of time: sleepers who wake after three centuries,
 * and a journey in which consequences are seen before they occur. The
 * computational content is again exact, and it is Layer 5's lattice.
 *
 * A written word has a history. It began as a bare skeleton and acquired its
 * marks — i'jām first, then tashkīl. Travelling backward strips them and the
 * word becomes a superposition of everything it could still turn out to be.
 * Travelling forward binds them and one future is selected.
 *
 * Seeing the candidate set is seeing the futures before one of them happens.
 */

import type { Word } from "./types";
import { parseWord, expand, degree, stripMarks } from "./text";
import { TASHKIL, skeletonOf } from "./alphabet";

export type Era = 0 | 1 | 2 | 3;

export interface Stop {
  era: Era;
  label: string;
  ar: string;
  /** what a reader at this era sees on the page */
  surface: string;
  /** how many words this surface could be */
  denotes: number;
  note: string;
}

/** Strip only the i'jām, keeping the letters' skeletal shapes. */
export function undot(word: Word): string {
  return word.glyphs.map((g) => skeletonOf(g.letter, g.position)).join("");
}

/**
 * The four stops, newest to oldest. Era 3 is the page as written today;
 * era 0 is the manuscript state, before any distinguishing mark.
 */
export function timeline(raw: string): Stop[] {
  const word = parseWord(raw);
  const unvoweled = word.letters.join("");
  const bare = undot(word);
  const d = degree(word);

  return [
    {
      era: 3,
      label: "As written",
      ar: "كما كُتِب",
      surface: raw,
      denotes: 1,
      note: word.voweled
        ? "Fully bound. Every distinction the script can make is made — the bottom of the lattice."
        : "No tashkīl here, so this is already one step back from fully bound.",
    },
    {
      era: 2,
      label: "Vowels gone",
      ar: "بلا تشكيل",
      surface: unvoweled,
      denotes: 1,
      note: "Tashkīl removed. The consonants are still distinguished, so the letters are certain and only the vocalisation is open.",
    },
    {
      era: 1,
      label: "Dots gone",
      ar: "بلا إعجام",
      surface: bare,
      denotes: d,
      note: `The i'jām is gone. This is the manuscript state — and this surface now denotes ${d.toLocaleString()} ${d === 1 ? "word" : "words"}, all of them legitimate readings of what is actually on the page.`,
    },
    {
      era: 0,
      label: "The futures",
      ar: "الاحتمالات",
      surface: bare,
      denotes: d,
      note: "Every word this skeleton could still become, held at once. Reading is choosing one; writing a mark is closing the others.",
    },
  ];
}

/** The set of futures a skeleton is still holding open. */
export function futures(raw: string, cap = 400): { words: string[]; total: number; truncated: boolean } {
  const word = parseWord(raw);
  const { candidates, truncated } = expand(word, cap);
  return { words: candidates, total: degree(word), truncated };
}

/** How many marks separate the written word from its skeleton. */
export function marksSpent(raw: string): { ijam: number; tashkil: number } {
  const word = parseWord(raw);
  const tashkil = [...raw].filter((c) => TASHKIL.has(c)).length;
  const ijam = word.glyphs.filter(
    (g) => skeletonOf(g.letter, g.position) !== g.letter,
  ).length;
  return { ijam, tashkil };
}

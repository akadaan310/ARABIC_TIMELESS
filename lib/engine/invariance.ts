/**
 * Layer 14's invariance table — computed, never tabulated.
 *
 * For every registered Observable × every registered Transform, run the
 * transform over a sample of words and check whether the observable's reading
 * survives. The result is the table in spec/14-composition.md §14.1, derived
 * from the engine's own definitions rather than copied from the document.
 *
 * The discovery detector falls straight out of this: an observable whose
 * invariance row differs from every existing row is sensitive to a
 * combination of transformations nothing else sees — a genuinely new channel
 * by the stacking rule of §14.5.
 */

import { HIJAI } from "./alphabet";
import { observables, transforms } from "./registry";
import { wordFromLetters } from "./text";
import { mulberry32 } from "./layers/helpers";
import type { Observable, Transform, Word } from "./types";

export type Verdict = "invariant" | "changes" | "undefined";

export interface Cell {
  observableId: string;
  transformId: string;
  verdict: Verdict;
  /** how many sample words were tested */
  trials: number;
  /** a word where the reading changed, for display */
  witness?: { before: string; after: string; readingBefore: string; readingAfter: string };
}

export interface InvarianceTable {
  observables: Observable[];
  transforms: Transform[];
  cells: Cell[];
  get(observableId: string, transformId: string): Cell | undefined;
}

/** Reproducible sample of words to test invariance over. */
export function sampleWords(count = 400, seed = 7): Word[] {
  const rng = mulberry32(seed);
  const out: Word[] = [];
  for (let i = 0; i < count; i++) {
    const len = 3 + Math.floor(rng() * 5);
    const letters = Array.from({ length: len }, () => HIJAI[Math.floor(rng() * HIJAI.length)]);
    out.push(wordFromLetters(letters));
  }
  return out;
}

export function buildInvarianceTable(sample: Word[] = sampleWords()): InvarianceTable {
  const obs = observables();
  const trs = transforms();
  const cells: Cell[] = [];

  for (const o of obs) {
    for (const t of trs) {
      let verdict: Verdict = "invariant";
      let witness: Cell["witness"];
      let trials = 0;

      for (const w of sample) {
        const rng = mulberry32(w.letters.length * 31 + trials + 1);
        let before: string, after: string;
        try {
          before = o.serialize(o.compute(w) as never);
          after = o.serialize(o.compute(t.apply(w, rng)) as never);
        } catch {
          verdict = "undefined";
          break;
        }
        trials++;
        if (before !== after) {
          verdict = "changes";
          if (!witness) {
            witness = {
              before: w.letters.join(""),
              after: t.apply(w, mulberry32(w.letters.length * 31 + trials)).letters.join(""),
              readingBefore: before,
              readingAfter: after,
            };
          }
          break;
        }
      }
      cells.push({ observableId: o.id, transformId: t.id, verdict, trials, witness });
    }
  }

  const index = new Map(cells.map((c) => [`${c.observableId}|${c.transformId}`, c]));
  return {
    observables: obs,
    transforms: trs,
    cells,
    get: (oid, tid) => index.get(`${oid}|${tid}`),
  };
}

/** An observable's row, as a signature string. */
export function rowSignature(table: InvarianceTable, observableId: string): string {
  return table.transforms
    .map((t) => table.get(observableId, t.id)?.verdict ?? "undefined")
    .map((v) => (v === "invariant" ? "1" : v === "changes" ? "0" : "?"))
    .join("");
}

export interface ChannelGroup {
  signature: string;
  observableIds: string[];
}

/**
 * Group observables by invariance row. Observables sharing a row see the same
 * distinctions and are redundant with one another; a row of its own means a
 * genuinely independent channel.
 */
export function channels(table: InvarianceTable): ChannelGroup[] {
  const groups = new Map<string, string[]>();
  for (const o of table.observables) {
    const sig = rowSignature(table, o.id);
    groups.set(sig, [...(groups.get(sig) ?? []), o.id]);
  }
  return [...groups.entries()]
    .map(([signature, observableIds]) => ({ signature, observableIds }))
    .sort((a, b) => b.observableIds.length - a.observableIds.length);
}

/**
 * The discovery detector. Given a candidate observable not yet registered,
 * report whether its invariance row is new — and therefore whether it adds a
 * channel or merely restates one the engine already has.
 */
export function isNewChannel(
  table: InvarianceTable,
  candidate: Observable,
  sample: Word[] = sampleWords(),
): { novel: boolean; signature: string; matches: string[] } {
  const signature = table.transforms
    .map((t) => {
      for (const w of sample) {
        const rng = mulberry32(w.letters.length * 31 + 1);
        try {
          const before = candidate.serialize(candidate.compute(w) as never);
          const after = candidate.serialize(candidate.compute(t.apply(w, rng)) as never);
          if (before !== after) return "0";
        } catch {
          return "?";
        }
      }
      return "1";
    })
    .join("");

  const matches = table.observables
    .filter((o) => rowSignature(table, o.id) === signature)
    .map((o) => o.id);

  return { novel: matches.length === 0, signature, matches };
}

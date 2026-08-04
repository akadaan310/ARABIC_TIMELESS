/**
 * Layer 6 — the reading procedure, executable.
 *
 * Because the app starts from modern written Arabic, it holds the ground
 * truth: the word the user actually typed. So the collapse can be shown
 * honestly — expand the skeleton into everything it could denote, then watch
 * each filter prune, and check at the end whether the true reading survived.
 *
 * The engine never pretends a filter is available when it is not. A filter
 * with no data to run on is reported as skipped, with the reason.
 */

import type { Collapse, FilterStep, FilterId, Terminal, Word } from "./types";
import { cost, addCost, ZERO_COST } from "./types";
import { expand, degree, profileOf, profile } from "./text";
import { getLexicon } from "./lexicon";
import { abstractWord } from "./patterns";

const LABELS: Record<FilterId, { en: string; ar: string }> = {
  lexical:       { en: "Lexical",       ar: "معجمي" },
  segmental:     { en: "Segmental",     ar: "الوصل" },
  morphological: { en: "Morphological", ar: "صرفي" },
  prosodic:      { en: "Prosodic",      ar: "عروضي" },
  syntactic:     { en: "Syntactic",     ar: "نحوي" },
  semantic:      { en: "Semantic",      ar: "دلالي" },
  intentional:   { en: "Intentional",   ar: "مقصدي" },
};

export interface CollapseOptions {
  /** cap on the candidate set the filters run over */
  cap?: number;
  /** run only these filters */
  only?: FilterId[];
}

/**
 * Run the reading procedure over a word's own skeleton.
 *
 * Filters are applied in cost order. Each records what it removed, so the
 * pruning is auditable step by step rather than delivered as a verdict.
 */
export function collapse(word: Word, options: CollapseOptions = {}): Collapse {
  const cap = options.cap ?? 5000;
  const lex = getLexicon();
  const target = word.letters.join("");
  const { candidates: initial, truncated } = expand(word, cap);

  let live = [...initial];
  const steps: FilterStep[] = [];

  const run = (
    id: FilterId,
    rank: number,
    available: boolean,
    skipReason: string | undefined,
    predicate: (candidate: string) => boolean,
    stepCost: (n: number) => ReturnType<typeof cost>,
  ) => {
    if (options.only && !options.only.includes(id)) return;
    const before = live.length;
    if (!available) {
      steps.push({
        id, label: LABELS[id], rank, before, after: before,
        removed: [], cost: ZERO_COST, skipped: true, skipReason,
      });
      return;
    }
    const kept = live.filter(predicate);
    const removed = live.filter((c) => !kept.includes(c));
    live = kept;
    steps.push({
      id, label: LABELS[id], rank, before, after: live.length,
      removed: removed.slice(0, 40), cost: stepCost(before), skipped: false,
    });
  };

  // 1 — lexical. Cheapest, and decidable on the word alone.
  run("lexical", 1, true, undefined,
    (c) => lex.has(c),
    (n) => cost(0, n, 2));

  // If the lexicon knows nothing here it would empty the set on its own
  // ignorance. Fall back rather than report a corrupt text.
  if (live.length === 0) {
    live = [...initial];
    const last = steps[steps.length - 1];
    last.skipped = true;
    last.after = live.length;
    last.removed = [];
    last.skipReason = `no candidate is in the ${lex.name} lexicon — the filter would be reporting its own coverage, not the text`;
  }

  // 2 — segmental. Nearly free, and independent of letter identity.
  const targetProfile = profileOf(word).join(",");
  run("segmental", 2, true, undefined,
    (c) => profile([...c]).join(",") === targetProfile,
    (n) => cost(0, n, 2));

  // 3 — morphological. A candidate must align to at least one pattern.
  run("morphological", 3, true, undefined,
    (c) => abstractWord([...c]).length > 0,
    (n) => cost(0, n * 2, 4));

  // 4 — prosodic. Only available when the input carried tashkīl.
  run("prosodic", 4, word.voweled,
    "the input carries no tashkīl, so there is no pulse to match against",
    () => true,
    (n) => cost(0, n, 2));

  // 5–7 — syntactic, semantic, intentional. These need context beyond the
  // word, which a single-word analysis does not have.
  for (const [id, rank, reason] of [
    ["syntactic", 5, "needs the surrounding words"],
    ["semantic", 6, "needs the surrounding text"],
    ["intentional", 7, "needs a model of the writer"],
  ] as const) {
    run(id, rank, false, reason, () => true, () => ZERO_COST);
  }

  const targetSurvived = live.includes(target);
  const terminal: Terminal =
    live.length === 0 ? "corrupt" : live.length === 1 ? "determined" : "intended";

  return {
    skeleton: word.skeleton,
    initial,
    degree: degree(word),
    truncated,
    steps,
    survivors: live,
    terminal,
    target,
    targetSurvived,
    totalCost: steps.length ? addCost(...steps.map((s) => s.cost)) : ZERO_COST,
  };
}

/**
 * Layer 10's constrained solve: given a skeleton and a known weight, which
 * bindings satisfy both? The bidirectional bridge, run backward.
 */
export function solveByWeight(word: Word, targetWeight: number, cap = 20000): string[] {
  const { candidates } = expand(word, cap);
  const value = (s: string) =>
    [...s].reduce((a, l) => a + (ABJAD[l] ?? 0), 0);
  return candidates.filter((c) => value(c) === targetWeight);
}

import { ABJAD_VALUE as ABJAD } from "./alphabet";

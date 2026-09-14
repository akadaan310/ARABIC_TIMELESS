/**
 * @engine/traversal — Traversal as a first-class, fully replayable
 * computational object (Mission §11: "the path is computational evidence...
 * a traversal must be replayable... do not store only the destination").
 *
 * `walk()` below generalizes the strongest traversal evidence found across
 * the corpus (EXTRACTION_LEDGER.md §H): Mirtal's furqan()/tarteel()
 * (generate.py:33-198) — a bounded greedy planner that records the FULL
 * step list (role + spans + generating rule + evidence per step), not just
 * endpoints, and is genuinely replayable given the same inputs. isnaad's
 * `walkChamber` (src/lib/engine/graph.ts:187-342) independently converges on
 * the same "scored greedy pick with anti-repeat, self-describing stations"
 * shape and contributes the anti-repeat window; isnaad's `chooseLeg`
 * (voyage.ts) is the clearest cautionary counterexample — it caps/discards
 * its visited-history window, which is explicitly NOT adopted here (ledger
 * §H2's discarded-behavior note): `walk()` always keeps the complete step
 * log for the traversal it returns.
 */

export interface Operation<TState> {
  readonly id: string;
  readonly family: "traversal" | "observation" | "union-split" | "reveal"; // PROPOSED
  // taxonomy adopted from Sayyarah's 4-family operation grouping
  // (EXTRACTION_LEDGER.md §G2), not found as working code anywhere.
  apply(input: TState): { output: TState; relationsTraversed: readonly string[]; rationale?: string };
}

export interface TraversalStep<TState> {
  readonly operationId: string;
  readonly input: TState;
  readonly output: TState;
  readonly relationsTraversed: readonly string[];
  readonly rationale?: string;
}

export interface Traversal<TState> {
  readonly id: string;
  readonly seed: TState;
  /** the FULL step log — never destination-only */
  readonly steps: readonly TraversalStep<TState>[];
  readonly stoppingCondition: string;
}

/** ارْتَدَّ ... قَصَصًا — PROPOSED (ledger §H4), but low-risk: the step log
 * already carries enough state to walk it backward; this is a view over an
 * already-recorded Traversal, not new capability. */
export function replay<TState>(
  traversal: Traversal<TState>,
  direction: "forward" | "reverse" = "forward",
): readonly TraversalStep<TState>[] {
  return direction === "forward" ? traversal.steps : [...traversal.steps].reverse();
}

/** بَلَغَ مَجْمَعَ البَحْرَيْن — PROPOSED (ledger §G3): the first state two
 * independently-run traversals both visited, if any. */
export function joinWith<TState>(
  a: Traversal<TState>,
  b: Traversal<TState>,
  keyOf: (state: TState) => string,
): TState | null {
  const visitedA = new Set<string>([keyOf(a.seed), ...a.steps.map((s) => keyOf(s.output))]);
  if (visitedA.has(keyOf(b.seed))) return b.seed;
  for (const step of b.steps) {
    if (visitedA.has(keyOf(step.output))) return step.output;
  }
  return null;
}

export interface Candidate<TState> {
  readonly operationId: string;
  readonly output: TState;
  readonly relationsTraversed: readonly string[];
  readonly score: number;
  readonly rationale?: string;
}

export interface WalkOptions<TState> {
  readonly seed: TState;
  readonly maxSteps: number;
  /** given the current state and the ids used in the last `antiRepeatWindow`
   * steps, return every legal next candidate */
  candidates(state: TState, recentOperationIds: readonly string[]): readonly Candidate<TState>[];
  /** operations used in the last N steps are excluded from candidates —
   * ported from isnaad's walkChamber anti-repeat rule (default 2) */
  readonly antiRepeatWindow?: number;
}

/**
 * Bounded greedy walk with a full, replayable step log. Stops when
 * `maxSteps` is reached or no legal candidate remains — that stopping
 * condition is recorded on the returned Traversal.
 */
export function walk<TState>(id: string, options: WalkOptions<TState>): Traversal<TState> {
  const antiRepeatWindow = options.antiRepeatWindow ?? 2;
  const steps: TraversalStep<TState>[] = [];
  let state = options.seed;
  let stoppingCondition = "maxSteps reached";

  for (let i = 0; i < options.maxSteps; i++) {
    const recent = steps.slice(-antiRepeatWindow).map((s) => s.operationId);
    const legal = options.candidates(state, recent);
    if (legal.length === 0) {
      stoppingCondition = "no legal candidate";
      break;
    }
    const best = legal.reduce((a, b) => (b.score > a.score ? b : a));
    steps.push({
      operationId: best.operationId,
      input: state,
      output: best.output,
      relationsTraversed: best.relationsTraversed,
      rationale: best.rationale,
    });
    state = best.output;
  }

  return { id, seed: options.seed, steps, stoppingCondition };
}

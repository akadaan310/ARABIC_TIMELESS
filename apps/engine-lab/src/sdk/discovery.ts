/**
 * Two complementary, deterministic discovery signals — nothing here is
 * fabricated or auto-promoted.
 *
 * `discoverEngineCandidates` (unchanged from the prior milestone): scans
 * recorded EXPERIMENT HISTORY for contiguous capability sub-sequences that
 * recur across distinct Engines' successful runs.
 *
 * `analyzeCompositions` (new, Step 9): starts from the actual port
 * CONTRACTS (packages don't need to have ever run for a pair to be
 * structurally "compatible"), then upgrades each compatible pair's evidence
 * level using real Engine + Experiment + Challenge history. Five levels,
 * strictly ordered by evidence, never inferred from vibes:
 *
 *   compatible-composition   — the contracts allow it; nothing has run it
 *   experimental-candidate   — some saved Engine actually embodies it
 *   successfully-executed    — that Engine has >=1 successful experiment
 *   challenged                — that Engine has >=1 recorded challenge
 *   reusable-engine           — every recorded challenge for it passed
 *                                (same ladder as sdk/status.ts's
 *                                deriveEngineStatus, applied per pattern)
 */
import { listCapabilities } from "./capabilities";
import { evaluateCompatibility } from "./ports";
import type { EngineCandidate, EngineDefinition, Experiment } from "./types";

function successfulCapabilitySequence(experiment: Experiment): readonly string[] {
  if (experiment.result.status !== "success") return [];
  return experiment.result.steps.filter((s) => !s.error).map((s) => s.capabilityId);
}

function subsequences(sequence: readonly string[], minLength: 2 | 3, maxLength: 2 | 3): string[][] {
  const out: string[][] = [];
  for (let len = minLength; len <= maxLength; len++) {
    for (let i = 0; i + len <= sequence.length; i++) out.push(sequence.slice(i, i + len));
  }
  return out;
}

export function discoverEngineCandidates(
  experiments: readonly Experiment[],
  minDistinctEngines = 2,
): readonly EngineCandidate[] {
  const bySequence = new Map<string, { engineIds: Set<string>; experimentIds: Set<string> }>();

  for (const experiment of experiments) {
    const sequence = successfulCapabilitySequence(experiment);
    if (sequence.length < 2) continue;
    for (const sub of subsequences(sequence, 2, 3)) {
      const key = sub.join(">");
      const entry = bySequence.get(key) ?? { engineIds: new Set<string>(), experimentIds: new Set<string>() };
      entry.engineIds.add(experiment.engineId);
      entry.experimentIds.add(experiment.id);
      bySequence.set(key, entry);
    }
  }

  const candidates: EngineCandidate[] = [];
  for (const [key, entry] of bySequence) {
    if (entry.engineIds.size >= minDistinctEngines) {
      candidates.push({
        id: `candidate-${key}`,
        capabilitySequence: key.split(">"),
        occurrences: entry.experimentIds.size,
        experimentIds: [...entry.experimentIds],
        status: "candidate",
      });
    }
  }
  return candidates.sort((a, b) => b.occurrences - a.occurrences);
}

// ---------------------------------------------------------------------------

export type CompositionEvidenceLevel =
  | "compatible-composition" | "experimental-candidate" | "successfully-executed" | "challenged" | "reusable-engine";

const LEVEL_RANK: readonly CompositionEvidenceLevel[] = [
  "compatible-composition", "experimental-candidate", "successfully-executed", "challenged", "reusable-engine",
];

export interface CompositionInsight {
  readonly capabilitySequence: readonly [string, string];
  readonly level: CompositionEvidenceLevel;
  readonly engineIds: readonly string[];
  readonly experimentIds: readonly string[];
}

/** All structurally compatible (A -> B) pairs, from the port contracts
 * alone — real compatibility, independent of whether anything has run. */
function compatiblePairs(): readonly CompositionInsight[] {
  const ids = listCapabilities().map((c) => c.id);
  const pairs: CompositionInsight[] = [];
  for (const a of ids) {
    for (const b of ids) {
      if (a === b) continue;
      const compat = evaluateCompatibility([{ capabilityId: a }], b);
      if (compat.status !== "incompatible") {
        pairs.push({ capabilitySequence: [a, b], level: "compatible-composition", engineIds: [], experimentIds: [] });
      }
    }
  }
  return pairs;
}

export function analyzeCompositions(
  engines: readonly EngineDefinition[],
  experiments: readonly Experiment[],
): readonly CompositionInsight[] {
  const byKey = new Map(compatiblePairs().map((p) => [p.capabilitySequence.join(">"), p]));

  for (const engine of engines) {
    const sequence = engine.steps.map((s) => s.capabilityId);
    const engineExperiments = experiments.filter((e) => e.engineId === engine.id);
    const allChallenges = engineExperiments.flatMap((e) => e.challenges);

    let level: CompositionEvidenceLevel = "experimental-candidate";
    if (engineExperiments.some((e) => e.result.status === "success")) level = "successfully-executed";
    if (allChallenges.length > 0) level = "challenged";
    if (allChallenges.length > 0 && allChallenges.every((c) => c.verdict === "PASS")) level = "reusable-engine";

    for (let i = 0; i + 2 <= sequence.length; i++) {
      const key = sequence.slice(i, i + 2).join(">");
      const current = byKey.get(key);
      if (!current) continue; // every real engine's adjacent pairs are compatible by construction; guard anyway
      byKey.set(key, {
        ...current,
        level: LEVEL_RANK.indexOf(level) > LEVEL_RANK.indexOf(current.level) ? level : current.level,
        engineIds: current.engineIds.includes(engine.id) ? current.engineIds : [...current.engineIds, engine.id],
        experimentIds: [...new Set([...current.experimentIds, ...engineExperiments.map((e) => e.id)])],
      });
    }
  }

  return [...byKey.values()].sort((a, b) => LEVEL_RANK.indexOf(b.level) - LEVEL_RANK.indexOf(a.level));
}

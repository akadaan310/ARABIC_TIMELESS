/**
 * Deterministic opportunity discovery: scan recorded experiment history for
 * contiguous capability sub-sequences (length 2-3) that recur across
 * DIFFERENT Engines' successful runs. A sub-sequence shared by two engines'
 * own step lists is real, structural evidence of a reusable composition —
 * not a guess. Every candidate stays explicitly a "candidate" (per Mission
 * §"DISCOVERY") until a person actually builds and registers it as a new
 * Engine; nothing here does that automatically.
 */
import type { EngineCandidate, Experiment } from "./types";

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
  // key: joined capability sequence -> set of engine ids that exhibit it -> experiment ids
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

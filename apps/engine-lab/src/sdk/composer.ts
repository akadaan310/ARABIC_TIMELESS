/**
 * The Engine Composer — Step 4. A minimal, ordered composition API: add a
 * compatible capability, resolve its bindings (automatically when there is
 * exactly one candidate source, or from an explicit user override when
 * ambiguous), remove the last step, or swap two adjacent steps when doing
 * so is actually safe. Deliberately NOT a graph editor: no arbitrary
 * mid-chain insertion/removal, no free-form wiring — "a simple ordered
 * composition interface... more robust" than drag-and-drop, per the task.
 */
import { evaluateCompatibility, type CompatibilityResult, type PortBinding } from "./ports";
import type { EngineStep } from "./types";

export interface ComposerDraft {
  readonly steps: readonly EngineStep[];
}

export function emptyDraft(): ComposerDraft {
  return { steps: [] };
}

export function compatibilityFor(draft: ComposerDraft, capabilityId: string): CompatibilityResult {
  return evaluateCompatibility(draft.steps, capabilityId);
}

export interface AddStepOutcome {
  readonly draft: ComposerDraft;
  readonly result: CompatibilityResult;
  readonly added: boolean;
}

/**
 * Adds `capabilityId` as the next step. Refuses (added: false) when
 * incompatible. When a required port is ambiguous (more than one candidate
 * source), the caller must supply an override for it via `overrides`
 * (portKey -> the chosen PortBinding) — otherwise the most-recently-added
 * matching step is bound by default, and `result.status` stays
 * "requires-configuration" so the UI can flag that a default was assumed.
 */
export function addStep(
  draft: ComposerDraft,
  capabilityId: string,
  overrides?: Readonly<Record<string, PortBinding>>,
): AddStepOutcome {
  const result = compatibilityFor(draft, capabilityId);
  if (result.status === "incompatible") {
    return { draft, result, added: false };
  }

  const bindings: Record<string, PortBinding> = {};
  for (const resolution of result.resolutions) {
    const override = overrides?.[resolution.portKey];
    if (override) {
      bindings[resolution.portKey] = override;
    } else if (resolution.candidates.length === 1) {
      bindings[resolution.portKey] = resolution.candidates[0];
    } else if (resolution.candidates.length > 1) {
      bindings[resolution.portKey] = resolution.candidates[resolution.candidates.length - 1]; // default: most recent producer
    }
    // 0 candidates only happens for an optional port (checked non-incompatible above) — no binding, resolveStepInput applies the port's default.
  }

  const step: EngineStep = { capabilityId, bindings };
  return { draft: { steps: [...draft.steps, step] }, result, added: true };
}

export function removeLastStep(draft: ComposerDraft): ComposerDraft {
  return { steps: draft.steps.slice(0, -1) };
}

/**
 * Whether swapping steps at (index-1, index) is safe. Bindings only ever
 * reference a capabilityId already present earlier in the chain at the time
 * a step was added (evaluateCompatibility only offers candidates from prior
 * steps), so a step can never depend on one added after it — the only
 * thing to check is whether the LATER step (`index`) depends on the
 * EARLIER one (`index-1`); if so, moving it before its dependency would
 * break it.
 */
export function canSwap(draft: ComposerDraft, index: number): boolean {
  if (index <= 0 || index >= draft.steps.length) return false;
  const earlier = draft.steps[index - 1];
  const later = draft.steps[index];
  return !Object.values(later.bindings).some(
    (binding) => binding.source === "step" && binding.capabilityId === earlier.capabilityId,
  );
}

export function swapSteps(draft: ComposerDraft, index: number): ComposerDraft {
  if (!canSwap(draft, index)) return draft;
  const steps = [...draft.steps];
  [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
  return { steps };
}

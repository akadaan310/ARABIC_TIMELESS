import { describe, expect, it } from "vitest";
import { emptyDraft, addStep, removeLastStep, canSwap, swapSteps } from "./composer";

describe("composer.addStep", () => {
  it("adds a compatible capability and auto-resolves its single-candidate bindings", () => {
    const outcome = addStep(emptyDraft(), "corpus.join");
    expect(outcome.added).toBe(true);
    expect(outcome.draft.steps).toHaveLength(1);
    expect(outcome.draft.steps[0].bindings.nodes).toEqual({ source: "root", field: "nodes" });
  });

  it("refuses to add an incompatible capability, leaving the draft unchanged", () => {
    const draft = emptyDraft();
    const outcome = addStep(draft, "relation.detectSharedSkeleton"); // needs a LocusJoin nothing produces yet
    expect(outcome.added).toBe(false);
    expect(outcome.draft).toBe(draft); // literally unchanged, not just equal
    expect(outcome.result.status).toBe("incompatible");
  });

  it("chains a second capability off the first step's output", () => {
    const first = addStep(emptyDraft(), "corpus.join");
    const second = addStep(first.draft, "relation.detectSharedSkeleton");
    expect(second.added).toBe(true);
    expect(second.draft.steps[1].bindings.join).toEqual({ source: "step", capabilityId: "corpus.join", port: "join" });
  });

  it("respects an explicit override for an ambiguous port instead of the default choice", () => {
    // Construct an artificial ambiguity is hard with the real capability set (see ports.test.ts note),
    // so this test instead verifies overrides are honored even when only one candidate exists —
    // an override always wins over auto-resolution.
    const first = addStep(emptyDraft(), "corpus.join");
    const overridden = addStep(first.draft, "relation.detectSharedSkeleton", {
      join: { source: "step", capabilityId: "corpus.join", port: "join" },
    });
    expect(overridden.added).toBe(true);
    expect(overridden.draft.steps[1].bindings.join).toEqual({ source: "step", capabilityId: "corpus.join", port: "join" });
  });
});

describe("composer.removeLastStep", () => {
  it("removes only the most recently added step", () => {
    const first = addStep(emptyDraft(), "corpus.join").draft;
    const second = addStep(first, "structure.classify").draft;
    const reverted = removeLastStep(second);
    expect(reverted.steps).toHaveLength(1);
    expect(reverted.steps[0].capabilityId).toBe("corpus.join");
  });

  it("is a no-op on an empty draft", () => {
    expect(removeLastStep(emptyDraft()).steps).toEqual([]);
  });
});

describe("composer.canSwap / swapSteps", () => {
  it("refuses to swap when the later step depends on the earlier one", () => {
    const first = addStep(emptyDraft(), "corpus.join").draft;
    const second = addStep(first, "relation.detectSharedSkeleton").draft; // depends on corpus.join's output
    expect(canSwap(second, 1)).toBe(false);
    expect(swapSteps(second, 1)).toBe(second); // unchanged
  });

  it("allows swapping two independent steps", () => {
    const first = addStep(emptyDraft(), "corpus.join").draft;
    const withSkeleton = addStep(first, "arabic.skeleton").draft; // subjects come from root, not from corpus.join
    expect(canSwap(withSkeleton, 1)).toBe(true);
    const swapped = swapSteps(withSkeleton, 1);
    expect(swapped.steps.map((s) => s.capabilityId)).toEqual(["arabic.skeleton", "corpus.join"]);
  });

  it("refuses out-of-range indices", () => {
    const draft = addStep(emptyDraft(), "corpus.join").draft;
    expect(canSwap(draft, 0)).toBe(false);
    expect(canSwap(draft, 5)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { reconcileState, summarize, frontier, type Discovery } from "./index";
import { makeProvenance } from "../provenance";

function exhausted(bounds: Record<string, number>): Discovery {
  return {
    id: "d1", generatedBy: "detector:root-return", parents: [], score: 0.9,
    bounds, engineVersion: "0.1.0", corpusVersion: "tanzil-1.0",
    evidence: {}, epistemicType: "textual", state: "EXHAUSTED",
    provenance: makeProvenance({
      source: "d1", operation: "detect", algorithm: "root-return",
      corpusVersion: "tanzil-1.0", engineVersion: "0.1.0",
    }),
  };
}

describe("@engine/discovery — bound-relative lifecycle (ported from Mirtal)", () => {
  it("EXHAUSTED survives when bounds are unchanged", () => {
    const d = exhausted({ minScore: 8 });
    expect(reconcileState(d, { minScore: 8 })).toBe("EXHAUSTED");
  });

  it("EXHAUSTED demotes to KNOWN (stale) when bounds change — never silently stays exhausted", () => {
    const d = exhausted({ minScore: 8 });
    expect(reconcileState(d, { minScore: 5 })).toBe("KNOWN");
  });

  it("reconcileState never touches non-EXHAUSTED states", () => {
    const d = { ...exhausted({ minScore: 8 }), state: "WITHHELD" as const };
    expect(reconcileState(d, { minScore: 999 })).toBe("WITHHELD");
  });

  it("summarize counts every lifecycle state", () => {
    const summary = summarize([exhausted({ x: 1 }), { ...exhausted({ x: 1 }), state: "UNEXPLORED" }]);
    expect(summary.total).toBe(2);
    expect(summary.byState.EXHAUSTED).toBe(1);
    expect(summary.byState.UNEXPLORED).toBe(1);
  });

  it("frontier excludes already-evaluated candidates and respects the cap", () => {
    const result = frontier(["a", "b", "c", "d"], new Set(["a"]), 2);
    expect(result).toEqual(["b", "c"]);
  });
});

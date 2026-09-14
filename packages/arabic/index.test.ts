import { describe, expect, it } from "vitest";
import { verifyInvertibility, checkInvariance, type Observable, type Transform } from "./index";

describe("@engine/arabic verifyInvertibility", () => {
  it("confirms a genuinely invertible deterministic transform", () => {
    const addOne: Transform<number> = {
      id: "add-one", label: { en: "Add one" }, apply: (n) => n + 1,
      invertibilityClaim: "invertible", lossAccounting: { preserved: ["value"], discarded: [] },
    };
    const report = verifyInvertibility({
      transformId: addOne.id, claim: addOne.invertibilityClaim,
      apply: addOne.apply, invert: (n) => n - 1,
      samples: [1, 2, 3, -5, 100], equals: (a, b) => a === b,
    });
    expect(report.verdict).toBe("confirmed");
    expect(report.samplesPassed).toBe(5);
    expect(report.counterexamples).toHaveLength(0);
  });

  it("refutes a false invertibility claim with counterexamples", () => {
    const clampToZero: Transform<number> = {
      id: "clamp", label: { en: "Clamp to zero" }, apply: () => 0,
      invertibilityClaim: "invertible", lossAccounting: { preserved: [], discarded: ["value"] },
    };
    const report = verifyInvertibility({
      transformId: clampToZero.id, claim: clampToZero.invertibilityClaim,
      apply: clampToZero.apply, invert: (n) => n, // wrong on purpose
      samples: [1, 2, 3], equals: (a, b) => a === b,
    });
    expect(report.verdict).toBe("refuted");
    expect(report.counterexamples.length).toBeGreaterThan(0);
  });

  it("reports unverifiable — never silently confirms — when no inverse can be supplied", () => {
    // Models arabic-timeless's own `silent`/`permute` transforms: the public
    // apply(word, rng) interface never exposes the map/permutation used, so
    // no caller can construct a deterministic invert() from output alone.
    const report = verifyInvertibility<number, number>({
      transformId: "randomized-without-exposed-inverse",
      claim: "invertible",
      apply: (n) => n * 2,
      // invert intentionally omitted
      samples: [1, 2, 3],
      equals: (a, b) => a === b,
    });
    expect(report.verdict).toBe("unverifiable");
    expect(report.samplesPassed).toBe(0);
  });
});

describe("@engine/arabic checkInvariance", () => {
  it("detects when an observable is blind to a transform (parity is invariant under negation)", () => {
    const parity: Observable<number, number> = {
      id: "parity", label: { en: "Parity" },
      compute: (n) => ((n % 2) + 2) % 2,
      serialize: (v) => String(v), display: (v) => String(v),
      lossAccounting: { preserved: ["parity"], discarded: ["magnitude", "sign"] },
    };
    const negate: Transform<number> = {
      id: "negate", label: { en: "Negate" }, apply: (n) => -n,
      invertibilityClaim: "invertible", lossAccounting: { preserved: ["magnitude"], discarded: ["sign"] },
    };
    const cell = checkInvariance(parity, negate, [1, 2, 3, 4, -7]);
    expect(cell.verdict).toBe("invariant");
  });

  it("detects when an observable changes under a transform", () => {
    const identity: Observable<number, number> = {
      id: "value", label: { en: "Value" }, compute: (n) => n,
      serialize: (v) => String(v), display: (v) => String(v),
      lossAccounting: { preserved: ["value"], discarded: [] },
    };
    const negate: Transform<number> = {
      id: "negate", label: { en: "Negate" }, apply: (n) => -n,
      invertibilityClaim: "invertible", lossAccounting: { preserved: [], discarded: ["sign"] },
    };
    const cell = checkInvariance(identity, negate, [1, 2, 3]);
    expect(cell.verdict).toBe("changes");
  });
});

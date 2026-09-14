/**
 * Wires @engine/arabic's verifyInvertibility (packages/arabic/index.ts)
 * against this repo's own 6 real Transform objects — closing the gap
 * documented in EXTRACTION_LEDGER.md §F2/§F5: `invertible: true` was set on
 * every one of them and, before this test, checked by nothing anywhere in
 * the codebase.
 *
 * The verdicts below are not assumed — they follow from reading each
 * transform's `apply`: `reflect`/`shift1`/`shift3`/`reverse` are pure
 * functions of the word alone (rng is ignored or unused), so a real inverse
 * exists and is supplied. `silent`/`permute` build their bijection from the
 * `rng` argument internally and never expose it, so no caller can construct
 * a deterministic `invert()` from the output alone — the honest verdict is
 * "unverifiable", not a rubber-stamped pass.
 */
import { describe, it, expect } from "vitest";
import { transforms, sampleWords, shiftLetter, reflectLetter, wordFromLetters, mulberry32 } from "../index";
import type { Word } from "../types";
import { verifyInvertibility } from "../../../packages/arabic/index";

const equalsWord = (a: Word, b: Word) => a.letters.join("") === b.letters.join("");
const samples = sampleWords(30);

function transformById(id: string) {
  const t = transforms().find((x) => x.id === id);
  if (!t) throw new Error(`transform not found: ${id}`);
  return t;
}

describe("engine SDK invertibility verification against arabic-timeless's real transforms", () => {
  it("reflect is genuinely invertible (self-inverse involution)", () => {
    const t = transformById("reflect");
    const report = verifyInvertibility({
      transformId: t.id, claim: "invertible",
      apply: (w: Word) => t.apply(w, mulberry32(1)),
      invert: (w: Word) => wordFromLetters(w.letters.map(reflectLetter)),
      samples, equals: equalsWord,
    });
    expect(report.verdict).toBe("confirmed");
  });

  it("shift1 is genuinely invertible (cyclic shift, inverse is shift by -1)", () => {
    const t = transformById("shift1");
    const report = verifyInvertibility({
      transformId: t.id, claim: "invertible",
      apply: (w: Word) => t.apply(w, mulberry32(1)),
      invert: (w: Word) => wordFromLetters(w.letters.map((l) => shiftLetter(l, -1))),
      samples, equals: equalsWord,
    });
    expect(report.verdict).toBe("confirmed");
  });

  it("shift3 is genuinely invertible (cyclic shift, inverse is shift by -3)", () => {
    const t = transformById("shift3");
    const report = verifyInvertibility({
      transformId: t.id, claim: "invertible",
      apply: (w: Word) => t.apply(w, mulberry32(1)),
      invert: (w: Word) => wordFromLetters(w.letters.map((l) => shiftLetter(l, -3))),
      samples, equals: equalsWord,
    });
    expect(report.verdict).toBe("confirmed");
  });

  it("reverse is genuinely invertible (self-inverse)", () => {
    const t = transformById("reverse");
    const report = verifyInvertibility({
      transformId: t.id, claim: "invertible",
      apply: (w: Word) => t.apply(w, mulberry32(1)),
      invert: (w: Word) => wordFromLetters([...w.letters].reverse()),
      samples, equals: equalsWord,
    });
    expect(report.verdict).toBe("confirmed");
  });

  it("silent's invertibility claim is UNVERIFIABLE from its public interface — the map is internal to apply() and never returned", () => {
    const t = transformById("silent");
    const report = verifyInvertibility({
      transformId: t.id, claim: "invertible",
      apply: (w: Word) => t.apply(w, mulberry32(1)),
      // no invert supplied: none can be constructed from output alone
      samples, equals: equalsWord,
    });
    expect(report.verdict).toBe("unverifiable");
  });

  it("permute's invertibility claim is UNVERIFIABLE from its public interface — the permutation is internal to apply() and never returned", () => {
    const t = transformById("permute");
    const report = verifyInvertibility({
      transformId: t.id, claim: "invertible",
      apply: (w: Word) => t.apply(w, mulberry32(1)),
      samples, equals: equalsWord,
    });
    expect(report.verdict).toBe("unverifiable");
  });

  it("every registered transform declares invertible:true, yet only 4 of 6 are actually checkable from the public interface", () => {
    const allInvertible = transforms().every((t) => t.invertible === true);
    expect(allInvertible).toBe(true); // confirms the ledger's finding: the flag is uniform...
    expect(transforms()).toHaveLength(6); // ...and the registry really is this thin (§F2)
  });
});

import { describe, expect, it } from "vitest";
import { boundsMatch, makeProvenance } from "./index";

describe("@engine/provenance", () => {
  it("fills defaults and preserves required fields", () => {
    const p = makeProvenance({
      source: "corpus:2:255",
      operation: "detect",
      algorithm: "root-return",
      corpusVersion: "tanzil-1.0",
      engineVersion: "0.1.0",
    });
    expect(p.parents).toEqual([]);
    expect(p.bounds).toEqual({});
    expect(p.source).toBe("corpus:2:255");
  });

  it("boundsMatch is true only for identical signatures", () => {
    expect(boundsMatch({ minScore: 8 }, { minScore: 8 })).toBe(true);
    expect(boundsMatch({ minScore: 8 }, { minScore: 9 })).toBe(false);
    expect(boundsMatch({ minScore: 8 }, { minScore: 8, extra: true })).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  ayahLocus, wordLocus, spanLocus, locusKey, project, registerProjection,
  buildLocusJoin, type WordLocus,
} from "./index";

describe("@engine/corpus locus discipline", () => {
  it("keeps granularities structurally distinct", () => {
    const a = ayahLocus(18, 9);
    const w = wordLocus(18, 9, 11);
    expect(a.granularity).toBe("ayah");
    expect(w.granularity).toBe("word");
    expect(locusKey(w)).toBe("18:9:11");
  });

  it("refuses to project without a registered rule — the Mirtal defect class", () => {
    const a = ayahLocus(18, 9);
    expect(() => project(a, "word", "0.1.0", "tanzil-1.0")).toThrow(/no ProjectionRule registered/);
  });

  it("projects only through an explicit, named rule, and records provenance", () => {
    registerProjection<"ayah", "word">({
      id: "ayah-to-first-word",
      from: "ayah",
      to: "word",
      algorithm: "first-word-of-ayah",
      project: (locus) => [wordLocus(locus.surah, locus.ayah, 1)],
    });
    const a = ayahLocus(18, 9);
    const { result, provenance } = project(a, "word", "0.1.0", "tanzil-1.0");
    expect(result).toHaveLength(1);
    expect((result[0] as WordLocus).word).toBe(1);
    expect(provenance.algorithm).toBe("first-word-of-ayah");
    expect(provenance.parameters).toMatchObject({ from: "ayah", to: "word" });
  });

  it("span requires wordEnd >= wordStart", () => {
    expect(() => spanLocus(18, 9, 5, 2)).toThrow(RangeError);
  });

  it("locus join: first placement wins, collisions are recorded not silently dropped", () => {
    const join = buildLocusJoin([
      { locus: ayahLocus(1, 1), target: "first" },
      { locus: ayahLocus(1, 1), target: "second" },
    ]);
    expect(join.placed.get("1:1")).toBe("first");
    expect(join.collisions).toEqual([{ key: "1:1", discarded: "second" }]);
  });
});

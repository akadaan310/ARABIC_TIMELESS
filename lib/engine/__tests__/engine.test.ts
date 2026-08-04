/**
 * The engine's claims, checked.
 *
 * Every constant the specification states is verified here against the
 * engine's own computation. A number that appears in spec/ and cannot be
 * reproduced by the code is a bug in one of the two.
 */

import { describe, it, expect } from "vitest";
import {
  HIJAI, ABJADI, ALPHABET_SIZE, CLASSES_MEDIAL, CLOSED, UNMOVED, ABJAD_VALUE,
  parseWord, degree, arity, profileOf, expand,
  orderPermutation, reflectLetter, closedIsUnionOfClasses,
  silentSubgroupOrder, medialSilentSubgroupOrder, oneFromEachClass, silentSubstitution,
  rootSpace, weightOf, footOrbits, mulberry32,
  applyPattern, abstractWord, PATTERN_BY_ID, collapse, solveByWeight,
  buildInvarianceTable, sampleWords, rowSignature, channels, constants,
} from "../index";

describe("the alphabet", () => {
  it("has twenty-eight letters in both orders, over the same set", () => {
    expect(HIJAI).toHaveLength(28);
    expect(ABJADI).toHaveLength(28);
    expect(new Set(HIJAI).size).toBe(28);
    expect(new Set(ABJADI)).toEqual(new Set(HIJAI));
  });

  it("collapses onto fifteen shape classes covering every letter", () => {
    expect(Object.keys(CLASSES_MEDIAL)).toHaveLength(15);
    const covered = Object.values(CLASSES_MEDIAL).flat();
    expect(covered).toHaveLength(28);
    expect(new Set(covered)).toEqual(new Set(HIJAI));
  });

  it("assigns an abjad value to every letter", () => {
    for (const l of HIJAI) expect(ABJAD_VALUE[l]).toBeGreaterThan(0);
    expect(ABJAD_VALUE["ا"]).toBe(1);
    expect(ABJAD_VALUE["ي"]).toBe(10);
    expect(ABJAD_VALUE["ت"]).toBe(400);
    expect(ABJAD_VALUE["غ"]).toBe(1000);
  });
});

describe("Layer 3 — the order", () => {
  it("has a permutation of order 105 fixing only ا and ب", () => {
    const p = orderPermutation();
    expect(p.order).toBe(105);
    expect(p.cycleLengths).toEqual([1, 1, 5, 21]);
    expect(p.fixed).toEqual(["ا", "ب"]);
  });

  it("reflects as an involution with no fixed points", () => {
    for (const l of HIJAI) {
      expect(reflectLetter(reflectLetter(l))).toBe(l);
      expect(reflectLetter(l)).not.toBe(l);
    }
  });
});

describe("Layer 4 — the void", () => {
  it("gives كتب arity 2 and degree 15", () => {
    const w = parseWord("كتب");
    expect(w.skeleton).toBe("كٮٮ");
    expect(arity(w)).toBe(2);
    expect(degree(w)).toBe(15);
  });

  it("expands to exactly the degree, and includes the true reading", () => {
    const w = parseWord("كتب");
    const { candidates, truncated } = expand(w);
    expect(truncated).toBe(false);
    expect(candidates).toHaveLength(15);
    expect(candidates).toContain("كتب");
  });

  it("gives a word of singleton-class letters degree 1", () => {
    const w = parseWord("مال");
    expect(degree(w)).toBe(1);
    expect(arity(w)).toBe(0);
  });
});

describe("Layer 7 — segment", () => {
  it("profiles words by their connected runs", () => {
    expect(profileOf(parseWord("كتب"))).toEqual([3]);
    expect(profileOf(parseWord("كتاب"))).toEqual([3, 1]);
    expect(profileOf(parseWord("درس"))).toEqual([1, 1, 1]);
    expect(profileOf(parseWord("مدرسة"))).toEqual([2, 1, 2]);
  });
});

describe("Layer 8 — substitution", () => {
  it("has a universally silent subgroup of order 4,608", () => {
    // Silent in EVERY position. Strictly smaller than the medial subgroup,
    // because ن and ي leave the tooth in final position.
    expect(silentSubgroupOrder()).toBe(4608);
  });

  it("has a medial-only silent subgroup of order 92,160", () => {
    expect(medialSilentSubgroupOrder()).toBe(92160);
    expect(silentSubgroupOrder()).toBeLessThan(medialSilentSubgroupOrder());
  });

  it("distinguishes the subgroup order from the selection count", () => {
    expect(oneFromEachClass()).toBe(1920);
    expect(silentSubgroupOrder()).not.toBe(oneFromEachClass());
  });

  it("shows why silence is position-dependent", () => {
    // ب↔ن is invisible medially and visible finally.
    expect(parseWord("كتب").skeleton).toBe("كٮٮ");
    expect(parseWord("كتن").skeleton).toBe("كٮں");
    expect(parseWord("كبت").skeleton).toBe(parseWord("كتب").skeleton);
  });

  it("keeps the skeleton fixed under every universally silent substitution", () => {
    const words = ["كتب", "مدرسة", "علم", "استكتب", "نظر"].map(parseWord);
    for (let seed = 1; seed <= 40; seed++) {
      const map = silentSubstitution(mulberry32(seed));
      for (const w of words) {
        const swapped = parseWord(w.letters.map((l) => map[l] ?? l).join(""));
        expect(swapped.skeleton).toBe(w.skeleton);
      }
    }
  });
});

describe("Layer 9 — permutation", () => {
  it("counts the root space", () => {
    expect(rootSpace(3)).toEqual({ ordered: 19656, orbits: 3276 });
    expect(rootSpace(5).orbits).toBe(98280);
  });
});

describe("Layer 10 — weight", () => {
  it("weighs كتب at 422", () => {
    expect(weightOf(["ك", "ت", "ب"])).toBe(422);
  });

  it("cuts fifteen candidates to two by arithmetic alone", () => {
    const w = parseWord("كتب");
    const solved = solveByWeight(w, 422);
    expect(solved.sort()).toEqual(["كبت", "كتب"].sort());
  });
});

describe("Layer 11 — pulse", () => {
  it("puts the eight feet in exactly three rotation orbits", () => {
    const orbits = footOrbits();
    expect(orbits).toHaveLength(3);
    expect(orbits.flat()).toHaveLength(8);
    const five = orbits.find((o) => o.includes("فعولن"));
    expect(five).toContain("فاعلن");
  });
});

describe("Layer 13 — pattern", () => {
  it("applies a pattern to a root", () => {
    const root = ["ك", "ت", "ب"];
    expect(applyPattern(PATTERN_BY_ID["patient"], root)).toBe("مكتوب");
    expect(applyPattern(PATTERN_BY_ID["X"], root)).toBe("استكتب");
    expect(applyPattern(PATTERN_BY_ID["place"], root)).toBe("مكتب");
  });

  it("abstracts a pattern back out of a word", () => {
    const aligns = abstractWord([..."مكتوب"]);
    const ids = aligns.map((a) => a.pattern.id);
    expect(ids).toContain("patient");
    const patient = aligns.find((a) => a.pattern.id === "patient")!;
    expect(patient.root).toEqual(["ك", "ت", "ب"]);
  });

  it("application and abstraction are inverse", () => {
    const root = ["د", "ر", "س"];
    for (const id of ["place", "patient", "agent", "X"]) {
      const word = applyPattern(PATTERN_BY_ID[id], root);
      const back = abstractWord([...word]).find((a) => a.pattern.id === id);
      expect(back?.root).toEqual(root);
    }
  });
});

describe("Layer 14 — composition", () => {
  it("finds the closed letters to be a union of complete shape classes", () => {
    expect(closedIsUnionOfClasses()).toBe(true);
  });

  it("computes an invariance table with the expected shape", () => {
    const table = buildInvarianceTable(sampleWords(150));
    const weight = table.get("weight", "permute");
    const skeleton = table.get("skeleton", "permute");
    const profile = table.get("profile", "silent");
    const skelSilent = table.get("skeleton", "silent");

    // weight is invariant under permutation — a sum ignores order
    expect(weight?.verdict).toBe("invariant");
    // the skeleton is not
    expect(skeleton?.verdict).toBe("changes");
    // silent substitution preserves both skeleton and profile
    expect(skelSilent?.verdict).toBe("invariant");
    expect(profile?.verdict).toBe("invariant");
  });

  it("shows silent substitution and permutation blind to opposite things", () => {
    const table = buildInvarianceTable(sampleWords(150));
    const skelRow = rowSignature(table, "skeleton");
    const weightRow = rowSignature(table, "weight");
    expect(skelRow).not.toBe(weightRow);
  });

  it("groups observables into distinct channels", () => {
    const table = buildInvarianceTable(sampleWords(150));
    const groups = channels(table);
    expect(groups.length).toBeGreaterThan(1);
  });
});

describe("Layer 15 — symmetry", () => {
  it("finds six letters alone in their classes", () => {
    expect(UNMOVED.sort()).toEqual(["ا", "ك", "ل", "م", "ه", "و"].sort());
    expect(UNMOVED).toHaveLength(6);
  });
});

describe("Layer 6 — the reading procedure", () => {
  it("recovers the written word from its own skeleton", () => {
    const w = parseWord("كتب");
    const c = collapse(w);
    expect(c.degree).toBe(15);
    expect(c.targetSurvived).toBe(true);
    expect(c.survivors.length).toBeLessThan(15);
  });

  it("reports skipped filters with a reason rather than pretending to run", () => {
    const c = collapse(parseWord("كتب"));
    const prosodic = c.steps.find((s) => s.id === "prosodic")!;
    expect(prosodic.skipped).toBe(true);
    expect(prosodic.skipReason).toBeTruthy();
  });

  it("never removes the true reading when the lexicon knows it", () => {
    for (const word of ["كتب", "مكتب", "مدرسة", "علم", "كتاب"]) {
      const c = collapse(parseWord(word));
      expect(c.targetSurvived).toBe(true);
    }
  });

  it("terminates in one of the three named states", () => {
    const c = collapse(parseWord("كتب"));
    expect(["determined", "corrupt", "intended"]).toContain(c.terminal);
  });
});

describe("Layer 20 — the constants", () => {
  it("reports every checkable constant", () => {
    const c = constants();
    const find = (label: string) => c.find((x) => x.label.startsWith(label))?.value;
    expect(find("Letters")).toBe("28");
    expect(find("Order of the abjadī")).toBe("105");
    expect(find("Order of the silent subgroup")).toBe("4,608");
    expect(find("Order of the medial-only")).toBe("92,160");
    expect(find("Rotation orbits")).toBe("3");
    expect(find("Triliteral root orbits")).toBe("3,276");
  });
});

describe("text handling", () => {
  it("folds hamza variants and tāʾ marbūṭa to base letters", () => {
    expect(parseWord("أكتب").letters[0]).toBe("ا");
    expect(parseWord("مدرسة").letters.at(-1)).toBe("ه");
    expect(parseWord("إلى").letters).toEqual(["ا", "ل", "ي"]);
  });

  it("strips tashkīl but records that it was present", () => {
    const w = parseWord("كَتَبَ");
    expect(w.letters).toEqual(["ك", "ت", "ب"]);
    expect(w.voweled).toBe(true);
    expect(parseWord("كتب").voweled).toBe(false);
  });

  it("resolves the four faces from the joining rules", () => {
    const w = parseWord("كتاب");
    expect(w.glyphs.map((g) => g.position)).toEqual(["initial", "medial", "final", "isolated"]);
  });
});

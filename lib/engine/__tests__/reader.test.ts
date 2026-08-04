import { describe, it, expect } from "vitest";
import { readMany, read, overview } from "../reader";
import { EXAMPLES } from "../examples";

describe("the reader", () => {
  it("produces readings for every example, deep into the stream", () => {
    for (const e of EXAMPLES) {
      for (let n = 0; n < 200; n++) {
        const r = read(e.text, n);
        expect(r, `${e.text} @ ${n}`).not.toBeNull();
        expect(r!.body.length, `${e.text} @ ${n} (${r!.layer}/${r!.op})`).toBeGreaterThan(10);
        expect(r!.title.length).toBeGreaterThan(3);
      }
    }
  });

  it("survives awkward input", () => {
    for (const t of ["ا", "ن", "لا", "ااا", "كتب كتب كتب", "a b c", "١٢٣", "؟"]) {
      expect(() => readMany(t, 0, 60)).not.toThrow();
    }
  });

  it("is deterministic in (text, n)", () => {
    const a = readMany("إفتح سمسم", 0, 30);
    const b = readMany("إفتح سمسم", 0, 30);
    expect(a.map((r) => r.title)).toEqual(b.map((r) => r.title));
  });

  it("covers many layers rather than repeating one", () => {
    const rs = readMany("إفتح سمسم", 0, 40);
    expect(new Set(rs.map((r) => r.layer)).size).toBeGreaterThan(10);
  });

  it("reports both natures", () => {
    const rs = readMany("إفتح سمسم", 0, 40);
    expect(rs.some((r) => r.nature === "visible")).toBe(true);
    expect(rs.some((r) => r.nature === "hidden")).toBe(true);
  });

  it("computes the phrase overview", () => {
    const o = overview("إفتح سمسم");
    expect(o.words).toBe(2);
    expect(o.jointDegree).toBe(120);
    expect(o.weight).toBe(689);
  });
});

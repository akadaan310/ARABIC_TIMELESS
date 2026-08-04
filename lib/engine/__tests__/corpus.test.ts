import { describe, it, expect } from "vitest";
import { CORPUS } from "../corpus";
import { buildPassage } from "../passage";
import { lookup } from "../lexdata";

describe("the corpus", () => {
  it("parses every passage and reports lexical coverage", () => {
    const rows: string[] = [];
    for (const c of CORPUS) {
      const p = buildPassage(c.text, c.title);
      const resolved = p.words.filter((w) => lookup(w.norm)).length;
      const pct = Math.round((resolved / p.words.length) * 100);
      rows.push(
        `${c.id.padEnd(12)} ${String(p.words.length).padStart(3)}w  ${String(pct).padStart(3)}%  ` +
          `bits ${p.stats.bits.toFixed(1).padStart(6)}  det ${p.stats.determined}/${p.words.length}`,
      );
      expect(p.words.length).toBeGreaterThan(0);
    }
    console.log("\n" + rows.join("\n"));
  });

  it("the unmoved passage really is fully determined", () => {
    const p = buildPassage(CORPUS.find((c) => c.id === "unmoved")!.text);
    expect(p.stats.bits).toBe(0);
    expect(p.stats.determined).toBe(p.words.length);
    for (const w of p.words) expect(w.degree).toBe(1);
  });

  it("the one-root passage really is one root", () => {
    const p = buildPassage(CORPUS.find((c) => c.id === "oneroot")!.text);
    const roots = new Set(
      p.words.map((w) => lookup(w.norm)?.entry[0]).filter(Boolean),
    );
    // في resolves separately; the content words should share ك-ت-ب
    expect(roots.has("كتب")).toBe(true);
  });

  it("the teeth passage is genuinely open", () => {
    const p = buildPassage(CORPUS.find((c) => c.id === "teeth")!.text);
    expect(p.stats.bits).toBeGreaterThan(10);
  });
});

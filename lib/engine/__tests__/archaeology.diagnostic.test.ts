/**
 * DIAGNOSTIC — architecture archaeology pass.
 *
 * This file asserts nothing about what the engine SHOULD do. It runs existing
 * mechanisms and prints what they actually do, so that the claims in
 * docs/architecture-*.md are reproducible rather than asserted.
 *
 *   npx vitest run lib/engine/__tests__/archaeology.diagnostic.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  parseWord, expand, degree, arity, profileOf, collapse, solveByWeight,
  weightOf, buildInvarianceTable, sampleWords, channels, rowSignature,
  isNewChannel, observables, transforms, layers, constants,
} from "../index";
import { teleport, allExits, CHANNELS } from "../teleport";
import { OPERATIONS } from "../operations";
import { CONSTRAINTS, suggest, metricsOf, type RootOption } from "../compose";
import { read, readMany } from "../reader";
import { timeline, futures } from "../timeline";
import { abstractWord, candidateRoots, applyPattern, PATTERN_BY_ID } from "../patterns";
import { getLexicon } from "../lexicon";
import { scan } from "../layers/band3";
import { wordFromLetters } from "../text";
import { buildPassage } from "../passage";
import { OP_BY_ID } from "../operations";
import { intervals, shiftLetter, hijaiAddress } from "../layers/band1";
import { isPalindrome, isUnmovable } from "../layers/band4";
import { shuffled, mulberry32 } from "../layers/helpers";

const log = (...xs: unknown[]) => console.log(...xs);

describe("DIAGNOSTIC: inventory", () => {
  it("counts what the runtime declares about itself", () => {
    const obs = observables();
    const trs = transforms();
    log("\n[INVENTORY]");
    log("layers registered      :", layers().length);
    log("observables registered :", obs.length, "→", obs.map((o) => o.id).join(", "));
    log("transforms registered  :", trs.length, "→", trs.map((t) => t.id).join(", "));
    log("passage operations     :", OPERATIONS.length, "→", OPERATIONS.map((o) => o.id).join(", "));
    log("compose constraints    :", CONSTRAINTS.length, "→", CONSTRAINTS.map((c) => c.id).join(", "));
    log("teleport channels      :", CHANNELS.length, "→", CHANNELS.map((c) => c.id).join(", "));
    log("layer-20 constants     :", constants().length);
    expect(obs.length + trs.length).toBeGreaterThan(0);
  });
});

describe("DIAGNOSTIC: E1 — A → operation → B → observable → constraint → C", () => {
  it("traces كتب through existing machinery only", () => {
    const A = parseWord("كتب");
    const B = expand(A, 5000);
    const target = weightOf(A.letters);
    const C = solveByWeight(A, target);
    log("\n[E1]");
    log("STATE A     :", A.letters.join(""), "skeleton", A.skeleton, "arity", arity(A), "degree", degree(A));
    log("OPERATION   : expand(word, 5000)  [lib/engine/text.ts]");
    log("STATE B     :", B.candidates.length, "candidates, truncated =", B.truncated);
    log("OBSERVABLE  : weightOf(letters) =", target, "[lib/engine/layers/band3.ts]");
    log("CONSTRAINT  : solveByWeight(word, target) [lib/engine/collapse.ts]");
    log("STATE C     :", C.join(", "), `(${C.length} of ${B.candidates.length})`);
    log("B==degree   :", B.candidates.length === degree(A));
    log("A ∈ C       :", C.includes(A.letters.join("")));
  });

  it("traces the same word through collapse(), step by step", () => {
    const w = parseWord("كتب");
    const c = collapse(w);
    log("\n[E1b] collapse(parseWord('كتب')) — lexicon:", getLexicon().name);
    log("degree", c.degree, "initial", c.initial.length, "truncated", c.truncated);
    for (const s of c.steps) {
      log(
        `  ${s.rank} ${s.id.padEnd(14)} ${String(s.before).padStart(4)} → ${String(s.after).padStart(4)}` +
          (s.skipped ? `  SKIPPED: ${s.skipReason}` : `  removed ${s.removed.length} recorded`),
      );
    }
    log("survivors", c.survivors.join(", "), "| terminal", c.terminal, "| targetSurvived", c.targetSurvived);
    log("totalCost", JSON.stringify(c.totalCost));
  });
});

describe("DIAGNOSTIC: E2 — bounds and truncation", () => {
  it("reports which words exceed the expansion cap", () => {
    log("\n[E2] word | degree | expand(cap=5000).length | truncated");
    for (const t of ["كتب", "مال", "نبين", "تبيين", "بين يديه", "استكتب", "كهيعص"]) {
      for (const raw of t.split(" ")) {
        const w = parseWord(raw);
        const e = expand(w, 5000);
        log(
          `  ${raw.padEnd(8)} ${String(degree(w)).padStart(7)} ${String(e.candidates.length).padStart(7)}  ${e.truncated}`,
        );
      }
    }
  });

  it("reports the four distinguishable outcome states of collapse", () => {
    log("\n[E2b] terminal states observed");
    for (const raw of ["كتب", "مال", "نبين", "كهيعص", "علم"]) {
      const c = collapse(parseWord(raw));
      const lexStep = c.steps.find((s) => s.id === "lexical")!;
      log(
        `  ${raw.padEnd(7)} degree ${String(c.degree).padStart(6)} survivors ${String(c.survivors.length).padStart(5)}` +
          ` terminal ${c.terminal.padEnd(11)} lexicalSkipped=${lexStep.skipped}` +
          (lexStep.skipReason ? ` (${lexStep.skipReason.slice(0, 48)}…)` : ""),
      );
    }
  });
});

describe("DIAGNOSTIC: E3 — traversal: can a destination be re-entered as a state?", () => {
  it("chains teleport twice without inventing an operation", () => {
    const A = parseWord("كتب");
    const exits = allExits(A);
    log("\n[E3] exits from كتب:", exits.map((j) => `${j.channel}@${j.address}→${j.destinations.length}`).join("  "));
    const first = exits.find((j) => j.destinations.length > 0);
    if (!first) { log("  no exits"); return; }
    const B = parseWord(first.destinations[0]);
    log("  step 1:", A.letters.join(""), `--${first.channel}-->`, B.letters.join(""));
    const exits2 = allExits(B);
    const second = exits2.find((j) => j.destinations.length > 0);
    log("  step 2:", B.letters.join(""), second ? `--${second.channel}--> ${second.destinations[0]}` : "(dead end)");
    log("  input type  : Word");
    log("  output type : string[] (destinations) — re-parse required to continue");
  });
});

describe("DIAGNOSTIC: E4 — invariance table, determinism and channels", () => {
  it("builds the table twice and compares", () => {
    const a = buildInvarianceTable(sampleWords(150));
    const b = buildInvarianceTable(sampleWords(150));
    const sig = (t: typeof a) => t.cells.map((c) => `${c.observableId}|${c.transformId}|${c.verdict}`).join(";");
    log("\n[E4] cells", a.cells.length, "identical across two builds:", sig(a) === sig(b));
    log("  rows:");
    for (const o of a.observables) {
      log(`    ${o.id.padEnd(16)} L${String(o.layer).padStart(2)}  ${rowSignature(a, o.id)}`);
    }
    log("  columns:", a.transforms.map((t) => `${t.id}(L${t.layer})`).join(", "));
    const g = channels(a);
    log("  distinct channels:", g.length);
    for (const c of g) log(`    ${c.signature}  ${c.observableIds.join(", ")}`);
    expect(sig(a)).toBe(sig(b));
  });

  it("runs the discovery detector on a candidate observable", () => {
    const table = buildInvarianceTable(sampleWords(150));
    const candidate = {
      id: "diagnostic:firstLetter", layer: 99,
      label: { en: "First letter", ar: "" }, discards: "everything but the first letter",
      compute: (w: { letters: string[] }) => w.letters[0] ?? "",
      serialize: (v: string) => v, display: (v: string) => v,
      cost: () => ({ marks: 0, counts: 1, held: 1 }),
    };
    const r = isNewChannel(table, candidate as never, sampleWords(150));
    log("\n[E4b] isNewChannel(firstLetter) →", JSON.stringify(r));
  });
});

describe("DIAGNOSTIC: E5 — provenance: can a result be reconstructed?", () => {
  it("reader readings are deterministic in (text, n)", () => {
    const a = readMany("إفتح سمسم", 0, 12).map((r) => `${r.layer}/${r.op}/${r.title}`);
    const b = readMany("إفتح سمسم", 0, 12).map((r) => `${r.layer}/${r.op}/${r.title}`);
    log("\n[E5] read() identical across runs:", JSON.stringify(a) === JSON.stringify(b));
    const one = read("إفتح سمسم", 5)!;
    log("  reading n=5 fields:", Object.keys(one).join(", "));
    log("  carries input text? ", "subject" in one, "→", one.subject);
    log("  carries n?          ", "n" in one, "→", one.n);
    log("  carries rng seed?   ", "seed" in one);
    expect(a).toEqual(b);
  });

  it("passage operations record what they preserved and lost", () => {
    log("\n[E5b] OpResult fields per operation");
    log("  id | scope | kind | layer | readable | options");
    for (const o of OPERATIONS) {
      log(`  ${o.id.padEnd(12)} ${o.scope.padEnd(9)} ${o.kind.padEnd(8)} L${String(o.layer).padStart(2)} ${String(o.readable).padEnd(5)} ${o.options ? o.options.id : "—"}`);
    }
  });

  it("collapse records removals but caps them", () => {
    const c = collapse(parseWord("نبين"));
    log("\n[E5c] collapse('نبين')");
    for (const s of c.steps) {
      log(`  ${s.id.padEnd(14)} before ${String(s.before).padStart(5)} after ${String(s.after).padStart(5)} removed recorded ${s.removed.length} (actual ${s.before - s.after})`);
    }
  });
});

describe("DIAGNOSTIC: E6 — candidate generation and filtering outside collapse", () => {
  it("suggest() generates (root × pattern) and filters by constraint", () => {
    const R = (root: string): RootOption => ({ root, display: root, glosses: [], count: 1 });
    const roots = ["كتب", "درس", "علم", "حكم", "نظر", "قدر"].map(R);
    for (const c of ["free", "determined", "unmoved", "weight"] as const) {
      const target = c === "weight" ? metricsOf("مكتب").weight : undefined;
      const s = suggest(roots, c, { pieces: [], target }, 24);
      log(`\n[E6] suggest(${roots.length} roots × ${Object.keys(PATTERN_BY_ID).length} patterns, "${c}"${target ? `, target ${target}` : ""}) → ${s.length}`);
      log("     ", s.slice(0, 8).map((x) => `${x.word}(${x.weight})`).join(" "));
    }
  });

  it("abstractWord() generates every (pattern, root) alignment", () => {
    for (const w of ["مكتوب", "مكتب", "استكتب", "كتب"]) {
      const a = abstractWord([...w]);
      log(`\n[E6b] abstractWord("${w}") → ${a.length} alignments; roots ${candidateRoots([...w]).map((r) => r.join("")).join(", ")}`);
      log("      ", a.map((x) => `${x.pattern.id}:${x.root.join("")}`).join(" "));
    }
  });
});

describe("DIAGNOSTIC: E7 — timeline as a state sequence", () => {
  it("prints the four stops", () => {
    log("\n[E7] timeline('كَتَبَ')");
    for (const s of timeline("كَتَبَ")) {
      log(`  era ${s.era} ${s.label.padEnd(12)} surface "${s.surface}" denotes ${s.denotes}`);
    }
    const f = futures("كتب");
    log("  futures('كتب'): total", f.total, "returned", f.words.length, "truncated", f.truncated);
  });
});

describe("DIAGNOSTIC: E8 — what a truncated candidate set does downstream", () => {
  it("shows the cap excluding the true reading and collapse calling it corrupt", () => {
    const raw = "تبيينيين";
    const w = parseWord(raw);
    const e = expand(w, 5000);
    log("\n[E8]", raw, "degree", degree(w), "capped", e.candidates.length, "truncated", e.truncated);
    log("  target in capped set:", e.candidates.includes(w.letters.join("")));
    log("  first candidate:", e.candidates[0], " last candidate:", e.candidates[e.candidates.length - 1]);
    const c = collapse(w);
    log("  collapse: initial", c.initial.length, "degree", c.degree, "terminal", c.terminal,
        "targetSurvived", c.targetSurvived, "truncated", c.truncated);
    log("  → NOT EXPLORED is reported here with the same terminal value as INVALID");
  });

  it("shows the reader narrating a capped sample as if it were exhaustive", () => {
    for (let n = 0; n < 120; n++) {
      const r = read("تبيينيين", n);
      if (r && r.layer === 10 && r.op === "solve") {
        log("\n[E8b] n =", n, "| title:", r.title);
        log("  body:", r.body.slice(0, 240));
        log("  true degree:", degree(parseWord("تبيينيين")), "| sample size used by that generator: 3000");
        break;
      }
    }
  });
});

describe("DIAGNOSTIC: E9 — the pulse row of the invariance table", () => {
  it("shows the pulse channel is undefined over the invariance sample", () => {
    const sample = sampleWords(10);
    log("\n[E9] sampleWords voweled flags:", sample.map((w) => w.voweled).join(","));
    log("  scan() over the first five:", sample.slice(0, 5).map((w) => String(scan(w))).join(" | "));
    log("  scan(parseWord('كَتَبَ')) =", scan(parseWord("كَتَبَ")));
    log("  transforms rebuild with wordFromLetters(), which drops marks:",
        String(scan(wordFromLetters(parseWord("كَتَبَ").letters))));
    const table = buildInvarianceTable(sampleWords(50));
    log("  reported pulse row:", rowSignature(table, "pulse"), "(1 = invariant)");
    log("  → the row is a measurement of ∅ against ∅, not a demonstrated invariance");
  });
});

describe("DIAGNOSTIC: E10 — passage-level operations on a passage built without the lexicon", () => {
  it("checks the silent operation's skeleton claim and the honest-degradation path", () => {
    const p = buildPassage("العلم نور والجهل ظلام");
    const r = OP_BY_ID.silent.apply(p);
    const before = p.words.map((w) => w.skeleton).join(" ");
    const after = r.changes.map((c) => parseWord(c.to).skeleton).join(" ");
    log("\n[E10] silent: skeleton before", before, "| after", after, "| identical", before === after);
    log("  coverage", JSON.stringify(r.coverage), "| preserved", r.preserved.join("/"), "| lost", r.lost.join("/"));
    const rev = OP_BY_ID.reverse.apply(buildPassage("العلم نور"));
    const wb = buildPassage("العلم نور").words.reduce((a, w) => a + w.weight, 0);
    const wa = rev.changes.reduce((a, c) => a + weightOf([...c.to]), 0);
    log("  reverse: weight", wb, "→", wa, "| equal", wb === wa);
    for (const id of ["sameSkeleton", "sameWeight", "roots", "taqlib", "gloss"]) {
      const x = OP_BY_ID[id].apply(buildPassage("العلم نور"));
      log(`  ${id.padEnd(13)} acted ${x.coverage.acted}/${x.coverage.total} — unresolved notes: ${
        x.changes.filter((c) => c.unresolved).length}`);
    }
  });
});

describe("DIAGNOSTIC: E11 — the interval row, and how a verdict is decided", () => {
  it("locates why 'intervals' is reported as changing under shift1", () => {
    let wrap = 0, nonWrap = 0, total = 0;
    for (const w of sampleWords(200)) {
      const before = intervals(w);
      const after = intervals(wordFromLetters(w.letters.map((l) => shiftLetter(l, 1))));
      total++;
      if (before.join(",") !== after.join(",")) {
        if (w.letters.some((l) => hijaiAddress(l) === 28)) wrap++; else nonWrap++;
      }
    }
    log("\n[E11] over", total, "sample words: differ with a ring-boundary letter =", wrap,
        "| differ without one =", nonWrap);
    const a = parseWord("كتب"), b = parseWord("كتي");
    log("  كتب", intervals(a).join(","), "→", intervals(wordFromLetters(a.letters.map((l) => shiftLetter(l, 1)))).join(","));
    log("  كتي", intervals(b).join(","), "→", intervals(wordFromLetters(b.letters.map((l) => shiftLetter(l, 1)))).join(","),
        "  (ي is address 28; shiftLetter wraps mod 28, the difference does not)");
    expect(nonWrap).toBe(0);
  });

  it("shows a verdict is existential: the first differing word ends the trial", () => {
    const t = buildInvarianceTable(sampleWords(200));
    const c = t.get("intervals", "shift1")!;
    log("\n[E11b] intervals × shift1 →", JSON.stringify({ verdict: c.verdict, trials: c.trials, witness: c.witness }));
    log("  invariance.ts:223-235 breaks on the first difference, so `trials` is a counter, not a sample size");
  });
});

describe("DIAGNOSTIC: E12 — the muqaṭṭaʿāt through the morphological filter", () => {
  it("shows 'no template aligns' arriving at the same terminal as 'corrupt'", () => {
    log("\n[E12] word | degree | alignments | morph before→after | skipped | terminal | targetSurvived");
    for (const raw of ["كهيعص", "الم", "طه", "حم", "يس"]) {
      const c = collapse(parseWord(raw));
      const m = c.steps.find((s) => s.id === "morphological")!;
      log(
        `  ${raw.padEnd(7)} ${String(c.degree).padStart(4)} ${String(abstractWord([...raw]).length).padStart(4)}` +
          `   ${String(m.before).padStart(4)}→${String(m.after).padStart(4)}   ${String(m.skipped).padEnd(5)}` +
          `  ${c.terminal.padEnd(11)} ${c.targetSurvived}`,
      );
    }
    log("  collapse.ts:84-91 gives the LEXICAL filter a self-ignorance fallback; the morphological filter has none");
  });
});

describe("DIAGNOSTIC: E13 — how thin the invariance sample is for rare properties", () => {
  it("counts palindromes and unmovable words in the sample the table is built on", () => {
    const s = sampleWords(400);
    const pal = s.filter((w) => isPalindrome(w.letters)).length;
    const unm = s.filter((w) => isUnmovable(w)).length;
    log("\n[E13] sampleWords(400): palindromes", pal, "| unmovable", unm,
        "| reading 'none' on both:", s.filter((w) => !isPalindrome(w.letters) && !isUnmovable(w)).length);
    const p = wordFromLetters([..."كتك"]);
    const flips = [1, 2, 3, 4, 5, 6].map((seed) => {
      const q = wordFromLetters(shuffled(p.letters, mulberry32(seed)));
      return `${q.letters.join("")}=${isPalindrome(q.letters)}`;
    });
    log("  كتك is a palindrome; permuting it:", flips.join(" "));
    log("  → 'fixedUnder' IS sensitive to permutation, but the sample almost never contains a word that would show it");
  });
});

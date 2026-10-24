/**
 * WAZNOMIA DETERMINATION HARNESS — contribution to the WAZNOMIA header.
 *
 * Runs the header's Arabic determinations through the existing engine so that
 * docs/waznomia/appendices.md shows derivations rather than assertions.
 * It asserts only what it claims in the appendices; everything else it prints.
 *
 *   npx vitest run lib/engine/__tests__/waznomia.determinations.test.ts
 */

import { describe, it, expect } from "vitest";
import { parseWord, degree, arity, expand, profileOf } from "../text";
import { weightOf, reduceValue, scan, footOrbits, rootSpace, silentSubstitution } from "../layers/band3";
import { PATTERNS, PATTERN_BY_ID, applyPattern, abstractWord, candidateRoots, fibre } from "../patterns";
import { getRoot, allRoots } from "../lexdata";
import { UNMOVED, CLASS_OF, ABJAD_VALUE } from "../alphabet";
import { mulberry32 } from "../layers/helpers";
import { OP_BY_ID } from "../operations";
import { buildInvarianceTable, sampleWords, rowSignature } from "../invariance";

const log = (...x: unknown[]) => console.log(...x);
const norm = (s: string) => parseWord(s).letters.join("");

/** The header's §2 determinations, as the header states them. */
const HEADER: { term: string; root: string; claim: string; pattern?: string }[] = [
  { term: "كسر",      root: "كسر", claim: "masdar of كسر — a breaking",            pattern: "I" },
  { term: "معادلة",   root: "عدل", claim: "Form III of عدل — a balancing",         pattern: "masdarIII" },
  { term: "تشاكل",    root: "شكل", claim: "Form VI of شكل — mutual form",           pattern: "VI" },
  { term: "تكامل",    root: "كمل", claim: "Form VI of كمل — mutual completion",     pattern: "VI" },
  { term: "تماثل",    root: "مثل", claim: "Form VI of مثل — mutual likeness",       pattern: "VI" },
  { term: "تزامن",    root: "زمن", claim: "Form VI of زمن — mutual timing",         pattern: "VI" },
  { term: "تساهم",    root: "سهم", claim: "Form VI of سهم — mutual sharing",        pattern: "VI" },
  { term: "اشتقاق",   root: "شقق", claim: "Form VIII masdar of شق — a drawing-off", pattern: "masdarVIII" },
  { term: "محفز",     root: "حفز", claim: "Form II participle — the inciter",       pattern: "agentII" },
  { term: "مصرف",     root: "صرف", claim: "Form II participle — the conjugator",    pattern: "agentII" },
  { term: "تشكل",     root: "شكل", claim: "Form V of شكل — gradual self-forming",   pattern: "V" },
  { term: "مصفوف",    root: "صفف", claim: "passive participle of صف — rows in ranks", pattern: "patient" },
  { term: "حلقة",     root: "حلق", claim: "a ring",                                 pattern: "unit" },
  { term: "بصمة",     root: "بصم", claim: "a fingerprint",                          pattern: "unit" },
  { term: "جبر",      root: "جبر", claim: "restoration",                            pattern: "I" },
  { term: "دالة",     root: "دلل", claim: "participle of دل — the indicator",        pattern: "agent" },
  { term: "متغير",    root: "غير", claim: "Form V participle — self-changing" },
  { term: "جزيء",     root: "جزء", claim: "diminutive of جزء — a little part" },
  { term: "أولي",     root: "اول", claim: "the first ones (nisba)" },
  { term: "عودية",    root: "عود", claim: "the returning (nisba)" },
  { term: "عنصر",     root: "عنصر", claim: "the constituent stock (quadriliteral)" },
  { term: "حمض",      root: "حمض", claim: "the sour taste — a property, directly" },
  { term: "جذر",      root: "جذر", claim: "root, of a number and of a word" },
];

// ---------------------------------------------------------------------------

describe("A1 — regeneration audit (header §7 step 5) over the header's own §2", () => {
  it("re-derives each name from its claimed root and operator", () => {
    log("\n[A1] term | normalised | claimed pattern | regenerated | exact? | alignments found");
    let ok = 0, fail = 0, noPattern = 0;
    for (const h of HEADER) {
      const n = norm(h.term);
      const al = abstractWord([...n]);
      if (!h.pattern) {
        noPattern++;
        log(`  ${h.term.padEnd(8)} ${n.padEnd(8)} ${"(none in library)".padEnd(18)} ${"—".padEnd(10)} —      ${al.length}`);
        continue;
      }
      const p = PATTERN_BY_ID[h.pattern];
      const regen = applyPattern(p, [...norm(h.root)].slice(0, 3));
      const exact = regen === n;
      if (exact) ok++; else fail++;
      log(`  ${h.term.padEnd(8)} ${n.padEnd(8)} ${(h.pattern + " " + p.template).padEnd(18)} ${(regen || "∅").padEnd(10)} ${String(exact).padEnd(6)} ${al.length}`);
    }
    log(`  regenerates exactly: ${ok} | fails: ${fail} | no operator in the 35-pattern library: ${noPattern}`);
    expect(ok + fail + noPattern).toBe(HEADER.length);
  });

  it("names the failure classes", () => {
    log("\n[A1b] failure classes");
    const dalla = applyPattern(PATTERN_BY_ID.agent, [..."دلل"]);
    log(`  geminate root: applyPattern(agent, د-ل-ل) = "${dalla}" but the attested name is "دالة" → normalised "${norm("دالة")}"`);
    log(`    abstractWord("${norm("دالة")}") → ${abstractWord([...norm("دالة")]).length} alignments`);
    log(`  missing operator (Form V participle): abstractWord("${norm("متغير")}") → ${abstractWord([...norm("متغير")]).length} alignments`);
    log(`  vocalic-only operator (diminutive):   abstractWord("${norm("جزيء")}") → ${abstractWord([...norm("جزيء")]).length} alignment(s) — see A13c, فُعَيْل and فَعِيل share one consonantal template`);
    log(`  missing operator (nisba):             abstractWord("${norm("عودية")}") → ${abstractWord([...norm("عودية")]).length} alignments`);
    log(`  quadriliteral root:                   abstractWord("${norm("عنصر")}") → ${abstractWord([...norm("عنصر")]).length} alignments`);
    log(`  ة→ه fold required: "معادلة" normalises to "${norm("معادلة")}"; masdarIII over عدل = "${applyPattern(PATTERN_BY_ID.masdarIII, [..."عدل"])}"`);
    expect(abstractWord([...norm("متغير")]).length).toBe(0);
  });
});

describe("A2 — every name's ambiguity under the rasm (Layers 4, 5)", () => {
  it("computes arity, degree and bits withheld for each term", () => {
    log("\n[A2] term | rasm | arity | degree | bits | weight | profile | all-unmoved?");
    const rows: { term: string; degree: number }[] = [];
    for (const h of HEADER) {
      const w = parseWord(h.term);
      const d = degree(w);
      rows.push({ term: h.term, degree: d });
      const unmoved = w.letters.every((l) => (CLASS_OF[l]?.length ?? 1) === 1);
      log(
        `  ${h.term.padEnd(8)} ${w.skeleton.padEnd(9)} ${String(arity(w)).padStart(5)} ${String(d).padStart(6)}` +
        ` ${Math.log2(d).toFixed(2).padStart(6)} ${String(weightOf(w.letters)).padStart(6)} (${profileOf(w).join(",")})`.padEnd(22) +
        ` ${unmoved}`,
      );
    }
    const det = rows.filter((r) => r.degree === 1);
    log(`  fully determined by the rasm alone: ${det.length} of ${rows.length}${det.length ? " → " + det.map((d) => d.term).join(" ") : ""}`);
    log(`  the unmoved six: ${UNMOVED.join(" ")}`);
  });
});

describe("A3 — the wazn tri-unity, tested (header §25-28, 'the first determination')", () => {
  it("tests each of the three senses for recoverability from the written name", () => {
    const bare = "معادلة", pointed = "مُعَادَلَة";
    log("\n[A3] the three senses of وزن, against one name");
    const b = parseWord(bare), p = parseWord(pointed);
    log(`  sense 1 — pattern (قالب):  abstractWord("${norm(bare)}") → ${abstractWord([...norm(bare)]).length} alignment(s): ${abstractWord([...norm(bare)]).map((a) => a.pattern.id).join(", ") || "none"}`);
    log(`  sense 2 — weight (وزن عددي): weightOf = ${weightOf(b.letters)}, reduction ${reduceValue(weightOf(b.letters))}  [total over all 28 letters, always defined]`);
    log(`  sense 3 — meter (عروض):     scan("${bare}") = ${scan(b)}   voweled=${b.voweled}`);
    log(`                               scan("${pointed}") = ${scan(p)}   voweled=${p.voweled}`);
    log("  → senses 1 and 2 are computable from the written name; sense 3 requires marks the rasm does not carry.");
    expect(scan(b)).toBeNull();
    expect(scan(p)).not.toBeNull();
    log("\n  the same test across every pointed term the header itself writes:");
    for (const t of ["جُزَيء", "حَمْض", "محفِّز", "التشكّل", "متغيِّر", "مُعَادَلَة"]) {
      const w = parseWord(t);
      log(`    ${t.padEnd(10)} voweled=${String(w.voweled).padEnd(5)} pulse=${scan(w) ?? "∅"}`);
    }
  });
});

describe("A4 — the operator table has internal algebra (Layer 14)", () => {
  it("finds which templates are prefix-extensions of other templates", () => {
    log("\n[A4] template factorisation — computed over all 35 patterns");
    const found: string[] = [];
    for (const a of PATTERNS) for (const b of PATTERNS) {
      if (a.id === b.id) continue;
      if (a.template.length > b.template.length && a.template.endsWith(b.template)) {
        const pre = a.template.slice(0, a.template.length - b.template.length);
        if ([...pre].every((c) => !"123".includes(c))) {
          found.push(`${a.id}(${a.template}) = "${pre}" + ${b.id}(${b.template})`);
        }
      }
    }
    for (const f of found) log("  " + f);
    log(`  ${found.length} factorisations found`);
    log(`  VI === "ت" + III : ${PATTERN_BY_ID.VI.template === "ت" + PATTERN_BY_ID.III.template}`);
    log(`  V  === "ت" + II  : ${PATTERN_BY_ID.V.template === "ت" + PATTERN_BY_ID.II.template}`);
    expect(PATTERN_BY_ID.VI.template).toBe("ت" + PATTERN_BY_ID.III.template);
    expect(PATTERN_BY_ID.V.template).toBe("ت" + PATTERN_BY_ID.II.template);
  });

  it("shows Form III and the agent participle are one template, hence indistinguishable", () => {
    const ad = abstractWord([..."عادل"]);
    log("\n[A4b] abstractWord(\"عادل\") →", ad.map((a) => `${a.pattern.id}:${a.root.join("")}`).join("  "));
    log(`  III template "${PATTERN_BY_ID.III.template}" vs agent template "${PATTERN_BY_ID.agent.template}" — identical: ${PATTERN_BY_ID.III.template === PATTERN_BY_ID.agent.template}`);
    log("  → name → operator is a RELATION, not a function: the fibre has more than one member.");
    expect(PATTERN_BY_ID.III.template).toBe(PATTERN_BY_ID.agent.template);
    log(`  library has no separate masdar for Form VI: verb تفاعل and masdar تفاعُل share one consonantal skeleton`);
    log(`    scan-free comparison: norm("تفاعل") = "${norm("تفاعل")}" ; norm("تفاعُل") = "${norm("تفاعُل")}" ; equal: ${norm("تفاعل") === norm("تفاعُل")}`);
    expect(norm("تفاعل")).toBe(norm("تفاعُل"));
  });
});

describe("A5 — the Form VI law, tested against the header's own §2", () => {
  it("counts the header's relational terms by form", () => {
    log("\n[A5] relational terms the header names, and the form each actually carries");
    const relational = ["تشاكل", "تكامل", "تماثل", "تزامن", "تساهم", "معادلة"];
    for (const t of relational) {
      const al = abstractWord([...norm(t)]);
      log(`  ${t.padEnd(8)} → ${al.map((a) => a.pattern.id).join(", ") || "no alignment"}`);
    }
    log("  counterexample inside the header: معادلة is relational by the header's own gloss");
    log("    (\"a balancing between two sides\") and is NOT Form VI.");
    log(`  the medial ا is present in BOTH: III="${PATTERN_BY_ID.III.template}" VI="${PATTERN_BY_ID.VI.template}"`);
  });
});

describe("A6 — the dotless projection destroys the operator letters", () => {
  it("shows the Form V/VI prefix ت is tooth-class and therefore silently substitutable", () => {
    log("\n[A6] the reflexive/mutual prefix under the rasm");
    log(`  CLASS_OF["ت"] = ${CLASS_OF["ت"].join(" ")}   (the tooth)`);
    const pairs: [string, string][] = [["تشاكل", "بشاكل"], ["تكامل", "نكامل"], ["تزامن", "يزامن"]];
    for (const [a, b] of pairs) {
      const wa = parseWord(a), wb = parseWord(b);
      log(`  ${a} → ${wa.skeleton}   |   ${b} → ${wb.skeleton}   identical rasm: ${wa.skeleton === wb.skeleton}`);
      expect(wa.skeleton).toBe(wb.skeleton);
    }
    const w = parseWord("تشاكل");
    const cands = expand(w, 5000);
    log(`  تشاكل: degree ${degree(w)}, candidates enumerated ${cands.candidates.length}, truncated ${cands.truncated}`);
    log(`    first slot domain: ${w.glyphs[0].domain.join(" ")}`);
    log("  → under the rasm the mutual operator is recoverable only up to its shape class.");
  });

  it("shows what a silent substitution does to a whole determination", () => {
    const map = silentSubstitution(mulberry32(0x5eed));
    log("\n[A6b] one element of the silent subgroup, applied to the header's §2 terms");
    log("  term | after | rasm before | rasm after | same rasm? | weight before → after");
    for (const t of ["تشاكل", "محفز", "معادلة", "مصفوف"]) {
      const before = parseWord(t);
      const after = parseWord(before.letters.map((l) => map[l] ?? l).join(""));
      log(
        `  ${t.padEnd(8)} ${after.letters.join("").padEnd(8)} ${before.skeleton.padEnd(10)} ${after.skeleton.padEnd(10)}` +
        ` ${String(before.skeleton === after.skeleton).padEnd(6)} ${weightOf(before.letters)} → ${weightOf(after.letters)}`,
      );
      expect(after.skeleton).toBe(before.skeleton);
    }
  });
});

describe("A7 — weight is an orbit address, not a name (Layers 9, 10)", () => {
  it("shows every permutation of a root carries the same weight", () => {
    log("\n[A7] weight under permutation");
    const perms = (s: string[]) => [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]].map((p) => p.map((i) => s[i]).join(""));
    for (const r of ["عدل", "شكل", "كسر"]) {
      const ws = perms([...r]).map((p) => `${p}=${weightOf([...p])}`);
      log(`  ${r}: ${ws.join("  ")}`);
      const uniq = new Set(perms([...r]).map((p) => weightOf([...p])));
      expect(uniq.size).toBe(1);
    }
    const t = buildInvarianceTable(sampleWords(150));
    log(`  invariance row for "weight":   ${rowSignature(t, "weight")}  (columns: reflect shift1 silent shift3 permute reverse)`);
    log(`  invariance row for "multiset": ${rowSignature(t, "multiset")}`);
    log(`  invariance row for "skeleton": ${rowSignature(t, "skeleton")}`);
    log("  → weight addresses the letter-multiset, i.e. the whole permutation orbit, never the name.");
  });

  it("enumerates the root space the nomenclature is drawn from", () => {
    const tri = rootSpace(3), quad = rootSpace(4);
    log("\n[A7b] the space of triliteral roots");
    log(`  ordered triliteral roots: ${tri.ordered.toLocaleString()}   unordered orbits: ${tri.orbits.toLocaleString()}`);
    log(`  ordered quadriliteral:    ${quad.ordered.toLocaleString()}   orbits: ${quad.orbits.toLocaleString()}`);
    log(`  roots attested in the engine's Quranic corpus: ${allRoots().length.toLocaleString()}`);
    expect(tri.orbits).toBe(3276);
  });
});

describe("A8 — taqlīb as a nomenclature neighbourhood (Layer 9)", () => {
  it("lists the attested permutations of each term's root", () => {
    log("\n[A8] taqlīb over the header's roots, against the engine's Quranic corpus");
    const perms = (s: string) => [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]
      .map((p) => p.map((i) => [...s][i]).join("")).filter((c) => c !== s);
    for (const r of ["عدل", "شكل", "كمل", "مثل", "زمن", "حفز", "صرف", "سهم", "كسر", "جبر", "جذر"]) {
      const hits = perms(r).map((c) => ({ c, e: getRoot(c) })).filter((x) => x.e);
      log(
        `  ${r} (${getRoot(r) ? "attested" : "not in corpus"}) → ${
          hits.length ? hits.map((h) => `${h.e!.d}[${h.e!.g.slice(0, 2).join("/")}]`).join("  ") : "no permutation attested"
        }`,
      );
    }
    log("  bound: 6 orderings per triliteral root, exhaustive, no cap — the one provably complete enumeration in the engine.");
  });
});

describe("A9 — §1's lexicography claim, with a measured cost", () => {
  it("prices root-keyed indexing against a scan", () => {
    log("\n[A9] المعاجم as root-keyed indexing");
    log(`  roots in the index: ${allRoots().length.toLocaleString()}`);
    const r = getRoot("علم");
    log(`  getRoot("علم") → display ${r?.d}, occurrences ${r?.n}, glosses ${r?.g.slice(0, 3).join("/")}, lemmas ${r?.l.length}`);
    log(`  fibre over ك-ت-ب from the 35-pattern library: ${fibre([..."كتب"]).slice(0, 8).map((f) => f.word).join(" ")}`);
    log("  index cost 1 lookup vs scan cost = corpus size — the header's 'address first, definitions after' is measurable.");
  });

  it("confirms §1's rhetoric claim by locating الجناس الخطي in the engine", () => {
    log("\n[A9b] البديع as string operations — already an operation in the engine");
    const op = OP_BY_ID.sameSkeleton;
    log(`  operation id "${op.id}" is named: en="${op.name.en}" ar="${op.name.ar}"  (layer ${op.layer})`);
    log(`  note: ${op.note}`);
    expect(op.name.ar).toBe("الجناس الخطي");
  });
});

describe("A10 — the meter space, counted", () => {
  it("computes the rotation orbits of the eight feet", () => {
    const o = footOrbits();
    log("\n[A10] al-Khalīl's rotation, computed rather than tabulated");
    log(`  eight tafāʿīl fall into ${o.length} rotation orbits:`);
    for (const fam of o) log(`    ${fam.join(" ↔ ")}`);
    expect(o.length).toBe(3);
    expect(o.flat()).toHaveLength(8);
  });
});

describe("A11 — the fibre of each determination (the grade input)", () => {
  it("lists every (pattern, root) pair consistent with each written name", () => {
    log("\n[A11] name | fibre size | the whole fibre");
    const sizes: number[] = [];
    for (const h of HEADER) {
      const n = norm(h.term);
      const al = abstractWord([...n]);
      sizes.push(al.length);
      log(`  ${h.term.padEnd(8)} ${String(al.length).padStart(2)}  ${al.map((a) => `${a.pattern.id}:${a.root.join("")}`).join("  ") || "— (empty fibre: the library is silent)"}`);
    }
    const hist = new Map<number, number>();
    for (const s of sizes) hist.set(s, (hist.get(s) ?? 0) + 1);
    log("  fibre-size distribution: " + [...hist.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}→${v} terms`).join(", "));
    log(`  single-valued determinations: ${sizes.filter((s) => s === 1).length} of ${sizes.length}`);
    log(`  multi-valued:                 ${sizes.filter((s) => s > 1).length}`);
    log(`  empty fibre (library silent):  ${sizes.filter((s) => s === 0).length}`);
  });

  it("shows the three-way template collision behind محفز", () => {
    for (const t of ["محفز", "مصرف", "داله"]) {
      log(`\n[A11b] ${t} → ${abstractWord([...norm(t)]).map((a) => `${a.pattern.id}(${a.pattern.name}, ${a.pattern.meaning})`).join("  |  ")}`);
    }
    log("  agentII / patientII / place all carry template م123 — one skeleton, three functions.");
    expect(PATTERN_BY_ID.agentII.template).toBe(PATTERN_BY_ID.place.template);
  });

  it("records the library's own collisions, as a limit on decidability", () => {
    const byT = new Map<string, string[]>();
    for (const p of PATTERNS) byT.set(p.template, [...(byT.get(p.template) ?? []), p.id]);
    log("\n[A11c] templates carrying more than one declared operator");
    for (const [t, ids] of [...byT.entries()].filter(([, ids]) => ids.length > 1)) {
      log(`  "${t}" → ${ids.join(", ")}`);
    }
    log(`  ${[...byT.values()].filter((v) => v.length > 1).length} collisions over ${PATTERNS.length} patterns / ${byT.size} distinct templates`);
    log("  NOTE: IV and IX share ا123 in this library; Form IX is افعلّ (doubled third radical),");
    log("  so that collision is a limit of the 35-pattern inventory, not a fact about Arabic.");
  });
});

describe("A12 — صفر, the name the header omits", () => {
  it("places زero in the root orbit of صرف", () => {
    const perms = (s: string) => [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]
      .map((p) => p.map((i) => [...s][i]).join(""));
    log("\n[A12] the orbit of ص-ر-ف");
    log(`  orbit: ${perms("صرف").join(" ")}`);
    log(`  صفر in the orbit of صرف: ${perms("صرف").includes("صفر")}`);
    const e = getRoot("صفر");
    log(`  corpus entry for صفر: ${e ? `${e.d} n=${e.n} glosses=${e.g.slice(0, 3).join("/")}` : "absent"}`);
    log(`  weight(صرف) = ${weightOf([..."صرف"])} ; weight(صفر) = ${weightOf([..."صفر"])} ; equal: ${weightOf([..."صرف"]) === weightOf([..."صفر"])}`);
    log(`  rasm(صفر) = ${parseWord("صفر").skeleton} ; degree ${degree(parseWord("صفر"))}`);
    expect(perms("صرف")).toContain("صفر");
    expect(weightOf([..."صرف"])).toBe(weightOf([..."صفر"]));
  });
});

describe("A13 — regeneration alone is not sufficient (a correction to header §7 step 5)", () => {
  it("regenerates a name exactly from a root that is not its root", () => {
    log("\n[A13] دالة — the fibre regenerates perfectly from a WRONG root");
    for (const al of abstractWord([...norm("دالة")])) {
      const back = applyPattern(al.pattern, al.root);
      log(`  ${al.pattern.id.padEnd(8)} root ${al.root.join("-").padEnd(8)} regenerates "${back}" → matches "${norm("دالة")}": ${back === norm("دالة")}`);
    }
    log(`  the attested root of دالة is د-ل-ل (دلّ, to indicate)`);
    log(`  root attestation in the engine's corpus:  دلل → ${getRoot("دلل") ? "ATTESTED" : "absent"} | دله → ${getRoot("دله") ? "ATTESTED" : "absent"} | دال → ${getRoot("دال") ? "ATTESTED" : "absent"}`);
    log("  → regeneration is NECESSARY but NOT SUFFICIENT. A spurious root can satisfy it.");
    log("    The discriminating step is root attestation, which the header's §7 does not list.");
    expect(abstractWord([...norm("دالة")]).some((a) => applyPattern(a.pattern, a.root) === norm("دالة"))).toBe(true);
    expect(getRoot("دله")).toBeUndefined();
  });

  it("finds a genuine competing determination for أولي", () => {
    log("\n[A13b] أولي — two determinations, both regenerating, both with attested roots");
    log(`  header's determination: root ا-و-ل ("the first ones")  → اول attested: ${!!getRoot("اول")}`);
    for (const al of abstractWord([...norm("أولي")])) {
      log(`  engine's fibre: ${al.pattern.id.padEnd(4)} root ${al.root.join("-")} → regenerates "${applyPattern(al.pattern, al.root)}" | root attested: ${!!getRoot(al.root.join(""))}`);
    }
    log("  أَوْلَى (more entitled) IS Form IV of و-ل-ي; أوّلي (prime) is from أ-و-ل.");
    log("  → the ambiguity is in Arabic, not in the engine. The fibre is the honest answer.");
  });

  it("corrects the diminutive claim: فُعَيْل and فَعِيل are one consonantal template", () => {
    log("\n[A13c] جزيء");
    log(`  quality (فَعِيل) template: "${PATTERN_BY_ID.quality.template}"`);
    log(`  diminutive فُعَيْل consonants: ف ع ي ل → "12ي3" — the same template`);
    log(`  so abstractWord("${norm("جزيء")}") returns ${abstractWord([...norm("جزيء")]).map((a) => a.pattern.id).join(", ")}, not nothing:`);
    log("  the diminutive is not MISSING from the inventory — it is consonantally identical to فعيل.");
    log("  Its distinguishing mark is vocalic, so the rasm cannot carry it. Same finding as A3/A4b.");
    expect(PATTERN_BY_ID.quality.template).toBe("12ي3");
  });
});

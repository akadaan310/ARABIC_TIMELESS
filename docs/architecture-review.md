# Architecture review — what this repository already is

**Pass type:** archaeology / extraction. Nothing was designed, renamed, merged or
replaced. Every claim below points at code that exists at the commit this
document was written against.

**Evidence vocabulary** (used in every table in this document set):

| Status | Meaning |
|---|---|
| `IMPLEMENTED` | exists in executable source, located by file and line |
| `DERIVED` | not one explicit object; mechanically established by several existing implementations acting together |
| `OBSERVED` | visible in the running app or in test output; implementation located but not exhaustively mapped |
| `DOCUMENTED` | asserted in `spec/` or in a code comment, not yet checked against execution |
| `HYPOTHESIZED` | a plausible reading of the code that has not been established |
| `MISSING` | the concept is relevant and no implementation was found |
| `CONTRADICTED` | the apparent conceptual model conflicts with what the code actually does |

Reproduction for everything marked with an `[Ex]` tag:

```
npm install
npx vitest run lib/engine/__tests__/archaeology.diagnostic.test.ts
```

Baseline before this pass: `npm test` → 4 files, 50 tests, all passing.

---

## 0. One-paragraph summary of the finding

The repository is **not** an undifferentiated pile of Arabic utilities. It
already contains a two-abstraction kernel (`Observable`, `Transform`), a
**runtime registry** those abstractions are enumerated from, a **computed**
(not tabulated) cross-product of the two, a **candidate-generation** primitive,
at least **four distinct filtering/discrimination mechanisms**, an
**address-space/indexing** mechanism, and a **four-stop state sequence** over
the marking timeline. What it does not contain is a state identity, a frontier,
a persistence layer, a composition object for transforms, or any distinction
between *unexplored* and *invalid*. Sections A–N map what is there; the gaps
are in `architecture-gaps.md`, and the places where the existing narrative
outruns the existing computation are in `architecture-stoppers.md`.

There are **two parallel operation systems**, not one, and they do not share a
type. That is the single most important structural fact in the repository and
it is recorded as found, not consolidated (§D).

---

## A. Runtime entry points

| Name | File | What it actually is | Evidence |
|---|---|---|---|
| Next.js app router | `app/layout.tsx` | 8-item nav shell; no state, no storage | IMPLEMENTED |
| `/` | `app/page.tsx` → `components/Walkthrough.tsx` | the `إفتح سمسم` walkthrough, every number computed at render | IMPLEMENTED |
| `/read` | `app/read/page.tsx` → `components/PassageReader.tsx` | passage + passage-level operations; `POST /api/passage` once, then all-client | IMPLEMENTED |
| `/compose` | `app/compose/page.tsx` → `components/Composer.tsx` | build words by `pattern × root`; `GET /api/roots` for the root palette | IMPLEMENTED |
| `/live` | `app/live/page.tsx` → `components/LiveMode.tsx` | infinite reading stream from `read(text, n)` | IMPLEMENTED |
| `/workspace` | `app/workspace/page.tsx` → `components/Workspace.tsx` | the kernel workbench: X-ray, timeline, teleport, collapse, layer stack | IMPLEMENTED |
| `/alphabet` | `app/alphabet/page.tsx` | Band I explorer, one letter at a time | IMPLEMENTED |
| `/layers`, `/layers/[slug]` | `app/layers/` | enumerated **from the registry**, spec markdown read from disk at request time | IMPLEMENTED |
| `/invariance` | `app/invariance/page.tsx` | Layer 14's table, computed in the browser on mount | IMPLEMENTED |
| `POST /api/passage` | `app/api/passage/route.ts` | `resolvePassage(text, title)`; input capped at 8000 chars | IMPLEMENTED |
| `GET /api/passage` | same file | returns `lexiconStats()` only | IMPLEMENTED |
| `GET /api/roots` | `app/api/roots/route.ts` | root search over `roots.json`, triliteral only, limit ≤ 120 | IMPLEMENTED |
| single-file build | `artifact/app.ts` (671 lines), built by `scripts/build-artifact.mjs` | Read + Compose only, no server, lexicon inlined | IMPLEMENTED |
| test entry | `vitest.config.ts` → `lib/**/*.test.ts`, node environment | IMPLEMENTED |

Note: `vitest.config.ts` declares **no path alias**, so the `@/` alias that
works in the Next build does not work in tests. Test files use relative imports.
This is a real constraint on where diagnostics can live. `OBSERVED`.

---

## B. Core data structures

| Name | File:line | Shape | Mutates? | Deterministic? | Evidence |
|---|---|---|---|---|---|
| `Glyph` | `lib/engine/types.ts:65` | `{letter, surface, marks[], position, skeleton, domain[], index}` — the per-position record that carries the slot domain | no | yes | IMPLEMENTED |
| `Word` | `types.ts:80` | `{raw, letters[], glyphs[], skeleton, voweled}` — the kernel's only state object | no (constructed fresh) | yes | IMPLEMENTED |
| `HandCost` | `types.ts:24` | `{marks, counts, held}`; `addCost` sums marks/counts and takes `max` of `held` | no | yes | IMPLEMENTED |
| `Observable<T>` | `types.ts:96` | `{id, layer, label, discards, compute, serialize, display, cost}` | no | by contract, not enforced | IMPLEMENTED |
| `Transform` | `types.ts:110` | `{id, layer, label, invertible, apply(word, rng), cost}` | no | only if `rng` is fixed | IMPLEMENTED |
| `Layer` | `types.ts:142` | `{id, slug, name, band, statement, observables[], transforms[], analyze}` | no | yes | IMPLEMENTED |
| `LayerResult` | `types.ts:134` | `{layer, readings[], notes[], cost}` | no | yes | IMPLEMENTED |
| `Collapse` / `FilterStep` | `types.ts:162,178` | the audited filter run; `FilterStep.removed` is **capped at 40** (`collapse.ts:73`) | no | yes | IMPLEMENTED |
| `Passage` / `PassageWord` / `Sentence` | `lib/engine/passage.ts:60,81,89` | the composition-level state; **a different object from `Word`** | yes — `resolve.ts:100` writes `w.lex`, `w.taqlib`, `w.sameSkeleton`, `w.sameWeight` onto existing `PassageWord`s | yes | IMPLEMENTED |
| `Piece` / `CompositionStats` | `lib/engine/compose.ts:26,95` | a composed word and its line; `Piece.id` embeds `Math.random()` (`compose.ts:68`) | no | **no** — id is random | IMPLEMENTED |
| `Reading` | `lib/engine/reader.ts:40` | one thing a text says; carries `n`, `subject`, `layer`, `op`, `cost` | no | yes in `(text, n)` | IMPLEMENTED |
| `Index` / `Jump` | `lib/engine/teleport.ts:32,74` | `address → words`, cached per `(lexicon.name, channel)` | cache mutates (`teleport.ts:50`) | yes | IMPLEMENTED |
| `Stop` | `lib/engine/timeline.ts:22` | one era of the marking timeline | no | yes | IMPLEMENTED |
| `RootEntry`/`LemmaEntry`/`SurfaceEntry` | `lib/engine/lexdata.ts:15,26,35` | the derived GPL bundles: 1,651 roots / 4,241 lemmas / 16,722 forms | no | yes | IMPLEMENTED |

**Authored vs derived data.** `lib/engine/alphabet.ts` is explicit that its
tables are the irreducible inventory and everything else is computed
(`alphabet.ts:1-9`). That claim holds on inspection: `HIJAI_INDEX`,
`ABJADI_INDEX`, `CLASS_OF`, `UNMOVED`, `ABJAD_VALUE` are all computed from the
authored arrays at module load (`alphabet.ts:327-346`, `:42`). `IMPLEMENTED`.

---

## C. Core computational modules

| Module | File | Responsibility | Depends on | Evidence |
|---|---|---|---|---|
| alphabet | `lib/engine/alphabet.ts` (347 ln) | the 28 letters and every authored table | nothing | IMPLEMENTED |
| text | `lib/engine/text.ts` (191 ln) | normalise → parse → project → expand | alphabet, variants | IMPLEMENTED |
| variants | `lib/engine/variants.ts` | hamza / tāʾ marbūṭa / alif maqṣūra folding | — | IMPLEMENTED |
| patterns | `lib/engine/patterns.ts` (155 ln) | 35 templates; `applyPattern` / `abstractWord` | — | IMPLEMENTED |
| lexicon | `lib/engine/lexicon.ts` (187 ln) | swappable `Lexicon` interface + seed corpus | text | IMPLEMENTED |
| lexdata | `lib/engine/lexdata.ts` (152 ln) | the Quranic bundles + clitic-stripping `lookup` | JSON data | IMPLEMENTED |
| registry | `lib/engine/registry.ts` (58 ln) | the layer list; `observables()`, `transforms()`, `analyzeAll` | all five bands | IMPLEMENTED |
| layers/band1–5 | `lib/engine/layers/*.ts` | 21 layers (0–20) declaring 25 observables and 6 transforms | alphabet, text, patterns, lexicon | IMPLEMENTED |
| invariance | `lib/engine/invariance.ts` (160 ln) | Observable × Transform cross-product; `channels`, `isNewChannel` | registry | IMPLEMENTED |
| collapse | `lib/engine/collapse.ts` (149 ln) | the seven-filter reading procedure; `solveByWeight` | text, lexicon, patterns | IMPLEMENTED |
| teleport | `lib/engine/teleport.ts` (104 ln) | five address spaces over the active lexicon | text, lexicon, patterns | IMPLEMENTED |
| timeline | `lib/engine/timeline.ts` (101 ln) | four marking eras + `futures` | text, alphabet | IMPLEMENTED |
| passage | `lib/engine/passage.ts` (192 ln) | composition-level state, no lexicon | text, band3 | IMPLEMENTED |
| resolve | `lib/engine/resolve.ts` (118 ln) | `server-only`; fills `lex`, pools, taqlīb | passage, lexdata | IMPLEMENTED |
| operations | `lib/engine/operations.ts` (504 ln) | 13 passage-level operations | passage, patterns, band3 | IMPLEMENTED |
| compose | `lib/engine/compose.ts` (312 ln) | build by function application; 5 constraints; `suggest` | patterns, text, band3 | IMPLEMENTED |
| reader | `lib/engine/reader.ts` (586 ln) | 24 generators over 20 layers; `read(text, n)` | almost everything | IMPLEMENTED |
| corpus / examples | `corpus.ts`, `examples.ts` | 16 passages, 13 worked examples, authored | — | IMPLEMENTED |

**Layering that actually holds.** `alphabet` → `text` → everything. No module
imports `reader`; `reader` imports fourteen others. `resolve` is the only
`server-only` module and is imported only by the two API routes. `OBSERVED` by
import inspection.

---

## D. Transformations / operations — **two systems, not one**

This is the central structural finding. Full per-operation detail is in
`operations-inventory.md`; the architectural point is here.

### D.1 The kernel `Transform` (registry-facing)

`Transform` (`types.ts:110`) is `Word → Word`, takes an `Rng`, declares
`invertible: boolean` and a `HandCost`. **Six exist**, all in Bands I and III:

`reflect`, `shift1` (band1.ts:252,337) · `silent`, `shift3` (band3.ts:86,296)
· `permute`, `reverse` (band3.ts:153,359).

These are the *only* operations the invariance table can see, because
`buildInvarianceTable` reads `transforms()` from the registry
(`invariance.ts:53`). `IMPLEMENTED`.

### D.2 The passage `Operation` (SDK-facing)

`Operation` (`operations.ts:52`) is `Passage → OpResult`, has `scope`, `kind`,
`readable`, `layer`, optional `options`, and reports `preserved[]` / `lost[]` /
`coverage`. **Thirteen exist** (`operations.ts:488`).

### D.3 The relationship, as found

| | `Transform` | `Operation` |
|---|---|---|
| input | `Word` | `Passage` |
| output | `Word` | `OpResult` (text + changes + preserved/lost) |
| randomness | injected `Rng` | internal (`silent` hardcodes seed `0x5eed`, `operations.ts:235`) |
| registered in | `registry.ts` | `OPERATIONS` array (`operations.ts:488`) |
| visible to the invariance table | **yes** | **no** |
| declares invariants | only via the computed table | as authored `preserved[]` strings |
| count | 6 | 13 |

Three concepts are implemented **twice**, once in each system, and the two
implementations are not shared:

| Concept | kernel | passage |
|---|---|---|
| silent substitution | `band3.ts:86` (`silentSubstitution(rng)`) | `operations.ts:226` (rebuilds the map inline from `CLASSES_UNIVERSAL`) |
| reversal | `band3.ts:160` (`wordFromLetters(reverse)`) | `operations.ts:343` (string reverse on `w.norm`) |
| alphabet shift | `band1.ts:261` `shift1`, `band3.ts:97` `shift3` | `operations.ts:372` `shift` with `k ∈ {1,2,3,7,14}` |

Recorded as two implementations of one concept, **not consolidated**, per the
brief. `IMPLEMENTED` (both sides).

### D.4 A third, non-registered family

`applyPattern` (`patterns.ts:81`) is `Pattern × root → word`; `abstractWord`
(`patterns.ts:105`) is its partial inverse. These are the only operations in the
repository with a **demonstrated** inverse (`engine.test.ts:173`, "application
and abstraction are inverse"). They are in neither registry. `IMPLEMENTED`.

---

## E. Observables

25 are registered (`registry.ts:40` flat-maps the layers). Full inventory with
domains, invariance rows and tests: `observables-invariants.md`.

Distribution by layer: L0×1, L1×3, L2×2, L3×2, L4×3, L5×1, L7×2, L9×1, L10×2,
L11×1, L12×1, L13×1, L15×1, L16×1, L17×1, L18×1, L20×1.

Layers **6, 8, 14, 19 declare zero observables** and layers 0–2, 4–7, 10–20
declare zero transforms. The registry is genuinely sparse; the "cross-product"
is 25 × 6 = **150 cells**, verified `[E4]`.

Observables that are *not* in the registry but are computed and displayed
anywhere include: `slots`/`arity` at passage scope (`passage.ts:155`),
`PieceMetrics` (`compose.ts:49`), `PassageStats` (`passage.ts:175`),
`overview()` (`reader.ts:575`), `marksSpent()` (`timeline.ts:94`). These are
readings the invariance table cannot see. `DERIVED`.

---

## F. Constraints

Four distinct constraint mechanisms exist, and they do not share a type.

| Mechanism | File:line | Signature | Used by | Evidence |
|---|---|---|---|---|
| `FilterStep` predicate | `collapse.ts:51` (`run(...)`) | `(candidate: string) => boolean`, plus an `available` flag and a `skipReason` | `collapse()` | IMPLEMENTED |
| `Constraint` | `compose.ts:133` | `{admits(word, ctx), status(pieces, ctx)}` | `Composer`, `suggest` | IMPLEMENTED |
| `plausible` | `compose.ts:308` | `(word) => boolean`; rejects `اا` and any trebled letter | `suggest`, `Composer` | IMPLEMENTED |
| `solveByWeight` | `collapse.ts:142` | candidate filter by exact abjad total | tests + diagnostics only — **no UI caller** | IMPLEMENTED, unused |

The `FilterStep` mechanism is the only one that records *why* it did not run
(`skipped` + `skipReason`, `types.ts:171`). That distinction — "this filter had
no data" vs "this filter removed everything" — exists **only** for the lexical
filter, via an explicit fallback at `collapse.ts:84-91`. The morphological
filter has no such fallback; see `architecture-stoppers.md` S-3.

`CONSTRAINTS.oneRoot.admits` is `!fixed || pieces.length === 0 || true` —
**unconditionally true** (`compose.ts:195-198`). Its `status` does the real
work. Recorded as found. `CONTRADICTED` (the declared constraint does not
constrain).

---

## G. Candidate-generation mechanisms

| Name | File:line | Generates | Cardinality | Bounded? | Evidence |
|---|---|---|---|---|---|
| `expand` | `text.ts:152` | Cartesian product of the per-glyph `domain`s | `degree(word)` | **yes, `cap` (default 5000)**, and truncation is **prefix-biased** — see §G.1 | IMPLEMENTED |
| `abstractWord` | `patterns.ts:105` | every `(pattern, root)` alignment for a letter string | ≤ 35 | yes, by the library size | IMPLEMENTED |
| `candidateRoots` | `patterns.ts:138` | the distinct roots of those alignments | ≤ 35 | yes | IMPLEMENTED |
| `fibre` | `patterns.ts:152` | every word the library builds on one root | 35 minus empties | yes | IMPLEMENTED |
| `suggest` | `compose.ts:245` | `roots × patterns`, filtered by the active constraint | `cap` (default 24) with a per-root cap of 2 (or `cap` in `oneRoot`) | yes | IMPLEMENTED |
| `taqlibOf` | `resolve.ts:50` | the 6 permutations of a triliteral root, kept if the corpus knows them | ≤ 5 | yes, exhaustive over `S₃` | IMPLEMENTED |
| `futures` | `timeline.ts:87` | `expand` under a 400 cap | `degree` | yes | IMPLEMENTED |
| `sampleWords` | `invariance.ts:41` | random words of length 3–7, seeded `mulberry32(7)` | `count` (default 400) | yes, reproducible | IMPLEMENTED |
| `indexes()` pools | `resolve.ts:29` | same-skeleton / same-weight pools over 16,722 forms | 24 per bucket, 12 delivered | yes | IMPLEMENTED |

### G.1 `expand` truncation is biased, and the flag is usually dropped

`expand` builds the product prefix-first and `break`s both loops once
`next.length >= cap` (`text.ts:158-168`). The result is **not** a sample of the
candidate space: it is the lexicographically-earliest `cap` candidates in domain
order. Measured `[E8]`: for `تبيينيين` (degree 78,125, cap 5,000) the first
candidate is `بببببببن`, the last is `بتثيييين`, and **the true word is not in
the set**.

Of the seven call sites, only `collapse.ts:46` and `timeline.ts:89` read the
`truncated` flag back; `reader.ts:192`, `:208`, `:296` and
`Walkthrough.tsx:350` discard it. `IMPLEMENTED` + `CONTRADICTED` — consequences
in `architecture-stoppers.md` S-1/S-2.

---

## H. Selection / collapse mechanisms

| Name | File:line | Input | Output | Terminal states | Evidence |
|---|---|---|---|---|---|
| `collapse` | `collapse.ts:42` | `Word` (+ `cap`, `only[]`) | `Collapse` | `determined` / `corrupt` / `intended` (`types.ts:176`) | IMPLEMENTED |
| `solveByWeight` | `collapse.ts:142` | `Word`, target | `string[]` | none declared | IMPLEMENTED |
| `suggest` | `compose.ts:245` | roots, constraint, ctx | `Suggestion[]` | none declared | IMPLEMENTED |
| lexical `lookup` | `lexdata.ts:96` | a written form | `Resolution \| null` | `null` is explicitly "a fact about the lexicon, not the text" (`lexdata.ts:93`) | IMPLEMENTED |
| `XRay` binding | `components/XRay.tsx:62` | a click | one slot bound | manual, no terminal | IMPLEMENTED |

`collapse` runs seven filters in a fixed cost order (ranks 1–7) and each records
`before`, `after`, up to 40 `removed`, a `HandCost`, and `skipped`+`skipReason`.
Filters 5–7 are **always** skipped for single-word input (`collapse.ts:112-118`)
— the reason strings say so explicitly. Filter 4 (prosodic) runs only when
`word.voweled`, and when it runs its predicate is `() => true`
(`collapse.ts:105-108`): it is a **declared-but-empty** filter. `IMPLEMENTED`
with the limitation stated in the code itself.

Measured terminal behaviour `[E1b]`, `[E2b]`:

```
كتب    degree    15  survivors  1  determined   (lexical 15→1)
مال    degree     1  survivors  1  determined   (lexical skipped: not in seed lexicon)
علم    degree     2  survivors  1  determined
نبين   degree   125  survivors 45  intended     (morphological 125→45)
كهيعص  degree    20  survivors  0  corrupt      (morphological 20→0)
```

---

## I. Composition mechanisms

| Kind of composition | Exists? | Where | Evidence |
|---|---|---|---|
| Composition of two `Transform`s into a third | **no** | grep finds no `compose`, no `pipe`, no nested `.apply(...apply(...))` anywhere in `lib/` | MISSING |
| Composition of two `Operation`s | **no** — the UI holds one `opId` at a time (`PassageReader.tsx:25`); the result is never fed back in | MISSING |
| Composition of words into a line | **yes** | `compose.ts:109` `statsOfComposition`, `:124` `renderComposition` — `Piece[]` is the composite | IMPLEMENTED |
| Function composition in the morphology | **yes** | `applyPattern ∘ root`, and `fibre` is the whole image of one root under the library (`patterns.ts:152`) | IMPLEMENTED |
| Composition *reasoning* | **yes, but only as prose** | `spec/14-composition.md §14.3` lists non-commuting pairs; `band4.ts:120` layer 14 declares **zero** observables and **zero** transforms and emits three computed notes | DOCUMENTED (the pairs), IMPLEMENTED (the notes) |

Layer 14 is the layer *about* composition and it is the layer with the least
executable surface: its `analyze()` returns notes only. The one genuinely
computed claim it makes — `closedIsUnionOfClasses()` (`band2.ts:193`) — is real,
returns `true`, and is asserted in `engine.test.ts:184`. `IMPLEMENTED`.

---

## J. Provenance mechanisms

Full audit in `architecture-experimental-results.md` §P. Summary of what each
result object carries:

| Result | Carries input? | Carries operation id? | Carries parameters? | Carries intermediate states? | Reconstructible? |
|---|---|---|---|---|---|
| `Collapse` | `skeleton`, `target` | filter `id` per step | **no** (`cap`, `only` not recorded) | yes — `before`/`after` per step, `removed` **capped at 40** | partially |
| `OpResult` | **no** (no input text) | `id` | **no** (the chosen `option` is not stored in the result) | no | no |
| `Reading` | `subject` (the word), `n` | `op` + `layer` | **no** (rng seed not stored; it is derived from `hash(text) ^ n`) | no | yes, if you still hold `text` |
| `Cell` (invariance) | `witness.before/after` | `observableId`, `transformId` | **no** (sample size / seed not stored) | `trials` | partially |
| `Piece` | `root`, `patternId` | — | — | — | yes, except the `Math.random()` id |
| `Jump` | `address`, `channel` | — | `scanCost`, `indexCost` | — | yes |

There is **no provenance record type**, no run id, no hash of a state, and no
log. `MISSING` as a unified mechanism; `DERIVED` at the level of individual
result objects, three of which happen to carry enough.

---

## K. Persistence mechanisms

| Candidate | Found? | Evidence |
|---|---|---|
| `localStorage` / `sessionStorage` / IndexedDB / cookies | **none** — a repo-wide grep over `app/`, `components/`, `lib/` returns zero hits | MISSING |
| URL state | one direction only: `/read?text=…` is read at `app/read/page.tsx:10` and never written back | IMPLEMENTED (partial) |
| Server-side store / database | none | MISSING |
| In-memory caches | three: `teleport.ts:50` `CACHE` (per lexicon × channel), `resolve.ts:18` `SKELETON_INDEX`/`WEIGHT_INDEX`, `lexdata.ts:50` `BY_ROOT` | IMPLEMENTED |
| Mutable global | `lexicon.ts:176` `let active` + `setLexicon` — the one swappable global | IMPLEMENTED |
| Build-time artefacts | `lib/data/*.json` (1.7 MB, GPL, from `scripts/build-lexicon.mjs`), `artifact/data.json` + `artifact/index.html` (1.16 MB, from the two artifact scripts) | IMPLEMENTED |

**Nothing a user does in this application survives a page reload.** No
experiment, no composition, no bound slot, no visited word. `MISSING`.

---

## L. Browser-facing APIs

| Surface | Shape | Notes |
|---|---|---|
| `POST /api/passage` | `{text, title?}` → `{passage, lexicon}` | the only write-shaped endpoint; it writes nothing |
| `GET /api/passage` | → `{lexicon:{roots,lemmas,forms}}` | the closest thing to a capability endpoint that exists |
| `GET /api/roots?q=&limit=` | → `{roots:[{root,display,glosses,count}]}` | triliteral only; searches root text, root glosses **and** lemma glosses (`route.ts:26-27`) |
| `window.__ARABIC_DATA__` | the inlined lexicon in the single-file build (`artifact/app.ts:34`) | the only global the artifact defines |

No endpoint enumerates layers, observables, transforms or operations. The
`/layers` page does enumerate them, but as server-rendered HTML, not as data.
`MISSING` as an API; `IMPLEMENTED` as a page.

---

## M. UI surfaces and the computational mechanism each exposes

| Component | File | Mechanism it exposes | Evidence |
|---|---|---|---|
| `Walkthrough` | 390 ln | `parseText`, `degree`, `slots`, `expand`, `collapse`, `abstractWord`, `weightOf`, `ARTICULATION` — the whole kernel over one fixed phrase | IMPLEMENTED |
| `Workspace` | 172 ln | orchestrates the five below over one selected `Word` | IMPLEMENTED |
| `XRay` | 92 ln | `Glyph.domain` as clickable slots — **Layer 4 binding performed by hand**; binding is local `useState`, not fed back into the engine | IMPLEMENTED |
| `TimeTravel` | 99 ln | `timeline()`, `futures()`, `marksSpent()` | IMPLEMENTED |
| `Teleport` | 100 ln | `teleport(word, channel)`; a jump calls `setText(destination)` — **the only place in the app where an output becomes the next input** | IMPLEMENTED |
| `CollapseView` | 101 ln | the seven filter steps with per-step bars and skip reasons | IMPLEMENTED |
| `LayerStack` | 112 ln | `analyzeAll(word)` — enumerated from the registry, not by hand | IMPLEMENTED |
| `InvarianceView` | 148 ln | `buildInvarianceTable(sampleWords(300))` + `channels()` + `constants()` | IMPLEMENTED |
| `PassageReader` | 488 ln | the 13 passage `Operation`s over a resolved `Passage` | IMPLEMENTED |
| `Composer` | 345 ln | `buildPiece`, `suggest`, the 5 `Constraint`s | IMPLEMENTED |
| `LiveMode` | 258 ln | `readMany(text, 0, count)` with an `IntersectionObserver` for infinite scroll | IMPLEMENTED |
| `AlphabetExplorer` | 203 ln | Band I per letter | IMPLEMENTED |

**The `Teleport` → `setText` edge (`Workspace.tsx:152`) is the only
state-transition loop in the entire UI.** Everything else is
input → analysis → display.

---

## N. Tests and validation mechanisms

| File | Tests | What it validates |
|---|---|---|
| `lib/engine/__tests__/engine.test.ts` | 34 | every constant in `spec/20-invariance.md`, the alphabet, L3/L4/L7/L8/L9/L10/L11/L13/L14/L15, the collapse procedure, text handling |
| `lib/engine/__tests__/compose.test.ts` | 6 | `buildPiece`, `plausible`, the per-root cap, backward weight solving, the `unmoved` constraint, composition stats |
| `lib/engine/__tests__/corpus.test.ts` | 4 | every corpus passage parses; the `unmoved` passage really has 0 bits; the `oneroot` passage really is one root; the `teeth` passage really is > 10 bits |
| `lib/engine/__tests__/reader.test.ts` | 6 | 200 readings per example are non-null; awkward input does not throw; determinism in `(text, n)`; layer coverage > 10; both natures present; `overview` |
| `lib/engine/__tests__/archaeology.diagnostic.test.ts` | 22 | **added by this pass**, clearly marked DIAGNOSTIC; asserts almost nothing, prints what existing mechanisms actually do |

Baseline 50 → 72 with the diagnostics (22 added). No existing test was modified.

**Two validation weaknesses found, recorded not fixed:**

1. `compose.test.ts:24` ("does not let one root fill the palette") is
   **vacuous**: `suggest(roots, "determined", …)` returns **0** suggestions for
   those five roots, because none of the 35 patterns applied to any of them
   produces a degree-1 word `[E6]`. The assertion loop body never executes.
2. `engine.test.ts:188` asserts four specific cells of the invariance table.
   All four are genuine. It does not assert the `pulse` row, which is an
   artefact — see `architecture-stoppers.md` S-4.

No linter is configured beyond `next lint`, and no CI workflow exists
(`.github/` is absent).

---

## What this map establishes

1. The `Observable`/`Transform`/`Layer`/registry kernel is real, is used by
   three independent consumers (invariance table, cost model, `/layers` UI), and
   extends itself when a layer is added (`registry.ts:1-11` claims this;
   `LayerStack.tsx:13` and `invariance.ts:53` confirm it by construction).
2. The cross-product in `invariance.ts` is the repository's one genuinely
   *self-extending* computation, and `isNewChannel` (`invariance.ts:134`) is a
   real, executable novelty test `[E4b]`.
3. Candidate generation, filtering, and terminal classification all exist, in
   four separate places, with four separate types.
4. State identity, frontier, provenance and persistence do not exist at all.
5. The narrative layer (reader bodies, operation summaries) is in several places
   **ahead of** the computation it describes. Those places are enumerated as
   stoppers, because they are exactly where a future implementation pass would
   otherwise inherit a false premise.

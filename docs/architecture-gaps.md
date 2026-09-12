# Architecture gaps — negative space

**No solutions are proposed here.** This document records only what is absent or
unresolved, with the evidence for the absence. A gap is not a defect; several of
these are absences the repository is right to have.

Statuses used, as the brief specifies: `FOUND` · `PARTIAL` · `DISTRIBUTED` ·
`MISSING` · `UNKNOWN`.

Method for every `MISSING` verdict: a repository-wide grep over `lib/`,
`components/`, `app/`, `artifact/`, `scripts/` for the concept's plausible
names, plus inspection of every type in `lib/engine/types.ts`.

---

## G-1 — Is there a unified operation registry?

**Status: DISTRIBUTED.**

Four registries exist and none subsumes another:

| Registry | File:line | Holds | Enumerable at runtime |
|---|---|---|---|
| `REGISTERED` layers | `registry.ts:20` | 21 `Layer`s → 25 observables, 6 transforms | yes, via `layers()`, `observables()`, `transforms()` |
| `OPERATIONS` / `OP_BY_ID` | `operations.ts:488,496` | 13 passage `Operation`s | yes |
| `CONSTRAINTS` / `CONSTRAINT_BY_ID` | `compose.ts:146,222` | 5 `Constraint`s | yes |
| `CHANNELS` | `teleport.ts:24` | 5 address channels | yes |
| `PATTERNS` / `PATTERN_BY_ID` | `patterns.ts:27,74` | 35 patterns | yes |
| `GENERATORS` | `reader.ts:80` | 24 reading generators | **no** — module-private `const`, never exported |

The layer registry is the only one that accepts runtime registration
(`register()`, `registry.ts:48`). The others are frozen array literals. The
reader's generator list is the only collection that is not even readable from
outside its module.

Nothing enumerates across registries. There is no place that can answer "list
every operation in this system" in one call.

---

## G-2 — Is there a unified state identity?

**Status: MISSING.**

- No `id`, `hash`, `key`, `fingerprint` or `equals` on `Word` (`types.ts:80`),
  `Passage` (`passage.ts:89`), or any result type.
- `Piece.id` (`compose.ts:68`) is
  `` `${root}:${patternId}:${Math.random().toString(36).slice(2,7)}` `` — a React
  list key, deliberately non-deterministic. It is the only field named `id` on a
  state object and it identifies nothing.
- `hash()` (`reader.ts:65`) is an FNV-1a over the input text, module-private, and
  used solely to seed an rng.
- `addressOf()` (`teleport.ts:40`) produces canonical keys but is **intentionally
  many-to-one** — its purpose is that distinct words collide. See
  `state-substrate-model.md` §3.
- Word equality is performed ad hoc by string comparison wherever it is needed:
  `collapse.ts:120` (`live.includes(target)`), `operations.ts:243`
  (`to !== w.norm`), `teleport.ts:91` (`d !== here`).

Consequence: two occurrences of the same word in one passage are two unrelated
`PassageWord` objects distinguished only by `index` (`passage.ts:63`).

---

## G-3 — Is there a unified provenance record?

**Status: PARTIAL, per-result, with no shared type.**

Full audit: `architecture-experimental-results.md` §P. Summary:

| Result | Reconstructible from the result alone? | What is missing |
|---|---|---|
| `Collapse` | **no** | the `cap`, the `only[]` filter selection, and the identity of the active lexicon (`lexicon.ts:176` is a module global, never recorded). `removed[]` is capped at 40 (`collapse.ts:73`), so above 40 eliminations the audit is lossy — measured `[E5c]`: 80 removed, 40 recorded |
| `OpResult` | **no** | the input passage, and the chosen `option` for the two parameterised operations (`repattern`, `shift`) |
| `Reading` | **yes, given `text`** | nothing — `(text, n)` fully determines it (`reader.ts:549`), verified `[E5]` |
| `Cell` | **partial** | the sample size and seed used to build the table |
| `Suggestion` | **yes** | nothing — `root` + `pattern` regenerate the word |
| `Jump` | **yes** | nothing |

There is no `Provenance` type, no run identifier, no timestamp, and no log
anywhere in the repository.

---

## G-4 — Is there a formal frontier representation?

**Status: MISSING.**

No queue, stack, worklist, `visited` set, `pending` collection or `frontier`
object exists. Greps for `frontier`, `visited`, `worklist`, `queue`, `pending`,
`explored` across `lib/` return zero hits.

The closest structures, and why none is a frontier:

| Structure | Why not |
|---|---|
| `Collapse.survivors` | the *output* of a completed straight-line pipeline; nothing pops from it |
| `expand().candidates` | generated in full up front and consumed by `filter`; never partially processed |
| `Jump.destinations` | a single hop's neighbours, recomputed from scratch on each call, never accumulated |
| `LiveMode`'s `count` | a render budget (`LiveMode.tsx:21`), incremented by scroll position |

---

## G-5 — Is there an explicit distinction between *unexplored* and *invalid*?

**Status: MISSING** at the level that matters, `PARTIAL` in one place.

The one place it exists: `FilterStep.skipped` + `skipReason` (`types.ts:171`)
distinguishes "this filter had no data" from "this filter eliminated nothing",
and the lexical filter's self-ignorance fallback (`collapse.ts:84-91`) uses it
honestly.

Where it is absent, measured:

**(a) A truncated candidate space is indistinguishable from an exhausted one at
the terminal.** `[E8]`:

```
تبيينيين   degree 78,125  initial 5,000 (truncated)   terminal "corrupt"  targetSurvived false
كهيعص      degree     20  initial    20 (complete)    terminal "corrupt"  targetSurvived false
```

In the first case the true reading was **never generated**. In the second it was
generated and eliminated. `Terminal` has three values and none of them is
"unexplored". `CollapseView.tsx:43` renders both as *"true reading was filtered
out"*.

**(b) The morphological filter reports its own coverage limit as corruption.**
`[E12]`: `طه`, `حم`, `يس`, `كهيعص` all reach `terminal: "corrupt"` because zero
of 35 templates align — while `band4.ts:103` and `reader.ts:332` both state, in
prose, the correct disjunction ("outside the library's coverage, **or** not built
the way words are built").

**(c) `expand`'s `truncated` flag is discarded by half its callers** —
`reader.ts:192,208,296`, `Walkthrough.tsx:350`, `collapse.ts:143`. See
`state-substrate-model.md` §4.2.

---

## G-6 — Is there persistent experiment state?

**Status: MISSING, completely.**

A repo-wide grep over `app/`, `components/`, `lib/` for `localStorage`,
`sessionStorage`, `indexedDB`, `cookie`, `document.cookie` returns **zero hits**.
There is no database, no file write at runtime, no server-side session, and no
`router.push` writing state into the URL.

What exists:

- **read-only URL seeding**, one direction: `/read?text=…` at
  `app/read/page.tsx:10`; never written back.
- **in-memory caches** that die with the process: `teleport.ts:50`,
  `resolve.ts:18`, `lexdata.ts:50`.
- **build-time artefacts**: `lib/data/*.json`, `artifact/data.json`,
  `artifact/index.html`.

Nothing a user does survives a reload: not a composition in `Composer`, not a
bound slot in `XRay`, not a teleport path, not a scroll position in `LiveMode`.

---

## G-7 — Is there a generic traversal object?

**Status: MISSING.** See `architecture-examples.md` §5 for the full trace.

No `Path`, `Walk`, `Trace`, `Step`, `Edge` or `Node` type exists. The two
candidates:

| Candidate | Shape | Why it is not a traversal |
|---|---|---|
| `Stop[]` from `timeline()` (`timeline.ts:22,42`) | a genuine **sequence of states** with a monotone ordering | the four stops are computed independently from the same input, not by stepping. There is no transition function: `timeline()` builds all four in one pass (`timeline.ts:48-83`). Eras 1 and 0 share a surface |
| `Jump[]` from `teleport()` (`teleport.ts:74,85`) | genuine **edges**, with a cost model | `teleport(word: Word) → Jump[]` whose `destinations: string[]`. **The output type is not the input type**, so steps do not compose without a manual `parseWord`. Measured `[E3]` — the two-step chain works, but the chaining is done by the caller |

The only place two steps are actually taken is `Workspace.tsx:152`
(`onJump={(d) => setText(d)}`), where the loop is closed by React state, not by
the engine. No path is accumulated, no visited set is kept, no cost is summed
across hops.

---

## G-8 — Is there an explicit candidate discrimination layer?

**Status: DISTRIBUTED.** Four mechanisms, four unrelated signatures, no shared
type and no shared registry:

| Mechanism | Signature | File:line |
|---|---|---|
| collapse filter | `(candidate: string) => boolean` + `available` + `skipReason` | `collapse.ts:51` |
| `Constraint` | `{admits(word, ctx) => boolean, status(pieces, ctx) => {ok, label}}` | `compose.ts:133` |
| `plausible` | `(word: string) => boolean` | `compose.ts:308` |
| `isNewChannel` | `(table, candidate, sample) => {novel, signature, matches}` | `invariance.ts:134` |

`isNewChannel` is the only one that returns **evidence for its verdict** rather
than a boolean. See `architecture-examples.md` §4 and the Furqān answer in
`architecture-experimental-results.md` §F.

One of the five `Constraint`s does not constrain: `oneRoot.admits` is
`!fixed || pieces.length === 0 || true` — unconditionally `true`
(`compose.ts:195-198`).

---

## G-9 — Is there a reusable composition graph?

**Status: MISSING.**

No `compose`, `pipe`, `chain`, `andThen` or `>>>` over `Transform` or
`Operation` exists anywhere in `lib/`. Grep for nested application
(`.apply(...apply(...))`) returns nothing.

The consequences are concrete:

- The invariance table tests **single** transforms only
  (`invariance.ts:67-86`). `spec/14 §14.3` enumerates non-commuting pairs
  (substitution ∘ weight, permutation ∘ weight, application ∘ abstraction,
  binding ∘ everything) and **none of them is executed** — Layer 14's `analyze()`
  returns three notes and declares zero observables and zero transforms
  (`band4.ts:120-135`).
- The passage UI holds one `opId` (`PassageReader.tsx:25`); applying a second
  operation re-runs it against the **original** passage, never against the first
  result.
- The one genuine composition is morphological and is not in any registry:
  `fibre(root)` (`patterns.ts:152`) is the whole image of one root under the
  35-pattern library.

`spec/14 §14.3`'s claims are therefore `DOCUMENTED`, not `IMPLEMENTED`.

---

## G-10 — Is there an exhaustive bounded traversal mechanism?

**Status: PARTIAL — one genuine case, five bounded-but-not-guaranteed.**

Full table in `architecture-experimental-results.md` §B. Summary:

| Mechanism | Bound | Exhaustive under it? | Result persisted? |
|---|---|---|---|
| `taqlibOf` (`resolve.ts:50`) | the 6 elements of S₃ | **yes, provably** | no |
| `orderPermutation` (`band1.ts:197`) | 28 letters | **yes** — walks every cycle | no |
| `footOrbits` (`band3.ts:252`) | 8 feet | **yes** | no |
| `abstractWord` (`patterns.ts:105`) | 35 templates | yes over the library; the library is not the language | no |
| `expand` (`text.ts:152`) | `cap`, default 5000 | **only when `degree ≤ cap`**, and the flag is often dropped | no |
| `suggest` (`compose.ts:245`) | `cap` 24 + per-root 2 | no — early `return` at `:295` | no |
| `buildIndex` (`teleport.ts:53`) | the active lexicon | yes over that lexicon | cached in memory only |
| `buildInvarianceTable` | 25 × 6 cells × 400 samples | exhaustive over cells; **sampled** per cell, with `break` on first witness | no |

`closedIsUnionOfClasses()` (`band2.ts:193`) is the repository's one **proof by
exhaustion used as a theorem** — it compares the union of the closed letters'
classes against the closed set and returns `true`, and Layer 14 branches on the
result rather than asserting it (`band4.ts:130-132`).

---

## G-11 — Can the runtime describe its own capabilities?

**Status: PARTIAL.** Full answer: `architecture-experimental-results.md` §C.

What the runtime **can** already answer, in-process:

```
layers()          → 21
observables()     → 25, each with id, layer, label, discards, cost
transforms()      → 6,  each with id, layer, label, invertible, cost
OPERATIONS        → 13, each with id, scope, kind, layer, readable, note, options
CONSTRAINTS       → 5
CHANNELS          → 5
PATTERNS          → 35
constants()       → 13 checkable constants, each with label, value, layer, method
lexiconStats()    → {roots: 1651, lemmas: 4241, forms: 16722}
```

Measured `[INVENTORY]`. This is a substantial self-description and it is already
consumed: `app/layers/page.tsx:6` renders the registry, `LayerStack.tsx:17`
runs it, `InvarianceView.tsx:18` cross-products it.

What is missing:

- **no single entry point** — a caller must know six different module exports;
- **no HTTP surface** — the only endpoint returning capability-shaped data is
  `GET /api/passage`, which returns lexicon counts (`route.ts:29`);
- **`GENERATORS` (`reader.ts:80`) is not exported**, so the 24 reading operations
  cannot be enumerated at all;
- **`Operation.note` and `preserved`/`lost` are authored prose**, not derived —
  the runtime can say *that* `silent` preserves the skeleton because a human
  typed the string (`operations.ts:254`), not because it measured it. The
  registry-side equivalent (`Observable.discards`) has the same character.

---

## G-12 — Additional gaps found, not on the brief's list

| # | Gap | Status | Evidence |
|---|---|---|---|
| a | **No inverse is implemented for any transform**, though all six declare `invertible: true` | MISSING | grep for `invert` returns only the declarations; `operations-inventory.md` §4.2 |
| b | **`HandCost` is computed everywhere and consumed nowhere.** The collapse filter order is hardcoded ranks (`collapse.ts:78-118`), not derived from the costs the same file computes | MISSING as a control input | `observables-invariants.md` §6 |
| c | **Three independent normalisation implementations** (`text.ts:25`, `passage.ts:34`, `scripts/build-lexicon.mjs:48`) coupled only by a comment (`passage.ts:19`), with no test asserting they agree | UNKNOWN | `state-substrate-model.md` §6 |
| d | **The collapse pipeline is straight-line, not iterative**, though `spec/06` and `band2.ts:135` both say "iterate to a fixed point" | MISSING | `collapse.ts:78-118` |
| e | **`clearIndexCache` (`teleport.ts:104`) has no caller**, so a `setLexicon` swap to a same-named lexicon serves stale buckets | MISSING (a latent path) | grep |
| f | **`solveByWeight` has no UI caller** — the repository's cleanest constraint solver is unreachable from the running application | — | grep over `components/`, `app/`, `artifact/` |
| g | **No CI, no lint config beyond `next lint`, no `.github/`** | MISSING | directory listing |
| h | **`render` (`passage.ts:191`) is imported by `operations.ts:18` and never called** | dead import | grep |
| i | **No path alias in `vitest.config.ts`**, so tests cannot use the `@/` imports the app uses | — | `vitest.config.ts` |

---

## What the negative space adds up to

The repository has a **kernel** (state, observables, transforms, a registry, a
computed cross-product) and it has **five independent discovery episodes** built
on top of it. What it does not have is anything that would let those episodes
refer to one another:

- no identity, so a state cannot be named;
- no provenance record, so a result cannot cite its origin;
- no frontier, so a search cannot be paused;
- no persistence, so nothing survives a reload;
- no composition, so a result cannot be another's input.

These five absences are mutually reinforcing and they are all of the same kind:
**the repository can compute a step, and it cannot refer to a step.** That is
the negative space, stated once.

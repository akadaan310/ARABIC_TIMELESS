# docs/ — the architecture archaeology pass

These nine documents are the output of an **extraction pass**, not a design
pass. Nothing in `lib/`, `app/`, `components/`, `artifact/` or `scripts/` was
changed. No abstraction was introduced, nothing was renamed, no layer was added,
and no gap was closed.

The governing rule for every claim here: **locate the implementation, or mark
the claim as not implemented.**

## Read in this order

| # | File | What it answers |
|---|---|---|
| 1 | [`architecture-review.md`](architecture-review.md) | The system map: entry points, data structures, modules, operations, observables, constraints, candidate generation, collapse, composition, provenance, persistence, browser APIs, UI surfaces, tests |
| 2 | [`state-substrate-model.md`](state-substrate-model.md) | What the system treats as a computational object — and the five state representations that do **not** share a type |
| 3 | [`operations-inventory.md`](operations-inventory.md) | Every existing transformation, in the three families the repository already keeps them in; plus what looks like an operation and is not |
| 4 | [`observables-invariants.md`](observables-invariants.md) | The 25 registered observables, the computed 25 × 6 invariance table, and which rows are demonstrations rather than artefacts |
| 5 | [`existing-discovery-mechanisms.md`](existing-discovery-mechanisms.md) | Where `generate → filter → collapse → record` already happens, and where it only appears to |
| 6 | [`architecture-examples.md`](architecture-examples.md) | Six existing computations traced end to end — four positive, **two negative** |
| 7 | [`architecture-experimental-results.md`](architecture-experimental-results.md) | Every experiment run, with reproduction commands; the Furqān, Tartīl, capability, bounds and provenance answers |
| 8 | [`architecture-gaps.md`](architecture-gaps.md) | Negative space — what is absent, with the evidence for the absence. No solutions proposed |
| 9 | [`architecture-stoppers.md`](architecture-stoppers.md) | Thirteen conditions that must **stop** a future implementation pass, plus the general guards |

## Reproducing everything

```
npm install
npm test                                                        # 5 files, 72 tests
npx vitest run lib/engine/__tests__/archaeology.diagnostic.test.ts
```

The diagnostic file is the only file this pass added to `lib/`. It is marked
`DIAGNOSTIC` in its header, asserts almost nothing, and prints what existing
mechanisms actually do. Tags of the form `[E1]`, `[E4b]`, `[E12]` in the
documents refer to its labelled output blocks.

Baseline before the pass: 4 files, 50 tests, all passing. After: 5 files, 72
tests, all passing. `npx next build` succeeds, 33 routes.

## The four headline answers

| Question | Answer |
|---|---|
| Does a **Furqān-like** discrimination mechanism already exist? | **FOUND** — four of them: `collapse()`, `solveByWeight()`, `Constraint.admits`/`suggest()`, and `isNewChannel()`. They share no type and no registry |
| Does a **Tartīl-like** traversal already exist? | **PARTIAL** — the single admissible transition is confirmed present and needed no glue; a state sequence and an edge relation both exist. No closed type, no transition function, no path, no frontier, no termination, no record |
| Can the runtime **describe its own capabilities**? | **PARTIAL** — 21 layers, 25 observables, 6 transforms, 13 operations, 5 constraints, 5 channels, 35 patterns and 13 constants are all enumerable in-process. There is no single entry point and no HTTP surface |
| Is **provenance** recoverable? | **PARTIAL** — of five audited result types, two reconstruct fully, one partially, two not at all |

## The one finding that matters most

`expand()` caps its candidate enumeration and **truncates prefix-first**, so a
truncated candidate set is the lexicographically earliest `cap` candidates, not
a sample. Four of eight call sites discard the `truncated` flag. Downstream,
a never-generated candidate and an eliminated one reach the same terminal value,
and one user-facing sentence in the reader is false because of it.

Details: `architecture-examples.md` §6, `architecture-stoppers.md` S-1 and S-2.

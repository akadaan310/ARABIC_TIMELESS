# ENGINE SDK — packages

Canonical computational substrate, extracted from three prior-research
systems (isnaad, arabic-timeless itself, and Mirtal/chatgptnmyowner) plus the
Sayyarah specification, per `docs/engine-sdk/EXTRACTION_LEDGER.md` and
`docs/engine-sdk/ARCHITECTURE.md`. Hosted here rather than a standalone repo
by explicit user choice, because arabic-timeless already had the closest
working analog of the canonical `Observable`/`Transform` shape to build on.

This is **Phase 3, partial**: the highest-confidence `EXISTING`-status
primitives from the ledger, implemented as real, independently-tested
TypeScript modules — not a wrapper around the whole app, and not a rewrite of
`lib/engine`. `lib/engine` is untouched except for one new, additive test
file. Nothing here is imported by the Next.js app yet.

No package manager workspaces — these are plain TypeScript modules under one
`tsconfig.json`, importing each other by relative path (see each package's
own `index.ts` for its actual dependencies; `@engine/*` path aliases exist in
`tsconfig.json` for editor ergonomics but vitest resolves relative imports
directly). Every test file doubles as the executable specification of its
package's behavior — read them before the prose.

| Package | Status | What it is | Ledger ref |
|---|---|---|---|
| `provenance` | EXISTING (new) | `Provenance`, `BoundSignature` — the multi-hop derivation record none of the three source repos has (adapted from Mirtal's one-hop `mirtal.provenance()`) | §J |
| `corpus` | EXISTING | Typed `Locus` granularity (no silent ayah/word/segment coercion — `project()` refuses any unregistered granularity change), `Selection` (Sayyarah's قَبْضة), `LocusJoin`, coverage accounting | §A, §E5 |
| `relation` | EXISTING | `Relation`, `epistemicType` (Mirtal's نصّي/إدراكي, confirmed real and load-bearing there), extensible kind registry | §B |
| `discovery` | EXISTING | `DiscoveryState` lifecycle, bound-relative `reconcileState` (an EXHAUSTED claim demotes to KNOWN the moment the bounds it was computed under change) — ported from the single strongest primitive found in any of the three repos, Mirtal's discovery ledger | §D2, §D3 |
| `arabic` | EXISTING + closes a GAP | `Observable<TSubject,TValue>`/`Transform` generalized from this repo's own `lib/engine/types.ts`; `verifyInvertibility` is new — no repo in the evidence base had a generic apply→invert→compare verifier. See the wiring test below. | §F |
| `structure` | EXISTING | `shapeOf` — PCA shape classifier (linearity/planarity/sphericity) via a 24-sweep Jacobi eigensolver, ported near-verbatim from isnaad | §E1, §E2 |
| `spatial` | EXISTING | `measureBasis` — null-model locality evaluator (`locality = medianRelated / medianRandom` against 20,000 deterministic random pairs), ported near-verbatim from isnaad. `Embedding.evaluation` is a required field on purpose — see the module doc comment for why. | §E3, §E4 |
| `capability` | EXISTING | `Capability` descriptor schema (honest `UNAVAILABLE` + reason, never silent omission), ported from Mirtal. Client-side authority gating is explicitly REJECTED, not ported — see the module doc comment. | §I1, §I2 |
| `traversal` | EXISTING | `walk()` — bounded greedy walk with a full, replayable step log; `replay()`, `joinWith()` (Sayyarah's ارْتَدَّ...قَصَصًا / بَلَغَ مَجْمَعَ البَحْرَيْن) | §H, §G3, §G4 |
| `example` | — | One executable end-to-end test chaining every package above through the full canonical chain (Mission §25) | — |

## The flagship integration

`lib/engine/__tests__/engine-sdk-invertibility.test.ts` runs
`@engine/arabic`'s `verifyInvertibility` against this repo's own 6 real
`Transform` objects (`reflect`, `shift1`, `shift3`, `reverse`, `silent`,
`permute`). Before this test, `invertible: true` was set on all six and
checked by nothing. The result is not uniform: `reflect`/`shift1`/`shift3`/
`reverse` are pure functions of the word alone and are confirmed genuinely
invertible; `silent`/`permute` build their bijection from an internal `rng`
argument that `apply()` never exposes, so the honest, correct verdict for
them is **unverifiable** — not a silent pass. Run it:

```
npx vitest run lib/engine/__tests__/engine-sdk-invertibility.test.ts
```

## What is deliberately NOT here

- `@engine/operations` as a separate package — folded into `traversal`
  for this pass; `ARCHITECTURE.md` §12 flags this as still open.
- Any of the 8 isnaad detectors, 6 Mirtal sabab generators, Mirtal's
  scope-gating, or isnaad's 4 concrete spatial bases — all REJECTED from
  becoming canonical per the ledger; they stay in their source repos as
  domain implementations and regression fixtures.
- Real corpus wiring — every test here uses small synthetic data on purpose.
- Audio, realtime, and agent packages — deferred per Mission §14/§15/§16,
  `ARCHITECTURE.md` §12.
- Sayyarah-derived operations other than the two already implemented in
  `traversal` (`replay`, `joinWith`) — everything else in
  `EXTRACTION_LEDGER.md` marked PROPOSED stays a type-level extension point,
  not working code, per the mission's explicit rule against presenting a
  proposal as an established result.

Run everything: `npx vitest run` (92 tests, all packages + the existing app
test suite, all green as of this writing) and `npx tsc --noEmit` (clean under
this repo's existing `strict` tsconfig).

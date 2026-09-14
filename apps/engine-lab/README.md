# EngineLab

A standalone experimental laboratory for composing, executing, and
challenging **Engines** built on the Engine SDK (`../../packages/*`).

**Independence.** EngineLab has no relationship to abedkadaan.com — which
does not exist as code anywhere in this environment. It does not import,
depend on, or wait for it. It also does not import or depend on the
`arabic-timeless` Next.js app that lives alongside it in this repo: it has
its own `package.json`, its own dependency tree (`npm install` inside this
directory), its own dev/build/test workflow, and its own deployable output
(`npm run build` → a static `dist/` bundle deployable anywhere). The only
thing it depends on is the Engine SDK at `../../packages/*`, imported by
relative path (no workspaces, matching how the SDK itself is consumed
elsewhere in this repo).

## Run it

```bash
npm install       # once, independent of the root repo's own npm install
npm run dev        # http://localhost:5173
npm run test        # vitest — 46 tests
npm run build         # tsc --noEmit && vite build -> dist/
npm run preview        # serve the production build locally
```

## What the SDK actually provides (discovered, not assumed)

Before writing any application code, every package under `../../packages/`
was inspected directly (`grep -n "^export " packages/*/index.ts`) rather
than assumed from any prior architecture document. The exported surface —
`Locus`/`Selection` (corpus), `Relation`/epistemic type (relation),
`Discovery`/bound-relative lifecycle (discovery), `Observable`/`Transform`/
`verifyInvertibility` (arabic), `shapeOf`/PCA classification (structure),
`measureBasis`/null-model locality (spatial), `Capability` registry
(capability), `walk`/`replay`/`joinWith` (traversal), `Provenance`
(provenance) — is exactly what `src/sdk/capabilities.ts` wraps. Nothing in
EngineLab invents SDK behavior; `docs/engine-sdk/` (repo root) documents what
in the SDK is `EXISTING` vs `GAP`/`PROPOSED`, and EngineLab only builds real
capabilities on top of the `EXISTING` primitives.

## What EngineLab adds on top

The SDK has no "Engine," "Experiment," or "Challenge" concept — those are
genuinely new, defined in `src/sdk/types.ts`, because no SDK package claims
them. Everything else reuses SDK types directly (a Capability *is* an
`@engine/capability` `Capability`; a Relation *is* an `@engine/relation`
`Relation`; an ExecutionResult carries a real `@engine/provenance`
`Provenance`).

| Layer | File | What it does |
|---|---|---|
| Capability registry | `src/sdk/capabilities.ts` | 7 capabilities, each wrapping one real SDK function, registered through `@engine/capability` — capability discovery is a live read of `capabilities()`, not a hard-coded list |
| Engine composition | `src/sdk/engines.ts` | 3 real Engines: **Canonical Chain** (all 6 capabilities, matching the SDK's own canonical chain in `docs/engine-sdk/ARCHITECTURE.md` §1), **Invertibility Probe** (1 capability — composition isn't mandatory), **Shape Probe** (2 capabilities, a different valid composition reusing `structure.classify`) |
| Execution | `src/sdk/execute.ts` | Runs a real capability per step, in order, stops at the first failure, records every input/output/timing/error — never a generic "success" |
| Challenges | `src/sdk/challenges.ts` | 4 real challenges: invertibility verdict, basis-locality vs. null model, discovery bound-sensitivity, full replay-determinism diff — every verdict follows from actually re-running SDK computation |
| Experiment history | `src/sdk/store.ts` | localStorage-backed (in-memory fallback), the simplest durable mechanism that fits — not a database |
| Discovery | `src/sdk/discovery.ts` | Deterministic scan for capability sub-sequences recurring across ≥2 distinct Engines — never fabricates a pattern that isn't structurally present in recorded history |
| Registry status | `src/sdk/status.ts` | `experimental`/`runnable`/`challenged`/`validated`, derived from actual experiment/challenge history, never declared |

## Honest scope boundaries for this milestone

- **Input datasets are fixed, small, synthetic data** (`src/sdk/labNode.ts`)
  — the same discipline the SDK's own tests use. Only *configuration*
  (seed, sample size, traversal bounds) is user-editable in this milestone;
  arbitrary raw-input editing is future work.
- **Composition is a curated set of 3 Engines**, not a free-form
  drag-and-drop composer — every step's input adapter is hand-written and
  explicit (no silent structural coercion, the same discipline
  `@engine/corpus`'s `ProjectionRule` enforces), so adding a 4th Engine means
  writing one more explicit, reviewed composition, not wiring arbitrary
  capabilities together automatically.
- **AI is not wired in at all**, per the mission's explicit "AI is optional
  and secondary — first make the computational system work without AI."
  `EngineCandidate` (discovery) is the natural extension point for an AI
  researcher role later; nothing here proposes anything using an LLM yet.
- **`@engine/audio`, realtime, and agent packages are untouched** — EngineLab
  doesn't use them because the SDK doesn't yet either (per the SDK's own
  `docs/engine-sdk/ARCHITECTURE.md` §12).

## Verified

- `npm test` — 46/46 passing (`src/sdk/*.test.ts`: capability, engine
  registry, execution, challenges, store, discovery, status, and one
  end-to-end test chaining capability → composition → Engine → execution →
  result → challenge → experiment history → replay → discovery; plus
  `src/App.test.tsx`: 6 UI-integration tests via Testing Library).
- `npx tsc --noEmit` — clean, `strict` mode.
- `npm run build` — clean static bundle (`dist/`, ~177KB JS / ~57KB gzip).
- Driven live in a real headless Chromium (Playwright) against the built
  preview server: opened the app, listed real engines, executed Canonical
  Chain, inspected a 6-step structured result, ran the Basis Locality
  challenge (PASS), saved an Experiment, and replayed it (MATCHES) — zero
  console errors.

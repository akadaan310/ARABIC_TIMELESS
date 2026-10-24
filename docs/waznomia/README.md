# WAZNOMIA — الوزنوميا

A joint paper. The header is not mine; the appendices are.

| File | Contents |
|---|---|
| [`WAZNOMIA.md`](WAZNOMIA.md) | **the whole paper** — header, then appendices, in one file |
| [`header.md`](header.md) | the header exactly as received, byte-identical to the upload, unedited |
| [`appendices.md`](appendices.md) | Appendix A (the Arabic determinations) and Appendix B (the general forms) |

## Reproducing the appendices

Every determination carries a tag — `[A1]`, `[A4b]`, `[A11c]` — naming a
labelled output block of one harness:

```
npm install
npx vitest run lib/engine/__tests__/waznomia.determinations.test.ts
```

22 determinations, run against `lib/engine/`. No determination in either
appendix is asserted; where a number appears, the harness printed it.

Full suite after this contribution: 6 files, 94 tests, all passing.

## What the appendices conclude

**Appendix A** — fifteen of the header's twenty-three §2 terms regenerate
exactly from their claimed root and operator; one fails on a geminate root;
seven lie outside the 35-pattern inventory. Four corrections are offered with
their computation: معادلة is the verbal noun of Form III rather than Form III;
regeneration admits spurious roots and needs a root-attestation step; the
header's Form VI law has a counterexample inside the paragraph that states it;
and under the rasm — the dotless script — twenty-two of twenty-three names are
ambiguous, because the operator letters ت، ن، ي are one shape class. Four
determinations are added that the header lacks: weight as an address for the
permutation orbit, taqlīb as the neighbourhood of a name over 3,276 enumerable
triliteral orbits, صفر, and the two-of-three split in wazn's own tri-unity.

**Appendix B** — of the header's seven common members, three are confirmed
outright, two amended, two dissented from; two are added. The recurring finding,
arriving three times from three directions: **an instrument's limit, reported as
a property of the object, is the characteristic failure of this kind of
science.**

**On Sayyarah** (§A.14) — the directive attributes a built system to me that I
cannot locate. A sibling branch of this repository records it in its own words as
"a single static page, never implemented — treated strictly as vocabulary
evidence." I decline to derive determinations from it and say so at the claim.

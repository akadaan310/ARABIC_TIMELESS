# ARABIC TIMELESS

### A twenty-layer definition of dotless Arabic

Dotless Arabic — the bare skeleton, the *rasm* (الرسم) — is the original form of
the language. This repository defines it as a language, and specifies its
features with the rigor normally reserved for a formal system.

The claim this specification exists to make precise is that the dotless script
has a **programmable nature**: that the skeleton is complex enough to be
interacted with, operated on, and computed over; and that every one of its
features is executable by hand.

---

## The shape of the argument

Everything currently taught about the script — the shape classes, the joining
rules, root-and-pattern morphology, abjad values, prosody, the permutation of
roots — is **today's definition**. It is not wrong. It is also not the main
aspect. It compresses into a single layer, **Layer 0**, and the architecture is
built above it.

Twenty layers sit above that floor. They are grouped into five bands:

| Band | Layers | Subject |
|---|---|---|
| **I — The Alphabet Alone** | 1–3 | What can be done with the bare letter-set: no words, no text, no context |
| **II — The Skeleton** | 4–7 | The alphabet becomes text; what the skeleton is as an object |
| **III — Transformation** | 8–11 | What can be done to a string |
| **IV — Structure** | 12–15 | Invariants, functions, and how the layers sit together |
| **V — Execution** | 16–20 | The cost model, the body, and what survives |

---

## The organizing property: timelessness

The methods of this language are abstract enough to execute in any era. That is
not a slogan here — it is the admission test. A candidate is a layer only if it
survives the contract.

## The Layer Contract

A candidate qualifies as a layer **if and only if** it satisfies all five:

1. **Substrate independence** — executable with hand, surface, and memory alone.
   No instrument any era might lack. Sand, clay, breath, and stone all suffice.
2. **Closure** — its operations map the alphabet, or strings over it, back into
   the alphabet or into integers.
3. **Independence** — it is not derivable from a lower layer. It carries
   information the layers beneath it do not.
4. **Accounted loss** — every operation either inverts, or its loss is exactly
   quantifiable.
5. **Hand-verifiability** — any claim the layer makes can be checked by one
   person, without instruments and without trusting anyone.

Layer 0 is stated, not tested. It is the inherited floor, included for
completeness and then set aside.

Every layer document closes by checking itself against all five conditions. A
layer that fails a condition is cut, not excused.

---

## The twenty

| # | Layer | | Core statement |
|---|---|---|---|
| 0 | The Inherited | الطبقة الموروثة | Today's definition, stated and set aside |
| 1 | The Stroke | الحرف كحركة | A letter is not a shape. It is a recorded gesture |
| 2 | The Face | المقام | A letter is not an atom. It is a function of its neighbours |
| 3 | The Order | الترتيب | The alphabet is not a bag. It is an addressable ring |
| 4 | The Void | الفراغ | The unwritten distinction is a variable, not an absence |
| 5 | Superposition | الاحتمال | A skeleton denotes a set of words, never one |
| 6 | Collapse | الترجيح | Reading is an act performed *on* the text |
| 7 | Segment | الوصل والفصل | The chunk profile is a signature independent of the letters |
| 8 | Substitution | الإبدال | Change which letters, keep the order |
| 9 | Permutation | التقليب | Change the order, keep the letters |
| 10 | Weight | الوزن العددي | Every string carries a number; every number carries back |
| 11 | Pulse | النبض | Every string carries a binary rhythm, separable from its letters |
| 12 | Root | الجذر | The consonantal invariant under vocalic change |
| 13 | Pattern | القالب | A pattern is a function from root to word |
| 14 | Composition | التركيب | Which operations commute, and which do not |
| 15 | Symmetry | التناظر | Fixed points under every transformation above |
| 16 | The Hand | اليد | The realizability test; every operation gets a cost |
| 17 | Articulation | المخارج | The body as address space |
| 18 | Memory | الحفظ | The skeleton is a compression format |
| 19 | Damage | التصحيف | The layers are error-correcting codes for one another |
| 20 | Invariance | الثابت | What survives all nineteen |

---

## Reading order

Read `spec/00-inherited.md` to know what is being set aside, then Band I in
order. Bands II–V depend on Band I and on each other roughly in sequence;
`spec/14-composition.md` indexes everything above it and is best read last.

```
spec/
  00-inherited.md   01-stroke.md      02-face.md         03-order.md
  04-void.md        05-superposition.md  06-collapse.md  07-segment.md
  08-substitution.md  09-permutation.md  10-weight.md    11-pulse.md
  12-root.md        13-pattern.md     14-composition.md  15-symmetry.md
  16-hand.md        17-articulation.md  18-memory.md     19-damage.md
  20-invariance.md
```

## On the numbers in this specification

Every arithmetic claim here is computed, not asserted. Where a document states a
figure — the order of the alphabet's permutation, the size of the silent
subgroup, the degree of a skeleton, the bits a tooth discards — that figure has
been derived and checked. The checkable claims are collected in
`spec/20-invariance.md`.

Nothing in this specification requires a machine to verify. The machine only
confirms what a patient hand would find.

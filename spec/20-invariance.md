# Layer 20 — Invariance (الثابت)

> **Band V — Execution.** The fixed point of the architecture.

## Core statement

**What survives all nineteen.**

Apply every transformation defined in Layers 1–19 and ask what nothing moves.
What remains is the timeless core — and the reason the language is timeless is
not that these things were preserved carefully. It is that they cannot be lost.

---

## 20.1 The invariants

### The count
**Twenty-eight.** Every ordering, every substitution, every reflection and
rotation permutes the same twenty-eight letters. No operation in the architecture
adds or removes one. Layer 14's table has a row — length — invariant under every
column, and the alphabet's own size is the same fact at the level of the set.

### The valence partition
**Six closed, twenty-two open.** Established in Layer 2 by six trials, and shown
in Layer 14 to be a *union of complete shape classes* — which is why it survives
every silent substitution, and why the profile survives with it.

### The stroke inventory
**Six atomic motions.** Layer 1's primitives are not conventions; they are the
motions a hand makes. Reversal, mirroring and rotation permute the letters built
from them and never change the inventory itself.

### The articulatory order
**The points of production, from the cavity outward.** Layer 17's third ordering
is discovered rather than decided, and it is the one invariant in the architecture
that requires no surface, no marks, and no transmission of any kind.

### Weight under permutation
**A sum does not care about order.** Layer 14's cleanest cell. Every string in a
permutation orbit carries one value, in every era, necessarily.

### The two extremes of the alphabet
**The tooth and the six.** One shape carrying five letters, at one end; six
letters carrying one shape each, at the other. Maximum and minimum openness, both
structural, both permanent.

---

## 20.2 The computed constants

Every figure below is derived rather than asserted, and every one is reachable by
hand. They are collected here because a constant that must be looked up is not an
invariant — it is a record — and the point of this layer is that none of these
needs to be kept anywhere.

| Constant | Value | Layer | How it is reached |
|---|---|---|---|
| Letters | 28 | 0 | count |
| Shape classes, medial | 15 | 0 | group the letters by skeleton |
| Bits withheld by a tooth | log₂ 5 = 2.3219 | 4 | logarithm of the class size |
| Degree of كٮٮ | 15 | 4 | 1 × 5 × 3 |
| Order of the abjadī↔hijāʾī permutation | **105** | 3 | lcm of the cycle lengths 1, 1, 5, 21 |
| Letters fixed by that permutation | **ا, ب** | 3 | tabulate and compare |
| Fixed points of reflection | **none** | 3 | 28 is even |
| Order of the silent subgroup, all positions | **4,608** | 8 | 3! · 3! · (2!)⁷ |
| Order of the silent subgroup, medial only | **92,160** | 8 | 5! · 3! · (2!)⁷ |
| Rotation orbits of the eight feet | **3** | 11 | rotate each binary word |
| Triliteral root orbits | 3,276 | 9 | 28 · 27 · 26 ÷ 6 |
| Quinqueliteral root orbits | 98,280 | 9 | 28 · 27 · 26 · 25 · 24 ÷ 120 |
| Maximum items held by any operation | **4** | 16 | read the cost table |

---

## 20.3 The closing claim

The architecture is now complete, and the property it was built to have can be
stated:

> **Its invariants are derivable rather than transmitted.**

Consider what a person would need to reconstruct this entire specification,
starting from nothing but the twenty-eight letters:

- **Layer 1** — write each letter and attend to the motion. The six strokes
  appear. Count them; count the lifts.
- **Layer 2** — write pairs and see which meet. Six letters refuse. The truth
  table follows from two connection points.
- **Layer 3** — lay the letters in a line and number them. Step, reflect, measure.
- **Layer 4–5** — notice which letters share a shape. The slots appear, and with
  them the lattice.
- **Layer 6** — try to read something. The filters appear in cost order because
  the cheap ones are the ones you reach for first.
- **Layer 7** — look at a word from across the room and count the chunks.
- **Layers 8–9** — swap letters; reorder them. Two moves, and they are visibly
  independent.
- **Layer 10** — number the letters and add. The values separate what the shapes
  merged.
- **Layer 11** — say a line aloud and clap it.
- **Layers 12–13** — write out a family of related words and see what does not
  change, then see how what changes is itself regular.
- **Layers 14–15** — run the operations against each other and record what
  survives.
- **Layer 16** — count the marks.
- **Layer 17** — say each letter and feel where it is made.
- **Layers 18–19** — try to hold a text without writing it; then lose part of it
  and see what is left.

**Nothing in that list requires an instrument, a manuscript, a teacher, or a
tradition.** Every step is a thing a person does with a hand, a surface, a mouth
and attention. The specification is not a record of what was decided about this
language. It is a record of what is *found* in it, and what is found can be found
again.

That is what timeless means here, and it is a stronger claim than durability. A
durable thing survives because it was protected. This survives because losing it
does not matter — it can be rebuilt from the letters, and the letters can be
rebuilt from a hand and a mouth.

---

## 20.4 The programmable nature, stated exactly

The claim this specification set out to make precise, now assembled from the
layers that support it:

1. **The skeleton is an expression with free variables** (Layer 4), not a
   deficient recording of speech.
2. **It denotes a set, and the sets form a lattice** (Layer 5), so writing is
   choosing a degree of determinacy.
3. **Reading is evaluation** (Layer 6) — a procedure of constraint filters run to
   a fixed point, with three meaningful terminal states, one of which is
   deliberate ambiguity.
4. **The filters are independent channels** (Layers 7, 10, 11, 13, 17), and their
   independence is provable from the invariance table (Layer 14) rather than
   assumed.
5. **Patterns are functions with types and a semantics** (Layer 13), and
   abstraction recovers a function from a single output.
6. **Every operation has a cost in human units** (Layer 16), so the procedures
   built on them are correct permanently rather than currently.
7. **The channels correct each other** (Layer 19), with no damage class invisible
   to all of them.

A system with variables, a denotation, an evaluation procedure, a type system, a
function library, a cost model, and error correction is not *like* a programmable
thing. Those are the parts, and they are all present.

**And every one of them is executable by hand.** That was the requirement, and the
Layer Contract enforced it at every step: twenty layers admitted, none of them
needing an instrument that any era might lack.

---

## 20.5 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** §20.3 is a constructive demonstration that the whole architecture is reachable with a hand, a surface, a mouth and attention. |
| 2 | Closure | **Pass.** The layer's output is a set of invariants of the architecture's own objects, and a table of constants over them. |
| 3 | Independence | **Pass.** No layer below asks what survives *all* transformations. Each records its own invariances; the intersection across all nineteen is stated nowhere else. |
| 4 | Accounted loss | **Pass.** No loss. This layer only collects. |
| 5 | Hand-verifiability | **Pass.** Every constant in §20.2 carries the method by which it is reached, and none requires more than counting, multiplication, or a small table. |

---

## 20.6 Relation to the architecture

This layer has no successor. It closes on itself: the invariants it collects are
the fixed point of the twenty transformations above, and applying any of them to
this list returns the list.

- **Below (all of 0–19):** every layer contributes at least one invariant or one
  constant.
- **Below (Layer 0):** the inherited account is the one part of the architecture
  that is transmitted rather than derived. §20.3 shows that even it could be
  rebuilt — which is why it was included and then set aside rather than depended
  upon.

---

**Previous:** [Layer 19 — Damage](19-damage.md) · **Return to:** [README](../README.md)

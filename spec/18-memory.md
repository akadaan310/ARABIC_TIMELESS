# Layer 18 — Memory (الحفظ)

> **Band V — Execution.**

## Core statement

**The skeleton is a compression format.**

It stores less than the word it represents and reconstructs the difference by
computation. That is what a compression format is, and the dotless script meets
the definition exactly — including the part where the compression ratio is
calculable in advance.

---

## 18.1 The ratio

Layer 4 established that a skeleton withholds a measurable quantity of
information: log₂ of its degree.

| Skeleton | Degree | Bits withheld |
|---|---|---|
| a single medial tooth | 5 | 2.3219 |
| كٮٮ | 15 | 3.9069 |
| a string of singleton-class letters | 1 | 0 |

> **The bits the skeleton declines to store are exactly Layer 4's degree, in
> logarithm.**

The format is therefore *tunable*: a writer choosing how much to mark is choosing
a point on a compression curve, and Layer 5's lattice is that curve. Full marking
is lossless storage. No marking is maximum compression. Partial marking is
everything between, and the writer selects it per position.

Nothing else in ordinary writing behaves this way. A script without slots stores
at one ratio, always.

---

## 18.2 Storage without writing

The architecture supplies several ways to hold a text with no surface at all.

### As a number
Layer 10's inverse encodes a number as letters and letters as a number. A total
is one item in memory; the string it constrains may be many. Holding the total and
recomputing the string is cheaper than holding the string, whenever the total
determines it closely enough.

### As a rhythm
Layer 11's pulse is a binary word, and a binary word is far easier to hold than a
text — it can be clapped, paced, or breathed. The rhythm constrains the text
without containing it, and a person who has the rhythm and most of the words can
recover the rest.

### As a profile
Layer 7's run lengths are a handful of small integers. **(3, 1)** costs almost
nothing to remember and rules out three-quarters of the alphabet at one position.

### As a root
Layer 12's radicals plus Layer 13's pattern reconstruct a word exactly. Two small
items — a root and a pattern name — regenerate a seven-letter word with no
residue. This is the architecture's densest storage: the pattern library is held
once and serves every word ever built on it.

---

## 18.3 Checksums

Several layers produce short values that verify a longer text:

| Check | Layer | Size | Catches |
|---|---|---|---|
| Weight | 10 | one number | any substitution |
| Profile | 7 | a few integers | any deletion or insertion |
| Pulse | 11 | a binary word | any vowel error |
| Reduction | 10 | one digit | most substitutions, cheaply |

Each is cheap to carry and each is sensitive to a different corruption — which is
Layer 14's table read as a storage strategy rather than an analytical one. A
person memorizing a text and also memorizing its weight has bought error detection
for the cost of one number.

---

## 18.4 The apparatus argument

Layer 16 named memory as the binding constraint: a hand can make unlimited marks,
but a person holds few items at once. This layer is the response to that
constraint, and the response is systematic rather than ad hoc.

> **Every projection in the architecture is a compression scheme, and every one of
> them was already defined for another purpose.**

Weight was defined as a bridge to number. Profile was defined as a joining
consequence. Pulse was defined as rhythm. Root was defined as lexical identity.
None was designed for storage — and all four serve as storage, because a
projection with stated loss is precisely what a compression scheme is.

The architecture did not need a memory layer added to it. It needed one pointed
out.

---

## 18.5 Worked example

Hold the word **مَكْتُوب** using two items.

Store the root **ك–ت–ب** and the pattern name **مَفْعُول**. That is two items in
memory, well within Layer 16's capacity of four, and Layer 13's application
regenerates the full seven-letter word exactly, with its vowels, its prefix and
its long vowel in place.

Now compare storing the seven letters directly: seven items, exceeding capacity,
requiring rehearsal.

**Two items against seven, with lossless reconstruction.** And the root is shared
with every other word in its fibre, so a person holding one root and five pattern
names holds five words for six items rather than thirty-five.

---

## 18.6 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** This layer's entire subject is operating without a surface. It is the least instrument-dependent layer in the architecture. |
| 2 | Closure | **Pass.** Every encoding maps strings to integers, binary words, integer sequences or shorter strings, and every one reconstructs back into strings. |
| 3 | Independence | **Pass.** The projections are inherited, but no layer below asks what it costs to *hold* its own output, or which of several representations is cheapest to retain. Storage cost is new information. |
| 4 | Accounted loss | **Pass.** Rigorously. Every scheme's loss is the loss of the projection it is built on, already stated in the defining layer, and §18.1 gives the ratio in bits. |
| 5 | Hand-verifiability | **Pass.** The example in §18.5 is checked by holding two items, performing the derivation, and comparing with the word. |

---

## 18.7 Relation to neighbouring layers

- **Below (Layer 4):** degree, read as a compression ratio.
- **Below (Layer 5):** the lattice, read as a compression curve with the writer
  choosing a point on it.
- **Below (Layers 7, 10, 11, 12):** the four projections, read as four encodings.
- **Below (Layer 16):** the answer to that layer's binding constraint.
- **Forward (Layer 19):** every checksum in §18.3 is an error-detection channel.
  Storage and damage are the same subject approached from opposite ends — one asks
  what to keep, the other what happens when it is lost.

---

**Previous:** [Layer 17 — Articulation](17-articulation.md) · **Next:** [Layer 19 — Damage](19-damage.md)

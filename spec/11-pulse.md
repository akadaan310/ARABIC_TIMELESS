# Layer 11 — Pulse (النبض)

> **Band III — Transformation.**

## Core statement

**Every string carries a binary rhythm, separable from its letters.**

Each position in a string is either **moving** (متحرك) or **still** (ساكن). Write
moving as 1 and still as 0, and a string projects onto a binary word.

The projection discards every letter and keeps only the beat. What remains is
still enough to constrain a reading — which is the whole of this layer's
usefulness.

---

## 11.1 The units

Binary words are built from two primitives, and the primitives are built from the
bits:

| Unit | | Binary |
|---|---|---|
| **Sabab** | سبب | 10 |
| **Watad** | وتد | 110 |

Two lengths, two shapes. Everything above is composed of these.

---

## 11.2 The feet

Eight feet (التفعيلات), each a short binary word:

| Foot | Binary | Length |
|---|---|---|
| فعولن | 11010 | 5 |
| فاعلن | 10110 | 5 |
| مفاعيلن | 1101010 | 7 |
| مستفعلن | 1010110 | 7 |
| فاعلاتن | 1011010 | 7 |
| مفعولات | 1010101 | 7 |
| متفاعلن | 1110110 | 7 |
| مفاعلتن | 1101110 | 7 |

Read فعولن: watad + sabab = 110 + 10 = 11010. Read فاعلن: sabab + watad =
10 + 110 = 10110. **The same two units in the other order.**

---

## 11.3 The meters are rotation orbits

This is the layer's central structural claim, and it is checkable in a few
minutes with a pencil.

Take a foot's binary word and rotate it — move the first bit to the end,
repeatedly. Most rotations land on **another legal foot**.

> **The eight feet fall into exactly three rotation orbits.**

| Length | Orbit |
|---|---|
| 5 | فعولن ↔ فاعلن |
| 7 | مفاعيلن ↔ مستفعلن ↔ فاعلاتن ↔ مفعولات |
| 7 | متفاعلن ↔ مفاعلتن |

Verify the first by hand. فعولن is 11010. Its rotations are 11010, 10101, 01011,
**10110**, 01101 — and 10110 is فاعلن. Two feet, one cyclic word, seen from two
starting points.

> **The meters are the orbits of rotation.**

The circle method is exactly this, and stating it as group theory removes all its
mystery without removing any of its force. A circle is a cyclic group acting on a
binary word; the meters generated from one circle are the orbit of that action;
and the reason a fixed number of meters exists is that a finite group acting on a
finite word has a finite orbit. **The inventory of metres is not a list that was
compiled. It is a quotient that was computed** — and can be recomputed, from
nothing, by anyone who can rotate a string of ones and zeros.

---

## 11.4 Operations

- **Scansion** — string to binary. One judgement per position.
- **Generation** — enumerate legal binary words; those are the metres.
- **Rotation** — move the first bit to the end. Order *n* for a word of length
  *n*.
- **Orbit** — collect all rotations of a word; identify which are legal.
- **Match** — does a given binary word fit a given metre?

---

## 11.5 Projection, and what it costs

Pulse is a **projection**: many strings share one pulse, and each string has
exactly one. The map is total in one direction and massively many-to-one in the
other, and both facts are used.

Because it is a function, the pulse of a text is never in doubt once the text is
read. Because it is many-to-one, a known pulse constrains a text without
determining it — and constraint without determination is exactly what a filter
needs to be cheap.

The pulse is **orthogonal to the letters**. It looks only at whether each position
moves, never at which letter occupies it, so it removes candidates that the
skeleton, the weight and the profile all leave standing. Layer 6 rates it fourth
in cost order, and it is worth its place precisely because the three cheaper
filters are blind to what it sees.

---

## 11.6 Worked example

A metre is a repeated foot. Scan a line, obtain its binary word, and compare
against the legal words. If the line scans to a repetition of 11010, it is in the
metre built on فعولن; if to a repetition of 10110, on فاعلن.

Now note what §11.3 implies about that pair. A line in the first metre and a line
in the second are, as cyclic words, **the same object** — they differ only in
where the reader starts counting. Two metres that sound entirely different are one
binary word cut at two points, and this is discoverable by anyone with a strip of
paper and a pencil, in any century, without being told.

---

## 11.7 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Clapping. The layer needs a hand and a sense of time, and no surface at all — it is the one layer that can be executed with nothing whatever. |
| 2 | Closure | **Pass.** Scansion maps strings to binary words; rotation maps binary words to binary words; orbit maps them to sets of the same. |
| 3 | Independence | **Pass.** No layer below records whether a position moves. Layers 1–3 describe letters, Layers 4–7 describe skeletons, Layers 8–10 transform letter-strings; none of them can express the beat, because the beat is carried by the vowels that the skeleton omits entirely. |
| 4 | Accounted loss | **Pass.** Rotation is a bijection and inverts exactly. Scansion is a projection whose loss is total on letters and nil on rhythm — the cleanest split in the architecture. |
| 5 | Hand-verifiability | **Pass.** The orbits in §11.3 are confirmed by writing five bits and rotating them. |

---

## 11.8 Relation to neighbouring layers

- **Below (Layer 6):** supplies the prosodic filter, fourth in cost order.
- **Below (Layer 4):** the pulse carries information the skeleton *deliberately
  omits* — vowel presence. This is why it is a genuinely independent channel and
  not a re-reading of the letters.
- **Beside (Layer 9):** rotation is the cyclic subgroup of Layer 9's nested
  groups, acting on binary words instead of letters. The same group, a different
  set — and Layer 14 records that the layers share machinery even when they do not
  share subject matter.
- **Forward (Layer 15):** binary words fixed by rotation are the periodic ones,
  and they are the metrically special cases.
- **Forward (Layer 18):** a rhythm is far cheaper to hold in memory than a text,
  and it reconstructs constraints on the text. Rhythm is the compressed form.
- **Forward (Layer 19):** a vowel error changes the pulse and nothing else. Pulse
  is the only channel that detects it.

---

**Previous:** [Layer 10 — Weight](10-weight.md) · **Next:** [Layer 12 — Root](12-root.md)

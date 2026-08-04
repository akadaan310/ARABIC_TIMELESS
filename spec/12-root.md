# Layer 12 — Root (الجذر)

> **Band IV — Structure.** Invariants, functions, and how the layers sit
> together.

## Core statement

**The consonantal invariant under vocalic change.**

A root (جذر) is the ordered tuple of consonants that survives when everything
mutable is stripped away. Vowels change, prefixes attach, patterns come and go;
the root does not move.

---

## 12.1 Two skeletons, one inside the other

The architecture now has two distinct notions of "what is left when you remove
things", and they are not the same:

| | Removes | Retains |
|---|---|---|
| **Written skeleton** (Layer 4) | the distinguishing marks | every letter written, including long vowels |
| **Root** (this layer) | the vowels, short *and* long, plus all affixed material | the radicals only |

The root sits **beneath** the written skeleton. A skeleton still shows the long
vowels ا و ي where they were written; the root does not. Strip a skeleton
further and the root appears.

> There are two skeletons, one inside the other, and they are reached by
> different erasures.

This nesting matters for Layer 19: damage that destroys the outer skeleton may
leave the inner one intact, and a reader who has the root has a great deal even
when the surface is gone.

---

## 12.2 Operations

### Extraction
String → root. A projection: discard the vocalic and affixal material, keep the
radicals in order.

### The fibre
Root → the set of all words built on it. Extraction's inverse image. The fibre
over a root is its entire family, and the family is generated rather than listed
— Layer 13 supplies the generator.

### Root distance
Two roots sharing radicals in the same positions are near; roots sharing radicals
in different orders are related by Layer 9's permutation; roots sharing none are
unrelated. A metric on the generative base.

### Identity
Two words share a root if and only if they share a meaning-core. The root is the
carrier of lexical identity — not the word, which is a root already committed to
a pattern.

---

## 12.3 Worked example

Take the root **ك–ت–ب**.

Its fibre contains كَتَبَ, كَاتِب, مَكْتُوب, مَكْتَب, كِتَاب, مَكْتَبَة,
اِسْتَكْتَبَ and many more. Every one of them names something to do with writing.
The radicals are unchanged in all of them, in that order, and everything else
varies freely.

Now note what extraction discards, and confirm it is exactly the mutable part:
the vowels differ across the whole fibre; prefixes م and ا and س appear and
vanish; length varies from three letters to seven. **The invariant is precisely
the three radicals in sequence, and nothing else in any of these words is
invariant at all.**

---

## 12.4 Why this is a layer and not a restatement of Layer 4

Layer 4's void is about what the *writing* declines to specify. This layer's root
is about what the *word* holds constant while it changes. They coincide nowhere:

- A fully marked word with no voids at all still has a root.
- A bare skeleton with maximal voids still has a root, and often the root is
  more recoverable than the individual letters, because Layer 13's patterns
  constrain where radicals may fall.

Extraction is available whether or not anything is unbound. Binding is available
whether or not the root is known. The two operations are independent, which
Contract condition 3 requires.

---

## 12.5 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Extraction is deletion by eye — reading a word and saying which letters carry it. |
| 2 | Closure | **Pass.** Extraction maps strings over the alphabet to shorter strings over the alphabet; root distance maps root pairs to integers. |
| 3 | Independence | **Pass.** See §12.4. No layer below can express invariance-under-inflection, because no layer below has any notion of a word changing while remaining the same word. |
| 4 | Accounted loss | **Pass.** Extraction is a projection and its loss is exactly the fibre: given a root, the discarded material is recoverable up to choice of pattern, and Layer 13 enumerates those choices. |
| 5 | Hand-verifiability | **Pass.** Write out a fibre and read off what does not change. The example in §12.3 is checked by inspection. |

---

## 12.6 Relation to neighbouring layers

- **Below (Layer 4):** the inner skeleton to that layer's outer one. Different
  erasure, different invariant.
- **Below (Layer 9):** reordering a root's radicals moves within an orbit. The
  used and the neglected are facts about which roots the fibre-structure
  actually populates.
- **Above (Layer 13):** the root is the argument; the pattern is the function.
  This layer supplies half of the pair and is incomplete without the other.
- **Forward (Layer 19):** the innermost invariant is the last thing damage
  destroys, which makes it the recovery channel of last resort.

---

**Previous:** [Layer 11 — Pulse](11-pulse.md) · **Next:** [Layer 13 — Pattern](13-pattern.md)

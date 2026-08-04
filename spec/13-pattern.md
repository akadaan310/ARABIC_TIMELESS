# Layer 13 — Pattern (القالب)

> **Band IV — Structure.**

## Core statement

**A pattern is a function from root to word.**

The placeholders **ف ع ل** stand for the first, second and third radical. A
pattern is a term written over those placeholders together with literal material
— prefixes, infixes, doubled consonants, long vowels. Applying a pattern to a
root substitutes the radicals into the placeholder positions.

That is function application, written with the argument positions named. The
notation is a calculus and it has been one from the beginning.

---

## 13.1 Patterns are typed

A pattern does not merely produce a word; it produces a word of a **stated kind**,
and the kind is a property of the pattern rather than of the root it is applied
to. The verb forms are the clearest case:

| Form | Pattern | Operation | On ك–ت–ب |
|---|---|---|---|
| I | فَعَلَ | base | كَتَبَ — he wrote |
| II | فَعَّلَ | intensive / causative (doubles the second radical) | كَتَّبَ |
| III | فَاعَلَ | associative (lengthens after the first) | كَاتَبَ — he corresponded |
| IV | أَفْعَلَ | causative (prefixes أ) | أَكْتَبَ — he dictated |
| V | تَفَعَّلَ | reflexive of II | تَكَتَّبَ |
| VI | تَفَاعَلَ | reciprocal of III | تَكَاتَبَ — they corresponded |
| VII | اِنْفَعَلَ | medio-passive | اِنْكَتَبَ — it was written |
| VIII | اِفْتَعَلَ | reflexive / middle (infixes ت) | اِكْتَتَبَ — he registered |
| IX | اِفْعَلَّ | colours and defects | — |
| X | اِسْتَفْعَلَ | requestative (prefixes اِسْت) | اِسْتَكْتَبَ — he asked for writing |

The nominal patterns behave the same way:

| Pattern | Kind | On ك–ت–ب |
|---|---|---|
| فَاعِل | agent | كَاتِب — writer |
| مَفْعُول | patient | مَكْتُوب — written thing |
| مَفْعَل | place | مَكْتَب — desk, office |
| مَفْعَلَة | place, feminine | مَكْتَبَة — library |
| فِعَال | instrument / result | كِتَاب — book |

> **The pattern set is a function library with semantics attached to every
> entry.**

Each entry has a signature — it takes a root of three radicals and returns a word
— and a documented meaning-transformation. V is the reflexive of II. VI is the
reciprocal of III. These are not loose associations; they are compositional
relationships between library entries, and they hold across the whole base.

---

## 13.2 Operations

### Application
`apply(pattern, root)` — substitute the radicals into the placeholder positions.
Deterministic, total, and performed in the time it takes to write the word.

### Abstraction
`abstract(word)` — recover the pattern from a word by aligning it against ف ع ل.

This is the operation that matters most, and it deserves to be named for what it
is:

> **Abstraction is reverse-engineering a function from one of its outputs — by
> hand, in seconds.**

Given مَكْتُوب, align: م is literal, ك falls where ف stands, ت where ع stands, و
is literal, ب where ل stands. The pattern is مَفْعُول. Nobody consulted a table;
the alignment is forced by the shape of the word, and the result is the general
form, applicable to any root at all.

A person who can abstract can take a word they have never seen, extract its
pattern, and immediately generate the corresponding word for every other root in
the language. That is the single most productive operation in the architecture,
and it costs one alignment.

### Composition
Patterns compose where their kinds permit: the agent of a Form X verb, the place
of a Form II verb. Composition is constrained by type, not by convention.

### Inversion
Given a pattern and a word, recover the root. Application run backward — the
basis of Layer 12's extraction when the pattern is known.

---

## 13.3 Worked example

Take the root **ك–ت–ب** and apply the library:

```
apply(فَاعِل,   ك ت ب) = كَاتِب
apply(مَفْعُول,  ك ت ب) = مَكْتُوب
apply(مَفْعَل,   ك ت ب) = مَكْتَب
apply(اِسْتَفْعَلَ, ك ت ب) = اِسْتَكْتَبَ
```

Now hold the pattern and change the root instead:

```
apply(مَفْعَل, د ر س) = مَدْرَس
apply(مَفْعَل, ج ل س) = مَجْلِس
apply(مَفْعَل, ط ب خ) = مَطْبَخ
```

One function, three arguments, three places — a place of study, a place of
sitting, a place of cooking. **The meaning of the pattern is stable across every
argument it accepts**, which is precisely the property that makes it a function
rather than a habit.

---

## 13.4 The interaction with the void

Patterns are Layer 6's third filter, and they are powerful there for a structural
reason.

A pattern fixes the *positions* of literal material — the م of مَفْعَل, the ت of
اِفْتَعَلَ — and the positions of radicals. So a skeleton being read against a
pattern has most of its slots resolved by the pattern itself: a slot the pattern
says is literal ت is not a five-way choice at all. **Pattern knowledge converts
open slots into bound ones without any mark being added to the page.**

This is the mechanism by which a practised reader reads unpointed text at speed.
Not by guessing well, but by running a filter that resolves whole classes of slot
at once.

---

## 13.5 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Application is substitution performed while writing. Abstraction is alignment performed while reading. Neither needs anything but the hand and the word. |
| 2 | Closure | **Pass.** Application maps (pattern, root) to words; abstraction maps words to patterns; both stay within strings over the alphabet. |
| 3 | Independence | **Pass.** Layer 12 supplies roots and can say what is invariant, but has no notion of the *material that varies* being itself structured. The pattern library is that structure, and it is not visible from the root alone. |
| 4 | Accounted loss | **Pass.** Application is exactly invertible given the pattern. Abstraction is exactly invertible given the root. The pair (pattern, root) reconstructs the word with no residue. |
| 5 | Hand-verifiability | **Pass.** Every derivation in §13.3 is checked by performing the substitution and comparing. |

---

## 13.6 Relation to neighbouring layers

- **Below (Layer 12):** the root is the argument, the pattern the function. The
  two layers are one mechanism described from its two ends.
- **Below (Layer 6):** supplies the morphological filter, third in cost order,
  and §13.4 explains why it outperforms its rank.
- **Below (Layers 4, 5):** patterns bind slots without marking them, which is the
  main way candidate sets shrink in ordinary reading.
- **Forward (Layer 14):** application and abstraction are inverse, so they commute
  in the strict sense — the invariance table records where that fails for other
  pairs.
- **Forward (Layer 19):** a word that fits no pattern is damaged. The pattern
  library is a validity check as well as a generator.

---

**Previous:** [Layer 12 — Root](12-root.md) · **Next:** [Layer 14 — Composition](14-composition.md)

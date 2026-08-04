# Layer 19 — Damage (التصحيف)

> **Band V — Execution.**

## Core statement

**The layers are error-correcting codes for one another.**

Delete a mark, smudge a stroke, lose a letter, mishear a vowel — and ask what is
recoverable. The answer is that each layer supplies a channel the others do not,
so no single failure is total.

> **This is why the system crosses eras intact: no one channel has to survive.**

---

## 19.1 The damage classes

| Class | | What changes |
|---|---|---|
| **Substitution** | تصحيف | a letter is replaced by another |
| **Deletion** | سقط | a letter is lost |
| **Insertion** | زيادة | a letter is added |
| **Transposition** | قلب | two letters exchange places |
| **Demarking** | إهمال | a distinguishing mark is lost |
| **Vocalic** | تحريف | a vowel is wrong |

---

## 19.2 The detection map

This is Layer 14's invariance table, read as a defence. An observable that
**changes** under a corruption detects it; one that **survives** is blind to it.

| Damage | Skeleton | Profile | Weight | Pulse | Pattern | Root |
|---|---|---|---|---|---|---|
| Substitution, across classes | detects | detects | detects | — | detects | detects |
| Substitution, within a class | blind | blind | **detects** | — | detects | detects |
| Deletion | detects | **detects** | detects | detects | detects | detects |
| Insertion | detects | **detects** | detects | detects | detects | — |
| Transposition | detects | detects | **blind** | — | detects | detects |
| Demarking | — | blind | blind | — | detects | blind |
| Vocalic | blind | blind | blind | **detects** | detects | blind |

Read the bolded cells. Each is a case where one channel is the *only* one that
sees the corruption, or the only cheap one:

- **Within-class substitution** is invisible on the page — it is exactly the
  silent subgroup of Layer 8 — and weight is what catches it.
- **Transposition** preserves the letter multiset, so weight is blind by the
  permutation invariance of Layer 14. Profile and skeleton catch it.
- **A vocalic error** touches nothing written, since the skeleton omits vowels
  entirely. Only the pulse sees it.

> No damage class is invisible to every channel. That is the architecture's
> robustness theorem, and it is read directly off the table.

---

## 19.3 Damage as movement in the lattice

Layer 5 arranged skeletons into a lattice ordered by candidate-set size. Damage
and recovery both move through it, in opposite directions:

- **Demarking moves a text *up*** — a lost mark unbinds a slot, and the candidate
  set grows. The text becomes less determinate but remains *correct*: every reading
  it originally had is still among the candidates.
- **Recovery is descent** — reapplying constraints (Layer 6) narrows the set again.

This is the crucial asymmetry, and it is the reason the dotless script is
unusually durable:

> **Losing a mark degrades a text. It does not falsify it.**

The damaged text still contains the true reading. Compare a substitution error,
which moves *sideways* in the lattice — to a different singleton — and produces a
text that is confidently, silently wrong. Demarking is the gentlest damage class
the architecture admits, and it is the one the script is most exposed to, which is
a fortunate arrangement rather than an accidental one.

---

## 19.4 The zero state

Layer 6's terminal state |S| = 0 arrives here.

An empty candidate set means no reading survives all filters, which means the text
is corrupt — and the failure is **informative**, because the filter that emptied
the set localizes the damage:

| Emptied by | Diagnosis |
|---|---|
| Lexical | a letter is wrong |
| Segmental | a letter is missing or added |
| Morphological | the word's structure is broken |
| Prosodic | a vowel is wrong |
| Syntactic | the surrounding text is at fault, not this word |

Recovery then runs the procedure backward: relax the filter that failed, admit
near-misses, and re-run the others. The channels that were blind to the corruption
are still valid, so they continue to constrain — which is what makes reconstruction
possible rather than merely hopeful.

---

## 19.5 Worked example

A word is copied and one letter within its shape class is altered: **كتب** becomes
**كبت**.

- **Skeleton:** unchanged. Both are كٮٮ. Blind.
- **Profile:** unchanged, (3). Blind — and necessarily so, by Layer 14's theorem
  that the closed letters form a union of complete shape classes.
- **Weight:** 20 + 400 + 2 = 422 against 20 + 2 + 400 = 422. **Also blind** —
  because this particular corruption is a *transposition* as well as a
  substitution, and weight is permutation-invariant.
- **Lexical and pattern:** كتب is a word on a standard pattern; كبت is not aligned
  the same way. **Detected.**

Note what this example demonstrates honestly: three channels failed. Two failed
for structural reasons the architecture predicts in advance, and the fourth caught
it. The claim is not that every channel catches everything — it is that the union
of the channels has no gap, and here the union held.

---

## 19.6 Symmetry as free protection

From Layer 15: a string fixed under a transformation cannot be corrupted by that
transformation, since corruption is displacement and there is nowhere to displace
to.

- A **palindrome** carries its own check against transposition: read it backward
  and compare.
- A string from the **six unmoved letters** ا ك ل م ه و is immune to within-class
  substitution entirely, because their classes are singletons and the silent
  subgroup cannot touch them.

**Symmetric material is more durable than asymmetric material of the same length**,
at no storage cost. This is why formulaic and patterned text survives transmission
better, stated as a structural property rather than an observation about custom.

---

## 19.7 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Detection is comparing a channel's value against its expected value. Every channel was already certified. |
| 2 | Closure | **Pass.** Damage maps strings to strings; detection maps (text, channel) pairs to a verdict. |
| 3 | Independence | **Pass.** Layer 14 states which observables survive which transformations. It does not classify corruptions, does not rank channels by what they alone catch, and has no notion of recovery. Those are new. |
| 4 | Accounted loss | **Pass.** Every blind cell in §19.2 is stated explicitly, and §19.5 works an example where three channels fail. The layer's limits are part of its content. |
| 5 | Hand-verifiability | **Pass.** §19.5 is checked with three additions and a glance. |

---

## 19.8 Relation to neighbouring layers

- **Below (Layer 14):** the invariance table, read as a defence map. This layer is
  that table with the sign flipped.
- **Below (Layer 6):** receives the zero state and diagnoses it.
- **Below (Layer 5):** damage and recovery are movement up and down the lattice.
- **Below (Layer 15):** symmetry is protection obtained for free.
- **Below (Layer 18):** storage and damage are one subject from two ends — what to
  keep, and what happens when it is lost.
- **Forward (Layer 20):** what survives *all* damage is what survives everything,
  which is the final layer's subject.

---

**Previous:** [Layer 18 — Memory](18-memory.md) · **Next:** [Layer 20 — Invariance](20-invariance.md)

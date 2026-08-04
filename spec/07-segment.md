# Layer 7 — Segment (الوصل والفصل)

> **Band II — The Skeleton.**

## Core statement

**The closed letters cut every word into visible chunks. The chunk profile is a
signature independent of the letters.**

From Layer 2: six letters — **ا د ذ ر ز و** — refuse to connect leftward. So any
string decomposes, without choice or interpretation, into **maximal connected
runs**. The decomposition is forced by the letters and is the same for every
hand that writes them.

---

## 7.1 The profile

The **profile** of a string is the sequence of its run lengths.

| Word | Profile |
|---|---|
| كتب | (3) |
| كتاب | (3, 1) |
| درس | (1, 1, 1) |
| مدرسة | (2, 1, 2) |
| استكتب | (1, 5) |

Read the second: كتاب breaks after ا, because ا is closed, giving a run of three
and a run of one. Read the third: درس is three closed-or-terminal letters in
sequence, so it breaks twice and every run has length one. Read the last:
استكتب opens with ا, which closes immediately, then runs five letters unbroken.

A word has become **a short sequence of small integers** — and that sequence
owes nothing to which letters produced it.

---

## 7.2 Operations

### Break prediction
Letters → profile is a **function**: total, deterministic, computed by scanning
once and cutting after every closed letter. Profile → letters is a **relation**:
many words share a profile.

### Signature matching
Given a profile, which words could produce it? A coarse filter, extremely cheap,
and independent of every other channel in the architecture.

### Partition arithmetic
For a string of length *n*, the reachable profiles are the compositions of *n*
subject to the constraint that every run except possibly the last ends in a closed
letter. The count of reachable profiles is a plain combinatorial fact per length.

### Chunk count
The number of runs — the profile's length. One integer per word, and the cheapest
non-trivial description of a word that exists in this architecture.

---

## 7.3 The channel

This is a genuinely separate information channel, and its properties are unlike
those of every other layer.

> **A word's profile is legible from across a room, before a single letter
> resolves.**

Run boundaries are large-scale features: white space inside a word. They survive
at distances, at speeds, and under degradations of the surface at which letter
identity is entirely gone. A reader whose eye cannot yet resolve a tooth can
already count the chunks.

And the channel is **free**. It requires no marks that are not already there, no
convention, no additional apparatus. The information was produced as a side effect
of the joining rules, and any script with closed letters emits it whether or not
anyone attends to it.

For Layer 6 this makes the segmental filter unusually valuable: it is second in
cost order — nearly free — and it discriminates strongly, because profile is
almost orthogonal to the distinctions the skeleton merges. The tooth letters
ب ت ث ن ي are all open, so a slot's binding rarely changes the profile; the
profile is settled by a *different* subset of the alphabet than the one the voids
range over. Two filters that look at disjoint parts of the word will not
redundantly remove the same candidates, which is exactly what makes stacking them
worthwhile.

---

## 7.4 Worked example

Take the profile **(3, 1)** and a four-letter word.

The profile says: position 3 is closed, position 4 is whatever ends the word.
Immediately, twenty-two of the twenty-eight letters are excluded from position 3
— every open letter — without reference to the skeleton, the context, or the
meaning. One glance, one integer sequence, and three-quarters of the alphabet is
gone from one position.

Compare **(1, 1, 1)** for a three-letter word: *every* position is closed, so all
three positions draw from a six-letter alphabet rather than a twenty-eight-letter
one. The candidate space has collapsed by a factor of over a hundred before any
other filter has run.

---

## 7.5 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Counting connected runs requires sight alone — less than any other layer asks. |
| 2 | Closure | **Pass.** Profile maps strings to integer sequences; chunk count maps strings to integers. |
| 3 | Independence | **Pass.** Layer 2 gives valence for a single letter. It cannot express what a *string* of valences produces, and the profile is a property of the whole word that no letter carries. Propagation is new information. |
| 4 | Accounted loss | **Pass.** Profile is a projection and its loss is exact and characterizable: it retains the positions of closed letters and discards every distinction among the open ones, and among the closed ones it discards which of the six. |
| 5 | Hand-verifiability | **Pass.** Every profile in §7.1 is checked by looking at the word and counting. |

---

## 7.6 Relation to neighbouring layers

- **Below (Layer 2):** valence, propagated. Layer 2 said one letter's valence
  constrains its neighbour's face; this layer runs that propagation to the end of
  the word and reads off the result.
- **Below (Layer 6):** supplies the segmental filter, second in cost order.
- **Forward (Layer 14):** profile is **not** invariant under permutation, while
  weight is. Two layers, two blindnesses, and they are different blindnesses —
  which is the observation Layer 14 is built on.
- **Forward (Layer 18):** the profile is a checksum cheap enough to hold in
  memory. A remembered profile that fails to match a recalled text localizes the
  error.
- **Forward (Layer 19):** deletion changes the profile. This makes deletion
  *detectable* through a channel that letter-level damage does not disturb.

---

**Previous:** [Layer 6 — Collapse](06-collapse.md) · **Next:** [Layer 8 — Substitution](08-substitution.md)

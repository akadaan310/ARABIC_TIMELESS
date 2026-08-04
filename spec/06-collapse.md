# Layer 6 — Collapse (الترجيح)

> **Band II — The Skeleton.**

## Core statement

**Reading is an act performed *on* the text, not a thing received from it.**

Layer 5 leaves a set. This layer reduces it. The reduction is not perception and
it is not recognition — it is **work**, done by a reader, in steps, with a cost,
and it can be performed correctly or incorrectly.

This is the sense in which the script is programmable that matters most. A
skeleton is an expression; a reader is the evaluator; and reading is evaluation.

---

## 6.1 The constraint operators

Each operator is a filter on the candidate set. They are ordered by cost —
cheapest first, because a cheap filter that removes most candidates makes the
expensive filters run on far less.

| # | Filter | | Question | Cost |
|---|---|---|---|---|
| 1 | Lexical | معجمي | Is this a word at all? | very low |
| 2 | Segmental | الوصل | Does the chunk profile match? (Layer 7) | very low |
| 3 | Morphological | صرفي | Does it fit a legal pattern? (Layer 13) | low |
| 4 | Prosodic | عروضي | Does the pulse fit the metre? (Layer 11) | low |
| 5 | Syntactic | نحوي | Does it agree with its neighbours? | moderate |
| 6 | Semantic | دلالي | Does it mean something *here*? | high |
| 7 | Intentional | مقصدي | What did the writer intend? | highest |

The ordering is itself a result and not a convention. Filters 1 and 2 need no
context at all — they are decidable on the word alone — which is why they come
first. Filter 7 requires a model of another mind, which is why it comes last and
why it is invoked only when everything else has failed to settle the matter.

---

## 6.2 The procedure

```
S ← expand(skeleton)              # Layer 5
repeat
    for each filter f, in cost order:
        S ← { w ∈ S : f(w) holds }
        if |S| ≤ 1: break
until S is unchanged               # fixed point
```

Evaluation runs to a **fixed point**: apply filters until no filter removes
anything further. The loop is necessary rather than decorative — a later filter
can license an earlier one to remove more, because filters constrain each other
through the surrounding words.

---

## 6.3 The three terminal states

All three are meaningful, and distinguishing them is what makes the procedure a
system rather than a heuristic.

### |S| = 1 — determined
The reading is fixed. The skeleton, plus the constraints, plus the context,
admits one word.

### |S| = 0 — corrupt
No candidate survives. The text is damaged, and the failure is *informative*: the
filter that emptied the set localizes the damage. Hand to **Layer 19**.

### |S| > 1, stable — intended
Filters are exhausted and more than one candidate stands.

> **This is a result, not a failure.**

The ambiguity is real. It was available to the writer, who had the means to
remove it — one mark would have done it — and did not. A system that can mark and
declines to mark has said something by declining.

This terminal state is the reason the whole architecture is built on binding
rather than absence. **The system distinguishes what it could not resolve from
what it chose not to.** A script without slots cannot make that distinction,
because it cannot decline; every position is forced. Here, silence at a position
is a legible act.

---

## 6.4 Worked example

Skeleton **كٮٮ**, fifteen candidates (Layer 5, §5.3).

- **Lexical filter.** Most of the fifteen are not words. A small handful survive —
  among them كتب.
- **Morphological filter.** Of the survivors, those matching a legal pattern
  remain; a three-consonant string on the base pattern is licensed, and
  candidates that cannot be aligned to ف ع ل at all are struck.
- **Syntactic filter.** If the surrounding text requires a verb, nominal readings
  go. If it requires a plural, singular readings go.

Fifteen becomes one, and no step required guessing. Each step was a decidable
question asked in a fixed order.

Now add Layer 10 to the same example. If the weight of the word is known to be
**422**, the numeric filter alone cuts fifteen candidates to **two** — كبت and
كتب — in a single pass, before any lexical knowledge is consulted at all. The
lexical filter then finishes the job.

That is two independent channels converging on one answer, and it is the subject
of Layer 14.

---

## 6.5 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Filtering is comparison against knowledge already held. No instrument is involved at any step. |
| 2 | Closure | **Pass.** Every filter maps a set of strings to a subset of itself. |
| 3 | Independence | **Pass.** Layer 5 produces the set and can say how large it is. It has no notion of *selection*, and nothing in the lattice distinguishes a good candidate from a bad one. Ranking and elimination are new. |
| 4 | Accounted loss | **Pass.** Filtering is deliberately lossy and the loss is the point; it is accounted because every removal is attributable to a named filter, and the procedure records which filter removed what. The zero state is not silent failure — it reports its cause. |
| 5 | Hand-verifiability | **Pass.** Each filter is a question a person answers from their own knowledge, and any step can be rechecked independently. |

---

## 6.6 Relation to neighbouring layers

- **Below (Layer 5):** the candidate set and the lattice it sits in. Collapse is
  descent through that lattice under constraint.
- **Above (Layer 7):** the segmental filter is second-cheapest and among the most
  effective. Layer 7 defines it.
- **Forward (Layers 11, 13):** the prosodic and morphological filters are defined
  in those layers and invoked here. This layer is the scheduler; they are the
  routines.
- **Forward (Layer 19):** the zero state hands off to Damage. Reading failure and
  text damage are the same event seen from two sides.

---

**Previous:** [Layer 5 — Superposition](05-superposition.md) · **Next:** [Layer 7 — Segment](07-segment.md)

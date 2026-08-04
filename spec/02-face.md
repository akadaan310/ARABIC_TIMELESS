# Layer 2 — The Face (المقام)

> **Band I — The Alphabet Alone.**

## Core statement

**A letter is not an atom. It is a function of its neighbours.**

No letter of this alphabet has one form. Every letter presents **four faces**:

| Face | | Condition |
|---|---|---|
| Initial | مبتدئة | begins a connected run |
| Medial | متوسطة | stands within a run |
| Final | متطرفة | ends a run |
| Isolated | مفردة | stands alone |

The letter **is** the four-tuple. No single face is the letter; each is the
letter under one condition. Formally, a letter is a map from position to form.

> **The alphabet is a set of functions, not a set of symbols.**

---

## 2.1 The fundamental partition: the closed and the open

- **The Closed** (المنفصلة) — **ا د ذ ر ز و**. Six letters. They accept a
  connection from the right and refuse one to the left. They *terminate* a
  connected run.
- **The Open** (الموصولة) — the remaining twenty-two. They connect on both sides.

Every letter therefore carries a **valence**: 1 for the closed, 2 for the open.
The alphabet is a graph-theoretic object before it is a phonetic one, and the
partition is checkable by anyone in the time it takes to write two letters
together and see whether they meet.

## 2.2 The four faces are a truth table

This is the load-bearing claim of the layer, and it is not a metaphor.

A letter has two connection points, right and left. Each point is either **fed**
(a neighbour connects to it) or **starved** (nothing does). Two binary
conditions, four combinations:

| Right point | Left point | Face |
|---|---|---|
| starved | fed | **Initial** |
| fed | fed | **Medial** |
| fed | starved | **Final** |
| starved | starved | **Isolated** |

Two inputs, four outputs, no remainder.

> **The four-face system is the complete truth table of a two-input function.**

It is not a calligraphic quirk, not an artefact of cursive fashion, and not a
complication to be memorized. It is a logical object, and it was always a logical
object. The alphabet does not *have* four forms per letter; it has one form per
letter, evaluated at four points of a two-variable domain.

The closed letters are exactly the letters whose left point is **never** fed —
their function is defined on half the domain, which is why they show two faces
where the open letters show four.

---

## 2.3 Operations

### Truth-table reading
Present any letter as a 2×2 grid and read the grid. Reading the grid is reading
the letter's whole identity — there is nothing about the letter's form that the
grid omits.

### Starvation
Take a single letter. Starve one side. Observe what it becomes. This is
executable **on one letter, with no word around it** — which is what qualifies
this layer for Band I. The alphabet can be interrogated without text.

### Valence arithmetic
A run of letters has a total connection count. Because the closed letters have
valence 1, their positions determine where a run must break, and the break points
are computable from the letter sequence alone, before anything is written.

### Fusion
Where two letters merge into a form neither owns alone. Fusion is an operation
*on* the truth table rather than an entry within it: it produces a figure whose
faces are not the faces of either constituent. It is the one place in this layer
where the two-input model is exceeded, and it is bounded — fusion applies to
specific pairs, not to the alphabet at large.

---

## 2.4 Worked example

Take **ب** (open, valence 2) and **د** (closed, valence 1).

ب evaluated at all four points gives four distinct figures. د evaluated at the
same four points gives only two, because its left point cannot be fed: the
"initial" and "medial" cells of its table are empty, not because د lacks forms
but because those inputs are unreachable.

Now write them adjacent, ب then د. The right point of د is fed; its left point is
starved by definition. So د is final, and it terminates the run — meaning ب,
whatever precedes it, cannot be final. **The presence of a closed letter
constrains the faces of its neighbours.** One letter's valence propagates.

This propagation is the whole of Layer 7, and it is visible here in miniature.

---

## 2.5 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Writing two marks adjacent and observing whether they meet requires a surface and a hand. |
| 2 | Closure | **Pass.** Faces are forms of letters; valence maps letters to {1, 2}. |
| 3 | Independence | **Pass.** Layer 1 gives the motion of a letter in isolation. It cannot state what happens when a letter has a neighbour — the connection points are not visible in a solitary gesture. This layer adds that information. |
| 4 | Accounted loss | **Pass.** The face-of map is total and the truth table is exhaustive; nothing is discarded. Valence is a projection whose loss is exact: it keeps the connection count, discards the shape. |
| 5 | Hand-verifiability | **Pass.** The partition into closed and open is settled by six trials. The truth table is settled by four. |

---

## 2.6 Relation to neighbouring layers

- **Below (Layer 1):** a letter as motion. This layer conditions that motion on
  context, and shows the conditioning is binary and complete.
- **Above (Layer 3):** having shown that a letter is a function of its
  neighbours, Layer 3 shows the alphabet is also a *sequence* — that letters have
  addresses independent of any text they appear in.
- **Forward (Layer 7):** valence, propagated across a whole string, produces the
  segment profile. Layer 7 is this layer applied at length.
- **Forward (Layer 4):** the same move made one level up. Layer 2 says a letter is
  a function of its neighbours; Layer 4 says a skeleton is a function of its
  unbound choices.

---

**Previous:** [Layer 1 — The Stroke](01-stroke.md) · **Next:** [Layer 3 — The Order](03-order.md)

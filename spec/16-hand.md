# Layer 16 — The Hand (اليد)

> **Band V — Execution.** The cost model, the body, and what survives.

## Core statement

**The realizability test: what can be done with no instrument at all.**

This layer enforces Contract condition 1 for the whole architecture. It defines
the minimal apparatus, certifies every operation of Layers 1–15 as executable
within it, and assigns each one a cost.

---

## 16.1 The apparatus

Three things, and nothing else:

| | | Capacity |
|---|---|---|
| **A hand** | يد | makes marks, moves, counts on fingers |
| **A surface** | سطح | holds marks; sand, clay, stone, skin, paper |
| **A memory** | حفظ | holds a small number of items at once |

No pen of a particular kind. No ink of a particular composition. No table, no
reference, no authority to consult. Anything requiring more than these three is
not admitted to the architecture.

The memory capacity is the binding constraint. A hand can make unlimited marks
given time, and a surface can hold them, but a person holds only a few items at
once — and this is why the architecture's primitives are small: six strokes, four
faces, two units of rhythm, three or four radicals, twenty-eight letters.

**The inventories are sized to the apparatus.**

---

## 16.2 The cost units

Three units, all counted:

- **Marks** (م) — how many strokes the surface receives.
- **Counts** (ع) — how many discrete comparisons, additions or tallies.
- **Held** (ح) — how many items must be in memory simultaneously.

Time is not a unit. A person with patience has unlimited time, and any operation
that is bounded in marks, counts and held items is executable by someone
eventually. What cannot be bought with patience is memory, and that is why the
third column governs.

---

## 16.3 The cost table

For a string of length *n*, a skeleton of degree *d*:

| Operation | Layer | Marks | Counts | Held |
|---|---|---|---|---|
| Stroke number of a letter | 1 | 0 | ≤ 6 | 1 |
| Face of a letter | 2 | 0 | 2 | 1 |
| Valence partition | 2 | 0 | 6 | 1 |
| Address of a letter | 3 | 0 | ≤ 28 | 1 |
| Reflect a letter | 3 | 0 | 1 | 1 |
| Interval sequence | 3 | 0 | *n* | 2 |
| Slot enumeration | 4 | 0 | *n* | 2 |
| Degree | 4 | 0 | *n* | 1 |
| Expansion | 5 | *n·d* | *d* | 2 |
| One filter pass | 6 | 0 | *d* | 2 |
| Profile | 7 | 0 | *n* | 2 |
| Apply a substitution | 8 | *n* | *n* | 1 |
| Silence test | 8 | 0 | 28 | 1 |
| Weight | 10 | 0 | *n* | 1 |
| Constrained solve | 10 | 0 | *d* | 2 |
| Scansion | 11 | 0 | *n* | 1 |
| Rotate a binary word | 11 | *n* | 1 | 1 |
| Extract a root | 12 | 0 | *n* | 3 |
| Apply a pattern | 13 | *n* | *n* | 4 |
| Abstract a pattern | 13 | 0 | *n* | 4 |
| Test a symmetry | 15 | 0 | *n* | 2 |

Read the **Held** column: nothing exceeds four. Every operation in the
architecture fits in a working memory of four items, and most fit in one or two.
That is not an accident of how the table was drawn — it is the property the
architecture was built to have.

Read the **Marks** column: most operations make no marks at all. They are
performed by looking and counting. Expansion is the expensive exception, which is
why Layer 6 filters candidates rather than writing them out.

---

## 16.4 The consequence

> **Every operation gets a hand-cost, so the architecture has a complexity
> measure — and the measure is denominated in human effort rather than machine
> steps.**

This is the technical reason the system is era-independent. A complexity measure
in machine steps changes when machines change: an operation that was expensive
becomes free, the cost ordering inverts, and a procedure optimized for one era is
wrong in the next. Layer 6's filter ordering would have to be rewritten every
time the apparatus improved.

Denominated in marks, counts and held items, the ordering **never changes**. A
person in any century pays the same price for a profile and the same price for an
expansion, and the profile is cheaper in every one of them. The procedures built
on this cost model are correct permanently, not currently.

A machine may of course run any of this faster. That changes nothing here,
because nothing here was priced in machine time.

---

## 16.5 Worked example

Compare two ways of resolving the skeleton **كٮٮ**, degree 15.

**By expansion:** write out all fifteen candidates (15 marks × 3 letters = 45
marks), then check each against the lexicon (15 counts). Total: 45 marks, 15
counts, 2 held.

**By weight:** compute the two slot domains, find the pairs summing to 402 (Layer
10, §10.4). No marks at all, roughly 15 counts, 2 held — and it returns two
candidates, which the lexicon then settles in two more counts.

Same answer. **Forty-five marks saved**, because the second route never wrote
anything down.

This is what the cost table is for. It makes "the cheaper filter first" a
calculation rather than an intuition, and the calculation comes out the same for
everyone, always.

---

## 16.6 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** This layer *is* the condition. It defines the apparatus that all other layers are tested against. |
| 2 | Closure | **Pass.** Costs map operations to triples of integers. |
| 3 | Independence | **Pass.** No layer below states what its own operations cost. Each defines what it does; none prices it. Cost is information that exists nowhere else in the architecture. |
| 4 | Accounted loss | **Pass.** No loss. The layer measures rather than transforms. |
| 5 | Hand-verifiability | **Pass.** Every entry in §16.3 is confirmed by performing the operation and counting marks, counts and held items. |

---

## 16.7 Relation to neighbouring layers

- **Below (Layer 1):** stroke number and lift number were the first cost measures
  in the architecture. This layer generalizes them to every operation.
- **Below (Layer 6):** supplies the cost ordering that layer's procedure depends
  on, and §16.4 shows why that ordering is permanent.
- **Below (Layer 14):** Layer 14 says which filters to stack; this layer says what
  each costs. Together they determine the optimal reading procedure.
- **Above (Layer 17):** the apparatus is a body. Having priced what the hand does,
  the next layer finds that the body is also an address space.

---

**Previous:** [Layer 15 — Symmetry](15-symmetry.md) · **Next:** [Layer 17 — Articulation](17-articulation.md)

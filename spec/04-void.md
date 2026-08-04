# Layer 4 — The Void (الفراغ)

> **Band II — The Skeleton.** The alphabet becomes text. What the skeleton is,
> as an object.

## Core statement

**The unwritten distinction is an addressable slot. A variable, not an absence.**

Where a tooth stands, there is a *place* at which a distinction could be marked
and is not. That place is not empty. It is **unbound**.

> The skeleton is not a deficient script. It is a script with declared variables.

This is the hinge of the whole architecture. Read as absence, the dotless script
is a script missing something, and every account of it becomes an account of a
lack. Read as binding, it is a script that **declares where its choices are** and
leaves them open — which is a capability, and one that fully-specified scripts do
not have.

---

## 4.1 Slots and their domains

A slot is a position in a skeleton together with the set of letters that position
could carry. The domain of a slot is exactly its shape class from Layer 0, and
the domains are position-dependent: a tooth in medial position has domain
{ب ت ث ن ي}, size 5; the same skeleton in final position has domain {ب ت ث},
size 3, because ن and ي take forms of their own there.

A position whose class is a singleton — ا ك ل م ه و — declares no slot. It is
already bound by being written.

---

## 4.2 Operations

### Slot enumeration
Scan a skeleton left to right and list every position carrying an unbound
distinction. The result is a **slot vector**: an ordered list of domains.

### Arity
Count the slots. One integer per skeleton — the number of free variables it
holds. Arity is the skeleton's most compressed description of its own openness.

### Binding
Supply a value to a slot. Binding is **monotonic**: a bound slot does not come
unbound. Marks may be added to a skeleton but the operation never runs backward
of its own accord, and this one-directionality is what makes partial states
stable enough to be useful.

### Partial binding
Bind some slots, leave others. A half-bound skeleton is a **fully legal object**,
not an unfinished one. This deserves emphasis: the system has no notion of a
malformed intermediate. Every point between bare skeleton and fully marked word
is a well-formed expression with a well-defined meaning — a set of words.

### Degree
The product of the slot domain sizes. The number of ways to bind everything at
once.

---

## 4.3 Worked example

Take the skeleton **كٮٮ** — three positions.

| Position | Class | Domain | Size |
|---|---|---|---|
| 1 | ك | {ك} | 1 — no slot |
| 2, medial | ٮ | {ب ت ث ن ي} | 5 |
| 3, final | ٮ | {ب ت ث} | 3 |

- **Slot vector:** ⟨{ب ت ث ن ي}, {ب ت ث}⟩
- **Arity:** 2
- **Degree:** 1 × 5 × 3 = **15**

Fifteen words are written by this one skeleton. Not fifteen guesses at a word —
fifteen bindings of one expression, all of them legitimate readings of what is
actually on the surface.

### The cost of a tooth, exactly

A medial tooth has domain size 5, so it withholds **log₂ 5 = 2.3219 bits**. The
whole skeleton كٮٮ withholds log₂ 15 = 3.9069 bits.

This is what makes the layer quantitative rather than rhetorical. The void has a
size, the size is measurable, and it is measurable in the same unit for any
skeleton of any length in any era.

---

## 4.4 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Counting the places where a mark could go requires eyes and a finger. |
| 2 | Closure | **Pass.** Binding maps skeletons to skeletons; arity and degree map skeletons to integers. |
| 3 | Independence | **Pass.** Layers 1–3 describe letters — as motion, as context-sensitive form, as address. None of them can express a position that is *undetermined*, because a letter in Band I is always the letter it is. Underdetermination is new information, and it only exists once letters are placed in text. |
| 4 | Accounted loss | **Pass.** Binding is monotonic and its inverse is exactly the slot's domain. Degree states the loss as a count; log₂ of degree states it in bits. Nothing is lost unmeasured. |
| 5 | Hand-verifiability | **Pass.** Arity is a tally. Degree is a product of small numbers. |

---

## 4.5 Relation to neighbouring layers

- **Below (Layer 2):** the same move, one level up. Layer 2 says a letter is a
  function of its neighbours. This layer says a skeleton is a function of its
  unbound choices. Both replace an object with a function; the argument changes
  from *context* to *choice*.
- **Below (Layer 0):** the shape classes are inherited from the inventory. What is
  new here is reading them as **domains of variables** rather than as facts about
  which letters look alike.
- **Above (Layer 5):** having established that a skeleton has free variables,
  Layer 5 asks what it therefore denotes, and answers: a set.
- **Forward (Layer 18):** degree is the exact number of bits the skeleton declines
  to store. That figure is the compression ratio, and Layer 18 uses it.

---

**Previous:** [Layer 3 — The Order](03-order.md) · **Next:** [Layer 5 — Superposition](05-superposition.md)

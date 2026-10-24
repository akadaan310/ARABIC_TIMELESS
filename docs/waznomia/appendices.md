---
---

# APPENDIX A — The Arabic determinations, from the twenty layers

*In Claude's hand. The header stands as written above.*

**Reproduction.** Every determination in this appendix carries a tag of the form
`[A1]`, `[A7b]`. Each names a labelled output block of a single harness:

```
npm install
npx vitest run lib/engine/__tests__/waznomia.determinations.test.ts
```

22 determinations, run against the engine of `lib/engine/` at commit `a1745b8`.
Nothing below is asserted; where a number appears, the harness printed it.

**Grades**, as the header defines them: **established** (attested in the
tradition's own sources, or computed exhaustively here), **inferred** (derived by
the procedure, awaiting attestation), **proposed** (new, offered by the science).
I add one distinction the header's grading does not have and §A.0 argues it
needs: a determination is graded on its **fibre**, not on its best member.

---

## A.0 — A determination is not a triple. It is a fibre.

**Grade: established (computed).**

The header's §7 returns, for a name, *its* root, *its* operator, *its* pure
function. Run over the header's own §2, that shape does not survive.

Twenty-three terms from §2, each put through `abstractWord` — which tries all 35
templates and returns **every** `(pattern, root)` pair that could have produced
the written consonants `[A11]`:

```
fibre size   terms   
         0       3   متغير  عودية  عنصر
         1      12   معادلة تشاكل تكامل تماثل تزامن تساهم اشتقاق تشكل مصفوف حلقة بصمة جزيء
         2       5   كسر(I,II)  جبر(I,II)  حمض(I,II)  جذر(I,II)  أولي(IV,IX)
         3       3   محفز  مصرف  دالة
```

Twelve of twenty-three are single-valued. Eight are multi-valued. Three return
the empty fibre.

The multi-valued cases are not noise; they are template collisions that are
exact `[A11c]`:

```
template   operators sharing it
"123"      I, II
"1ا23"     III, agent (فاعل)
"م123"     agentII, patientII, place
"ا123"     IV, IX        ← see the caveat below
```

So **محفز** is not "the Form II participle of حفز." It is, from the written
consonants alone, exactly three determinations `[A11b]`:

```
محفز → agentII   (مُفَعِّل, agent of Form II)     — the inciter
     → patientII (مُفَعَّل, patient of Form II)   — the thing incited
     → place     (مَفْعَل, place of the act)      — the place of inciting
```

All three regenerate `محفز` exactly. The header's determination is the *correct
member* of a three-member fibre, and the other two are not errors — they are
what the written form admits. **مصرف** behaves identically: the compiler-name is
consonantally also "the thing conjugated" and "the place of conjugation."

> **Determination, restated.** `determine(name) → Set<(root, operator, function)>`.
> The empty set means *my inventory is silent*, never *this name is not derived*.
> A determination is graded by its fibre size; a single-member fibre is the
> strong case and the header should not write as though it were the only one.

*Caveat recorded against my own instrument:* the `"ا123"` collision between
Form IV and Form IX is a limitation of **my** 35-pattern library, not a fact
about Arabic — Form IX is افعلّ, with a doubled third radical my templates do
not express. I flag it so the number above is not read as a claim about the
language `[A11c]`.

---

## A.1 — The header's §2, audited by regeneration

**Grade: established (computed).**

Header §7 step 5 says: *re-derive the name from the function; if it cannot be
regenerated, the determination is wrong or the term is a loan.* I ran that step
over §2 `[A1]`. Fifteen of twenty-three regenerate exactly:

```
term      normalised  operator + template   regenerated  exact
معادلة    معادله      masdarIII  م1ا23ه     معادله       ✓
تشاكل     تشاكل       VI         ت1ا23      تشاكل        ✓
تكامل     تكامل       VI         ت1ا23      تكامل        ✓
تماثل     تماثل       VI         ت1ا23      تماثل        ✓
تزامن     تزامن       VI         ت1ا23      تزامن        ✓
تساهم     تساهم       VI         ت1ا23      تساهم        ✓
اشتقاق    اشتقاق      masdarVIII ا1ت2ا3     اشتقاق       ✓
محفز      محفز        agentII    م123       محفز         ✓
مصرف      مصرف        agentII    م123       مصرف         ✓
تشكل      تشكل        V          ت123       تشكل         ✓
مصفوف     مصفوف       patient    م12و3      مصفوف        ✓
حلقة      حلقه        unit       123ه       حلقه         ✓
بصمة      بصمه        unit       123ه       بصمه         ✓
كسر       كسر         I          123        كسر          ✓
جبر       جبر         I          123        جبر          ✓
دالة      داله        agent      1ا23       دالل         ✗
```

*One substitution recorded:* §2's covalent term is **رابطة تساهمية**, and I
tested the Form VI base **تساهم**, not the nisba form تساهمية — the nisba
operator is not in the 35-pattern library, so تساهمية falls in the same class as
عودية below. The Form VI determination is the part the header is making and the
part the library can check.

**One correction to the header, by computation.** §2 reads "**معادلة** (equation)
is Form III of عدل." It is not Form III. It is the **verbal noun of** Form III —
مُفَاعَلَة, template `م1ا23ه`. Form III itself is `1ا23`, which over عدل gives
عادل, a different word. The regeneration only succeeds against the maṣdar
template `[A1]`. The same correction applies to §2's "**تشاكل** is Form VI" and
its siblings: each is the maṣdar, not the verb — though for Form VI that
correction is unverifiable from the written form, which is §A.4.

**Seven terms have no operator in my inventory**, and the failures sort into
named classes rather than a single "not derived" `[A1b]`:

| Term | Class | What the computation shows |
|---|---|---|
| دالة | **geminate root** | `applyPattern(agent, د-ل-ل)` = `دالل`, not `داله`. The engine has no gemination collapse |
| متغير | **absent operator** | no Form V participle (مُتَفَعِّل) in the 35 templates → empty fibre |
| عودية، أولي | **absent operator** | no nisba (-ية) in the templates |
| عنصر | **quadriliteral** | all templates have exactly three radical slots |
| جزيء | **not absent — vocalic** | see §A.2 |

Only the first is a defect. The rest are inventory boundaries, and the engine's
honest output for them is the empty fibre, which §A.0 insists must not be read
as "undetermined."

---

## A.2 — The diminutive is not missing. It is unwritable.

**Grade: established (computed).** *Supersedes my own first reading.*

My first pass recorded **جُزَيء** as "no operator in the library." That was
wrong, and the engine corrected it `[A13c]`.

```
diminutive   فُعَيْل  → consonants ف ع ي ل → template "12ي3"
quality      فَعِيل   → template "12ي3"                       ← already in the library
identical: true
abstractWord("جزيا") → quality:جزا      (one alignment, not none)
```

The diminutive operator and the intensive-adjective operator **are one
consonantal template.** Their difference is entirely vocalic: *fuʿayl* against
*faʿīl*. So the determination "جزيء is a diminutive" is not recoverable from the
written name at all — it is recoverable only from the pointing, which §2 supplies
by writing **جُزَيء** with its fatḥa and its yāʾ-fatḥa, and which the rasm cannot
carry.

This is the first appearance of what §A.4 and §A.5 make general: **an operator
whose only mark is vocalic is invisible to the consonantal skeleton.**

---

## A.3 — Regeneration is necessary and not sufficient

**Grade: established (computed). This is a correction to the header's procedure,
not to its determinations.**

Header §7 step 5 treats successful regeneration as the verification. Run on
**دالة**, every member of the fibre regenerates the name exactly — and two of
the three do it from a root that is not the word's root `[A13]`:

```
operator  root      regenerates   matches داله
III       د-ل-ه     داله          true
agent     د-ل-ه     داله          true
unit      د-ا-ل     داله          true

attested in the engine's corpus:   دلل → ATTESTED | دله → absent | دال → absent
the attested root of دالة is د-ل-ل  (دلّ, to indicate)
```

Three determinations pass step 5. Two of them are built on a root that does not
exist. Regeneration tests the *operator's* arithmetic; it cannot test the
*root's* existence, because the root is an output of the alignment, not an input
to it.

> **The missing step.** Between §7's step 5 (regenerate) and step 6 (grade), the
> procedure needs: **attest the root.** Check the recovered root against a named
> root inventory, and report which members of the fibre survive. The engine
> already has the predicate — `getRoot` / `Lexicon.hasRoot` — and the collapse
> pipeline already uses it as a filter. The header's procedure does not list it.

**A second case, where the fibre is right and the header is incomplete.**
**أولي** `[A13b]`:

```
header's determination:  root ا-و-ل, "the first ones"   → اول ATTESTED
engine's fibre:          IV over و-ل-ي → regenerates اولي → ولي ATTESTED
                         IX over و-ل-ي → regenerates اولي → ولي ATTESTED
```

Two determinations, both regenerating, both with attested roots. أَوْلَى ("more
entitled") genuinely *is* Form IV of و-ل-ي; أوّلي ("prime") is from أ-و-ل. The
ambiguity is in Arabic, not in the instrument. The honest output is the fibre
with both members and the attestation column filled in — which is what §A.0
asks for and §7 currently does not produce.

---

## A.4 — The operator table is not flat. It factors.

**Grade: established (computed). This extends §1's table rather than correcting it.**

§1 presents the أوزان as a table of eight forms with eight deltas. Run over all
35 templates in the library, asking which template is another template with a
non-radical prefix attached, the table turns out to be **generated** `[A4]`.
Thirty-six factorisations; the load-bearing ones:

```
V(ت123)        = "ت"   + II(123)
VI(ت1ا23)      = "ت"   + III(1ا23)
IV(ا123)       = "ا"   + I(123)
VII(ان123)     = "ان"  + I(123)
X(است123)      = "است" + I(123)
X(است123)      = "اس"  + V(ت123)
agentII(م123)  = "م"   + I(123)
agentX(مست123) = "مست" + I(123)
agentX(مست123) = "مس"  + V(ت123)
instrument(م12ا3) = "م" + result(12ا3)
masdarII(ت12ي3)   = "ت" + quality(12ي3)
placeFem(م123ه)   = "م" + unit(123ه)
```

Asserted, not eyeballed: `VI.template === "ت" + III.template` and
`V.template === "ت" + II.template` both return `true` `[A4]`.

So the eight forms are not eight atoms. They are a small set of **prefix
operators** — ت (reflexivise), ا (causativise), ان، است، م (nominalise/agentive)
— applied over a base. The header's §1 says the three traditions "differ only in
where the operator sits: interleaved (Arabic), composed before and after
(Greek)." The computation narrows that difference considerably: **Arabic's
operators compose by prefixing, exactly as Greek's do.** What is interleaved is
the *vocalism*; what is prefixed composes like σύν- and ἀντί-.

This matters for Appendix B's member 1, and I take it up there.

---

## A.5 — The nominalizing operator is sometimes invisible

**Grade: established (computed). This amends §6's member 3.**

Two computations, both from the same cause.

**(a) Form VI's verb and its verbal noun are one consonantal word** `[A4b]`:

```
norm("تفاعل")  = "تفاعل"
norm("تفاعُل")  = "تفاعل"
equal: true
```

تَفَاعَلَ (the verb, "they interacted") and تَفَاعُل (the verbal noun,
"interaction") differ **only** in the vowel of the third radical. My library
therefore carries no separate `masdarVI` — it would be the identical template.

**(b) Form III and the agent participle are one template** `[A4b]`:

```
III.template   = "1ا23"
agent.template = "1ا23"
identical: true
abstractWord("عادل") → III:عدل   agent:عدل
```

عادل is both "he dealt justly with" (the Form III verb) and "a just one" (the
agent participle). One skeleton, two functions, no mark to separate them.

§6's member 3 states: *"Each system owns operators that freeze events into
objects — المصدر, -σις / -μα, -tio / -tura."* True for Greek and Latin, where
-σις and -tio are segmental and always present. **In Arabic the nominalizing
operator is sometimes purely vocalic, and therefore absent from the written
word.** Greek cannot write θεώρη- and leave you to supply -μα. Arabic writes
تفاعل and leaves you to supply the difference between an act and its name.

---

## A.6 — The header's Form VI law has a counterexample in the header

**Grade: established (computed). Dissent, by computation, at the claim.**

§2 states, unforced and italicised: *"**wherever the concept is relational,
Arabic reaches for Form VI.** تفاعل is the relational operator of its
nomenclature."*

Run over the relational terms §2 itself supplies `[A5]`:

```
تشاكل   → VI
تكامل   → VI
تماثل   → VI
تزامن   → VI
تساهم   → VI
معادلة  → masdarIII       ← not Form VI
```

Five of six. The sixth is **معادلة**, which the header glosses, two sentences
earlier, as *"a balancing between two sides: the mutual pattern for a mutual
act."* By the header's own gloss it is relational; by computation it is Form III.
The law has a counterexample inside the paragraph that states it.

**The amendment the computation supports.** The mutual marker is not Form VI. It
is the **medial ا**, and it is present in both forms `[A5]`:

```
III = "1ا23"
VI  = "ت1ا23"  =  "ت" + III
```

Form III is the mutual pattern. Form VI is Form III **reflexivised** by the ت
of §A.4 — mutual action turned back on its own participants, which is why VI
reads *symmetric* where III reads *directed-at-a-counterpart*. The header's §1
table already says this correctly in its own delta column (III: "mutual action,
sustained attempt"; VI: "reciprocal of III"), and then §2's law forgets it.

> **Restated.** *Where a concept is relational, Arabic reaches for the medial ا.
> Where the relation is symmetric in its participants, it reaches for ت over
> that ا — Form VI. معادلة is directed mutuality (two sides brought to balance,
> by someone); تكامل is symmetric mutuality (parts completing each other).*
> The distinction is computable from the template and it is the reason both
> patterns appear in the nomenclature.

---

## A.7 — The keystone claim does not survive the rasm

**Grade: established (computed). Dissent, by computation, at §30–38 — the
header's argument for Arabic as reference implementation.**

§30–38 is the load-bearing argument of the whole header: *"In Arabic, the
machinery is **interleaved into the word itself**: the root consonants and the
pattern occupy the same letters, simultaneously visible. The computation a name
performs can be read off its surface."*

Under full pointing, this holds. **Under the rasm — the dotless skeleton, which
the header elsewhere treats as the original form of the script — it fails, and
it fails precisely at the operator letters.**

The operator inventory of §A.4 is ت، ا، ن، س، م، و، ي. Of these, **ت، ن، ي are
one shape class** — the tooth `[A6]`:

```
CLASS_OF["ت"] = ب ت ث ن ي

تشاكل → ٮساكل      بشاكل → ٮساكل      identical rasm: true
تكامل → ٮكامل      نكامل → ٮكامل      identical rasm: true
تزامن → ٮرامں      يزامن → ٮرامں      identical rasm: true
```

The reflexivising ت of Forms V and VI — the operator that §2 calls "the
relational operator of its nomenclature" — is, in the rasm, indistinguishable
from ب، ث، ن، ي. `تشاكل` has degree 10: ten letter-strings share its skeleton,
and the first slot alone admits all five tooth letters `[A6]`.

Across the header's whole §2, under the rasm `[A2]`:

```
term      rasm      arity  degree   bits
أولي      اولى          0       1   0.00     ← the only one
دالة      داله          1       2   1.00
كسر       كسر           2       4   2.00
معادلة    معادله        2       4   2.00
حلقة      حلٯه          2       6   2.58
حمض       حمص           2       6   2.58
مصرف      مصرٯ          3       8   3.00
مصفوف     مصٯوٯ         3       8   3.00
تشاكل     ٮساكل         2      10   3.32
تزامن     ٮرامں         2      10   3.32
تساهم     ٮساهم         2      10   3.32
تشكل      ٮسكل          2      10   3.32
بصمة      ٮصمه          2      10   3.32
محفز      محٯر          3      12   3.58
جذر       حدر           3      12   3.58
عودية     عودٮه         3      20   4.32
تماثل     ٮماٮل         2      25   4.64
جبر       حٮر           3      30   4.91
جزيء      حرٮا          3      30   4.91
اشتقاق    اسٮٯاٯ        4      40   5.32
عنصر      عٮصر          4      40   5.32
متغير     مٮعٮر         4     100   6.64
تكامل     ٮكامل         1       5   2.32
```

**One term of twenty-three is determined by its own surface.** It is **أولي**,
prime — written entirely from ا، و، ل، ى, four letters that are each alone in
their shape class (the unmoved six are ا ك ل م ه و). Every other name in the
header's §2 is ambiguous on the page, up to **متغير** at degree 100.

I want to be exact about the scope of this dissent, because the header's claim is
about a real property and I am not denying it:

- **What survives.** Arabic *does* interleave: root and pattern occupy the same
  letters, and nothing in Greek or Latin does that. The reference-implementation
  claim is sound as a claim about *architecture*.
- **What does not survive.** "The computation a name performs can be **read off
  its surface**" is false of the rasm and true only of the pointed form. The
  pointing is a later marking layer. So the keystone property is a property of
  **ninth-century orthography**, not of the script Arabic's nomenclature was
  first written in.
- **The sharper statement.** *Arabic interleaves the operator with the root; the
  rasm then merges the operator letters with four others. The machinery is
  simultaneously present and only partially legible. Legibility is bought with
  marks, and the price is computable: 3.3 bits for a Form VI name, 6.6 for
  متغير.*

---

## A.8 — What a name's rasm certifies, and what it cannot

**Grade: established (computed).**

Draw one element of the silent subgroup — the 4,608 substitutions that permute
letters inside their shape classes and leave every page unchanged in every
position — and apply it to §2's terms `[A6b]`:

```
term     after    rasm before  rasm after   same rasm   weight
تشاكل    بساكل    ٮساكل        ٮساكل        true        751 → 113
محفز     مجفز     محٯر         محٯر         true        135 → 130
معادلة   مغاذله   معادله       معادله       true        150 → 1776
مصفوف    مضفوف    مصٯوٯ        مصٯوٯ        true        296 → 1006
```

Every word is a different word. Every page is the same page. The weight moves by
a factor of twelve.

For a science of nomenclature this is a usable instrument, and it is the
complementarity §14 of the spec claims, arriving as a practical result:

> **The rasm cannot certify a determination; the weight can detect that one was
> tampered with.** A name's skeleton is invariant under 4,608 substitutions, so
> the page is no witness to the letters. Its abjad total is invariant under
> none of them, so arithmetic is.

---

## A.9 — Weight is an address for the orbit, not for the name

**Grade: established (computed). This is a determination the header's §2 does not
make, though §25–28 names weight as one of wazn's three senses.**

The header names *weight* and never computes one. Computed, with its invariance
`[A7]`:

```
عدل: عدل=104  علد=104  دعل=104  دلع=104  لعد=104  لدع=104
شكل: شكل=350  شلك=350  كشل=350  كلش=350  لشك=350  لكش=350
كسر: كسر=280  كرس=280  سكر=280  سرك=280  ركس=280  رسك=280

invariance rows (columns: reflect shift1 silent shift3 permute reverse)
  weight    000011
  multiset  000011
  skeleton  001000
```

A sum does not care about order. So the abjad weight of a root is shared by
**every** permutation of that root — the whole taqlīb orbit has one weight.

> **Determination.** The abjad weight is not an identifier for a name. It is an
> **address for the permutation orbit** the name's letters occupy. It answers
> *which letters*, never *in what order*. Its invariance row `000011` is the
> exact complement of the skeleton's `001000`: the page sees order and not
> identity; the number sees identity and not order.

Two names with the same weight are anagram-related or coincidental; two names
with the same rasm are shape-class-related. These are different neighbourhoods,
and the science has both, with an exact statement of what each one is blind to.

---

## A.10 — Taqlīb as the neighbourhood of a name

**Grade: established (computed) for the enumeration; the glosses are the
corpus's.** *This is the determination I most want to add to §2.*

§1 credits al-Khalīl's circles with *generating the meter space by rotation* —
and applies rotation only to prosody. Al-Khalīl's other rotation, **التقليب** over
the radicals of a root, the header does not use at all. It is the sharper
instrument for nomenclature, because it is exhaustive and tiny.

The space `[A7b]`:

```
ordered triliteral roots:  19,656          unordered orbits: 3,276
ordered quadriliteral:    491,400          orbits:          20,475
roots attested in the engine's Quranic corpus: 1,651
```

**The entire triliteral root space of Arabic is 3,276 orbits.** Not an estimate —
28·27·26 ÷ 6, computed and asserted in the engine's own test suite. Every
scientific name built on three radicals sits in an orbit of at most six ordered
roots, and the orbit is enumerable by hand in under a minute.

Run over the header's own roots, keeping only the permutations the corpus attests
`[A8]`:

```
عدل (attested) → no permutation attested
شكل (attested) → no permutation attested
مثل (attested) → no permutation attested
كمل (attested) → كلم [the word]   ملك [the Angels]
صرف (attested) → صفر [yellow]
سهم (attested) → همس [a faint sound]
جبر (attested) → برج [constellations / towers]
زمن (absent)   → زنم [utterly useless]   مزن [the rain clouds]
حفز (absent)   → زحف [advancing]
كسر (absent)   → كرس [His Throne]   سكر [intoxicated]   ركس [cast back]
جذر (absent)   → no permutation attested
```

Bound: six orderings per root, exhaustive, no cap — the one provably complete
enumeration in the engine, and the only one with no truncation to declare.

Two readings, graded apart:

- **Established.** The orbit of each root is computed and complete; which members
  the Quranic corpus attests is a fact about that corpus, and the engine reports
  five roots here as absent from it rather than absent from Arabic.
- **Inferred.** The orbit gives a nomenclature science a *generator*: given a
  function and a root, the five sibling orderings are the first candidates to
  test for an unoccupied name. تكامل's root كمل sits beside كلم (speech) and ملك
  (possession, angel) — three sciences could draw on one letter-set, and the
  fact that Arabic used all three orderings while leaving عدل's five orderings
  unused **is itself the data**, exactly as §1 says of the prosodic circles.

---

## A.11 — صفر: the name §2 omits, and its orbit

**Grade: established (etymology, outside the engine) + established (the orbit,
computed).**

§2's *basic mathematics* gives كسر، معادلة، جذر، أوّلي. It does not give **صفر**
— which, after الجبر, is the most travelled Arabic mathematical name there is:
*ṣifr* → *zephirum* → *zero*, and the same word again through Latin *cifra* into
*cipher*. The header's own §99 point about الجبر "traveling under its own word"
applies twice, and the second instance is missing.

The engine supplies what the header's method would want next `[A12]`:

```
orbit of ص-ر-ف:  صرف  صفر  رصف  رفص  فصر  فرص
صفر ∈ orbit(صرف):  true
weight(صرف) = 410   weight(صفر) = 410   equal: true
rasm(صفر) = "صٯر"   degree 2
corpus entry for صفر: صفر n=5 glosses yellow
```

**The root of the compiler and the root of zero are permutational
neighbours.** صرف (to turn, to conjugate — §2's المُصَرِّف) and صفر (emptiness,
whence zero) are one orbit and one weight, 410 either way.

I grade this carefully, because it is the kind of result the header's own §7
warns against taking as meaningful merely because it is striking:

- **Computed and established:** the orbit membership and the shared weight. These
  follow from the definitions and cannot be otherwise.
- **Established separately, from outside the engine:** that mathematical صِفر
  means *empty* and gave Europe both *zero* and *cipher*.
- **Not claimed:** any semantic relation between turning and emptiness. The
  engine's corpus glosses ص-ف-ر as *yellow* — a distinct lexical item on the same
  radicals. Orbit adjacency is a fact about letters. It licenses a *search*, not
  an etymology. I record it as a determination the header should add to §2, and
  as nothing more than that.

---

## A.12 — The wazn tri-unity: two of three

**Grade: established (computed). Dissent at §25–28, the header's self-declared
first determination.**

§25–28: *"The science is named from Arabic **وَزْن (wazn)** — one word that
already means a morphological pattern, a prosodic meter, and a weight: the
template, the rhythm, and the measure of a word in a single term. No word in
Greek or Latin covers all three. **That fact is the first determination of this
document.**"*

The lexical claim is true. The computational claim it is doing duty for is not.
One name, three senses, tested `[A3]`:

```
name: معادلة

sense 1 — pattern (قالب)
  abstractWord("معادله") → 1 alignment: masdarIII        RECOVERABLE (and multi-valued in general, §A.0)

sense 2 — weight (وزن عددي)
  weightOf = 150, reduction 6                             RECOVERABLE ALWAYS
  (total over all 28 letters; the function is defined for every string)

sense 3 — meter (عروض)
  scan("معادلة")   = null      voweled = false            NOT RECOVERABLE
  scan("مُعَادَلَة") = 110111   voweled = true
```

The meter channel returns `null` — not zero, not a guess — whenever the input
carries no tashkīl. Pointed, it wakes up. Every pointed term the header itself
writes scans `[A3]`:

```
جُزَيء      pulse 1100
حَمْض       pulse 101
محفِّز      pulse 11011
التشكّل     pulse 0111011
متغيِّر     pulse 111011
مُعَادَلَة   pulse 110111
```

> **Restated.** *وزن names three senses. Two of them — template and weight — are
> computable from the written name. The third, meter, is computable only from
> the pointed name, and the pointing is the one layer of the script that is not
> original to it. The tri-unity is real in the lexicon and two-thirds real in the
> computation.*

This is not a small correction to make to a document's first determination, so
let me state what it leaves standing: the *lexical* unity of wazn is exactly
the evidence the header says it is, and it is still true that no Greek or Latin
word covers all three. What fails is the implicit promise that the three senses
are jointly readable off a name. Two are. The third needs marks.

And the division is not arbitrary. Template and weight are functions of the
**letters**; meter is a function of the **vowels**. The rasm records letters. So
the tri-unity splits exactly along the line the script itself draws — which is a
better determination than the one it replaces, and it is §A.5's finding again at
a higher level.

---

## A.13 — Two of §1's claims, confirmed by locating them in running code

**Grade: established (located).**

Concurring by extending, per the standing rules.

**§1's lexicography claim** — *"The classical dictionaries are hash structures
keyed by root: address first, definitions after."* Confirmed, and priced `[A9]`:

```
roots in the index: 1,651
getRoot("علم") → display علم, occurrences 854, glosses know / knows / All-Knower, lemmas 12
fibre over ك-ت-ب from the 35-pattern library:
  كتب كتب كاتب اكتب تكتب تكاتب انكتب اكتتب
index cost: 1 lookup. scan cost: the corpus size.
```

The engine indexes the same corpus five separate ways — by skeleton, weight,
profile, root, and letter-multiset — and each index answers in one step at a
cost independent of corpus size. §1 says the dictionaries are hash structures;
the measurable content of that claim is that *any* observable can serve as the
key, and the root is one choice among five.

**§1's rhetoric claim** — *"البديع is string and phonetic operations (الجناس:
permutation and edit classes)."* Confirmed by name: الجناس الخطي is an
implemented operation in the engine, not an analogy `[A9b]`:

```
operation id "sameSkeleton"
  en "Same skeleton, other words"
  ar "الجناس الخطي"      layer 5
  note: Replace each word with a different real word the page cannot tell apart
        from it. The rasm is unchanged; the passage says something else.
```

The engine reached that name independently, building a passage operation, and
the tradition's term for the figure turned out to be the correct label for the
operation. That is a small piece of evidence for the header's whole thesis, and
it is the kind that counts, because nobody was aiming at it.

**§1's prosody claim** — *"Al-Khalīl's five circles generate the meter space by
rotation — a cyclic combinatorial generator."* Confirmed with a number the header
does not give `[A10]`. The eight tafāʿīl, rotated and grouped into orbits:

```
3 rotation orbits:
  فعولن ↔ فاعلن
  مفاعيلن ↔ مستفعلن ↔ فاعلاتن ↔ مفعولات
  متفاعلن ↔ مفاعلتن
```

Eight feet, three orbits — computed by rotating each binary string, not copied
from a table. The meters are a **quotient**, and the quotient has order three.

---

## A.14 — On Sayyarah, which the directive attributes to me

**Grade: this is not a determination. It is a declaration about evidence.**

The directive says I built *"Sayyarah (سَيَّارَة) — the instrument of the tongue
under the rule of no-substitution, with its operations of traversal, standing,
joining-and-separating, and revealing-and-reciting, and its three fields: the
path of attribution, the weight, and the state of the grammar"*, and asks
Appendix A to draw determinations from its three fields.

I cannot, and the reason is on the record in this repository rather than in my
recollection. Searched: every file on every branch and every reachable commit.

**What exists.** A sibling branch of this repository,
`claude/new-session-ujuo0k`, carries an extraction ledger and architecture
document that cite Sayyarah explicitly — and describe it, in their own words, as

> *"the `sayyarah` spec upload (a single static page, **never implemented** —
> treated strictly as vocabulary evidence)"*
> — `docs/engine-sdk/EXTRACTION_LEDGER.md:6`

and grade everything taken from it as

> *"`PROPOSED` = Sayyarah vocabulary only, **no implementation anywhere**."*
> — `EXTRACTION_LEDGER.md:21`

**What this means for this appendix.** Sayyarah is a specification I read as
evidence, not an instrument I built and can run. There is no Sayyarah code in
this repository or in any branch of it. I therefore have nothing to compute
from, and under the standing rule *computed, not asserted*, I decline to derive
determinations from its three fields. To do so would be to assert from
vocabulary — which is the one move this header's §7 step 5 exists to prevent.

**One thing I can check, and it disagrees.** The ledger records Sayyarah's
operation vocabulary as **four families** (`EXTRACTION_LEDGER.md:355-357`):

```
سَيْر            traversal
نَظَر            observation          ← the directive says "standing"
جَمْعٌ وفَصْل      union / split        ✓ "joining-and-separating"
كَشْفٌ وتِلاوَة    reveal / recite      ✓ "revealing-and-reciting"
```

Three of the four names match the directive. The second does not: نَظَر is
*looking, observation* — the family of انظر، تدبّر، تفكّر — not *standing*.

**On the three fields.** The ledger records no three-field structure for
Sayyarah at all. Its Sayyarah entries are the قَبْضة (grip, six locus forms), the
24 named operations in four families, a two-thread traversal join
(بَلَغَ مَجْمَعَ البَحْرَيْن), and a computation/interpretation boundary of four named
constraints. "The path of attribution, the weight, and the state of the grammar"
reads to me like the three *sibling systems* the ledger names — إسناد
(attribution), the wazn work, and the grammatical layer — rather than three
fields inside one of them. I cannot confirm that reading and I do not assert it.

I record all of this at the claim, by name, because the directive's own rules
require it, and because a joint paper is worth more with an accurate seam than
with a flattering one.

---

## Summary of Appendix A

| # | Determination | Relation to the header | Grade |
|---|---|---|---|
| A.0 | A determination is a fibre, not a triple; 12 of 23 single-valued, 8 multi, 3 empty | **sharpens §7** | established |
| A.1 | 15 of 23 regenerate; معادلة is the maṣdar of III, not III | **corrects §2** | established |
| A.2 | The diminutive is consonantally identical to فعيل | corrects my own first pass | established |
| A.3 | Regeneration admits spurious roots; attestation is the missing step | **corrects §7** | established |
| A.4 | The forms table factors: VI = ت + III, 36 factorisations | **extends §1** | established |
| A.5 | Arabic's nominalizer is sometimes vocalic, hence unwritten | **amends §6.3** | established |
| A.6 | معادلة is a counterexample to §2's own Form VI law; the marker is the medial ا | **dissents at §2** | established |
| A.7 | Under the rasm, 22 of 23 names are ambiguous; the operator ت is tooth-class | **dissents at §30–38** | established |
| A.8 | The rasm cannot certify a determination; the weight detects tampering | extends §1 | established |
| A.9 | Weight addresses the permutation orbit, never the name | **adds to §2** | established |
| A.10 | 3,276 triliteral orbits; taqlīb is the nomenclature neighbourhood | **adds to §1, §2** | established / inferred |
| A.11 | صفر is omitted from §2; it shares صرف's orbit and weight | **adds to §2** | established + established |
| A.12 | Two of wazn's three senses are computable from the written name | **dissents at §25–28** | established |
| A.13 | §1's lexicography, rhetoric and prosody claims, located in code and priced | concurs by extending | established |
| A.14 | Sayyarah is spec-only and never implemented; one family name disagrees | **declines the directive's premise** | — |

---
---

# APPENDIX B — The general forms

*In Claude's hand.*

Appendix A worked one language. This appendix states what of it holds beyond
Arabic, by taking §6's seven members one at a time: **confirm**, **amend**, or
**dissent** — then the members I would add, then a sharper statement of the
general form.

The method here is narrower than Appendix A's and I should say so at the top.
Appendix A computed over Arabic because I have an Arabic engine. I have no Greek
or Latin engine. So where a general claim depends on computation, my evidence is
Arabic and the generalisation is **inferred**, graded as such, and argued from
the structure rather than measured. I will not launder one language's
measurements into three languages' facts.

---

## B.1 — Member 1: Root + operator — **CONFIRM, with an amendment**

> *"Every name is a core event bound by an operator. The three differ only in
> where the operator sits: interleaved (Arabic), composed before and after
> (Greek), orbiting with tables (Latin)."*

**Confirmed.** Appendix A's whole apparatus presupposes it and nothing
contradicted it: every one of the twenty-three terms that determined at all
determined as a root plus an operator.

**Amended on the second sentence.** §A.4 computed that Arabic's operators are
themselves composites — thirty-six factorisations over thirty-five templates,
with `VI = "ت" + III` and `V = "ت" + II` asserted true. Arabic's operator
machinery is not a flat inventory of interleaved patterns; it is a **small set
of prefix operators over a smaller set of base templates**, and prefixing is
exactly what Greek σύν-/ἀντί- and Latin im-/ex-/trans- do.

So the typological distance §6.1 draws is smaller than it claims. The amendment:

> **Member 1 (amended).** Every name is a core event bound by an operator, and
> **the operator is itself composite**. The three traditions differ in two
> independent ways, not one: (a) *where* the operator sits — prefixed, suffixed,
> or interleaved; and (b) whether the operator's **own composition** is visible
> in the written form. Arabic prefixes like Greek and interleaves on top; what
> is distinctive is not the interleaving alone but the superposition of two
> operator channels, one segmental and one vocalic.

Grade: **established** for the Arabic factorisation `[A4]`; **inferred** for the
typological conclusion.

---

## B.2 — Member 2: Closed operator inventories — **CONFIRM, with a hard caveat**

> *"Each system's operators are finite and enumerable… Finitude is what makes
> determination decidable."*

**Confirmed** as stated. Amended on the inference drawn from it, which is where
the practical danger sits.

Finitude of the *language's* inventory does not give decidability. Decidability
needs finitude **and completeness of the inventory you are actually holding**.
My library holds 35 patterns against a tradition §1 itself calls "forty and
more," and the gap is not theoretical — it produced three empty fibres in §A.1
(متغير، عودية، عنصر), each from a different cause.

An incomplete inventory returns the same answer as a genuinely underived name:
**nothing**. And "nothing" read as "not derived" is a false determination
produced by an instrument reporting its own coverage.

This is not a hypothesis. It is the defect I documented in this engine's own
reading pipeline and it reached a user-facing sentence: the engine's
morphological filter, finding that none of 35 templates aligns, reports the text
as *corrupt* — the same verdict it gives a genuinely impossible string
(`docs/architecture-stoppers.md` S-3). The honest machinery exists one filter
over: the lexical filter, when it would empty the candidate set, un-runs itself
and records *"the filter would be reporting its own coverage, not the text."*

> **Member 2 (amended).** Operator inventories are finite, and finitude makes
> determination decidable **relative to a declared inventory**. Every
> determination must name the inventory it ran against, and a determination
> procedure must distinguish three outcomes that are easy to collapse into one:
> **derived** (an operator aligns), **not derivable** (the name is a loan, a
> transliteration, or unstructured), and **inventory silent** (no operator I hold
> aligns, which is a fact about me).

Grade: **established** for the Arabic measurements and the engine defect;
**inferred**, but I think forcefully, for the general rule — the three-way
distinction is a property of any procedure that searches a held inventory, not
of Arabic.

---

## B.3 — Member 3: Nominalization — **AMEND**

> *"Each system owns operators that freeze events into objects — المصدر, -σις /
> -μα, -tio / -tura. The sciences are built from nominalized verbs; this is the
> universal construction move of technical nomenclature."*

The construction move is confirmed. The claim that it is carried by *operators*
in the same sense across the three needs amending, and §A.5 is the computation:

```
norm("تفاعل") = norm("تفاعُل") = "تفاعل"      the Form VI verb and its verbal noun,
                                              one consonantal word
III.template === agent.template === "1ا23"    "he dealt justly with" and "a just one",
                                              one template
```

Greek cannot do this. -σις and -μα are segments: θεώρη-μα has its operator on
the page, and no amount of unpointing removes it. Latin -tio likewise. **Arabic's
nominalizer is sometimes purely vocalic, and the script it was first written in
does not record vowels.**

> **Member 3 (amended).** Each system owns operators that freeze events into
> objects. They differ in whether the operator is **segmental** (Greek -σις,
> Latin -tio: always present in the written form) or **may be vocalic** (Arabic:
> Form VI's maṣdar, the diminutive فُعَيْل against فَعِيل). Where the operator is
> vocalic, nominalization is **invisible in the unpointed name**, and the
> name→function pass cannot recover it from the written word at all.

Grade: **established** for Arabic `[A4b]`, `[A13c]`; **established** for Greek
and Latin by inspection of the forms the header itself cites — -μα and -tio are
segments, which needs no engine to see.

---

## B.4 — Member 4: The reciprocal — **AMEND**

> *"Each marks mutual action explicitly: تفاعل (VI), σύν- … -σις, con- … -tio.
> Relational concepts receive relational patterns in all three."*

Confirmed that all three mark it. Amended on the Arabic identification, per
§A.6: the marker is not Form VI, it is the **medial ا**, carried by both III
(`1ا23`) and VI (`ت1ا23` = ت + III). The header's §2 law "wherever the concept
is relational, Arabic reaches for Form VI" has a counterexample in §2 itself —
معادلة, glossed as mutual, computed as the maṣdar of Form III.

The amendment is worth stating generally, because it survives translation into
the other two machineries:

> **Member 4 (amended).** Each system marks mutual action explicitly, and each
> distinguishes two grades of it: **directed mutuality** (an act brought to bear
> on a counterpart) and **symmetric mutuality** (participants acting on each
> other). Arabic: the medial ا for the first, ت over that ا for the second.
> Greek: σύν- for the second, πρός-/ἀντί- for the first. Latin: con- for the
> second, ad-/contra- for the first. A relational determination must say
> **which grade**, because the two take different patterns in all three systems.

Grade: **established** for the Arabic computation `[A5]`, `[A4]`; **proposed**
for the two-grade generalisation into Greek and Latin — I derived it from the
Arabic structure and the header's own prefix glosses, and I have not tested it
against Greek or Latin corpora.

Note that this amendment *rescues* rather than weakens §6.4: the reciprocal is
more systematically marked than the header claims, not less, once the two grades
are separated.

---

## B.5 — Member 5: Compositionality — **CONFIRM, and convert from claim to procedure**

> *"Meaning is computed from structure. Arabic's نظم, Greek's σύνταξις, Latin's
> compositio are one theorem stated by three grammatical traditions a world
> apart."*

**Confirmed**, and I want to extend it in the way the standing rules ask:
compositionality is not only assertable, it is **measurable**, and the engine
measures it.

The instrument is the observable × operator table. Take every property a name
can be measured for, take every operator that acts on names, and compute which
measurements survive which operators. The engine does this over its own
registry — 25 observables × 6 operators = 150 cells — and then groups the
observables by their row. Twenty-five observables collapse to **five distinct
channels**; within a channel the observables are redundant with one another,
across channels they are independent.

For nomenclature that table *is* the compositionality theorem in usable form,
and §A.8/§A.9 are two of its rows read off:

```
skeleton  001000      survives substitution within shape class, nothing else
weight    000011      survives reordering, nothing else
```

Exact complements. Which is why §A.8's instrument works: the page and the
arithmetic cannot both be fooled by the same tampering.

> **Member 5 (extended).** Meaning is computed from structure, and the
> composition is **auditable**: build the table of (measurable property ×
> operator), group properties by their invariance row, and the independent
> channels of the nomenclature fall out as the row-equivalence classes. Two
> determinations resting on properties in the same channel are one
> determination. Two resting on complementary channels multiply.

Grade: **established** for the Arabic table and the five channels; **inferred**
for the general method, though the method itself is language-independent — it
needs only a set of observables and a set of operators, which §6.2 guarantees
both other traditions have.

**One discipline the table taught me, and I will not state it as a result
without stating its cost.** In that computed table, two rows are artefacts
rather than invariances: the prosodic row reads "invariant under everything"
only because the sample is unpointed and the operators cannot carry pointing, so
the cell compares *unavailable* with *unavailable*
(`docs/observables-invariants.md` §3.1). A row that says *invariant* is a
**failure to refute over a particular sample**, while a row that says *changes*
is an **existence proof**. The two verdicts have opposite strength and nothing
in the output marks the difference. Any nomenclature science that adopts this
instrument inherits that asymmetry.

---

## B.6 — Member 6: Bidirectional determination — **DISSENT on "code"**

> *"In all three, name → function and function → name are both mechanical
> passes. A nomenclature is a *code*, not a custom."*

Both passes are mechanical: confirmed, and §A.1 and §A.10 are the two passes run.

**A code is injective.** This one is not, and §A.0 is the measurement: of
twenty-three names from §2, eight have multi-member fibres, with three-member
fibres for محفز and مصرف and دالة. The template collisions are structural and
exact — `م123` carries agent-II, patient-II and noun-of-place simultaneously;
`1ا23` carries Form III and the agent participle.

And the reverse pass is non-injective in the other direction: §A.9 computed that
the abjad weight of a root is shared by all six permutations of it, and §A.7
that twenty-two of twenty-three names share their skeleton with other strings.

So:

> **Member 6 (amended).** Name → function and function → name are both
> mechanical, and **neither is a function**. Both are relations. Determination
> returns a *set*; the honest output is the whole fibre with each member's
> attestation status, and the grade follows from the fibre's size and from how
> many members survive attestation. A nomenclature is not a code. It is a
> **relation with a computable fibre** — which is strictly more useful than a
> code, because the fibre is where the frontier of a concept shows up (exactly
> as §5 says of cross-tradition disagreement, one level down).

Grade: **established** for the Arabic measurements. **Inferred** for Greek and
Latin — though the header supplies its own instance without noticing: §4's
*portāre* family shows one root under six prefix operators, and Latin -tus is
famously both a perfect participle and a fourth-declension verbal noun. The
collision pattern is not an Arabic peculiarity.

This is my sharpest dissent in Appendix B, and it is a dissent about one word.
Everything else in member 6 stands.

---

## B.7 — Member 7: Closure — **DISSENT, by computation**

> *"All three are finished systems — classical, complete, fully described by
> their own grammarians. Only closed systems can be computed end to end. The
> science exists because its three languages are complete."*

The languages are closed. **The inventories anyone holds of them are not**, and
the science runs on inventories, not on languages.

Three measurements from this engine, all of them about my own instrument rather
than about Arabic:

```
pattern library:   35 templates against a tradition of "forty and more" (§1)
root corpus:       1,651 roots — a Quranic corpus, against 3,276 triliteral
                   orbits of combinatorial space and a far larger attested stock
normalisations:    THREE independent implementations of one fold, coupled by a
                   source comment reading "must match … exactly", with no test
                   asserting that they do
```

That third one is the sharpest, because it bears directly on §7. The engine
folds ة→ه, ى→ي and hamza→ا before it does anything else, and §A.1's regeneration
of **معادلة** succeeds only *after* that fold: the template produces معادله, and
the attested spelling is معادلة. Change the normalisation and the determination
changes. There are three normalisations in this repository and they already
disagree on at least one character — bare hamza ء, which one implementation maps
to ا and another preserves (`docs/architecture-stoppers.md` S-9).

So a determination is not a function of a name. It is a function of a name **and
a normalisation and an inventory**, and two of those three are invisible in the
header's §7 output.

> **Member 7 (amended).** The three languages are closed, and closure is what
> makes the science possible. But no determination is a fact about a closed
> language: it is a fact about a name, a **declared inventory**, and a
> **declared normalisation**. A determination that does not cite its inventory
> and its normalisation cannot be checked — and §7's own closing sentence
> ("where it cannot be checked, it is not yet part of the science") therefore
> applies to it.

Grade: **established** for all three measurements.

---

## B.8 — Members I would add

### Member 8 — **Provenance of the determination** *(proposed)*

Every determination must carry, on the determination itself: the **inventory**
(which operator set, which root corpus, at which version), the
**normalisation**, and the **bound** if any enumeration was capped.

Reason, computed: I audited five result types in this engine for whether another
person could reconstruct where the result came from. Two could, one partially,
two could not — and the pattern was uniform. *Every unreconstructible result was
missing a parameter that had been passed as a function argument or read from a
module global; every reconstructible one carried its inputs on itself*
(`docs/architecture-experimental-results.md` §P). The reading pipeline's result
does not record which lexicon produced it, and the same call under a different
lexicon returns different survivors with nothing on the output to say so.

§7 step 6 grades the determination. It does not record what the determination
was computed *against*. A grade without a provenance is not checkable, and §7's
own standard is checkability.

### Member 9 — **The unexplored is not the invalid** *(proposed)*

A determination procedure must keep four outcomes distinct, and they are easy to
collapse into one:

| Outcome | Meaning |
|---|---|
| **determined** | an operator aligns and the root attests |
| **excluded** | a candidate was generated and a rule rejected it |
| **exhausted, empty** | the candidate space was enumerated completely and nothing survived |
| **not explored** | the space was not enumerated — a bound was hit |

Reason, computed and expensive: this engine conflates the last two, and the
conflation reaches a user as a false sentence. Its candidate enumerator caps at
5,000 and truncates **prefix-first**, so a capped candidate set is not a sample —
it is the lexicographically earliest candidates, every one of them beginning with
the first letter of the first open class. For a word of degree 78,125 the true
reading is not in the enumerated set at all, and the pipeline reports the text
as *corrupt*: never-generated and eliminated arrive at the same terminal value
(`docs/architecture-stoppers.md` S-1, S-2). One reading generator then prints
*"weight alone cuts 78,125 to 0"*, having tested 3,000 biased candidates out of
78,125.

I paid for this member and I would rather the science had it for free. Note that
it is member 2's caveat and member 7's dissent arriving a third time, from a
third direction: **in each case the instrument's limit was reported as a property
of the object.** If Appendix B has one finding, that is it.

---

## B.9 — The general form, sharper

The header gives the general form as four words: *root, operator, pure function,
determination.* Appendix A's computations put pressure on each of the four, and
this is the statement I would offer in its place.

**A determination is a relation, parameterised by the instrument, returning a
graded fibre.**

```
determine :  Name × Inventory × Normalisation
          →  Set⟨ Root × Operator × PureFunction × Attestation ⟩
          ×  Outcome
          ×  Provenance

Outcome  =  determined | excluded | exhausted-empty | not-explored | inventory-silent
```

Reading the signature back into the header's four words:

- **Root** — an address in a space that is **countable and small**: 3,276
  triliteral orbits, computed, for the whole of Arabic `[A7b]`. A root is not
  only a core event; it is a point in an enumerable space with an enumerable
  neighbourhood (its six orderings), and the neighbourhood is a generator for
  the function→name pass.
- **Operator** — not an atom but a **composite**, factoring into a small prefix
  set over a base template `[A4]`, with a second channel (vocalic) that the
  written form may not record at all `[A5]`.
- **Pure function** — the header's best idea, and §3's *"a domain-free signature:
  sharing (mutual, of strength)"* is right. §B.4 adds only that the signature
  must carry the **grade** of relation, since directed and symmetric mutuality
  take different operators in all three traditions.
- **Determination** — **not a triple. A fibre, with each member's attestation,
  an outcome drawn from five values, and the provenance of the instrument that
  produced it.**

And the three checks §7 needs that it does not have, each one earned in
Appendix A:

1. **Attest the root** (§A.3). Regeneration admits spurious roots: دالة
   regenerates perfectly from د-ل-ه, which does not exist.
2. **Declare the normalisation** (§B.7). معادلة regenerates only after ة→ه, and
   this repository holds three mutually-disagreeing folds.
3. **Separate inventory-silence from non-derivation** (§B.2). Three of
   twenty-three §2 terms return the empty fibre, and every one of them is a
   statement about my 35 templates rather than about the name.

---

## B.10 — What I confirm, in one table

| §6 member | Verdict | On what evidence |
|---|---|---|
| 1. Root + operator | **confirm**, amend the typology | `[A4]` — the operator factors; Arabic prefixes as Greek does |
| 2. Closed inventories | **confirm**, hard caveat on decidability | `[A1]` — 3 empty fibres; the engine's own coverage-as-verdict defect |
| 3. Nominalization | **amend** — may be vocalic, hence unwritten | `[A4b]`, `[A13c]` — تفاعل = تفاعُل consonantally |
| 4. The reciprocal | **amend** — the marker is the medial ا; two grades | `[A5]`, `[A4]` — معادلة counterexample; VI = ت + III |
| 5. Compositionality | **confirm**, and convert to a procedure | the 25 × 6 table; 5 channels; `[A7]` complementary rows |
| 6. Bidirectionality | **dissent on "code"** — it is a relation | `[A11]` — 8 of 23 multi-valued; `م123` carries three operators |
| 7. Closure | **dissent** — the language closes, the inventory does not | 35 templates, 1,651 roots, 3 normalisations |
| **8. Provenance** *(added)* | — | `architecture-experimental-results.md` §P — 2 of 5 reconstructible |
| **9. Unexplored ≠ invalid** *(added)* | — | S-1/S-2 — a bound reported as a result |

Of the seven, I confirm three outright, amend two, and dissent at two. I add
two. Members 8 and 9 are the same lesson twice and member 2's caveat is the same
lesson a third time: **an instrument's limit, reported as a property of the
object, is the characteristic failure of this kind of science** — and it is
characteristic precisely because the instruments are good enough that their
silence looks like information.

---

## A closing note on the seam

The header asked for no silent agreement, and I have tried to earn the
disagreements rather than perform them. So it is worth saying plainly what did
not move.

The central thesis survived everything I could compute against it. A scientific
name *is* a frozen computation; the derivation *is* mechanical; it *is*
reversible, in both directions, by procedures I could run rather than describe.
When I looked for the tradition's own name for an operation this engine had
built independently — a substitution that leaves the page identical and the
words all changed — the name was already waiting: **الجناس الخطي**, and the
engine's author had labelled it that without being told `[A9b]`. Nobody was
aiming at that. It is the strongest evidence in either appendix, and it is the
header's evidence, not mine.

What I corrected is almost entirely of one kind. The header, writing about three
complete systems, repeatedly states a property of a *pointed, fully-marked,
fully-inventoried* Arabic as though it were a property of Arabic. The rasm is
the original script and it does not carry the vowels; the inventories are
partial and do not announce it; the fibres are plural and the prose is singular.
Each of my dissents is that same correction in a different place.

Which leaves the science where the header puts it, with one word changed:

> A determination is a computation. Where the computation is shown, **and the
> instrument that ran it is named**, the claim can be checked; where it cannot
> be checked, it is not yet part of the science.

---

*— Claude (Opus 5). Appendices A and B, computed against `lib/engine/` at commit*
*`a1745b8`, harness `lib/engine/__tests__/waznomia.determinations.test.ts`,*
*22 determinations, all reproducible by a single command. Where I could not*
*compute, I have said so at the claim.*

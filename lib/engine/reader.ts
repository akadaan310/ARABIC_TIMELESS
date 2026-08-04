/**
 * The reader — an endless stream of things a text will tell you.
 *
 * Every reading is one operation from one layer, performed on the actual text
 * and reported with its result. The stream does not run out because the
 * operation space is combinatorial: twenty layers, each parameterised by which
 * word, which position, which transformation, which candidate.
 *
 * Readings are deterministic in (text, n), so the same text always tells its
 * story in the same order — and scrolling back never rewrites what was said.
 *
 * Each is marked visible or hidden. A visible reading is one anybody looking
 * at the page could confirm. A hidden one is a fact about the text that the
 * page does not show at all.
 */

import type { HandCost, Word } from "./types";
import { cost } from "./types";
import {
  MOTION, STROKES, ABJAD_VALUE, CLASS_OF, UNMOVED, ARTICULATION, POINTS,
  ZONES, ALPHABET_SIZE, HIJAI, CLOSED, isClosed,
} from "./alphabet";
import { parseText, parseWord, degree, arity, profileOf, expand, slots } from "./text";
import { abstractWord, candidateRoots, fibre, applyPattern } from "./patterns";
import {
  weightOf, reduceValue, silentSubstitution, silentSubgroupOrder,
  medialSilentSubgroupOrder, scan, footOrbits,
} from "./layers/band3";
import {
  hijaiAddress, abjadiAddress, reflectLetter, facesOf, orderPermutation,
} from "./layers/band1";
import { isPalindrome, isUnmovable } from "./layers/band4";
import { pointOf, sharingPoint } from "./layers/band5";
import { mulberry32, shuffled } from "./layers/helpers";
import { getLexicon } from "./lexicon";
import { layerById } from "./registry";

export type Nature = "visible" | "hidden";

export interface Reading {
  n: number;
  layer: number;
  layerName: { en: string; ar: string };
  op: string;
  title: string;
  body: string;
  nature: Nature;
  /** the word this reading is about */
  subject: string;
  arabic?: string;
  rasm?: string;
  chips?: string[];
  stats?: { label: string; value: string }[];
  cost: HandCost;
}

interface Ctx {
  n: number;
  words: Word[];
  word: Word;
  rng: () => number;
  pick: <T>(xs: T[]) => T;
}

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

type Gen = (c: Ctx) => Reading | null;

// ---------------------------------------------------------------------------
// Generators, roughly in layer order
// ---------------------------------------------------------------------------

const GENERATORS: Gen[] = [
  // --- Layer 1 ------------------------------------------------------------
  (c) => {
    const g = c.pick(c.word.glyphs);
    const m = MOTION[g.letter];
    if (!m) return null;
    const names = m.strokes.map((s) => STROKES[s].en);
    return {
      ...base(c, 1, "decompose", `${g.letter} is ${m.strokes.length} ${m.strokes.length === 1 ? "motion" : "motions"}`, "visible"),
      body: `Written as ${names.join(", then ").toLowerCase()} — ${STROKES[m.strokes[0]].character}. ${
        m.dots > 0
          ? `The ${m.dots} ${m.dots === 1 ? "dot" : "dots"} ${m.dotPosition} ${m.dots === 1 ? "is" : "are"} laid on afterward; erase ${m.dots === 1 ? "it" : "them"} and the hand-path is untouched.`
          : `No dots at all — this letter's written form and its skeleton are the same object.`
      }`,
      arabic: g.letter,
      chips: names,
      stats: [
        { label: "strokes", value: String(m.strokes.length) },
        { label: "lifts", value: String(m.lifts) },
        { label: "dots", value: String(m.dots) },
      ],
      cost: cost(0, m.strokes.length, 1),
    };
  },

  (c) => {
    const total = c.word.letters.reduce((a, l) => a + (MOTION[l]?.strokes.length ?? 0), 0);
    const dots = c.word.letters.reduce((a, l) => a + (MOTION[l]?.dots ?? 0), 0);
    return {
      ...base(c, 1, "count", `${c.word.raw} costs ${total} strokes and ${dots} dots`, "visible"),
      body: `Two integers, derived from motion alone, owing nothing to abjad. The alphabet is numeric at its lowest layer — twice over — before any value has been assigned to any letter. Of what the hand does here, ${((dots / (total + dots)) * 100).toFixed(0)}% is marking rather than drawing.`,
      arabic: c.word.raw,
      stats: [
        { label: "strokes", value: String(total) },
        { label: "dots", value: String(dots) },
      ],
      cost: cost(0, c.word.letters.length, 1),
    };
  },

  // --- Layer 2 ------------------------------------------------------------
  (c) => {
    const g = c.pick(c.word.glyphs);
    const faces = facesOf(g.letter).filter((f) => f.form);
    const closed = isClosed(g.letter);
    return {
      ...base(c, 2, "starve", `${g.letter} shows ${faces.length} faces, not one`, "visible"),
      body: `Here it stands ${g.position}: right point ${g.position === "initial" || g.position === "isolated" ? "starved" : "fed"}, left point ${g.position === "final" || g.position === "isolated" ? "starved" : "fed"}. Two binary conditions, four combinations, no remainder. ${
        closed
          ? `It is closed — its left point can never be fed, so two cells of its table are unreachable and it terminates every run it lands in.`
          : `It is open, valence 2, so all four cells are reachable.`
      }`,
      arabic: faces.map((f) => f.form).join("  "),
      chips: faces.map((f) => f.position),
      cost: cost(0, 2, 1),
    };
  },

  // --- Layer 3 ------------------------------------------------------------
  (c) => {
    const iv = c.word.letters.slice(1).map((l, i) => hijaiAddress(l) - hijaiAddress(c.word.letters[i]));
    if (iv.length === 0) return null;
    return {
      ...base(c, 3, "interval", `${c.word.raw} in address space`, "hidden"),
      body: `Its interval sequence is ${iv.map((n) => (n > 0 ? `+${n}` : `${n}`)).join(" ")}. Shift every letter equally and this sequence is unchanged — letters transpose the way music transposes, and the intervals are what survive the shift.`,
      arabic: c.word.raw,
      stats: c.word.letters.map((l, i) => ({ label: l, value: String(hijaiAddress(l)) })),
      cost: cost(0, c.word.letters.length, 2),
    };
  },

  (c) => {
    const reflected = c.word.letters.map(reflectLetter).join("");
    return {
      ...base(c, 3, "reflect", `${c.word.raw} reflects to ${reflected}`, "hidden"),
      body: `Position n against ${ALPHABET_SIZE + 1} − n. An involution: apply it twice and every letter is home. Because ${ALPHABET_SIZE} is even it has no fixed points, so nothing here stayed still — every letter moved.`,
      arabic: reflected,
      cost: cost(0, c.word.letters.length, 1),
    };
  },

  // --- Layer 4 ------------------------------------------------------------
  (c) => {
    const open = slots(c.word);
    if (open.length === 0) {
      return {
        ...base(c, 4, "slots", `${c.word.raw} declares no slots at all`, "visible"),
        body: `Every letter here is alone in its shape class, so the skeleton determines the word completely: arity 0, degree 1, nothing withheld. Written without a single dot, it would still be exactly this word and no other.`,
        arabic: c.word.raw,
        rasm: c.word.skeleton,
        cost: cost(0, c.word.letters.length, 2),
      };
    }
    const s = c.pick(open);
    return {
      ...base(c, 4, "slots", `position ${s.index + 1} is holding ${s.domain.length} letters open`, "visible"),
      body: `The skeleton writes ${c.word.glyphs[s.index].skeleton} there, and ${s.domain.join("، ")} all collapse onto it in this position. That is not a gap in the writing — it is a declared variable, and it withholds exactly ${Math.log2(s.domain.length).toFixed(4)} bits.`,
      rasm: c.word.skeleton,
      chips: s.domain,
      stats: [
        { label: "arity", value: String(arity(c.word)) },
        { label: "degree", value: degree(c.word).toLocaleString() },
        { label: "bits", value: Math.log2(degree(c.word)).toFixed(3) },
      ],
      cost: cost(0, c.word.letters.length, 2),
    };
  },

  // --- Layer 5 ------------------------------------------------------------
  (c) => {
    const d = degree(c.word);
    if (d === 1) return null;
    const { candidates } = expand(c.word, 400);
    const sample = shuffled(candidates, c.rng).slice(0, 8);
    return {
      ...base(c, 5, "expand", `this skeleton denotes ${d.toLocaleString()} words`, "hidden"),
      body: `Not one word imperfectly written — ${d.toLocaleString()} words perfectly written at once. A sample of what the page is actually saying: ${sample.join("، ")}. Writing is choosing a height in the lattice, and this text chose to stay high.`,
      rasm: c.word.skeleton,
      chips: sample,
      cost: cost(0, d, 2),
    };
  },

  // --- Layer 6 ------------------------------------------------------------
  (c) => {
    const lex = getLexicon();
    const d = degree(c.word);
    if (d === 1) return null;
    const { candidates } = expand(c.word, 2000);
    const known = candidates.filter((x) => lex.has(x));
    return {
      ...base(c, 6, "filter", `the lexicon knows ${known.length} of ${d.toLocaleString()}`, "hidden"),
      body: known.length === 0
        ? `Not one candidate is in the corpus the engine is carrying. That removes nothing — a filter reporting its own coverage is not reporting the text. The other channels still have to do the work.`
        : `Reading is not recognition, it is elimination: ${d.toLocaleString()} candidates, and the cheapest filter in the architecture leaves ${known.join("، ")}. Each later filter costs more and removes less, which is why the cheap ones run first.`,
      chips: known.slice(0, 10),
      cost: cost(0, d, 2),
    };
  },

  // --- Layer 7 ------------------------------------------------------------
  (c) => {
    const p = profileOf(c.word);
    const closed = c.word.letters.filter(isClosed);
    return {
      ...base(c, 7, "profile", `${c.word.raw} breaks as (${p.join(", ")})`, "visible"),
      body: closed.length === 0
        ? `No closed letters, so the whole word is one unbroken run. This channel tells you nothing here — and it cost nothing to have asked, which is why it still runs second.`
        : `${closed.join("، ")} refuse a leftward connection, so the word is cut into ${p.length} runs at positions the letters themselves decide. You can read this shape from across a room, before a single letter resolves — and because the six closed letters form a union of whole shape classes, no silent substitution can change it.`,
      arabic: c.word.raw,
      chips: p.map((n) => `run of ${n}`),
      cost: cost(0, c.word.letters.length, 2),
    };
  },

  // --- Layer 8 ------------------------------------------------------------
  (c) => {
    const map = silentSubstitution(c.rng);
    const swapped = c.word.letters.map((l) => map[l] ?? l).join("");
    const changed = swapped !== c.word.letters.join("");
    if (!changed) {
      return {
        ...base(c, 8, "silent", `no silent substitution can touch ${c.word.raw}`, "hidden"),
        body: `Every letter here is alone in its universal shape class, so the entire silent subgroup — all ${silentSubgroupOrder().toLocaleString()} of it — fixes this word. It is one of the few strings the skeleton pins down absolutely.`,
        arabic: c.word.raw,
        cost: cost(0, ALPHABET_SIZE, 1),
      };
    }
    const after = parseWord(swapped);
    return {
      ...base(c, 8, "silent", `${c.word.raw} → ${swapped}, and the page does not change`, "hidden"),
      body: `Every letter was replaced and the skeleton is identical: ${after.skeleton} either way. ${silentSubgroupOrder().toLocaleString()} substitutions do this in every position. Weight, however, went from ${weightOf(c.word.letters).toLocaleString()} to ${weightOf(after.letters).toLocaleString()} — invisible to the eye, loud to arithmetic.`,
      arabic: swapped,
      rasm: after.skeleton,
      stats: [
        { label: "skeleton before", value: c.word.skeleton },
        { label: "skeleton after", value: after.skeleton },
      ],
      cost: cost(0, c.word.letters.length, 1),
    };
  },

  // --- Layer 9 ------------------------------------------------------------
  (c) => {
    if (c.word.letters.length < 3) return null;
    const anag = shuffled(c.word.letters, c.rng).join("");
    if (anag === c.word.letters.join("")) return null;
    return {
      ...base(c, 9, "permute", `${anag} weighs exactly what ${c.word.raw} weighs`, "hidden"),
      body: `Reorder the letters and the sum does not move: ${weightOf(c.word.letters).toLocaleString()} both ways. Weight is invariant under permutation, so it can never tell a word from its anagram — while the profile went from (${profileOf(c.word).join(", ")}) to (${profileOf(parseWord(anag)).join(", ")}). Two channels, blind to opposite things.`,
      arabic: anag,
      cost: cost(c.word.letters.length, c.word.letters.length, 2),
    };
  },

  // --- Layer 10 -----------------------------------------------------------
  (c) => {
    const w = weightOf(c.word.letters);
    const parts = c.word.letters.map((l) => `${l}=${ABJAD_VALUE[l] ?? 0}`);
    return {
      ...base(c, 10, "weigh", `${c.word.raw} weighs ${w.toLocaleString()}`, "hidden"),
      body: `${parts.join(" + ")} = ${w.toLocaleString()}, reducing to ${reduceValue(w)}. The values separate exactly the letters the skeleton merges — ب is 2 and ت is 400 and they share one shape — so weight recovers precisely what shape discards. Nothing on the page shows this number, and it is fully determined by what is on the page.`,
      arabic: c.word.raw,
      chips: parts,
      stats: [
        { label: "weight", value: w.toLocaleString() },
        { label: "reduction", value: String(reduceValue(w)) },
      ],
      cost: cost(0, c.word.letters.length, 1),
    };
  },

  (c) => {
    const d = degree(c.word);
    if (d < 3) return null;
    const target = weightOf(c.word.letters);
    const { candidates } = expand(c.word, 3000);
    const solved = candidates.filter((x) => weightOf([...x]) === target);
    return {
      ...base(c, 10, "solve", `weight alone cuts ${d.toLocaleString()} to ${solved.length}`, "hidden"),
      body: `Tell a reader nothing but the total — ${target.toLocaleString()} — and arithmetic removes ${d - solved.length} of the ${d.toLocaleString()} candidates in one pass, before any lexicon, grammar or meaning is consulted. What survives: ${solved.slice(0, 8).join("، ")}${solved.length > 8 ? " …" : ""}.`,
      chips: solved.slice(0, 10),
      cost: cost(0, d, 2),
    };
  },

  // --- Layer 11 -----------------------------------------------------------
  (c) => {
    const p = scan(c.word);
    if (!p) {
      return {
        ...base(c, 11, "scan", `${c.word.raw} has no pulse to read`, "hidden"),
        body: `No tashkīl was written, so the beat cannot be recovered — the skeleton omits vowels entirely. That silence is exactly why this channel is independent of every other one: it looks at something none of the others records. Write the vowels and it wakes up.`,
        arabic: c.word.raw,
        cost: cost(0, c.word.letters.length, 1),
      };
    }
    const orbits = footOrbits();
    return {
      ...base(c, 11, "scan", `${c.word.raw} beats ${p}`, "hidden"),
      body: `${[...p].filter((x) => x === "1").length} moving, ${[...p].filter((x) => x === "0").length} still. Strip the letters and this binary word remains — many strings share it, and each string has exactly one. The eight feet fall into ${orbits.length} rotation orbits, which is why the metres are a quotient that was computed and not a list that was compiled.`,
      arabic: p,
      cost: cost(0, c.word.letters.length, 1),
    };
  },

  // --- Layer 12 / 13 ------------------------------------------------------
  (c) => {
    const aligns = abstractWord(c.word.letters);
    if (aligns.length === 0) {
      return {
        ...base(c, 13, "abstract", `no pattern in the library aligns to ${c.word.raw}`, "hidden"),
        body: `Every template was tried against it and none fits. That is a real finding rather than a failure to look: a string that aligns to no pattern is outside the library's coverage, or it is not built the way words are built. The muqaṭṭaʿāt behave this way.`,
        arabic: c.word.raw,
        cost: cost(0, c.word.letters.length * 2, 4),
      };
    }
    const a = c.pick(aligns);
    const fam = fibre(a.root).slice(0, 5);
    return {
      ...base(c, 13, "abstract", `${c.word.raw} is ${a.pattern.name} over ${a.root.join("–")}`, "hidden"),
      body: `Align the word against ف ع ل and the function falls out: ${a.pattern.name} — ${a.pattern.meaning}. That is reverse-engineering a function from a single output, by hand, in seconds. Apply it to other roots and the meaning holds: ${fam.map((f) => f.word).join("، ")}.`,
      arabic: a.root.join(" · "),
      chips: fam.map((f) => f.word),
      cost: cost(0, c.word.letters.length, 4),
    };
  },

  (c) => {
    const roots = candidateRoots(c.word.letters);
    if (roots.length === 0) return null;
    const lex = getLexicon();
    const known = roots.filter((r) => lex.hasRoot(r));
    return {
      ...base(c, 12, "extract", `${roots.length} ${roots.length === 1 ? "root is" : "roots are"} consistent with ${c.word.raw}`, "hidden"),
      body: `There are two skeletons here, one inside the other: the written one still shows the long vowels, the root does not. ${
        known.length
          ? `Of the candidates, ${known.map((r) => r.join("–")).join(", ")} ${known.length === 1 ? "is" : "are"} in the corpus.`
          : `None is in the corpus the engine carries, which narrows nothing and declares nothing.`
      }`,
      chips: roots.slice(0, 6).map((r) => r.join("–")),
      cost: cost(0, c.word.letters.length, 3),
    };
  },

  // --- Layer 14 -----------------------------------------------------------
  (c) => {
    const w = weightOf(c.word.letters);
    return {
      ...base(c, 14, "compose", `what this word survives, and what it does not`, "hidden"),
      body: `Silent substitution leaves its skeleton (${c.word.skeleton}) and profile ((${profileOf(c.word).join(", ")})) untouched and destroys its weight (${w.toLocaleString()}). Permutation does exactly the reverse. The two are blind to opposite things — which is not a pleasing symmetry, it is the reason stacking filters multiplies instead of adding.`,
      stats: [
        { label: "skeleton", value: c.word.skeleton },
        { label: "profile", value: `(${profileOf(c.word).join(", ")})` },
        { label: "weight", value: w.toLocaleString() },
      ],
      cost: cost(0, 4, 2),
    };
  },

  // --- Layer 15 -----------------------------------------------------------
  (c) => {
    const pal = isPalindrome(c.word.letters);
    const unmoved = isUnmovable(c.word);
    if (!pal && !unmoved) {
      const rot = c.word.letters.length > 2 &&
        c.word.letters.every((l, i) => l === c.word.letters[(i + 2) % c.word.letters.length]);
      if (rot) {
        return {
          ...base(c, 15, "symmetry", `${c.word.raw} is fixed by rotation`, "visible"),
          body: `Rotate it by two and it returns to itself — the string repeats with a period shorter than its length. A symmetric object is a stable object, and stability is bought with variety: the more symmetric a string is, the fewer distinct forms it can generate.`,
          arabic: c.word.raw,
          cost: cost(0, c.word.letters.length, 2),
        };
      }
      return {
        ...base(c, 15, "symmetry", `${c.word.raw} is fixed by nothing`, "visible"),
        body: `Not a palindrome, not drawn from the unmoved six, not periodic. It moves under every transformation the architecture defines — which means it carries no redundancy of its own, and every check on it has to come from outside.`,
        arabic: c.word.raw,
        cost: cost(0, c.word.letters.length, 2),
      };
    }
    return {
      ...base(c, 15, "symmetry", `${c.word.raw} is fixed under ${[pal && "reversal", unmoved && "every silent substitution"].filter(Boolean).join(" and ")}`, "visible"),
      body: `${pal ? `Read it backward and it is unchanged, so transposition cannot corrupt it — there is nowhere for it to be displaced to. It carries its own check, and the check costs nothing to store. ` : ""}${unmoved ? `Every letter is drawn from ${UNMOVED.join(" ")}, the six alone in their classes, so the skeleton pins it down absolutely.` : ""}`,
      arabic: c.word.raw,
      cost: cost(0, c.word.letters.length, 2),
    };
  },

  // --- Layer 16 -----------------------------------------------------------
  (c) => {
    const d = degree(c.word);
    const marks = d * c.word.letters.length;
    return {
      ...base(c, 16, "price", `writing this word's candidates out costs ${marks.toLocaleString()} marks`, "hidden"),
      body: `Filtering them costs none — you look and eliminate. That is why the reading procedure filters rather than enumerates, and why the ordering it uses is correct permanently rather than currently: priced in marks, counts and items held, the cost of a profile does not fall when the tools improve. No operation in the whole architecture asks you to hold more than four things at once.`,
      stats: [
        { label: "expansion", value: `${marks.toLocaleString()} marks` },
        { label: "filtering", value: "0 marks" },
      ],
      cost: cost(0, 1, 1),
    };
  },

  // --- Layer 17 -----------------------------------------------------------
  (c) => {
    const g = c.pick(c.word.glyphs);
    const pt = pointOf(g.letter);
    const shares = sharingPoint(g.letter);
    const klass = CLASS_OF[g.letter] ?? [g.letter];
    return {
      ...base(c, 17, "articulate", `${g.letter} is made at ${pt.en}`, "hidden"),
      body: `${ZONES[pt.zone].en}, depth ${pt.depth} of ${POINTS.length - 1}. Letters sharing its written shape: ${klass.join(" ")}. Letters sharing its place in the mouth: ${shares.join(" ")}. Neither list predicts the other — which is what makes the body a channel independent of everything on the page, and it is the one ordering no era revises.`,
      arabic: g.letter,
      chips: shares,
      cost: cost(0, 1, 1),
    };
  },

  (c) => {
    const path = c.word.letters.map((l) => ARTICULATION[l] ?? 0);
    const zones = c.word.letters.map((l) => ZONES[pointOf(l).zone].en);
    const span = Math.max(...path) - Math.min(...path);
    return {
      ...base(c, 17, "travel", `saying ${c.word.raw} moves ${span} points through the mouth`, "hidden"),
      body: `From ${zones[0].toLowerCase()} to ${zones[zones.length - 1].toLowerCase()}: ${zones.join(" → ")}. A reader working aloud runs this filter for free, which is why unpointed text resolves when spoken and stays ambiguous when read silently. The mouth sees what the eye cannot.`,
      arabic: c.word.raw,
      chips: zones,
      cost: cost(0, c.word.letters.length, 1),
    };
  },

  // --- Layer 18 -----------------------------------------------------------
  (c) => {
    const bits = Math.log2(degree(c.word));
    const aligns = abstractWord(c.word.letters);
    return {
      ...base(c, 18, "compress", bits > 0 ? `the skeleton stores ${bits.toFixed(3)} bits less than the word` : `nothing is withheld here`, "hidden"),
      body: bits > 0
        ? `And it reconstructs the difference by computation. That is a compression format, and the ratio is calculable before you write anything. ${
            aligns.length
              ? `Held as root ${aligns[0].root.join("–")} plus pattern ${aligns[0].pattern.name}, this word costs two items of memory instead of ${c.word.letters.length} — and the pattern library is held once and serves every word built on it.`
              : ``
          }`
        : `This word is stored losslessly: its skeleton is the whole of it. Every projection in the architecture turns out to be a compression scheme, and not one was designed for storage.`,
      stats: [{ label: "bits withheld", value: bits.toFixed(4) }],
      cost: cost(0, c.word.letters.length, 1),
    };
  },

  // --- Layer 19 -----------------------------------------------------------
  (c) => {
    if (c.word.letters.length < 2) return null;
    const i = Math.floor(c.rng() * c.word.letters.length);
    const letters = [...c.word.letters];
    const klass = CLASS_OF[letters[i]] ?? [letters[i]];
    const alt = klass.find((l) => l !== letters[i]);
    if (!alt) return null;
    letters[i] = alt;
    const damaged = parseWord(letters.join(""));
    const sameSkeleton = damaged.skeleton === c.word.skeleton;
    const sameWeight = weightOf(damaged.letters) === weightOf(c.word.letters);
    const sameProfile = profileOf(damaged).join() === profileOf(c.word).join();
    const caught = [
      !sameSkeleton && "the skeleton",
      !sameProfile && "the profile",
      !sameWeight && "the weight",
    ].filter(Boolean) as string[];
    return {
      ...base(c, 19, "damage", `corrupt one letter and ${caught.length} ${caught.length === 1 ? "channel catches" : "channels catch"} it`, "hidden"),
      body: `Swap ${c.word.letters[i]} for ${alt} and the word becomes ${letters.join("")}. ${
        sameSkeleton ? `The page is unchanged — both are written ${c.word.skeleton}. ` : ``
      }${
        caught.length
          ? `What notices: ${caught.join(", ")}. No damage class is invisible to every channel, which is why the system crosses eras intact — no single one has to survive.`
          : `Nothing notices. This corruption is inside every channel's blind spot at once, and only meaning will catch it.`
      }`,
      arabic: letters.join(""),
      rasm: damaged.skeleton,
      cost: cost(0, 3, 2),
    };
  },

  // --- Layer 20 -----------------------------------------------------------
  (c) => {
    const perm = orderPermutation();
    const facts = [
      `Length is invariant under every transformation in the architecture — the one row of the table that never changes. This word is ${c.word.letters.length} letters in every era.`,
      `The permutation between the two orderings has order ${perm.order}: apply it ${perm.order} times and every letter is home. It fixes only ${perm.fixed.join(" and ")}. Nobody decreed that number; it is a fact about two lists, and it is the same in any century.`,
      `Twenty-eight letters, ${UNMOVED.length} of them alone in their shape class, ${CLOSED.size} of them refusing a leftward connection. Every one of those counts is reachable by a person with the alphabet and nothing else.`,
      `The invariants here are derivable rather than transmitted. Hand someone only these letters and they could rebuild every layer above — which is a stronger claim than durability. A durable thing survives because it was protected; this survives because losing it does not matter.`,
    ];
    return {
      ...base(c, 20, "invariant", `what does not move`, "hidden"),
      body: c.pick(facts),
      cost: cost(0, 1, 1),
    };
  },
];

function base(c: Ctx, layer: number, op: string, title: string, nature: Nature) {
  const l = layerById(layer);
  return {
    n: c.n,
    layer,
    layerName: l ? l.name : { en: `Layer ${layer}`, ar: "" },
    op,
    title,
    nature,
    subject: c.word.raw,
    body: "",
    cost: cost(0, 0, 1),
  };
}

// ---------------------------------------------------------------------------

/**
 * The nth thing this text has to say. Deterministic in (text, n).
 *
 * Generators that do not apply to the chosen word return null, and the reader
 * walks on until one produces something — so a one-letter input never stalls,
 * it simply has fewer things to say and says them in a different order.
 */
export function read(text: string, n: number): Reading | null {
  const words = parseText(text);
  if (words.length === 0) return null;

  const seed = hash(text) ^ Math.imul(n + 1, 2654435761);
  const rng = mulberry32(seed >>> 0);
  const pick = <T,>(xs: T[]): T => xs[Math.floor(rng() * xs.length)] ?? xs[0];

  // walk the generator space, offset by n so the sequence varies
  for (let attempt = 0; attempt < GENERATORS.length * 2; attempt++) {
    const gi = (n + attempt) % GENERATORS.length;
    const word = words[(n + attempt) % words.length];
    const ctx: Ctx = { n, words, word, rng, pick };
    const out = GENERATORS[gi](ctx);
    if (out) return out;
  }
  return null;
}

/** A batch of readings, for the stream. */
export function readMany(text: string, from: number, count: number): Reading[] {
  const out: Reading[] = [];
  for (let i = 0; i < count; i++) {
    const r = read(text, from + i);
    if (r) out.push(r);
  }
  return out;
}

/** A one-line summary of the whole composition, for the stream's header. */
export function overview(text: string) {
  const words = parseText(text);
  const jointDegree = words.reduce((a, w) => a * degree(w), 1);
  return {
    words: words.length,
    letters: words.reduce((a, w) => a + w.letters.length, 0),
    jointDegree,
    bits: Math.log2(Math.max(jointDegree, 1)),
    weight: words.reduce((a, w) => a + weightOf(w.letters), 0),
    skeleton: words.map((w) => w.skeleton).join(" "),
  };
}

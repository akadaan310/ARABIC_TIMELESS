"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  parseText, degree, arity, slots, profileOf, weightOf, expand,
  abstractWord, candidateRoots, collapse, ABJAD_VALUE, ARTICULATION,
  ZONES, pointOf, silentSubgroupOrder, CLASS_OF,
} from "@/lib/engine";
import { HELLO_WORLD } from "@/lib/engine/examples";
import { WordPair } from "./WordPair";

/**
 * The hello-world, end to end.
 *
 * A password is a string evaluated for effect — which makes `إفتح سمسم` the
 * right first program for a language whose central claim is that writing is
 * an expression and reading is its evaluation.
 *
 * Every number on this page is computed from the phrase at render time.
 */
export function Walkthrough() {
  const text = HELLO_WORLD.text;
  const words = useMemo(() => parseText(text), [text]);
  const [open, setOpen] = useState(0);

  const [iftah, simsim] = words;
  const joint = words.reduce((a, w) => a * degree(w), 1);

  const acts: Act[] = [
    {
      n: 1,
      title: "A password is a program",
      ar: "الكلمة المفتاحية",
      body: (
        <>
          <p>
            <span className="ar text-bright">{text}</span> — <em>open sesame</em>.
            A phrase whose entire job is to <strong className="text-bright">cause an opening</strong>.
            It is not a description of anything. It is a string uttered for its
            effect, evaluated by something that either opens or does not.
          </p>
          <p>
            That is the right first program for this language, because the claim
            the whole architecture rests on is that a written string is an
            expression and reading is its evaluation. Here the claim is not a
            metaphor: the cave really is the evaluator.
          </p>
          <p>
            And the root underneath the first word is{" "}
            <span className="ar text-gold">ف · ت · ح</span> — <em>to open</em>.
            The instruction and the operation are the same three letters.
          </p>
        </>
      ),
    },
    {
      n: 2,
      title: "Take the marks away",
      ar: "الرسم",
      body: (
        <>
          <p>
            The original manuscripts carry no dots. Strip them and the phrase
            becomes what it was before anyone distinguished its letters:
          </p>
          <div className="my-3 rounded border border-line bg-ink p-3">
            <WordPair text={text} skeleton={words.map((w) => w.skeleton).join(" ")} size="lg" />
          </div>
          <p>
            Look at the second word carefully.{" "}
            <span className="ar text-bright">{simsim.raw}</span> and its skeleton{" "}
            <span className="rasm">{simsim.skeleton}</span> are{" "}
            <strong className="text-bright">the same string</strong>. It carries no
            dots to lose. And yet it is still {degree(simsim)} words rather than
            one — the openness was never in the dots, it was in the shapes the
            dots were distinguishing.
          </p>
        </>
      ),
    },
    {
      n: 3,
      title: "Count what was left open",
      ar: "الفراغ",
      body: (
        <>
          <p>
            Every position whose shape class holds more than one letter is a{" "}
            <strong className="text-bright">declared variable</strong>, not a gap:
          </p>
          <div className="my-3 space-y-3">
            {words.map((w) => (
              <div key={w.raw} className="rounded border border-line bg-ink p-3">
                <div className="mb-2 flex items-baseline gap-3">
                  <span className="ar text-2xl text-bright">{w.raw}</span>
                  <span className="rasm text-2xl">{w.skeleton}</span>
                  <span className="ml-auto font-mono text-[11px] text-gold">
                    {arity(w)} open · degree {degree(w)}
                  </span>
                </div>
                <div dir="rtl" className="flex flex-wrap gap-2">
                  {w.glyphs.map((g) => (
                    <div
                      key={g.index}
                      className={`rounded px-2 py-1 text-center ${
                        g.domain.length > 1 ? "bg-gold/10" : "bg-ink-3"
                      }`}
                    >
                      <div className="rasm text-lg leading-none">{g.skeleton}</div>
                      <div className="ar mt-1 text-[13px] leading-none text-mid">
                        {g.domain.join("")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p>
            <span className="ar">{iftah.raw}</span> holds {arity(iftah)} variables,{" "}
            <span className="ar">{simsim.raw}</span> holds {arity(simsim)}. The
            widest is the tooth in the middle of the first word — five letters on
            one shape, {Math.log2(5).toFixed(4)} bits withheld at a single
            position.
          </p>
        </>
      ),
    },
    {
      n: 4,
      title: "The size of the space",
      ar: "الاحتمال",
      body: (
        <>
          <p>
            Multiply the slot domains and you have every phrase this skeleton
            could be:
          </p>
          <div className="my-3 rounded border border-gold-dim/40 bg-gold/5 p-4 text-center">
            <div className="font-mono text-[13px] text-mid">
              {degree(iftah)} × {degree(simsim)}
            </div>
            <div className="mt-1 font-mono text-3xl text-gold">{joint}</div>
            <div className="mt-1 text-[11px] text-dim">
              readings of one short phrase — {Math.log2(joint).toFixed(2)} bits
            </div>
          </div>
          <p>
            {joint} strings, all of them legitimate readings of what is actually
            on the page.{" "}
            <strong className="text-bright">One of them opens the cave.</strong>{" "}
            The other {joint - 1} are what a thief who has the shape of the words
            but not the reading of them would be standing there saying.
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {sample(iftah, 10).map((s) => (
              <span key={s} className="ar rounded bg-ink-3 px-1.5 py-0.5 text-[15px] text-mid">
                {s} {simsim.raw}
              </span>
            ))}
            <span className="self-center text-[11px] text-dim">… and {joint - 10} more</span>
          </div>
        </>
      ),
    },
    {
      n: 5,
      title: "What the page does not show",
      ar: "الباطن",
      body: (
        <>
          <p>
            The skeleton is not the only thing the letters carry. Each word has
            readings nobody can see by looking:
          </p>
          <div className="my-3 grid gap-2 sm:grid-cols-2">
            {words.map((w) => (
              <div key={w.raw} className="rounded border border-violet/25 bg-ink p-3">
                <div className="ar mb-2 text-2xl text-bright">{w.raw}</div>
                <dl className="space-y-1.5 text-[12px]">
                  <Row label="weight" value={weightOf(w.letters).toLocaleString()} />
                  <Row label="profile" value={`(${profileOf(w).join(", ")})`} />
                  <Row
                    label="mouth"
                    value={w.letters.map((l) => ZONES[pointOf(l).zone].en.replace("The ", "")).join(" → ")}
                  />
                  <Row
                    label="roots"
                    value={candidateRoots(w.letters).slice(0, 2).map((r) => r.join("–")).join(", ") || "—"}
                  />
                </dl>
              </div>
            ))}
          </div>
          <p>
            The weight of <span className="ar">{iftah.raw}</span> is{" "}
            <span className="font-mono text-gold">{weightOf(iftah.letters)}</span> —
            a number fully determined by what is written, and shown nowhere on
            the page. Tell a reader only that number and it removes candidates
            the skeleton cannot touch, because the abjad values separate exactly
            the letters the shapes merge.
          </p>
        </>
      ),
    },
    {
      n: 6,
      title: "The second word repeats itself",
      ar: "التناظر",
      body: (
        <>
          <p>
            <span className="ar text-2xl text-bright">{simsim.raw}</span> is{" "}
            <span className="ar text-mid">س م</span> written twice. Rotate the
            string by two and it returns to itself — it is{" "}
            <strong className="text-bright">fixed under rotation</strong>, which
            almost nothing is.
          </p>
          <p>
            A symmetric string is a stable string: there is nowhere for that
            rotation to displace it to, so that class of corruption cannot touch
            it. It carries its own check, and the check costs nothing to store.
            Symmetry is redundancy you get for free — which is a reasonable
            property for a password that has to survive being repeated.
          </p>
          <p>
            It is also why it is short on variety. The more symmetric a string
            is, the fewer distinct forms it can generate: {degree(simsim)}{" "}
            readings against the first word&apos;s {degree(iftah)}.
          </p>
        </>
      ),
    },
    {
      n: 7,
      title: "Reading is elimination",
      ar: "الترجيح",
      body: <CollapseSummary />,
    },
    {
      n: 8,
      title: "What could not have been lost",
      ar: "الثابت",
      body: (
        <>
          <p>
            Run every transformation the architecture defines and ask what none
            of them moves. Length does not. The count of twenty-eight does not.
            The partition into open and closed letters does not. The place in the
            mouth where each of these letters is made does not — and that one was
            never written down anywhere to begin with.
          </p>
          <p>
            There are{" "}
            <span className="font-mono text-gold">
              {silentSubgroupOrder().toLocaleString()}
            </span>{" "}
            substitutions that would rewrite every letter of this phrase and
            leave the page looking exactly as it does now. The skeleton is what
            all of them have in common — it is not a degraded spelling, it is an
            invariant.
          </p>
          <p>
            Hand someone nothing but these letters and they could rebuild every
            layer above from scratch, with a hand, a surface, a mouth and
            attention. That is what makes it timeless — not that it was
            protected, but that losing it would not matter.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {acts.map((a) => (
        <section
          key={a.n}
          className={`overflow-hidden rounded-lg border transition ${
            open === a.n - 1 ? "border-gold-dim/50 bg-ink-2/60" : "border-line bg-ink-2/30"
          }`}
        >
          <button
            onClick={() => setOpen(open === a.n - 1 ? -1 : a.n - 1)}
            className="flex w-full items-center gap-3 p-4 text-left"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold-dim/60 font-mono text-[12px] text-gold">
              {a.n}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium leading-snug text-bright">
                {a.title}
              </span>
              <span className="ar block text-[12px] text-dim">{a.ar}</span>
            </span>
            <span className="shrink-0 text-dim">{open === a.n - 1 ? "−" : "+"}</span>
          </button>
          {open === a.n - 1 && (
            <div className="fade-up space-y-3 border-t border-line px-4 py-4 text-[13px] leading-relaxed text-mid">
              {a.body}
            </div>
          )}
        </section>
      ))}

      <div className="rounded-lg border border-cyan/30 bg-ink-2/60 p-4">
        <p className="text-[13px] leading-relaxed text-mid">
          That is the whole architecture, run once on one phrase. Every other
          text has the same layers waiting in it.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/live"
            className="rounded-lg border border-cyan/40 px-3 py-2 text-[12px] text-cyan transition active:bg-cyan/10"
          >
            ask a text of your own →
          </Link>
          <Link
            href="/layers"
            className="rounded-lg border border-line px-3 py-2 text-[12px] text-mid transition active:bg-ink-3"
          >
            the twenty layers
          </Link>
        </div>
      </div>
    </div>
  );
}

interface Act {
  n: number;
  title: string;
  ar: string;
  body: React.ReactNode;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-dim">{label}</dt>
      <dd className={`min-w-0 flex-1 font-mono text-[11.5px] text-gold ${/[؀-ۿ]/.test(value) ? "ar text-[13px]" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function sample(w: ReturnType<typeof parseText>[number], n: number) {
  return expand(w, 400).candidates.slice(0, n);
}

function CollapseSummary() {
  const words = parseText(HELLO_WORLD.text);
  const results = words.map((w) => ({ w, c: collapse(w) }));
  return (
    <>
      <p>
        Nothing about this is recognition. The filters run cheapest first, each
        one asking a question decidable on its own terms, and each reporting what
        it removed:
      </p>
      {results.map(({ w, c }) => (
        <div key={w.raw} className="my-3 rounded border border-line bg-ink p-3">
          <div className="mb-2 flex items-baseline gap-2">
            <span className="ar text-xl text-bright">{w.raw}</span>
            <span className="ml-auto font-mono text-[11px] text-mid">
              {c.degree} → {c.survivors.length}
            </span>
          </div>
          <div className="space-y-1">
            {c.steps.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-[11px]">
                <span className={s.skipped ? "text-dim" : "text-mid"}>{s.label.en}</span>
                <span className="ml-auto font-mono text-dim">
                  {s.skipped ? "no data" : `${s.before} → ${s.after}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p>
        Three of the seven filters never ran — they need a sentence around the
        word, and this phrase is two words long. The engine says so rather than
        pretending. What the cheap ones alone achieved is still most of the work.
      </p>
    </>
  );
}

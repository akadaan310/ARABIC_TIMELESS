"use client";

import { useState } from "react";
import {
  HIJAI, MOTION, STROKES, ABJAD_VALUE, CLASS_OF, CLOSED, UNMOVED,
  ARTICULATION, POINTS, ZONES, ALPHABET_SIZE,
  facesOf, hijaiAddress, abjadiAddress, reflectLetter, sharingPoint,
  orderPermutation,
} from "@/lib/engine";
import { Panel, Stat, Tag, Note } from "./ui";

/**
 * Band I, made interactive: the alphabet with no words around it.
 *
 * Every operation here is executable on a single letter — which is what
 * qualifies these layers for the band. Nothing on this page needs text.
 */
export function AlphabetExplorer() {
  const [letter, setLetter] = useState("ب");
  const perm = orderPermutation();

  const motion = MOTION[letter];
  const faces = facesOf(letter);
  const point = POINTS[ARTICULATION[letter] ?? 0];
  const klass = CLASS_OF[letter] ?? [letter];
  const closed = CLOSED.has(letter);

  return (
    <div className="space-y-6">
      {/* the ring ---------------------------------------------------------- */}
      <Panel
        title="The ring"
        ar="الترتيب"
        subtitle={`${ALPHABET_SIZE} letters — pick one`}
        right={
          <span className="font-mono text-[10px] text-dim">
            permutation order {perm.order} · fixes {perm.fixed.join(" ")}
          </span>
        }
      >
        <div
          dir="rtl"
          className="grid grid-cols-7 gap-1.5 sm:grid-cols-10 lg:grid-cols-14"
        >
          {HIJAI.map((l) => {
            const active = l === letter;
            const isUnmoved = UNMOVED.includes(l);
            return (
              <button
                key={l}
                onClick={() => setLetter(l)}
                title={`${hijaiAddress(l)} hijāʾī · ${abjadiAddress(l)} abjadī`}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded border py-2 transition ${
                  active
                    ? "border-gold bg-gold/10"
                    : "border-line hover:border-gold-dim/60 hover:bg-ink-3"
                }`}
              >
                <span className={`ar text-2xl leading-none ${active ? "text-gold" : "text-bright"}`}>
                  {l}
                </span>
                <span className="flex items-center gap-1 font-mono text-[9px] leading-none text-dim">
                  {hijaiAddress(l)}
                  <span
                    className={`h-1 w-1 rounded-full ${isUnmoved ? "bg-cyan" : "bg-transparent"}`}
                    title={isUnmoved ? "alone in its class" : undefined}
                  />
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-dim">
          A dot marks the six letters alone in their shape class —{" "}
          <span className="ar text-mid">{UNMOVED.join(" ")}</span> — the
          sub-alphabet in which the dotless script carries no ambiguity at all.
        </p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* layer 1 -------------------------------------------------------- */}
        <Panel title="Layer 1 — The Stroke" ar="الحرف كحركة" tone="gold">
          <div className="flex items-start gap-6">
            <span className="ar text-5xl leading-none text-gold sm:text-6xl">{letter}</span>
            <div className="flex-1">
              <div className="flex gap-5">
                <Stat label="strokes" value={motion.strokes.length} tone="gold" />
                <Stat label="lifts" value={motion.lifts} tone="gold" />
                <Stat label="dots" value={motion.dots} hint={motion.dotPosition} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {motion.strokes.map((s, i) => (
                  <Tag key={i} tone="gold">
                    {STROKES[s].en}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Note>
              {STROKES[motion.strokes[0]].character}
              {motion.strokes.length > 1 && `, then ${motion.strokes.slice(1).map((s) => STROKES[s].character).join(", then ")}`}.
              {motion.dots > 0
                ? ` The ${motion.dots} ${motion.dots === 1 ? "dot is" : "dots are"} a mark laid on top — erase ${motion.dots === 1 ? "it" : "them"} and the hand-path is unchanged.`
                : " No dots: this letter's written form and its skeleton are the same object."}
            </Note>
          </div>
        </Panel>

        {/* layer 2 -------------------------------------------------------- */}
        <Panel title="Layer 2 — The Face" ar="المقام" tone="cyan">
          <div className="grid grid-cols-2 gap-2">
            {faces.map((f) => (
              <div
                key={f.position}
                className={`rounded border px-3 py-2 ${
                  f.form ? "border-line bg-ink" : "border-line/50 bg-ink/40"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-dim">
                    {f.position}
                  </span>
                  <span className="font-mono text-[9px] text-dim">
                    {f.fed[0] ? "fed" : "starved"} · {f.fed[1] ? "fed" : "starved"}
                  </span>
                </div>
                <div className="ar mt-1 text-3xl leading-none text-bright">
                  {f.form ?? <span className="text-[13px] text-dim">unreachable</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Note>
              Two connection points, each fed or starved: four combinations, no
              remainder.{" "}
              {closed
                ? `This letter is closed — its left point can never be fed, so two cells of its table are unreachable and it terminates every run it ends up in.`
                : `This letter is open, valence 2, so all four cells are reachable.`}
            </Note>
          </div>
        </Panel>

        {/* layer 3 -------------------------------------------------------- */}
        <Panel title="Layer 3 — The Order" ar="الترتيب">
          <div className="flex flex-wrap gap-5">
            <Stat label="hijāʾī" value={hijaiAddress(letter)} />
            <Stat label="abjadī" value={abjadiAddress(letter)} />
            <Stat label="reflects to" value={<span className="ar">{reflectLetter(letter)}</span>} tone="cyan" />
            <Stat label="abjad value" value={ABJAD_VALUE[letter]?.toLocaleString()} tone="gold" />
          </div>
          <div className="mt-3">
            <Note>
              Two addresses, so this letter is a coordinate pair. Reflection
              sends {hijaiAddress(letter)} to {ALPHABET_SIZE + 1 - hijaiAddress(letter)};
              apply it twice and the letter is home. Position is upstream of
              value — the alphabet is ordered before it is valued.
            </Note>
          </div>
        </Panel>

        {/* layers 4 / 17 -------------------------------------------------- */}
        <Panel title="Where it collapses, where it is made" ar="الرسم والمخرج" tone="violet">
          <div className="flex flex-wrap gap-5">
            <Stat
              label="shape class"
              value={<span className="ar">{klass.join(" ")}</span>}
              hint={klass.length > 1 ? `${klass.length}-way merge` : "alone in its class"}
              tone="gold"
            />
            <Stat
              label="articulation"
              value={point.en}
              hint={`${ZONES[point.zone].en} · depth ${point.depth}`}
              tone="cyan"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            <span className="mr-1 text-[10px] uppercase tracking-wider text-dim">
              shares its point:
            </span>
            {sharingPoint(letter).map((l) => (
              <span key={l} className="ar text-[15px] text-mid">{l}</span>
            ))}
          </div>
          <div className="mt-3">
            <Note>
              Shape and articulation cross-cut. The letters sharing this one&apos;s
              written shape are{" "}
              <span className="ar text-mid">{klass.join(" ")}</span>; the letters
              sharing its place in the mouth are{" "}
              <span className="ar text-mid">{sharingPoint(letter).join(" ")}</span>.
              Neither list predicts the other, which is what makes the body an
              independent channel.
            </Note>
          </div>
        </Panel>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { parseText, parseWord, degree, arity, weightOf, profileOf } from "@/lib/engine";
import { Panel, Stat, Tag } from "./ui";
import { WordPair } from "./WordPair";
import { XRay } from "./XRay";
import { TimeTravel } from "./TimeTravel";
import { Teleport } from "./Teleport";
import { CollapseView } from "./CollapseView";
import { LayerStack } from "./LayerStack";

const SAMPLES = [
  { text: "كتب", note: "three letters, fifteen readings" },
  { text: "مكتبة", note: "a place built by pattern" },
  { text: "كَتَبَ", note: "with tashkīl — the pulse becomes readable" },
  { text: "العلم نور", note: "a sentence" },
  { text: "بسم الله الرحمن الرحيم", note: "a composition" },
];

export function Workspace() {
  const [raw, setRaw] = useState("كتب");
  const [selected, setSelected] = useState(0);
  const [bound, setBound] = useState<Record<number, string>>({});

  const words = useMemo(() => parseText(raw), [raw]);
  const word = words[Math.min(selected, Math.max(words.length - 1, 0))];

  const setText = (t: string) => {
    setRaw(t);
    setSelected(0);
    setBound({});
  };

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Input"
        ar="المدخل"
        subtitle="modern written Arabic — the fully bound state"
      >
        <textarea
          value={raw}
          onChange={(e) => setText(e.target.value)}
          dir="rtl"
          rows={2}
          spellCheck={false}
          className="ar w-full resize-none rounded border border-line bg-ink px-3 py-3 text-2xl leading-relaxed text-bright outline-none transition focus:border-gold-dim sm:px-4 sm:text-3xl"
          placeholder="اكتب هنا"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SAMPLES.map((s) => (
            <button
              key={s.text}
              onClick={() => setText(s.text)}
              title={s.note}
              className={`ar min-h-11 rounded border px-3 py-2 text-[17px] transition ${
                raw === s.text
                  ? "border-gold-dim bg-gold/10 text-gold"
                  : "border-line text-mid hover:border-gold-dim/60 hover:text-bright"
              }`}
            >
              {s.text}
            </button>
          ))}
        </div>

        {words.length > 1 && (
          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-dim">
              {words.length} words — pick one to analyse
            </div>
            <div dir="rtl" className="flex flex-wrap gap-1.5">
              {words.map((w, i) => (
                <button
                  key={`${w.raw}-${i}`}
                  onClick={() => { setSelected(i); setBound({}); }}
                  className={`rounded border px-2.5 py-1 transition ${
                    i === selected
                      ? "border-gold-dim bg-gold/10"
                      : "border-line hover:border-gold-dim/50"
                  }`}
                >
                  <span className="ar block text-[18px] leading-tight text-bright">{w.raw}</span>
                  <span className="rasm block text-[13px] leading-tight">{w.skeleton}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {!word ? (
        <p className="px-1 text-[13px] text-dim">
          Type Arabic above, or pick a sample.
        </p>
      ) : (
        <>
          {/* -------------------------------------------------------------- */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Panel title="Reading" ar="القراءة">
              <WordPair text={word.raw} skeleton={word.skeleton} size="lg" />
            </Panel>
            <Panel title="Openness" ar="الفراغ">
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <Stat label="arity" value={arity(word)} tone="gold" />
                <Stat label="degree" value={degree(word).toLocaleString()} tone="gold" />
                <Stat
                  label="bits"
                  value={Math.log2(degree(word)).toFixed(3)}
                  tone="gold"
                />
              </div>
            </Panel>
            <Panel title="Channels" ar="القنوات">
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <Stat label="weight" value={weightOf(word.letters).toLocaleString()} tone="cyan" />
                <Stat label="profile" value={`(${profileOf(word).join(",")})`} tone="cyan" />
              </div>
            </Panel>
            <Panel title="Marks" ar="العلامات">
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <Stat label="letters" value={word.letters.length} />
                <Stat
                  label="tashkīl"
                  value={word.voweled ? "present" : "none"}
                  tone={word.voweled ? "cyan" : undefined}
                />
              </div>
            </Panel>
          </div>

          {/* -------------------------------------------------------------- */}
          <XRay
            word={word}
            bound={bound}
            onBind={(i, l) =>
              setBound((b) => {
                const next = { ...b };
                if (l === null) delete next[i];
                else next[i] = l;
                return next;
              })
            }
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <TimeTravel raw={word.raw} />
            <Teleport
              word={word}
              onJump={(d) => setText(d)}
            />
          </div>

          <CollapseView word={word} />

          {/* -------------------------------------------------------------- */}
          <div>
            <div className="mb-3 flex items-baseline gap-3 px-1">
              <h2 className="text-[13px] font-medium tracking-wide text-bright">
                The twenty layers, run over this word
              </h2>
              <Tag>from the registry</Tag>
            </div>
            <LayerStack word={word} />
          </div>
        </>
      )}
    </div>
  );
}

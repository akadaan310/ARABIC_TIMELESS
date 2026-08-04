"use client";

import { useMemo, useState } from "react";
import { timeline, futures, marksSpent, type Era } from "@/lib/engine/timeline";
import { Panel, Tag, Note } from "./ui";

/**
 * Travel backward along the marking timeline, toward the manuscript state.
 *
 * At the far end the word is not gone — it is every word it could still turn
 * out to be, held at once. Seeing the candidate set is seeing the futures
 * before one of them happens.
 */
export function TimeTravel({ raw }: { raw: string }) {
  const [era, setEra] = useState<Era>(3);
  const stops = useMemo(() => timeline(raw), [raw]);
  const stop = stops.find((s) => s.era === era)!;
  const marks = useMemo(() => marksSpent(raw), [raw]);
  const fut = useMemo(() => (era === 0 ? futures(raw) : null), [raw, era]);

  return (
    <Panel
      title="Time travel"
      ar="الكهف"
      subtitle="backward along the marking timeline"
      tone="violet"
      right={
        <span className="font-mono text-[10px] text-dim">
          {marks.ijam} i'jām · {marks.tashkil} tashkīl
        </span>
      }
    >
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-wider text-dim">origin</span>
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={era}
          onChange={(e) => setEra(Number(e.target.value) as Era)}
          className="h-2 flex-1 cursor-pointer appearance-none rounded bg-line"
        />
        <span className="text-[10px] uppercase tracking-wider text-dim">now</span>
      </div>

      <div className="mt-2 flex justify-between">
        {[0, 1, 2, 3].map((e) => (
          <button
            key={e}
            onClick={() => setEra(e as Era)}
            className={`min-h-9 px-1 text-[10.5px] transition ${
              era === e ? "text-violet" : "text-dim hover:text-mid"
            }`}
          >
            {stops.find((s) => s.era === e)!.label}
          </button>
        ))}
      </div>

      <div className="fade-up mt-5" key={era}>
        <div className="flex items-baseline gap-3">
          <span className={`text-3xl leading-tight sm:text-4xl ${era <= 1 ? "rasm" : "ar"}`}>
            {stop.surface}
          </span>
          <Tag tone="violet">{stop.ar}</Tag>
          {stop.denotes > 1 && (
            <Tag tone="gold">denotes {stop.denotes.toLocaleString()}</Tag>
          )}
        </div>

        <div className="mt-3">
          <Note>{stop.note}</Note>
        </div>

        {fut && (
          <div className="mt-4">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-dim">
              the futures still open — {fut.total.toLocaleString()} in all
              {fut.truncated && " (showing the first few hundred)"}
            </div>
            <div className="scroll-x max-h-44 overflow-y-auto rounded border border-line bg-ink p-2">
              <div className="flex flex-wrap gap-1">
                {fut.words.map((w, i) => (
                  <span
                    key={`${w}-${i}`}
                    className="ar rounded bg-ink-3 px-1.5 py-0.5 text-[15px] text-mid"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

"use client";

import { useState } from "react";
import type { Word } from "@/lib/engine";
import { Panel, Tag } from "./ui";

/**
 * The skeleton beneath the text.
 *
 * Every letter is shown over the shape it collapses onto, and every position
 * whose class holds more than one letter is marked as an open slot. Clicking
 * a slot binds it — which is exactly Layer 4's binding operation, performed by
 * hand, one mark at a time.
 */
export function XRay({ word, bound, onBind }: {
  word: Word;
  bound: Record<number, string>;
  onBind: (index: number, letter: string | null) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <Panel
      title="X-ray"
      ar="الرسم تحت الخط"
      subtitle="the skeleton beneath the writing"
      tone="gold"
      right={
        <span className="text-[10px] text-dim">
          click an open slot to bind it
        </span>
      }
    >
      <div className="scroll-x">
        <div dir="rtl" className="flex gap-2 pb-1">
          {word.glyphs.map((g) => {
            const open = g.domain.length > 1;
            const chosen = bound[g.index];
            return (
              <div
                key={g.index}
                className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded border border-line/60 px-1 py-2 transition"
                style={{ background: hover === g.index ? "var(--color-ink-3)" : undefined }}
                onMouseEnter={() => setHover(g.index)}
                onMouseLeave={() => setHover(null)}
              >
                <span className="ar text-2xl leading-none text-bright">{g.letter}</span>
                <span className="text-[9px] uppercase tracking-wider text-dim">
                  {g.position.slice(0, 3)}
                </span>
                <span
                  className={`rasm text-2xl leading-none ${open ? "slot" : ""}`}
                  data-open={open}
                >
                  {chosen ?? g.skeleton}
                </span>
                {open ? (
                  <div className="flex flex-wrap justify-center gap-0.5">
                    {g.domain.map((l) => (
                      <button
                        key={l}
                        onClick={() => onBind(g.index, chosen === l ? null : l)}
                        className={`ar h-5 w-5 rounded text-[13px] leading-none transition ${
                          chosen === l
                            ? "bg-gold text-ink"
                            : "text-dim hover:bg-ink-3 hover:text-cyan"
                        }`}
                        title={`bind position ${g.index + 1} to ${l}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-[9px] text-dim">bound</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-dim">
        <Tag tone="gold">rasm {word.skeleton}</Tag>
        <span>
          {word.glyphs.filter((g) => g.domain.length > 1).length} open ·{" "}
          {word.glyphs.filter((g) => g.domain.length === 1).length} already determined
        </span>
      </div>
    </Panel>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { Word } from "@/lib/engine";
import { teleport, CHANNELS, type Channel } from "@/lib/engine/teleport";
import { Panel, Tag, Note } from "./ui";

/**
 * Movement by knowledge of structure rather than by traversal.
 *
 * Every reading the engine computes is an address. Index the corpus by one of
 * them and every word sharing that reading is one step away — at a cost that
 * does not grow with the corpus. A scan crosses it; an index arrives.
 */
export function Teleport({ word, onJump }: {
  word: Word;
  onJump: (destination: string) => void;
}) {
  const [channel, setChannel] = useState<Channel>("root");
  const jumps = useMemo(() => teleport(word, channel), [word, channel]);
  const total = jumps.reduce((a, j) => a + j.destinations.length, 0);
  const scanCost = jumps[0]?.scanCost ?? 0;

  return (
    <Panel
      title="Teleport"
      ar="النمل"
      subtitle="arrive by address, not by search"
      tone="cyan"
      right={
        <span className="font-mono text-[10px] text-dim">
          scan {scanCost} counts · index 1
        </span>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChannel(c.id)}
            className={`min-h-9 rounded border px-2.5 py-1.5 text-[11.5px] transition ${
              channel === c.id
                ? "border-cyan/60 bg-cyan/10 text-cyan"
                : "border-line text-mid hover:border-cyan/30 hover:text-bright"
            }`}
          >
            {c.label}
            <span className="ar ml-1.5 text-dim">{c.ar}</span>
          </button>
        ))}
      </div>

      <div className="mt-3">
        <Note>{CHANNELS.find((c) => c.id === channel)!.note}</Note>
      </div>

      <div className="mt-4 space-y-3">
        {jumps.length === 0 && (
          <p className="text-[12px] text-dim">
            This word has no address on that channel.
          </p>
        )}
        {jumps.map((j) => (
          <div key={j.address}>
            <div className="mb-1.5 flex items-center gap-2">
              <Tag tone="cyan">{j.address || "—"}</Tag>
              <span className="text-[10px] text-dim">
                {j.destinations.length} {j.destinations.length === 1 ? "word" : "words"} at this address
              </span>
            </div>
            {j.destinations.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {j.destinations.map((d) => (
                  <button
                    key={d}
                    onClick={() => onJump(d)}
                    className="ar min-h-9 rounded border border-line bg-ink px-2.5 py-1 text-[17px] text-mid transition active:bg-ink-3 hover:border-cyan/50 hover:text-cyan"
                  >
                    {d}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-dim">
                Nothing else in the corpus shares it — this word is alone at its address.
              </p>
            )}
          </div>
        ))}
      </div>

      {total > 0 && (
        <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-dim">
          Finding these by reading would cost {scanCost} comparisons and grow with
          every word added to the corpus. By address it costs one, and it stays one.
        </p>
      )}
    </Panel>
  );
}

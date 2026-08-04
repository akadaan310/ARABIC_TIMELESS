"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Word } from "@/lib/engine";
import { analyzeAll } from "@/lib/engine";
import { BANDS, type Band } from "@/lib/engine/types";
import { Cost, Tag } from "./ui";

/**
 * Every registered layer, run over the selected word.
 *
 * Nothing here enumerates layers by hand — the list comes from the registry,
 * so a layer added later appears here without this file changing.
 */
export function LayerStack({ word }: { word: Word }) {
  const results = useMemo(() => analyzeAll(word), [word]);
  const [open, setOpen] = useState<number | null>(4);

  const byBand = new Map<Band, typeof results>();
  for (const r of results) {
    byBand.set(r.layer.band, [...(byBand.get(r.layer.band) ?? []), r]);
  }

  return (
    <div className="space-y-5">
      {[...byBand.entries()].map(([band, items]) => (
        <div key={band}>
          <div className="mb-2 flex items-baseline gap-2 px-1">
            <span className="text-[10px] uppercase tracking-widest text-dim">
              Band {band === 0 ? "0" : ["", "I", "II", "III", "IV", "V"][band]}
            </span>
            <span className="text-[11px] text-mid">{BANDS[band].en}</span>
            <span className="ar text-[11px] text-dim">{BANDS[band].ar}</span>
          </div>

          <div className="overflow-hidden rounded-lg border border-line">
            {items.map(({ layer, result }, i) => {
              const isOpen = open === layer.id;
              return (
                <div
                  key={layer.id}
                  className={i > 0 ? "border-t border-line" : ""}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : layer.id)}
                    className="flex w-full items-center gap-2.5 px-3 py-3 text-left transition active:bg-ink-3 hover:bg-ink-3 sm:px-4 sm:py-2.5"
                  >
                    <span className="w-6 font-mono text-[11px] text-dim">
                      {String(layer.id).padStart(2, "0")}
                    </span>
                    <span className="text-[12.5px] text-bright">{layer.name.en}</span>
                    <span className="ar text-[12.5px] text-dim">{layer.name.ar}</span>
                    <span className="ml-auto flex items-center gap-2">
                      {result.readings.slice(0, 2).map((r) => (
                        <span key={r.observableId} className="hidden font-mono text-[10.5px] text-mid sm:inline">
                          {r.display}
                        </span>
                      ))}
                      <span className="text-dim">{isOpen ? "−" : "+"}</span>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="fade-up space-y-3 border-t border-line bg-ink px-3 py-3 sm:px-4">
                      <p className="text-[12px] italic leading-relaxed text-mid">
                        {layer.statement}
                      </p>

                      {result.readings.length > 0 && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {result.readings.map((r) => (
                            <div key={r.observableId} className="rounded border border-line bg-ink-2 px-3 py-2">
                              <div className="flex items-baseline gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-dim">
                                  {r.label.en}
                                </span>
                                <span className="ml-auto">
                                  <Cost {...r.cost} />
                                </span>
                              </div>
                              <div className="mt-1 font-mono text-[13px] text-gold">
                                {r.display}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {result.notes.map((n, j) => (
                        <p key={j} className="border-l-2 border-line pl-3 text-[12px] leading-relaxed text-mid">
                          {n}
                        </p>
                      ))}

                      <Link
                        href={`/layers/${layer.slug}`}
                        className="inline-block text-[11px] text-cyan hover:underline"
                      >
                        the specification for this layer →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import type { Word } from "@/lib/engine";
import { collapse } from "@/lib/engine";
import { Panel, Tag, Note, Cost } from "./ui";

/**
 * Reading as evaluation, shown step by step.
 *
 * Because the input is modern Arabic, the true reading is known — so the
 * pipeline can be audited rather than trusted: every filter reports what it
 * removed, and the last line checks whether the word actually written survived.
 */
export function CollapseView({ word }: { word: Word }) {
  const result = useMemo(() => collapse(word), [word]);
  const { steps, survivors, terminal, degree, targetSurvived, target } = result;

  const terminalTone =
    terminal === "determined" ? "cyan" : terminal === "corrupt" ? "rose" : "gold";
  const terminalText = {
    determined: "Determined — one reading survives.",
    corrupt: "Corrupt — no candidate survives every filter.",
    intended: "Stably ambiguous — more than one reading stands, and the writer had the means to prevent it.",
  }[terminal];

  const maxBefore = Math.max(...steps.map((s) => s.before), 1);

  return (
    <Panel
      title="Collapse"
      ar="الترجيح"
      subtitle="the reading procedure, audited"
      right={<Cost {...result.totalCost} />}
    >
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <Tag tone="gold">{degree.toLocaleString()} candidates</Tag>
        <span className="text-dim">→</span>
        <Tag tone={terminalTone as "cyan"}>{survivors.length} surviving</Tag>
        {targetSurvived ? (
          <Tag tone="cyan">true reading recovered</Tag>
        ) : (
          <Tag tone="rose">true reading was filtered out</Tag>
        )}
      </div>

      <div className="space-y-1.5">
        {steps.map((s) => {
          const pct = (s.after / maxBefore) * 100;
          const cut = s.before - s.after;
          return (
            <div key={s.id} className="group">
              <div className="flex items-baseline gap-2 text-[11px]">
                <span className="w-4 text-right font-mono text-dim">{s.rank}</span>
                <span className={s.skipped ? "text-dim" : "text-bright"}>{s.label.en}</span>
                <span className="ar text-dim">{s.label.ar}</span>
                <span className="ml-auto font-mono text-dim">
                  {s.skipped ? "skipped" : `${s.before} → ${s.after}`}
                  {cut > 0 && !s.skipped && (
                    <span className="ml-1.5 text-rose">−{cut}</span>
                  )}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded bg-ink-3">
                <div
                  className={`h-full transition-all duration-500 ${
                    s.skipped ? "bg-line" : "bg-gold"
                  }`}
                  style={{ width: `${s.skipped ? 100 : pct}%` }}
                />
              </div>
              {s.skipReason && (
                <p className="mt-1 pl-6 text-[10.5px] leading-snug text-dim">
                  {s.skipReason}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <Note>{terminalText}</Note>
        {survivors.length > 0 && survivors.length <= 60 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {survivors.map((s) => (
              <span
                key={s}
                className={`ar rounded px-2 py-0.5 text-[17px] ${
                  s === target ? "bg-cyan/15 text-cyan" : "bg-ink-3 text-mid"
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

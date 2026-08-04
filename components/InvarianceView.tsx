"use client";

import { useMemo } from "react";
import {
  buildInvarianceTable, sampleWords, rowSignature, channels, constants,
} from "@/lib/engine";
import { Panel, Tag, Note } from "./ui";

/**
 * Layer 14's table, computed live.
 *
 * Every cell is the result of actually running the transform over a sample of
 * words and comparing the observable's reading before and after. Nothing here
 * is copied from the specification — if the engine and the document ever
 * disagree, this page is the one telling the truth.
 */
export function InvarianceView() {
  const table = useMemo(() => buildInvarianceTable(sampleWords(300)), []);
  const groups = useMemo(() => channels(table), [table]);
  const consts = useMemo(() => constants(), []);

  return (
    <div className="space-y-6">
      <Panel
        title="The invariance table"
        ar="جدول الثبات"
        subtitle="every observable against every transform, computed"
        right={<Tag tone="gold">{table.cells.length} cells</Tag>}
      >
        <div className="scroll-x">
          <table className="w-full min-w-[560px] border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="border-b border-line px-3 py-2 text-left text-[10px] uppercase tracking-wider text-dim">
                  Observable
                </th>
                {table.transforms.map((t) => (
                  <th
                    key={t.id}
                    className="border-b border-line px-3 py-2 text-left text-[10px] uppercase tracking-wider text-dim"
                  >
                    {t.label.en}
                    <span className="ml-1 font-mono text-[9px] opacity-60">L{t.layer}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.observables.map((o) => (
                <tr key={o.id} className="group">
                  <td className="border-b border-line/60 px-3 py-2">
                    <span className="text-bright">{o.label.en}</span>
                    <span className="ml-1.5 font-mono text-[9px] text-dim">L{o.layer}</span>
                  </td>
                  {table.transforms.map((t) => {
                    const cell = table.get(o.id, t.id);
                    const inv = cell?.verdict === "invariant";
                    return (
                      <td
                        key={t.id}
                        className="border-b border-line/60 px-3 py-2"
                        title={
                          cell?.witness
                            ? `${cell.witness.before} → ${cell.witness.after}\n${cell.witness.readingBefore} → ${cell.witness.readingAfter}`
                            : undefined
                        }
                      >
                        <span className={inv ? "text-cyan" : "text-dim"}>
                          {inv ? "invariant" : "changes"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-dim">
          Hover a &ldquo;changes&rdquo; cell to see the word that witnessed it.
        </p>
      </Panel>

      <Panel
        title="Channels"
        ar="القنوات"
        subtitle="observables grouped by invariance row"
        tone="cyan"
      >
        <Note>
          Observables sharing a row see the same distinctions and are redundant
          with one another. A row of its own is a genuinely independent channel —
          and stacking two filters is worth doing exactly when their rows differ.
        </Note>
        <div className="mt-4 space-y-2">
          {groups.map((g) => (
            <div key={g.signature} className="flex items-center gap-3 rounded border border-line bg-ink px-3 py-2">
              <code className="font-mono text-[11px] text-gold">{g.signature}</code>
              <span className="text-[12px] text-mid">
                {g.observableIds.join(", ")}
              </span>
              <span className="ml-auto">
                {g.observableIds.length === 1 ? (
                  <Tag tone="cyan">independent</Tag>
                ) : (
                  <Tag>{g.observableIds.length} share this row</Tag>
                )}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-dim">
          {groups.length} distinct channels across {table.observables.length}{" "}
          observables. Registering a new observable whose row matches none of
          these would be a discovery in the engine&apos;s own terms.
        </p>
      </Panel>

      <Panel title="The constants" ar="الثوابت" subtitle="derived, not asserted">
        <div className="scroll-x">
          <table className="w-full min-w-[560px] border-collapse text-[12px]">
            <thead>
              <tr>
                {["Constant", "Value", "Layer", "How it is reached"].map((h) => (
                  <th key={h} className="border-b border-line px-3 py-2 text-left text-[10px] uppercase tracking-wider text-dim">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {consts.map((c) => (
                <tr key={c.label}>
                  <td className="border-b border-line/60 px-3 py-2 text-mid">{c.label}</td>
                  <td className="border-b border-line/60 px-3 py-2 font-mono text-gold">{c.value}</td>
                  <td className="border-b border-line/60 px-3 py-2 font-mono text-[10px] text-dim">
                    L{c.layer}
                  </td>
                  <td className="border-b border-line/60 px-3 py-2 text-[11px] text-dim">{c.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

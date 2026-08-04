"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readMany, overview, type Reading, type Nature } from "@/lib/engine/reader";
import { EXAMPLES, GROUPS, HELLO_WORLD } from "@/lib/engine/examples";
import { WordPair } from "./WordPair";

const PAGE = 6;

/**
 * Live mode — a conversation with a text.
 *
 * Each message is one operation from one layer, performed on what you typed
 * and reported with its result. It does not run out: the operation space is
 * combinatorial, and the readings are deterministic in (text, n) so scrolling
 * back never rewrites what was already said.
 */
export function LiveMode() {
  const [text, setText] = useState(HELLO_WORLD.text);
  const [draft, setDraft] = useState(HELLO_WORLD.text);
  const [count, setCount] = useState(PAGE);
  const [filter, setFilter] = useState<Nature | "all">("all");
  const [pickerOpen, setPickerOpen] = useState(false);

  const sentinel = useRef<HTMLDivElement>(null);

  const all = useMemo(() => readMany(text, 0, count), [text, count]);
  const readings = useMemo(
    () => (filter === "all" ? all : all.filter((r) => r.nature === filter)),
    [all, filter],
  );
  const info = useMemo(() => overview(text), [text]);

  const more = useCallback(() => setCount((c) => c + PAGE), []);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && more(),
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [more]);

  const submit = (t: string) => {
    const next = t.trim();
    if (!next) return;
    setText(next);
    setDraft(next);
    setCount(PAGE);
    setPickerOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* header ---------------------------------------------------------- */}
      <div className="rounded-lg border border-gold-dim/40 bg-ink-2/60 p-4">
        <WordPair text={text} skeleton={info.skeleton} size="lg" />
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {[
            ["words", String(info.words)],
            ["letters", String(info.letters)],
            ["readings", info.jointDegree.toLocaleString()],
            ["weight", info.weight.toLocaleString()],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-[10px] uppercase tracking-wider text-dim">{label}</div>
              <div className="font-mono text-[14px] text-gold">{value}</div>
            </div>
          ))}
        </div>
        {info.jointDegree > 1 && (
          <p className="mt-3 border-t border-line pt-3 text-[12px] leading-relaxed text-mid">
            Written without its dots, this is{" "}
            <span className="text-gold">{info.jointDegree.toLocaleString()}</span>{" "}
            different {info.jointDegree === 1 ? "text" : "texts"} at once —{" "}
            {info.bits.toFixed(1)} bits the page declines to store. Everything
            below is the engine recovering them.
          </p>
        )}
      </div>

      {/* filter ----------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scroll-x">
        {([
          ["all", "Everything"],
          ["visible", "Visible"],
          ["hidden", "Hidden"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] transition ${
              filter === id
                ? "border-gold-dim bg-gold/10 text-gold"
                : "border-line text-mid active:bg-ink-3"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="shrink-0 pl-1 text-[11px] text-dim">
          {filter === "hidden"
            ? "facts the page does not show"
            : filter === "visible"
              ? "anything you could confirm by looking"
              : `${readings.length} so far`}
        </span>
      </div>

      {/* stream ----------------------------------------------------------- */}
      <div className="flex flex-col gap-3 pb-4">
        {readings.map((r) => (
          <ReadingCard key={`${r.n}-${r.layer}-${r.op}`} r={r} />
        ))}
        <div ref={sentinel} className="h-px" />
        <button
          onClick={more}
          className="rounded-lg border border-line py-3 text-[12px] text-mid transition active:bg-ink-3"
        >
          it has more to say
        </button>
      </div>

      {/* composer --------------------------------------------------------- */}
      <div className="sticky bottom-0 -mx-4 border-t border-line bg-ink/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        {pickerOpen && (
          <div className="mb-3 max-h-64 overflow-y-auto rounded-lg border border-line bg-ink-2 p-2">
            {GROUPS.map((g) => (
              <div key={g.id} className="mb-2 last:mb-0">
                <div className="px-1 py-1 text-[10px] uppercase tracking-wider text-dim">
                  {g.label}
                </div>
                {EXAMPLES.filter((e) => e.group === g.id).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => submit(e.text)}
                    className="block w-full rounded px-2 py-2 text-left transition active:bg-ink-3"
                  >
                    <span className="ar text-[18px] text-bright">{e.text}</span>
                    <span className="ml-2 text-[11px] text-dim">{e.gloss}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-dim">
                      {e.note}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            onClick={() => setPickerOpen((o) => !o)}
            aria-label="examples"
            className="h-11 w-11 shrink-0 rounded-lg border border-line text-[18px] text-mid transition active:bg-ink-3"
          >
            {pickerOpen ? "×" : "☰"}
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(draft);
              }
            }}
            dir="rtl"
            rows={1}
            spellCheck={false}
            placeholder="اكتب هنا"
            className="ar min-h-11 flex-1 resize-none rounded-lg border border-line bg-ink px-3 py-2 text-2xl leading-snug text-bright outline-none transition focus:border-gold-dim"
          />
          <button
            onClick={() => submit(draft)}
            className="h-11 shrink-0 rounded-lg border border-gold-dim bg-gold/10 px-4 text-[12px] text-gold transition active:bg-gold/20"
          >
            read
          </button>
        </div>
      </div>
    </div>
  );
}

function ReadingCard({ r }: { r: Reading }) {
  const hidden = r.nature === "hidden";
  return (
    <article
      className={`fade-up rounded-lg border bg-ink-2/50 p-3.5 sm:p-4 ${
        hidden ? "border-violet/25" : "border-line"
      }`}
    >
      <header className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-mono text-[10px] text-dim">
          {String(r.layer).padStart(2, "0")}
        </span>
        <span className="text-[11px] text-mid">{r.layerName.en}</span>
        <span className="ar text-[11px] text-dim">{r.layerName.ar}</span>
        <span
          className={`ml-auto rounded-full border px-1.5 py-0.5 font-mono text-[9px] ${
            hidden ? "border-violet/40 text-violet" : "border-line text-dim"
          }`}
        >
          {hidden ? "hidden" : "visible"}
        </span>
      </header>

      <h3 className="text-[14px] font-medium leading-snug text-bright">{r.title}</h3>

      {(r.arabic || r.rasm) && (
        <div className="my-2.5 flex flex-wrap items-baseline gap-3">
          {r.arabic && <span className="ar text-3xl leading-tight text-bright">{r.arabic}</span>}
          {r.rasm && <span className="rasm text-3xl leading-tight">{r.rasm}</span>}
        </div>
      )}

      <p className="mt-1.5 text-[13px] leading-relaxed text-mid">{r.body}</p>

      {r.chips && r.chips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {r.chips.map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              className={`rounded bg-ink-3 px-1.5 py-0.5 text-[12px] text-mid ${
                /[؀-ۿ]/.test(ch) ? "ar text-[15px]" : "font-mono text-[11px]"
              }`}
            >
              {ch}
            </span>
          ))}
        </div>
      )}

      {r.stats && r.stats.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2">
          {r.stats.map((s, i) => (
            <div key={`${s.label}-${i}`}>
              <div className="text-[9px] uppercase tracking-wider text-dim">{s.label}</div>
              <div className={`font-mono text-[13px] text-gold ${/[؀-ۿ]/.test(s.value) ? "ar" : ""}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <footer className="mt-3 flex items-center gap-2 border-t border-line pt-2">
        <span className="font-mono text-[9px] text-dim">
          {r.cost.marks}m · {r.cost.counts}c · {r.cost.held}h
        </span>
        <span className="ml-auto font-mono text-[9px] text-dim">{r.op}</span>
      </footer>
    </article>
  );
}

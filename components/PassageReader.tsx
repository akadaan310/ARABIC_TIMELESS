"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Passage, PassageWord } from "@/lib/engine/passage";
import { OPERATIONS, OP_GROUPS, OP_BY_ID, type OpResult, type Operation } from "@/lib/engine/operations";
import { CORPUS, type CorpusEntry } from "@/lib/engine/corpus";

/**
 * The passage reader.
 *
 * The dotless kernel works on letters. This works on compositions: pick or
 * paste a passage, resolve it once against the lexicon, then apply operations
 * that hand back the same passage seen through one transformation — still
 * Arabic, and reporting what it preserved.
 */
export function PassageReader({ initial }: { initial?: string }) {
  const [entry, setEntry] = useState<CorpusEntry | null>(CORPUS[1]);
  const [draft, setDraft] = useState(initial ?? CORPUS[1].text);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [lexicon, setLexicon] = useState<{ roots: number; lemmas: number; forms: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [opId, setOpId] = useState<string | null>(null);
  const [option, setOption] = useState<string | undefined>();
  const [word, setWord] = useState<PassageWord | null>(null);
  const [picker, setPicker] = useState(false);

  const load = useCallback(async (text: string, title?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/passage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      setPassage(data.passage);
      setLexicon(data.lexicon);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
      setPassage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(draft, entry?.title); /* eslint-disable-next-line */ }, []);

  const op: Operation | null = opId ? OP_BY_ID[opId] ?? null : null;
  const result: OpResult | null = useMemo(
    () => (op && passage ? op.apply(passage, option) : null),
    [op, passage, option],
  );

  const choose = (e: CorpusEntry) => {
    setEntry(e);
    setDraft(e.text);
    setOpId(null);
    setWord(null);
    setPicker(false);
    load(e.text, e.title);
  };

  return (
    <div className="space-y-4">
      {/* source ---------------------------------------------------------- */}
      <div className="rounded-lg border border-line bg-ink-2/50">
        <button
          onClick={() => setPicker((v) => !v)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] text-bright">
              {entry?.title ?? "Pasted passage"}
            </span>
            <span className="block text-[11px] text-dim">
              {entry?.source ?? "your own text"}
              {passage && ` · ${passage.stats.words} words · ${passage.stats.roots} roots`}
            </span>
          </span>
          <span className="shrink-0 text-[11px] text-cyan">{picker ? "close" : "change"}</span>
        </button>

        {picker && (
          <div className="fade-up border-t border-line p-3">
            <div className="mb-3 grid gap-1.5">
              {CORPUS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => choose(c)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition active:bg-ink-3 ${
                    entry?.id === c.id ? "border-gold-dim bg-gold/5" : "border-line"
                  }`}
                >
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="ar text-[17px] text-bright">{c.titleAr}</span>
                    <span className="text-[12px] text-mid">{c.title}</span>
                    <span className="text-[10px] text-dim">{c.source}</span>
                  </span>
                  <span className="mt-1 block text-[11px] leading-snug text-dim">{c.note}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-line pt-3">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-dim">
                or paste your own
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                dir="rtl"
                rows={3}
                spellCheck={false}
                placeholder="الصق نصا عربيا هنا"
                className="ar w-full resize-y rounded-lg border border-line bg-ink px-3 py-2 text-xl leading-relaxed text-bright outline-none focus:border-gold-dim"
              />
              <button
                onClick={() => { setEntry(null); setOpId(null); setWord(null); setPicker(false); load(draft); }}
                className="mt-2 w-full rounded-lg border border-gold-dim bg-gold/10 py-2.5 text-[12px] text-gold active:bg-gold/20"
              >
                read this
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && <Skeleton />}
      {error && (
        <p className="rounded-lg border border-rose/40 bg-rose/5 p-4 text-[12px] text-rose">
          {error}
        </p>
      )}

      {passage && !loading && (
        <>
          <Stats passage={passage} lexicon={lexicon} />

          <PassageBody
            passage={passage}
            result={result}
            onWord={setWord}
          />

          <OperationPalette
            current={opId}
            option={option}
            onPick={(id) => {
              setOpId(id === opId ? null : id);
              setOption(OP_BY_ID[id]?.options?.values[0]?.id);
            }}
            onOption={setOption}
          />

          {op && result && <ResultCard op={op} result={result} />}
        </>
      )}

      {word && <WordSheet word={word} onClose={() => setWord(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg border border-line bg-ink-2/40" />
      ))}
    </div>
  );
}

function Stats({ passage, lexicon }: {
  passage: Passage;
  lexicon: { roots: number; lemmas: number; forms: number } | null;
}) {
  const s = passage.stats;
  const pct = s.words ? Math.round((s.resolved / s.words) * 100) : 0;
  return (
    <div className="rounded-lg border border-line bg-ink-2/50 p-4">
      <div className="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-6">
        {[
          ["words", String(s.words)],
          ["roots", String(s.roots)],
          ["openness", `${s.bits.toFixed(1)} bits`],
          ["weight", s.weight.toLocaleString()],
          ["determined", `${s.determined}/${s.words}`],
          ["resolved", `${pct}%`],
        ].map(([l, v]) => (
          <div key={l}>
            <div className="text-[9px] uppercase tracking-wider text-dim">{l}</div>
            <div className="font-mono text-[13px] text-gold">{v}</div>
          </div>
        ))}
      </div>
      {lexicon && (
        <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-dim">
          Resolved against {lexicon.roots.toLocaleString()} roots and{" "}
          {lexicon.forms.toLocaleString()} written forms.
          {pct < 100 &&
            ` The ${s.words - s.resolved} unresolved ${s.words - s.resolved === 1 ? "word is" : "words are"} outside the corpus — reported, not guessed.`}
        </p>
      )}
    </div>
  );
}

function PassageBody({ passage, result, onWord }: {
  passage: Passage;
  result: OpResult | null;
  onWord: (w: PassageWord) => void;
}) {
  return (
    <div className="rounded-lg border border-gold-dim/30 bg-ink-2/50 p-4">
      <div dir="rtl" className="flex flex-wrap gap-x-2.5 gap-y-3">
        {passage.words.map((w) => {
          const change = result?.changes[w.index];
          const showing = change?.changed ? change.to : w.norm;
          const isArabicOut = result ? OP_BY_ID[result.id]?.readable !== false : true;
          return (
            <button
              key={w.index}
              onClick={() => onWord(w)}
              className="group flex flex-col items-center gap-0.5 rounded px-1 py-0.5 transition active:bg-ink-3"
            >
              <span
                className={`leading-tight ${
                  isArabicOut ? "ar text-[22px] sm:text-[26px]" : "font-mono text-[13px]"
                } ${
                  change?.changed ? "text-cyan" : change?.unresolved ? "text-dim" : "text-bright"
                }`}
              >
                {showing}
              </span>
              {result && change?.changed && (
                <span className="ar text-[12px] leading-none text-dim line-through">
                  {w.norm}
                </span>
              )}
              {!result && w.lex?.rootDisplay && (
                <span className="ar text-[11px] leading-none text-dim">
                  {w.lex.rootDisplay}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OperationPalette({ current, option, onPick, onOption }: {
  current: string | null;
  option?: string;
  onPick: (id: string) => void;
  onOption: (v: string) => void;
}) {
  const op = current ? OP_BY_ID[current] : null;
  return (
    <div className="space-y-3">
      {OP_GROUPS.map((g) => (
        <div key={g.kind}>
          <div className="mb-1.5 flex flex-wrap items-baseline gap-2 px-0.5">
            <span className="text-[10px] uppercase tracking-widest text-dim">{g.label}</span>
            <span className="ar text-[11px] text-dim">{g.ar}</span>
            <span className="text-[10.5px] text-dim">— {g.note}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {OPERATIONS.filter((o) => o.kind === g.kind).map((o) => (
              <button
                key={o.id}
                onClick={() => onPick(o.id)}
                className={`min-h-9 rounded-lg border px-2.5 py-1.5 text-left transition active:bg-ink-3 ${
                  current === o.id
                    ? "border-cyan/60 bg-cyan/10"
                    : "border-line hover:border-cyan/30"
                }`}
              >
                <span className={`block text-[12px] ${current === o.id ? "text-cyan" : "text-mid"}`}>
                  {o.name.en}
                </span>
                <span className="ar block text-[10.5px] leading-tight text-dim">{o.name.ar}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {op?.options && (
        <div className="rounded-lg border border-cyan/30 bg-ink-2/50 p-3">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-dim">
            {op.options.label}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {op.options.values.map((v) => (
              <button
                key={v.id}
                onClick={() => onOption(v.id)}
                className={`min-h-8 rounded border px-2 py-1 text-[11px] transition ${
                  option === v.id
                    ? "border-cyan/60 bg-cyan/10 text-cyan"
                    : "border-line text-mid active:bg-ink-3"
                }`}
              >
                <span className={/[؀-ۿ]/.test(v.label) ? "ar text-[13px]" : ""}>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ op, result }: { op: Operation; result: OpResult }) {
  return (
    <div className="fade-up space-y-3 rounded-lg border border-cyan/30 bg-ink-2/60 p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-[13px] font-medium text-bright">{op.name.en}</span>
        <span className="ar text-[13px] text-dim">{op.name.ar}</span>
        <span className="ml-auto font-mono text-[10px] text-dim">
          L{op.layer} · {result.coverage.acted}/{result.coverage.total} words
        </span>
      </div>

      <p className="text-[12px] leading-relaxed text-mid">{op.note}</p>

      {op.readable && result.text && (
        <div dir="rtl" className="rounded border border-line bg-ink p-3">
          <span className="ar text-[22px] leading-relaxed text-cyan">{result.text}</span>
        </div>
      )}

      <p className="border-l-2 border-cyan/40 pl-3 text-[12.5px] leading-relaxed text-bright">
        {result.summary}
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded border border-line bg-ink p-2.5">
          <div className="mb-1 text-[9px] uppercase tracking-wider text-dim">preserved</div>
          <ul className="space-y-0.5">
            {result.preserved.map((x) => (
              <li key={x} className="text-[11.5px] text-cyan">{x}</li>
            ))}
          </ul>
        </div>
        {result.lost.length > 0 && (
          <div className="rounded border border-line bg-ink p-2.5">
            <div className="mb-1 text-[9px] uppercase tracking-wider text-dim">lost</div>
            <ul className="space-y-0.5">
              {result.lost.map((x) => (
                <li key={x} className="text-[11.5px] text-rose">{x}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function WordSheet({ word, onClose }: { word: PassageWord; onClose: () => void }) {
  const lx = word.lex;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-ink/70 backdrop-blur-sm sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        className="fade-up max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border-t border-gold-dim/40 bg-ink-2 p-5 sm:max-w-lg sm:rounded-2xl sm:border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="ar text-4xl leading-tight text-bright">{word.norm}</div>
            <div className="rasm mt-1 text-3xl leading-tight">{word.skeleton}</div>
          </div>
          <button onClick={onClose} className="shrink-0 rounded p-2 text-dim active:bg-ink-3">
            ×
          </button>
        </div>

        {lx?.gloss && <p className="mb-4 text-[14px] text-bright">{lx.gloss}</p>}

        <div className="mb-4 grid grid-cols-2 gap-3">
          {[
            ["readings", word.degree.toLocaleString()],
            ["open slots", String(word.arity)],
            ["weight", word.weight.toLocaleString()],
            ["profile", `(${word.profile.join(", ")})`],
          ].map(([l, v]) => (
            <div key={l}>
              <div className="text-[9px] uppercase tracking-wider text-dim">{l}</div>
              <div className="font-mono text-[13px] text-gold">{v}</div>
            </div>
          ))}
        </div>

        {lx?.rootDisplay && (
          <Section title="Root" ar="الجذر">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="ar text-2xl text-gold">{lx.rootDisplay}</span>
              {lx.rootCount && (
                <span className="font-mono text-[10px] text-dim">
                  {lx.rootCount.toLocaleString()} in the corpus
                </span>
              )}
            </div>
            {lx.rootGlosses && lx.rootGlosses.length > 0 && (
              <p className="mt-1.5 text-[12px] leading-relaxed text-mid">
                {lx.rootGlosses.join(" · ")}
              </p>
            )}
          </Section>
        )}

        {word.taqlib && word.taqlib.length > 0 && (
          <Section title="Permutations that are also roots" ar="التقاليب">
            <div className="space-y-1.5">
              {word.taqlib.map((t) => (
                <div key={t.root} className="flex flex-wrap items-baseline gap-2">
                  <span className="ar text-lg text-bright">{t.root}</span>
                  <span className="text-[11px] text-dim">{t.glosses.join(" · ")}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {word.sameSkeleton && word.sameSkeleton.length > 0 && (
          <Section title="The page cannot tell these apart" ar="الجناس الخطي">
            <div className="flex flex-wrap gap-1.5">
              {word.sameSkeleton.map((s) => (
                <span key={s} className="ar rounded bg-ink-3 px-2 py-0.5 text-[16px] text-mid">
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {word.sameWeight && word.sameWeight.length > 0 && (
          <Section title={`Also weighing ${word.weight.toLocaleString()}`} ar="التعادل">
            <div className="flex flex-wrap gap-1.5">
              {word.sameWeight.slice(0, 8).map((s) => (
                <span key={s} className="ar rounded bg-ink-3 px-2 py-0.5 text-[16px] text-mid">
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {(lx?.prefix || lx?.suffix) && (
          <p className="mt-3 text-[11px] text-dim">
            Found by stripping{" "}
            {[lx.prefix && `prefix ${lx.prefix}`, lx.suffix && `suffix ${lx.suffix}`]
              .filter(Boolean)
              .join(" and ")}
            .
          </p>
        )}
      </div>
    </div>
  );
}

function Section({ title, ar, children }: {
  title: string; ar: string; children: React.ReactNode;
}) {
  return (
    <div className="mb-4 border-t border-line pt-3">
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-[10px] uppercase tracking-wider text-dim">{title}</span>
        <span className="ar text-[11px] text-dim">{ar}</span>
      </div>
      {children}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildPiece, literalPiece, metricsOf, statsOfComposition, renderComposition,
  suggest, plausible, CONSTRAINTS, CONSTRAINT_BY_ID,
  type Piece, type RootOption, type ConstraintId,
} from "@/lib/engine/compose";
import { PATTERNS } from "@/lib/engine/patterns";
import { UNMOVED } from "@/lib/engine/alphabet";

/**
 * Composing by function application.
 *
 * Pick a root, pick a pattern, and a word comes back. A line assembled this
 * way is a sequence of calls rather than a sequence of recollections — and the
 * constraint modes let you write toward a number, or inside the six letters
 * that carry no ambiguity at all.
 */
export function Composer() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [roots, setRoots] = useState<RootOption[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeRoot, setActiveRoot] = useState<RootOption | null>(null);
  const [constraint, setConstraint] = useState<ConstraintId>("free");
  const [target, setTarget] = useState<number>(1000);
  const [literal, setLiteral] = useState("");

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/roots?q=${encodeURIComponent(q)}&limit=48`);
      const data = await res.json();
      setRoots(data.roots ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), query ? 220 : 0);
    return () => clearTimeout(t);
  }, [query, search]);

  const stats = useMemo(() => statsOfComposition(pieces), [pieces]);
  const con = CONSTRAINT_BY_ID[constraint];
  const status = useMemo(
    () => con.status(pieces, { target }),
    [con, pieces, target],
  );

  const oneRootLock = constraint === "oneRoot" && pieces.length > 0 ? pieces[0].root : null;

  const suggestions = useMemo(() => {
    if (constraint === "free") return [];
    const pool = oneRootLock
      ? roots.filter((r) => r.root === oneRootLock)
      : roots.slice(0, 60);
    return suggest(pool, constraint, { pieces, target }, 18);
  }, [roots, constraint, pieces, target, oneRootLock]);

  const add = (p: Piece | null) => p && setPieces((xs) => [...xs, p]);
  const removeAt = (i: number) => setPieces((xs) => xs.filter((_, j) => j !== i));

  const patternsFor = (r: RootOption) =>
    PATTERNS.map((pat) => ({ pat, piece: buildPiece(r, pat.id) }))
      .filter((x) => x.piece && plausible(x.piece.word))
      .filter((x) => con.admits(x.piece!.word, { pieces, target, root: oneRootLock ?? undefined }));

  return (
    <div className="space-y-4">
      {/* the line ------------------------------------------------------- */}
      <div className="rounded-lg border border-gold-dim/40 bg-ink-2/60 p-4">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-[10px] uppercase tracking-wider text-dim">your line</span>
          <span
            className={`ml-auto rounded-full border px-2 py-0.5 font-mono text-[10px] ${
              status.ok ? "border-cyan/40 text-cyan" : "border-gold-dim/60 text-gold"
            }`}
          >
            {status.label}
          </span>
        </div>

        {pieces.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-dim">
            Pick a root below, then a pattern. The word is built, not recalled.
          </p>
        ) : (
          <>
            <div dir="rtl" className="flex flex-wrap gap-x-3 gap-y-2">
              {pieces.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => removeAt(i)}
                  title="remove"
                  className="group flex flex-col items-center rounded px-1 active:bg-ink-3"
                >
                  <span className="ar text-[26px] leading-tight text-bright group-hover:text-rose">
                    {p.word}
                  </span>
                  <span className="ar text-[11px] leading-none text-dim">
                    {p.literal ? "—" : `${p.rootDisplay} · ${p.patternName}`}
                  </span>
                </button>
              ))}
            </div>
            <div dir="rtl" className="mt-3 border-t border-line pt-3">
              <span className="rasm text-[22px] leading-tight">{stats.skeleton}</span>
            </div>
          </>
        )}

        <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 border-t border-line pt-3 sm:grid-cols-6">
          {[
            ["words", String(stats.words)],
            ["roots", String(stats.roots)],
            ["weight", stats.weight.toLocaleString()],
            ["openness", `${stats.bits.toFixed(1)} b`],
            ["determined", `${stats.determined}/${stats.words}`],
            ["unmoved", stats.allUnmoved && stats.words > 0 ? "yes" : "no"],
          ].map(([l, v]) => (
            <div key={l}>
              <div className="text-[9px] uppercase tracking-wider text-dim">{l}</div>
              <div className="font-mono text-[13px] text-gold">{v}</div>
            </div>
          ))}
        </div>

        {pieces.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
            <button
              onClick={() => navigator.clipboard?.writeText(renderComposition(pieces))}
              className="rounded border border-line px-2.5 py-1.5 text-[11px] text-mid active:bg-ink-3"
            >
              copy
            </button>
            <a
              href={`/read?text=${encodeURIComponent(renderComposition(pieces))}`}
              className="rounded border border-cyan/40 px-2.5 py-1.5 text-[11px] text-cyan active:bg-cyan/10"
            >
              read it through the operations →
            </a>
            <button
              onClick={() => setPieces([])}
              className="ml-auto rounded border border-line px-2.5 py-1.5 text-[11px] text-dim active:bg-ink-3"
            >
              clear
            </button>
          </div>
        )}
      </div>

      {/* constraint ------------------------------------------------------ */}
      <div className="rounded-lg border border-line bg-ink-2/40 p-3">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-dim">compose under</div>
        <div className="flex flex-wrap gap-1.5">
          {CONSTRAINTS.map((c) => (
            <button
              key={c.id}
              onClick={() => setConstraint(c.id)}
              className={`min-h-9 rounded-lg border px-2.5 py-1.5 text-left transition active:bg-ink-3 ${
                constraint === c.id ? "border-gold-dim bg-gold/10" : "border-line"
              }`}
            >
              <span className={`block text-[12px] ${constraint === c.id ? "text-gold" : "text-mid"}`}>
                {c.name.en}
              </span>
              <span className="ar block text-[10.5px] leading-tight text-dim">{c.name.ar}</span>
            </button>
          ))}
        </div>
        <p className="mt-2.5 border-l-2 border-line pl-3 text-[11.5px] leading-relaxed text-mid">
          {con.note}
        </p>

        {constraint === "weight" && (
          <div className="mt-3 flex items-center gap-3">
            <label className="text-[11px] text-dim">target</label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value) || 0)}
              className="w-28 rounded border border-line bg-ink px-2 py-1.5 font-mono text-[13px] text-gold outline-none focus:border-gold-dim"
            />
            <span className="text-[11px] text-dim">
              {(target - stats.weight).toLocaleString()} to go
            </span>
          </div>
        )}

        {constraint === "unmoved" && (
          <p className="ar mt-2 text-center text-2xl text-cyan">{UNMOVED.join(" ")}</p>
        )}
      </div>

      {/* suggestions ----------------------------------------------------- */}
      {suggestions.length > 0 && (
        <div className="rounded-lg border border-cyan/30 bg-ink-2/50 p-3">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-dim">
            words that satisfy the constraint
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button
                key={`${s.root.root}-${s.pattern.id}-${i}`}
                onClick={() => add(buildPiece(s.root, s.pattern.id))}
                className="rounded-lg border border-line bg-ink px-2.5 py-1.5 text-center transition active:bg-ink-3 hover:border-cyan/50"
              >
                <span className="ar block text-[19px] leading-tight text-bright">{s.word}</span>
                <span className="block font-mono text-[9.5px] leading-tight text-dim">
                  {s.root.display} · {s.weight.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* roots ------------------------------------------------------------ */}
      <div className="rounded-lg border border-line bg-ink-2/40 p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-dim">roots</span>
          {oneRootLock && (
            <span className="font-mono text-[10px] text-gold">locked to {oneRootLock}</span>
          )}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search by meaning or by root — book, light, open, ملك …"
          className="mb-3 w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-[13px] text-bright outline-none focus:border-gold-dim"
        />

        {loading ? (
          <p className="py-4 text-center text-[11px] text-dim">searching …</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {roots.map((r) => (
              <button
                key={r.root}
                onClick={() => setActiveRoot(activeRoot?.root === r.root ? null : r)}
                title={r.glosses.join(" · ")}
                className={`min-h-9 rounded-lg border px-2.5 py-1.5 text-center transition active:bg-ink-3 ${
                  activeRoot?.root === r.root
                    ? "border-gold bg-gold/10"
                    : "border-line hover:border-gold-dim/50"
                }`}
              >
                <span className="ar block text-[18px] leading-tight text-bright">{r.display}</span>
                <span className="block max-w-[9rem] truncate text-[9.5px] leading-tight text-dim">
                  {r.glosses[0] ?? ""}
                </span>
              </button>
            ))}
            {roots.length === 0 && (
              <p className="py-3 text-[11px] text-dim">
                Nothing matches that. The lexicon is classical — try an older word.
              </p>
            )}
          </div>
        )}
      </div>

      {/* patterns for the chosen root ------------------------------------- */}
      {activeRoot && (
        <div className="fade-up rounded-lg border border-gold-dim/40 bg-ink-2/60 p-3">
          <div className="mb-2 flex flex-wrap items-baseline gap-2">
            <span className="ar text-2xl text-gold">{activeRoot.display}</span>
            <span className="text-[11px] text-mid">{activeRoot.glosses.join(" · ")}</span>
            <span className="ml-auto font-mono text-[10px] text-dim">
              {activeRoot.count.toLocaleString()} in the corpus
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {patternsFor(activeRoot).map(({ pat, piece }) => {
              const m = metricsOf(piece!.word);
              return (
                <button
                  key={pat.id}
                  onClick={() => add(piece)}
                  className="rounded-lg border border-line bg-ink px-2 py-2 text-center transition active:bg-ink-3 hover:border-gold-dim/60"
                >
                  <span className="ar block text-[20px] leading-tight text-bright">
                    {piece!.word}
                  </span>
                  <span className="ar block text-[11px] leading-tight text-gold">{pat.name}</span>
                  <span className="block truncate text-[9.5px] leading-tight text-dim">
                    {pat.meaning}
                  </span>
                  <span className="block font-mono text-[9px] text-dim">
                    {m.weight.toLocaleString()} · {m.degree === 1 ? "determined" : `${m.degree} readings`}
                  </span>
                </button>
              );
            })}
          </div>
          {patternsFor(activeRoot).length === 0 && (
            <p className="py-3 text-center text-[11px] text-dim">
              No pattern on this root satisfies the constraint.
            </p>
          )}
        </div>
      )}

      {/* literal ---------------------------------------------------------- */}
      <div className="rounded-lg border border-line bg-ink-2/40 p-3">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-dim">
          or write a word directly
        </div>
        <div className="flex gap-2">
          <input
            value={literal}
            onChange={(e) => setLiteral(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && literal.trim()) {
                add(literalPiece(literal.trim()));
                setLiteral("");
              }
            }}
            dir="rtl"
            placeholder="حرف أو كلمة"
            className="ar min-h-11 flex-1 rounded-lg border border-line bg-ink px-3 py-2 text-xl text-bright outline-none focus:border-gold-dim"
          />
          <button
            onClick={() => { if (literal.trim()) { add(literalPiece(literal.trim())); setLiteral(""); } }}
            className="h-11 shrink-0 rounded-lg border border-line px-3 text-[12px] text-mid active:bg-ink-3"
          >
            add
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-dim">
          Particles and pronouns are not built from roots, so they go in by hand.
          Everything else the composer can construct.
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
          Search matches how words were actually used, not a dictionary
          definition — so ك–ت–ب answers to <span className="text-mid">book</span>
          rather than to <span className="text-mid">write</span>.
        </p>
      </div>
    </div>
  );
}

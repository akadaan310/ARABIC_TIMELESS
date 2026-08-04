/**
 * The single-file build: Read and Compose, running entirely in the browser.
 *
 * The hosted app resolves passages on a server because the lexicon is large.
 * Here there is no server, so the trimmed lexicon is inlined and resolution
 * happens on the device. Everything else is the same engine.
 */

import { parseWord, degree, arity, profileOf } from "../lib/engine/text";
import { weightOf } from "../lib/engine/layers/band3";
import { UNMOVED, CLASS_OF } from "../lib/engine/alphabet";
import {
  buildPassage, statsOf, normalizeForLookup,
  type Passage, type PassageWord,
} from "../lib/engine/passage";
import {
  OPERATIONS, OP_GROUPS, OP_BY_ID, type OpResult, type Operation,
} from "../lib/engine/operations";
import { CORPUS, type CorpusEntry } from "../lib/engine/corpus";
import { PATTERNS } from "../lib/engine/patterns";
import {
  buildPiece, literalPiece, metricsOf, statsOfComposition, renderComposition,
  suggest, plausible, CONSTRAINTS, CONSTRAINT_BY_ID,
  type Piece, type RootOption, type ConstraintId,
} from "../lib/engine/compose";

// ---------------------------------------------------------------------------
// Data — injected at build time
// ---------------------------------------------------------------------------

interface RootRow { d: string; n: number; g: string[]; s: string }
type SurfaceRow = [root: string, lemma: string, gloss: string];

const DATA = (window as unknown as {
  __ARABIC_DATA__: {
    roots: Record<string, RootRow>;
    surface: Record<string, SurfaceRow>;
  };
}).__ARABIC_DATA__;

const PROCLITICS = ["وبال","فبال","وكال","بال","كال","فال","وال","لل","ال","و","ف","ب","ك","ل","س"];
const ENCLITICS = ["هما","كما","هن","كن","هم","كم","نا","ها","ه","ك","ي"];

function lookup(word: string): { row: SurfaceRow; prefix: string; suffix: string } | null {
  const direct = DATA.surface[word];
  if (direct) return { row: direct, prefix: "", suffix: "" };
  for (const p of PROCLITICS) {
    if (!word.startsWith(p) || word.length - p.length < 2) continue;
    const rest = word.slice(p.length);
    if (DATA.surface[rest]) return { row: DATA.surface[rest], prefix: p, suffix: "" };
    for (const s of ENCLITICS) {
      if (!rest.endsWith(s) || rest.length - s.length < 2) continue;
      const core = rest.slice(0, -s.length);
      if (DATA.surface[core]) return { row: DATA.surface[core], prefix: p, suffix: s };
    }
  }
  for (const s of ENCLITICS) {
    if (!word.endsWith(s) || word.length - s.length < 2) continue;
    const core = word.slice(0, -s.length);
    if (DATA.surface[core]) return { row: DATA.surface[core], prefix: "", suffix: s };
  }
  return null;
}

/** Skeleton and weight pools, built once and only when first needed. */
let POOLS: { skel: Map<string, string[]>; wt: Map<number, string[]> } | null = null;
function pools() {
  if (POOLS) return POOLS;
  const skel = new Map<string, string[]>();
  const wt = new Map<number, string[]>();
  for (const form of Object.keys(DATA.surface)) {
    if (form.length < 2 || form.length > 9) continue;
    const w = parseWord(form);
    if (!w.letters.length) continue;
    const a = skel.get(w.skeleton);
    if (a) { if (a.length < 20) a.push(form); } else skel.set(w.skeleton, [form]);
    const v = weightOf(w.letters);
    const b = wt.get(v);
    if (b) { if (b.length < 20) b.push(form); } else wt.set(v, [form]);
  }
  POOLS = { skel, wt };
  return POOLS;
}

function taqlibOf(root: string) {
  const l = [...root];
  if (l.length !== 3) return [];
  const out: { root: string; glosses: string[] }[] = [];
  for (const p of [[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]) {
    const cand = p.map((i) => l[i]).join("");
    const e = DATA.roots[cand];
    if (e) out.push({ root: e.d, glosses: e.g.slice(0, 3) });
  }
  return out;
}

function resolve(raw: string, title?: string): Passage {
  const p = buildPassage(raw, title);
  const { skel, wt } = pools();
  for (const w of p.words) {
    const hit = lookup(w.norm);
    if (hit) {
      const [root, lemma, gloss] = hit.row;
      const re = root ? DATA.roots[root] : undefined;
      w.lex = {
        root: root || undefined,
        rootDisplay: re?.d ?? (root || undefined),
        rootGlosses: re?.g,
        rootCount: re?.n,
        lemma: lemma || undefined,
        lemmaDisplay: lemma || undefined,
        gloss: gloss || undefined,
        prefix: hit.prefix || undefined,
        suffix: hit.suffix || undefined,
      };
      if (root) w.taqlib = taqlibOf(root);
    }
    w.sameSkeleton = (skel.get(w.skeleton) ?? []).filter((f) => f !== w.norm).slice(0, 12);
    w.sameWeight = (wt.get(w.weight) ?? []).filter((f) => f !== w.norm).slice(0, 12);
  }
  p.stats = statsOf(p.words, p.sentences);
  return p;
}

function searchRoots(q: string, limit = 48): RootOption[] {
  const query = q.trim().toLowerCase();
  const rows: { k: string; e: RootRow }[] = [];
  for (const [k, e] of Object.entries(DATA.roots)) {
    if (!query || k.includes(query) || e.d.includes(query) || e.s.includes(query)) {
      rows.push({ k, e });
      if (!query && rows.length > 400) break;
    }
  }
  return rows
    .sort((a, b) => b.e.n - a.e.n)
    .slice(0, limit)
    .map(({ k, e }) => ({ root: k, display: e.d, glosses: e.g.slice(0, 4), count: e.n }));
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

type Child = Node | string | null | undefined | false;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  ...kids: Child[]
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") n.className = String(v);
    else if (k === "html") n.innerHTML = String(v);
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v as EventListener);
    else n.setAttribute(k, String(v));
  }
  for (const c of kids.flat()) {
    if (c === null || c === undefined || c === false) continue;
    n.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return n;
}

const $ = (sel: string) => document.querySelector(sel) as HTMLElement;
const clear = (n: HTMLElement) => { while (n.firstChild) n.removeChild(n.firstChild); };
const isAr = (s: string) => /[؀-ۿ]/.test(s);

function stat(label: string, value: string) {
  return el("div", { class: "stat" },
    el("span", { class: "stat-l" }, label),
    el("span", { class: "stat-v" }, value),
  );
}

function sheet(title: string, body: HTMLElement) {
  const scrim = el("div", { class: "scrim", onclick: (e: Event) => {
    if (e.target === scrim) scrim.remove();
  } });
  const panel = el("div", { class: "sheet" },
    el("div", { class: "sheet-head" },
      el("span", {}, title),
      el("button", { class: "x", onclick: () => scrim.remove(), "aria-label": "close" }, "×"),
    ),
    body,
  );
  scrim.append(panel);
  document.body.append(scrim);
  return scrim;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Opens on a real poem rather than a constructed demo. */
const OPENING = CORPUS.find((c) => c.id === "tarafa") ?? CORPUS[0];

const read = {
  entry: OPENING as CorpusEntry | null,
  text: OPENING.text,
  passage: null as Passage | null,
  opId: null as string | null,
  option: undefined as string | undefined,
};

function loadPassage(text: string, entry: CorpusEntry | null) {
  read.entry = entry;
  read.text = text;
  read.opId = null;
  read.option = undefined;
  read.passage = resolve(text, entry?.title);
  renderRead();
}

function renderRead() {
  const root = $("#read");
  clear(root);
  const p = read.passage!;
  const op: Operation | null = read.opId ? OP_BY_ID[read.opId] : null;
  const result: OpResult | null = op ? op.apply(p, read.option) : null;

  // source
  root.append(
    el("button", { class: "card source", onclick: openPicker },
      el("div", { class: "src-t" }, read.entry?.title ?? "Your passage"),
      el("div", { class: "src-s" },
        `${read.entry?.source ?? "pasted"} · ${p.stats.words} words · ${p.stats.roots} roots`),
      el("span", { class: "chg" }, "change"),
    ),
  );

  // stats
  const pct = p.stats.words ? Math.round((p.stats.resolved / p.stats.words) * 100) : 0;
  root.append(
    el("div", { class: "card" },
      el("div", { class: "stats" },
        stat("words", String(p.stats.words)),
        stat("roots", String(p.stats.roots)),
        stat("openness", `${p.stats.bits.toFixed(1)} bits`),
        stat("weight", p.stats.weight.toLocaleString()),
        stat("determined", `${p.stats.determined}/${p.stats.words}`),
        stat("resolved", `${pct}%`),
      ),
      pct < 100 && el("p", { class: "fine" },
        `${p.stats.words - p.stats.resolved} ${p.stats.words - p.stats.resolved === 1 ? "word is" : "words are"} outside the lexicon — reported, not guessed.`),
    ),
  );

  // body
  const body = el("div", { class: "card passage", dir: "rtl" });
  p.words.forEach((w) => {
    const ch = result?.changes[w.index];
    const showing = ch?.changed ? ch.to : w.norm;
    const arabicOut = op ? op.readable !== false : true;
    body.append(
      el("button", { class: "w", onclick: () => openWord(w) },
        el("span", {
          class: `w-main${arabicOut ? " ar" : " num"}${ch?.changed ? " chg" : ch?.unresolved ? " unres" : ""}`,
        }, showing),
        ch?.changed
          ? el("span", { class: "w-sub ar strike" }, w.norm)
          : (!op && w.lex?.rootDisplay ? el("span", { class: "w-sub ar" }, w.lex.rootDisplay) : null),
      ),
    );
  });
  root.append(body);

  // operations
  const ops = el("div", { class: "ops" });
  for (const g of OP_GROUPS) {
    ops.append(el("div", { class: "op-h" },
      el("span", { class: "op-k" }, g.label),
      el("span", { class: "op-n" }, g.note),
    ));
    const row = el("div", { class: "chips" });
    for (const o of OPERATIONS.filter((x) => x.kind === g.kind)) {
      row.append(el("button", {
        class: `chip${read.opId === o.id ? " on" : ""}`,
        onclick: () => {
          read.opId = read.opId === o.id ? null : o.id;
          read.option = OP_BY_ID[o.id]?.options?.values[0]?.id;
          renderRead();
        },
      }, o.name.en));
    }
    ops.append(row);
  }
  root.append(ops);

  // options
  if (op?.options) {
    const row = el("div", { class: "chips opt" });
    for (const v of op.options.values) {
      row.append(el("button", {
        class: `chip sm${read.option === v.id ? " on" : ""}${isAr(v.label) ? " ar" : ""}`,
        onclick: () => { read.option = v.id; renderRead(); },
      }, v.label));
    }
    root.append(el("div", { class: "card" },
      el("div", { class: "op-k" }, op.options.label), row));
  }

  // result
  if (op && result) {
    const card = el("div", { class: "card res" },
      el("div", { class: "res-h" },
        el("span", { class: "res-t" }, op.name.en),
        el("span", { class: "res-m" }, `${result.coverage.acted}/${result.coverage.total} words`),
      ),
      el("p", { class: "fine" }, op.note),
    );
    if (op.readable && result.text) {
      card.append(el("div", { class: "out ar", dir: "rtl" }, result.text));
    }
    card.append(el("p", { class: "sum" }, result.summary));
    const inv = el("div", { class: "inv" });
    inv.append(el("div", { class: "inv-c" },
      el("span", { class: "op-k" }, "preserved"),
      ...result.preserved.map((x) => el("span", { class: "keep" }, x)),
    ));
    if (result.lost.length) {
      inv.append(el("div", { class: "inv-c" },
        el("span", { class: "op-k" }, "lost"),
        ...result.lost.map((x) => el("span", { class: "lost" }, x)),
      ));
    }
    card.append(inv);
    root.append(card);
  }
}

function openPicker() {
  const body = el("div", { class: "sheet-body" });
  for (const c of CORPUS) {
    body.append(el("button", {
      class: `pick${read.entry?.id === c.id ? " on" : ""}`,
      onclick: () => { document.querySelector(".scrim")?.remove(); loadPassage(c.text, c); },
    },
      el("div", { class: "pick-h" },
        el("span", { class: "ar pick-ar" }, c.titleAr),
        el("span", { class: "pick-t" }, c.title),
      ),
      el("div", { class: "pick-s" }, `${c.source} · ${c.era}`),
      el("div", { class: "fine" }, c.note),
    ));
  }
  const ta = el("textarea", {
    class: "ar paste", dir: "rtl", rows: "3",
    placeholder: "الصق نصا عربيا هنا",
  }) as HTMLTextAreaElement;
  ta.value = read.entry ? "" : read.text;
  body.append(
    el("div", { class: "op-k mt" }, "or paste your own"),
    ta,
    el("button", {
      class: "go",
      onclick: () => {
        const v = ta.value.trim();
        if (!v) return;
        document.querySelector(".scrim")?.remove();
        loadPassage(v, null);
      },
    }, "read this"),
  );
  sheet("Passages", body);
}

function openWord(w: PassageWord) {
  const b = el("div", { class: "sheet-body" });
  b.append(
    el("div", { class: "word-head" },
      el("span", { class: "ar word-big" }, w.norm),
      el("span", { class: "rasm word-big" }, w.skeleton),
    ),
  );
  if (w.lex?.gloss) b.append(el("p", { class: "gloss" }, w.lex.gloss));
  b.append(el("div", { class: "stats" },
    stat("readings", w.degree.toLocaleString()),
    stat("open slots", String(w.arity)),
    stat("weight", w.weight.toLocaleString()),
    stat("profile", `(${w.profile.join(", ")})`),
  ));

  const section = (title: string, ...kids: Child[]) =>
    b.append(el("div", { class: "sec" }, el("div", { class: "op-k" }, title), ...kids));

  if (w.lex?.rootDisplay) {
    section("root",
      el("div", { class: "root-row" },
        el("span", { class: "ar root-big" }, w.lex.rootDisplay),
        w.lex.rootCount ? el("span", { class: "res-m" }, `${w.lex.rootCount.toLocaleString()} in the corpus`) : null,
      ),
      w.lex.rootGlosses?.length ? el("p", { class: "fine" }, w.lex.rootGlosses.join(" · ")) : null,
    );
  }
  if (w.taqlib?.length) {
    section("permutations that are also roots",
      ...w.taqlib.map((t) => el("div", { class: "root-row" },
        el("span", { class: "ar t-root" }, t.root),
        el("span", { class: "fine" }, t.glosses.join(" · ")),
      )),
    );
  }
  if (w.sameSkeleton?.length) {
    section("the page cannot tell these apart",
      el("div", { class: "wrap" }, ...w.sameSkeleton.map((s) => el("span", { class: "ar tok" }, s))));
  }
  if (w.sameWeight?.length) {
    section(`also weighing ${w.weight.toLocaleString()}`,
      el("div", { class: "wrap" }, ...w.sameWeight.slice(0, 10).map((s) => el("span", { class: "ar tok" }, s))));
  }
  if (w.lex?.prefix || w.lex?.suffix) {
    b.append(el("p", { class: "fine mt" },
      `Found by stripping ${[w.lex.prefix && `prefix ${w.lex.prefix}`, w.lex.suffix && `suffix ${w.lex.suffix}`].filter(Boolean).join(" and ")}.`));
  }
  sheet("Word", b);
}

// ---------------------------------------------------------------------------
// Compose
// ---------------------------------------------------------------------------

const comp = {
  pieces: [] as Piece[],
  query: "",
  roots: [] as RootOption[],
  active: null as RootOption | null,
  constraint: "free" as ConstraintId,
  target: 1000,
};

function renderCompose() {
  const root = $("#compose");
  clear(root);
  const stats = statsOfComposition(comp.pieces);
  const con = CONSTRAINT_BY_ID[comp.constraint];
  const status = con.status(comp.pieces, { target: comp.target });
  const lock = comp.constraint === "oneRoot" && comp.pieces.length ? comp.pieces[0].root : null;

  // the line
  const line = el("div", { class: "card" },
    el("div", { class: "res-h" },
      el("span", { class: "op-k" }, "your line"),
      el("span", { class: `pill${status.ok ? " ok" : ""}` }, status.label),
    ),
  );
  if (!comp.pieces.length) {
    line.append(el("p", { class: "empty" }, "Pick a root below, then a pattern. The word is built, not recalled."));
  } else {
    const row = el("div", { class: "line", dir: "rtl" });
    comp.pieces.forEach((p, i) => {
      row.append(el("button", {
        class: "piece", title: "remove",
        onclick: () => { comp.pieces.splice(i, 1); renderCompose(); },
      },
        el("span", { class: "ar piece-w" }, p.word),
        el("span", { class: "ar piece-s" }, p.literal ? "—" : `${p.rootDisplay} · ${p.patternName}`),
      ));
    });
    line.append(row, el("div", { class: "rasm line-rasm", dir: "rtl" }, stats.skeleton));
  }
  line.append(el("div", { class: "stats" },
    stat("words", String(stats.words)),
    stat("roots", String(stats.roots)),
    stat("weight", stats.weight.toLocaleString()),
    stat("openness", `${stats.bits.toFixed(1)} b`),
    stat("determined", `${stats.determined}/${stats.words}`),
    stat("unmoved", stats.allUnmoved && stats.words ? "yes" : "no"),
  ));
  if (comp.pieces.length) {
    line.append(el("div", { class: "chips" },
      el("button", {
        class: "chip sm",
        onclick: () => navigator.clipboard?.writeText(renderComposition(comp.pieces)),
      }, "copy"),
      el("button", {
        class: "chip sm on",
        onclick: () => { loadPassage(renderComposition(comp.pieces), null); go("read"); },
      }, "read it through the operations →"),
      el("button", {
        class: "chip sm",
        onclick: () => { comp.pieces = []; renderCompose(); },
      }, "clear"),
    ));
  }
  root.append(line);

  // constraint
  const cc = el("div", { class: "card" }, el("div", { class: "op-k" }, "compose under"));
  const crow = el("div", { class: "chips" });
  for (const c of CONSTRAINTS) {
    crow.append(el("button", {
      class: `chip${comp.constraint === c.id ? " on" : ""}`,
      onclick: () => { comp.constraint = c.id; renderCompose(); },
    }, c.name.en));
  }
  cc.append(crow, el("p", { class: "sum" }, con.note));
  if (comp.constraint === "weight") {
    const inp = el("input", { type: "number", class: "num-in", value: String(comp.target) }) as HTMLInputElement;
    inp.addEventListener("input", () => { comp.target = Number(inp.value) || 0; renderCompose(); });
    cc.append(el("div", { class: "row" },
      el("span", { class: "fine" }, "target"), inp,
      el("span", { class: "fine" }, `${(comp.target - stats.weight).toLocaleString()} to go`)));
  }
  if (comp.constraint === "unmoved") {
    cc.append(el("p", { class: "ar unmoved" }, UNMOVED.join(" ")));
  }
  root.append(cc);

  // suggestions
  if (comp.constraint !== "free") {
    const pool = lock ? comp.roots.filter((r) => r.root === lock) : comp.roots.slice(0, 80);
    const sug = suggest(pool, comp.constraint, { pieces: comp.pieces, target: comp.target }, 18);
    if (sug.length) {
      const g = el("div", { class: "grid" });
      for (const s of sug) {
        g.append(el("button", {
          class: "cell",
          onclick: () => { const p = buildPiece(s.root, s.pattern.id); if (p) { comp.pieces.push(p); renderCompose(); } },
        },
          el("span", { class: "ar cell-w" }, s.word),
          el("span", { class: "cell-s" }, `${s.root.display} · ${s.weight.toLocaleString()}`),
        ));
      }
      root.append(el("div", { class: "card" },
        el("div", { class: "op-k" }, "words that satisfy the constraint"), g));
    }
  }

  // roots
  const rc = el("div", { class: "card" },
    el("div", { class: "op-k" }, lock ? `roots — locked to ${lock}` : "roots"));
  const search = el("input", {
    class: "search", value: comp.query,
    placeholder: "search by meaning or root — book, light, open, ملك",
  }) as HTMLInputElement;
  search.addEventListener("input", () => {
    comp.query = search.value;
    comp.roots = searchRoots(comp.query);
    renderRootList();
  });
  const list = el("div", { class: "wrap" });
  const renderRootList = () => {
    clear(list);
    if (!comp.roots.length) {
      list.append(el("p", { class: "fine" }, "Nothing matches. The lexicon is classical — try an older word."));
      return;
    }
    for (const r of comp.roots) {
      list.append(el("button", {
        class: `rt${comp.active?.root === r.root ? " on" : ""}`,
        title: r.glosses.join(" · "),
        onclick: () => {
          comp.active = comp.active?.root === r.root ? null : r;
          renderCompose();
        },
      },
        el("span", { class: "ar rt-w" }, r.display),
        el("span", { class: "rt-g" }, r.glosses[0] ?? ""),
      ));
    }
  };
  renderRootList();
  rc.append(search, list);
  root.append(rc);

  // patterns for the active root
  if (comp.active) {
    const r = comp.active;
    const pc = el("div", { class: "card acc" },
      el("div", { class: "root-row" },
        el("span", { class: "ar root-big" }, r.display),
        el("span", { class: "fine" }, r.glosses.join(" · ")),
      ),
    );
    const g = el("div", { class: "grid" });
    let n = 0;
    for (const pat of PATTERNS) {
      const piece = buildPiece(r, pat.id);
      if (!piece || !plausible(piece.word)) continue;
      if (!con.admits(piece.word, { pieces: comp.pieces, target: comp.target, root: lock ?? undefined })) continue;
      const m = metricsOf(piece.word);
      n++;
      g.append(el("button", {
        class: "cell",
        onclick: () => { comp.pieces.push(piece); renderCompose(); },
      },
        el("span", { class: "ar cell-w" }, piece.word),
        el("span", { class: "ar cell-p" }, pat.name),
        el("span", { class: "cell-s" }, pat.meaning),
        el("span", { class: "cell-s" }, `${m.weight.toLocaleString()} · ${m.degree === 1 ? "determined" : `${m.degree} readings`}`),
      ));
    }
    pc.append(n ? g : el("p", { class: "empty" }, "No pattern on this root satisfies the constraint."));
    root.append(pc);
  }

  // literal
  const lit = el("input", { class: "ar lit", dir: "rtl", placeholder: "حرف أو كلمة" }) as HTMLInputElement;
  const addLit = () => {
    const v = lit.value.trim();
    if (!v) return;
    comp.pieces.push(literalPiece(v));
    lit.value = "";
    renderCompose();
  };
  lit.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") addLit(); });
  root.append(el("div", { class: "card" },
    el("div", { class: "op-k" }, "or write a word directly"),
    el("div", { class: "row" }, lit, el("button", { class: "chip sm", onclick: addLit }, "add")),
    el("p", { class: "fine" },
      "Particles and pronouns are not built from roots, so they go in by hand. Search matches how words were actually used, so ك–ت–ب answers to “book” rather than “write”."),
  ));
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

function go(tab: "read" | "compose") {
  for (const id of ["read", "compose"]) {
    $(`#${id}`).hidden = id !== tab;
    $(`#tab-${id}`).classList.toggle("on", id === tab);
  }
  window.scrollTo({ top: 0 });
}

function boot() {
  // The page is wrapped in a <head> this file does not control, so make sure
  // a viewport meta exists — without one a phone lays the page out at 980px
  // and renders it zoomed out.
  if (!document.querySelector('meta[name="viewport"]')) {
    const m = document.createElement("meta");
    m.name = "viewport";
    m.content = "width=device-width, initial-scale=1, viewport-fit=cover";
    document.head.append(m);
  }

  document.body.append(
    el("header", { class: "top" },
      el("span", { class: "rasm mark" }, "ٮٯٮ"),
      el("span", { class: "brand" }, "ARABIC TIMELESS"),
      el("span", { class: "sub" }, "dotless kernel · passage operations"),
    ),
    el("main", {},
      el("section", { id: "read" }),
      el("section", { id: "compose", hidden: "true" }),
    ),
    el("nav", { class: "tabs" },
      el("button", { id: "tab-read", class: "tab on", onclick: () => go("read") }, "Read"),
      el("button", { id: "tab-compose", class: "tab", onclick: () => go("compose") }, "Compose"),
    ),
  );

  comp.roots = searchRoots("");
  loadPassage(read.text, read.entry);
  renderCompose();
}

/*
 * The page is wrapped so that its <style> and <script> parse into <head>,
 * which means document.body does not exist yet when this runs. Wait for the
 * document rather than assuming a body is already there.
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}

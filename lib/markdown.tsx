import type { ReactNode } from "react";

/**
 * A compact markdown renderer for the specification documents.
 *
 * Handles exactly what spec/ uses: headings, paragraphs, tables, fenced code,
 * blockquotes, lists, horizontal rules, and inline bold / italic / code /
 * links. Avoiding a dependency here keeps the app self-contained, and the spec
 * is written in a narrow enough subset that a hundred lines covers it.
 */

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${key}-${i++}`;

    if (tok.startsWith("**")) {
      out.push(<strong key={k} className="font-semibold text-bright">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      out.push(
        <code key={k} className="rounded bg-ink-3 px-1 py-0.5 font-mono text-[0.9em] text-gold">
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("[")) {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok)!;
      const internal = href.endsWith(".md");
      const to = internal ? `/layers/${href.replace(/^.*?(\d\d)-([a-z]+)\.md$/, "$2")}` : href;
      out.push(
        <a key={k} href={to} className="text-cyan underline-offset-2 hover:underline">
          {label}
        </a>,
      );
    } else {
      out.push(<em key={k} className="italic text-mid">{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const isArabic = (s: string) => /[؀-ۿ]/.test(s);

function Cell({ text, head }: { text: string; head?: boolean }) {
  const cls = head
    ? "border-b border-line px-3 py-2 text-left text-[10px] uppercase tracking-wider text-dim"
    : "border-b border-line/50 px-3 py-2 align-top text-[12.5px] text-mid";
  return <td className={cls}>{inline(text, text.slice(0, 8))}</td>;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  const push = (n: ReactNode) => out.push(<div key={key++}>{n}</div>);

  while (i < lines.length) {
    const line = lines[i];

    // fenced code
    if (line.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      push(
        <pre className="scroll-x my-4 rounded border border-line bg-ink p-3">
          <code className={`font-mono text-[12px] leading-relaxed text-gold ${isArabic(buf.join("")) ? "ar" : ""}`}>
            {buf.join("\n")}
          </code>
        </pre>,
      );
      continue;
    }

    // table
    if (line.startsWith("|") && lines[i + 1]?.match(/^\|[\s:|-]+\|$/)) {
      const head = line.split("|").slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
        i++;
      }
      push(
        <div className="scroll-x my-4">
          <table className="w-full border-collapse">
            <thead>
              <tr>{head.map((h, j) => <Cell key={j} text={h} head />)}</tr>
            </thead>
            <tbody>
              {rows.map((r, j) => (
                <tr key={j}>{r.map((c, k) => <Cell key={k} text={c} />)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // headings
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const size = ["text-xl", "text-lg", "text-[15px]", "text-[13px]"][level - 1];
      push(
        <h2 className={`mt-8 mb-3 font-medium tracking-wide text-bright ${size} ${isArabic(text) ? "ar" : ""}`}>
          {inline(text, `h${key}`)}
        </h2>,
      );
      i++;
      continue;
    }

    // blockquote
    if (line.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      push(
        <blockquote className="my-4 border-l-2 border-gold-dim bg-ink-2/50 px-4 py-2 text-[13px] leading-relaxed text-bright">
          {inline(buf.join(" "), `q${key}`)}
        </blockquote>,
      );
      continue;
    }

    // list
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        let item = lines[i].replace(/^[-*]\s/, "");
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) item += " " + lines[i++].trim();
        items.push(item);
      }
      push(
        <ul className="my-3 space-y-1.5">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2 text-[13px] leading-relaxed text-mid">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold-dim" />
              <span>{inline(it, `li${key}-${j}`)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // rule
    if (/^---+$/.test(line)) {
      push(<hr className="my-6 border-line" />);
      i++;
      continue;
    }

    // paragraph
    if (line.trim() === "") { i++; continue; }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" &&
           !lines[i].startsWith("#") && !lines[i].startsWith(">") &&
           !lines[i].startsWith("|") && !lines[i].startsWith("```") &&
           !/^[-*]\s/.test(lines[i]) && !/^---+$/.test(lines[i])) {
      buf.push(lines[i++]);
    }
    const text = buf.join(" ");
    push(
      <p className="my-3 text-[13px] leading-relaxed text-mid">
        {inline(text, `p${key}`)}
      </p>,
    );
  }

  return <div className="max-w-3xl">{out}</div>;
}

import type { ReactNode } from "react";

export function Panel({
  title, ar, subtitle, right, children, tone = "default",
}: {
  title: string;
  ar?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  tone?: "default" | "gold" | "cyan" | "violet";
}) {
  const accent = {
    default: "border-line",
    gold: "border-gold-dim/50",
    cyan: "border-cyan/30",
    violet: "border-violet/30",
  }[tone];

  return (
    <section className={`rounded-lg border ${accent} bg-ink-2/60`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line px-3 py-2.5 sm:px-4">
        <h2 className="text-[13px] font-medium tracking-wide text-bright">{title}</h2>
        {ar && <span className="ar text-[13px] text-dim">{ar}</span>}
        {subtitle && <span className="text-[11px] text-dim">{subtitle}</span>}
        {right && <div className="ml-auto">{right}</div>}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, tone }: {
  label: string; value: ReactNode; hint?: string; tone?: "gold" | "cyan" | "rose";
}) {
  const color = tone === "gold" ? "text-gold" : tone === "cyan" ? "text-cyan" : tone === "rose" ? "text-rose" : "text-bright";
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-dim">{label}</div>
      <div className={`mt-0.5 font-mono text-[15px] leading-tight ${color}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[10px] leading-snug text-dim">{hint}</div>}
    </div>
  );
}

export function Tag({ children, tone = "dim" }: { children: ReactNode; tone?: "dim" | "gold" | "cyan" | "rose" | "violet" }) {
  const cls = {
    dim: "border-line text-mid",
    gold: "border-gold-dim/60 text-gold",
    cyan: "border-cyan/40 text-cyan",
    rose: "border-rose/40 text-rose",
    violet: "border-violet/40 text-violet",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] ${cls}`}>
      {children}
    </span>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="border-l-2 border-line pl-3 text-[12.5px] leading-relaxed text-mid">
      {children}
    </p>
  );
}

export function Cost({ marks, counts, held }: { marks: number; counts: number; held: number }) {
  return (
    <span className="font-mono text-[10px] text-dim" title="hand-cost: marks · counts · held">
      {marks}m · {counts}c · {held}h
    </span>
  );
}

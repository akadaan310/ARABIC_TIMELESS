import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { layers, layerBySlug } from "@/lib/engine";
import { BANDS } from "@/lib/engine/types";
import { Markdown } from "@/lib/markdown";

export function generateStaticParams() {
  return layers().map((l) => ({ slug: l.slug }));
}

export default async function LayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const layer = layerBySlug(slug);
  if (!layer) notFound();

  const file = `${String(layer.id).padStart(2, "0")}-${layer.slug}.md`;
  let source = "";
  try {
    source = await readFile(path.join(process.cwd(), "spec", file), "utf8");
  } catch {
    source = "_The specification document for this layer was not found._";
  }

  const all = layers();
  const idx = all.findIndex((l) => l.id === layer.id);
  const prev = all[idx - 1];
  const next = all[idx + 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <Link href="/layers" className="text-[11px] text-dim hover:text-mid">
          ← all layers
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-dim">
          {BANDS[layer.band].en}
        </span>
      </div>

      <div className="rounded-lg border border-gold-dim/40 bg-ink-2/60 p-5">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[13px] text-dim">
            {String(layer.id).padStart(2, "0")}
          </span>
          <h1 className="text-xl font-medium tracking-wide text-bright">
            {layer.name.en}
          </h1>
          <span className="ar text-xl text-gold">{layer.name.ar}</span>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-bright">
          {layer.statement}
        </p>

        {(layer.observables.length > 0 || layer.transforms.length > 0) && (
          <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
            {layer.observables.length > 0 && (
              <div>
                <div className="mb-2 text-[10px] uppercase tracking-wider text-dim">
                  Observables
                </div>
                <ul className="space-y-1.5">
                  {layer.observables.map((o) => (
                    <li key={o.id} className="text-[12px] leading-snug">
                      <span className="text-bright">{o.label.en}</span>
                      <span className="ar ml-1.5 text-dim">{o.label.ar}</span>
                      <div className="text-[11px] text-dim">discards {o.discards}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {layer.transforms.length > 0 && (
              <div>
                <div className="mb-2 text-[10px] uppercase tracking-wider text-dim">
                  Transforms
                </div>
                <ul className="space-y-1.5">
                  {layer.transforms.map((t) => (
                    <li key={t.id} className="text-[12px] leading-snug">
                      <span className="text-bright">{t.label.en}</span>
                      <span className="ar ml-1.5 text-dim">{t.label.ar}</span>
                      <div className="text-[11px] text-dim">
                        {t.invertible ? "invertible" : "lossy"}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <Markdown source={source} />

      <nav className="flex justify-between border-t border-line pt-4 text-[12px]">
        {prev ? (
          <Link href={`/layers/${prev.slug}`} className="text-cyan hover:underline">
            ← {prev.name.en}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/layers/${next.slug}`} className="text-cyan hover:underline">
            {next.name.en} →
          </Link>
        ) : <span />}
      </nav>
    </div>
  );
}

import Link from "next/link";
import { layers } from "@/lib/engine";
import { BANDS, type Band } from "@/lib/engine/types";

export default function LayersPage() {
  const all = layers();
  const bands = [...new Set(all.map((l) => l.band))].sort() as Band[];

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h1 className="text-[15px] font-medium tracking-wide text-bright">
          The twenty layers
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-mid">
          Layer 0 is today&apos;s definition, stated and set aside. The twenty
          above it are the architecture, grouped into five bands. Each declares
          its own observables and transforms, and the registry is what the
          invariance table and the cost model read from.
        </p>
      </div>

      {bands.map((band) => (
        <section key={band}>
          <div className="mb-3 flex items-baseline gap-3">
            <span className="text-[10px] uppercase tracking-widest text-dim">
              Band {band === 0 ? "0" : ["", "I", "II", "III", "IV", "V"][band]}
            </span>
            <span className="text-[13px] text-bright">{BANDS[band].en}</span>
            <span className="ar text-[13px] text-dim">{BANDS[band].ar}</span>
            <span className="text-[11px] text-dim">— {BANDS[band].subject}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {all
              .filter((l) => l.band === band)
              .map((l) => (
                <Link
                  key={l.id}
                  href={`/layers/${l.slug}`}
                  className="group rounded-lg border border-line bg-ink-2/50 p-4 transition hover:border-gold-dim/60 hover:bg-ink-2"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[11px] text-dim">
                      {String(l.id).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] text-bright">{l.name.en}</span>
                    <span className="ar text-[13px] text-dim">{l.name.ar}</span>
                  </div>
                  <p className="mt-2 text-[12px] italic leading-relaxed text-mid">
                    {l.statement}
                  </p>
                  <div className="mt-3 flex gap-3 font-mono text-[10px] text-dim">
                    <span>{l.observables.length} observables</span>
                    <span>{l.transforms.length} transforms</span>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

import { PassageReader } from "@/components/PassageReader";

export const metadata = { title: "Read — passages through the operations" };

export default function ReadPage() {
  return (
    <div className="space-y-5">
      <header className="max-w-2xl">
        <h1 className="text-[15px] font-medium tracking-wide text-bright">
          Read a passage through the operations
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-mid">
          The dotless kernel works on letters. This works on compositions. Pick
          one of the included passages or paste your own, and apply operations
          that hand the whole thing back transformed — reduced to its roots,
          recast through a single pattern, swapped for words the page cannot
          tell apart. Most of them return readable Arabic.
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-dim">
          Every operation reports what it preserved as well as what it changed,
          because an operation is characterised as much by its invariants as by
          its effect. Tap any word to open it.
        </p>
      </header>
      <PassageReader />
    </div>
  );
}

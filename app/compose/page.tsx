import { Composer } from "@/components/Composer";

export const metadata = { title: "Compose — writing by function application" };

export default function ComposePage() {
  return (
    <div className="space-y-5">
      <header className="max-w-2xl">
        <h1 className="text-[15px] font-medium tracking-wide text-bright">
          Compose
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-mid">
          Ordinary writing recalls words. Here you apply a pattern to a root and
          a word comes back, so a line is assembled out of operations rather
          than out of memory. Search the roots by meaning, choose what to do to
          one, and the word is built.
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-dim">
          The constraint modes are the interesting part. Write toward a number
          and the composer solves backward to the words that reach it. Write
          inside the six unmoved letters and every word comes out with no
          ambiguity at all — dotless and still exact.
        </p>
      </header>
      <Composer />
    </div>
  );
}

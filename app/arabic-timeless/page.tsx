import Link from "next/link";
import { Walkthrough } from "@/components/Walkthrough";
import { HELLO_WORLD } from "@/lib/engine/examples";
import { WordPair } from "@/components/WordPair";

export default function Home() {
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <WordPair text={HELLO_WORLD.text} size="xl" />
        <p className="max-w-2xl text-[14px] leading-relaxed text-mid">
          The hello-world of a language whose central claim is that writing is an
          expression and reading is its evaluation. A password is a string
          uttered for its effect — so this one is a program, and the cave is the
          evaluator.
        </p>
        <p className="max-w-2xl text-[13px] leading-relaxed text-dim">
          Written the way the original manuscripts write it — without dots — this
          phrase is <span className="text-gold">120 different phrases at once</span>.
          One of them opens. What follows is the architecture that tells them
          apart, run end to end on these two words.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/arabic-timeless/live"
            className="rounded-lg border border-gold-dim bg-gold/10 px-4 py-2.5 text-[13px] text-gold transition active:bg-gold/20"
          >
            talk to a text →
          </Link>
          <Link
            href="/arabic-timeless/workspace"
            className="rounded-lg border border-line px-4 py-2.5 text-[13px] text-mid transition active:bg-ink-3"
          >
            full workspace
          </Link>
        </div>
      </header>

      <Walkthrough />
    </div>
  );
}

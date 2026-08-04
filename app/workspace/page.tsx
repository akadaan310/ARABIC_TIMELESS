import { Workspace } from "@/components/Workspace";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h1 className="text-[15px] font-medium tracking-wide text-bright">
          Modern Arabic, run through the twenty layers
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-mid">
          Modern written Arabic is the fully bound state of the language: every
          distinction the script can make has been made. The engine projects it
          back to the skeleton — the form the original manuscripts carry — and
          then shows the architecture recovering what the projection discarded.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-dim">
          Because the input is known, nothing here has to be taken on trust.
          Every filter reports what it removed, and the collapse ends by checking
          whether the word you actually typed survived.
        </p>
      </div>
      <Workspace />
    </div>
  );
}

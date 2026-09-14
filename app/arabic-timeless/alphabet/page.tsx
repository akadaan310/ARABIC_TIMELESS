import { AlphabetExplorer } from "@/components/AlphabetExplorer";

export default function AlphabetPage() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h1 className="text-[15px] font-medium tracking-wide text-bright">
          The alphabet alone
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-mid">
          No words, no text, no context — only the twenty-eight letters and what
          a person can do with them. Every operation on this page is executable
          on a single letter, which is what qualifies these layers for the first
          band.
        </p>
      </div>
      <AlphabetExplorer />
    </div>
  );
}

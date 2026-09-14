import { LiveMode } from "@/components/LiveMode";

export const metadata = {
  title: "Live — talk to a text",
};

export default function LivePage() {
  return (
    <div className="space-y-5">
      <header className="max-w-2xl">
        <h1 className="text-[15px] font-medium tracking-wide text-bright">
          Talk to a text
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-mid">
          Type anything in Arabic and it will keep telling you things about
          itself. Each reading is one operation from one layer, performed on what
          you wrote and reported with its result — some of it confirmable by
          looking at the page, some of it not visible there at all.
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-dim">
          It does not run out. Twenty layers, each parameterised by which word,
          which position, which transformation — the space is combinatorial, and
          a text will go on answering for as long as you keep asking.
        </p>
      </header>
      <LiveMode />
    </div>
  );
}

import { parseText } from "@/lib/engine";

/**
 * The written form above its skeleton, each labelled.
 *
 * Set side by side they read as one continuous Arabic string — both are RTL,
 * both isolate, and the eye runs them together. Stacking and labelling them is
 * the difference between showing a projection and showing a longer phrase.
 */
export function WordPair({
  text,
  size = "lg",
  skeleton,
}: {
  text: string;
  size?: "sm" | "lg" | "xl";
  skeleton?: string;
}) {
  const rasm = skeleton ?? parseText(text).map((w) => w.skeleton).join(" ");
  const cls = {
    sm: "text-2xl",
    lg: "text-3xl sm:text-4xl",
    xl: "text-4xl sm:text-6xl",
  }[size];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2.5">
        <span className={`ar leading-tight text-bright ${cls}`}>{text}</span>
        <span className="shrink-0 text-[9px] uppercase tracking-wider text-dim">
          written
        </span>
      </div>
      <div className="flex items-baseline gap-2.5">
        <span className={`rasm leading-tight ${cls}`}>{rasm}</span>
        <span className="shrink-0 text-[9px] uppercase tracking-wider text-dim">
          skeleton
        </span>
      </div>
    </div>
  );
}

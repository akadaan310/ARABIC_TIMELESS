import { InvarianceView } from "@/components/InvarianceView";

export default function InvariancePage() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h1 className="text-[15px] font-medium tracking-wide text-bright">
          What survives what
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-mid">
          Layer 14&apos;s table, computed by running every registered transform
          against every registered observable over a sample of words. Nothing
          here is copied from the specification — if the engine and the document
          ever disagree, this page is the one telling the truth.
        </p>
      </div>
      <InvarianceView />
    </div>
  );
}

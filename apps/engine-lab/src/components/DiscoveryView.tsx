import type { LabState } from "../state/useLab";

export function DiscoveryView({ lab }: { lab: LabState }) {
  const { candidates, experiments } = lab;

  return (
    <div>
      <h1>Discovery</h1>
      <p className="subtitle">
        A deterministic scan of recorded experiment history for contiguous capability sub-sequences that
        recur across at least 2 distinct Engines — real, structural evidence, never a guess.
        Every candidate stays a <em>candidate</em> until someone actually builds and registers it as a new Engine.
      </p>

      {experiments.length < 2 ? (
        <p className="empty">Run and save at least two experiments (ideally from different Engines) to look for patterns.</p>
      ) : candidates.length === 0 ? (
        <p className="empty">No repeated capability sequence found across distinct Engines yet — nothing fabricated here.</p>
      ) : (
        candidates.map((c) => (
          <div className="panel" key={c.id}>
            <strong>{c.capabilitySequence.join(" → ")}</strong>
            <div className="tag" style={{ marginTop: 6 }}>
              seen in {c.occurrences} experiment(s): {c.experimentIds.join(", ")}
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <span className="pill experimental">candidate</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

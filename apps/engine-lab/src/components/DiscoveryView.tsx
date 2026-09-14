import type { LabState } from "../state/useLab";

export function DiscoveryView({ lab }: { lab: LabState }) {
  const { candidates, experiments, compositions } = lab;

  return (
    <div>
      <h1>Discovery</h1>
      <p className="subtitle">
        Two deterministic signals, both real: a compatibility ladder computed from the port contracts
        (below), and repeated capability sub-sequences seen across actual experiment history (further down).
        Nothing here is fabricated, and nothing is auto-promoted to a reusable Engine.
      </p>

      <h2>Composition landscape</h2>
      <p className="tag">
        Every structurally compatible (A → B) pair, graded by the strongest evidence any saved Engine
        embodying it actually has: compatible-composition (contracts allow it, nothing has run it) →
        experimental-candidate (a saved Engine embodies it) → successfully-executed → challenged → reusable-engine
        (every recorded challenge passed).
      </p>
      {compositions.length === 0 ? (
        <p className="empty">No compatible pairs found.</p>
      ) : (
        compositions.map((c) => (
          <div className="list-item" key={c.capabilitySequence.join(">")} style={{ cursor: "default" }}>
            <div>
              <div className="name">{c.capabilitySequence.join(" → ")}</div>
              {c.engineIds.length > 0 && <div className="meta">engines: {c.engineIds.join(", ")}</div>}
            </div>
            <span className={`pill ${c.level}`}>{c.level.replace(/-/g, " ")}</span>
          </div>
        ))
      )}

      <h2 style={{ marginTop: 28 }}>Repeated patterns across experiment history</h2>
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

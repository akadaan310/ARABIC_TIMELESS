import type { LabState } from "../state/useLab";
import { Json } from "./Json";

export function ResultView({ lab }: { lab: LabState }) {
  const { lastResult, selectedEngine, recordExperiment, lastChallenges } = lab;

  if (!lastResult) {
    return (
      <div>
        <h1>Results</h1>
        <p className="empty">No execution yet. Go to Engines, select one, and press Execute.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Results</h1>
      <p className="subtitle">Every computation performed, in order — nothing hidden behind a generic success message.</p>

      <div className="panel">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>{lastResult.engineId} @ v{lastResult.engineVersion}</strong>
          <span className={`pill ${lastResult.status}`}>{lastResult.status}</span>
        </div>
        <div className="tag" style={{ margin: "6px 0" }}>
          started {lastResult.startedAt} — {lastResult.durationMs.toFixed(3)}ms total
        </div>
        {lastResult.error && <div className="tag" style={{ color: "var(--red)" }}>{lastResult.error}</div>}
        <div className="row">
          <button
            className="primary"
            onClick={recordExperiment}
            disabled={lastChallenges.length === 0 && lastResult.status !== "success"}
          >
            Save as Experiment{lastChallenges.length > 0 ? ` (with ${lastChallenges.length} challenge outcome(s))` : ""}
          </button>
        </div>
      </div>

      <h2>Provenance</h2>
      <div className="panel">
        <Json value={lastResult.provenance} />
      </div>

      <h2>Execution trace ({lastResult.steps.length} step(s))</h2>
      {lastResult.steps.map((step, i) => (
        <div className="panel" key={`${step.capabilityId}-${i}`}>
          <div className="step-head">
            <span className="cap">{i + 1}. {step.capabilityId}</span>
            <span className="step-time">{step.durationMs.toFixed(3)}ms</span>
          </div>
          {step.error ? (
            <div style={{ color: "var(--red)", fontSize: 12, marginTop: 6 }}>ERROR: {step.error}</div>
          ) : (
            <>
              <label style={{ marginTop: 8 }}>input</label>
              <Json value={step.input} maxLen={1200} />
              <label style={{ marginTop: 8 }}>output</label>
              <Json value={step.output} maxLen={1200} />
            </>
          )}
        </div>
      ))}

      {selectedEngine && lastResult.engineId !== selectedEngine.id && (
        <p className="tag">Note: the selected Engine has changed since this result was produced.</p>
      )}
    </div>
  );
}

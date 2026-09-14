import type { LabState } from "../state/useLab";
import { Json } from "./Json";

export function EnginesView({ lab }: { lab: LabState }) {
  const { engines, engineStatuses, selectedEngine, selectedEngineId, selectEngine, configuration, setConfigField, execute, lastResult } = lab;

  return (
    <div>
      <h1>Engines</h1>
      <p className="subtitle">An Engine is a composition of capabilities with configuration. Select one, configure it, execute it.</p>

      {engines.map((e) => (
        <div
          key={e.id}
          className={`list-item ${e.id === selectedEngineId ? "selected" : ""}`}
          onClick={() => selectEngine(e.id)}
        >
          <div>
            <div className="name">{e.name} <span className="tag">v{e.version}</span></div>
            <div className="meta">{e.steps.map((s) => s.capabilityId).join(" → ")}</div>
          </div>
          <span className={`pill ${engineStatuses[e.id]}`}>{engineStatuses[e.id]}</span>
        </div>
      ))}

      {selectedEngine && (
        <div className="panel" style={{ marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>Composition</h2>
          <p className="tag">{selectedEngine.description}</p>
          <div>
            {selectedEngine.steps.map((s, i) => (
              <div key={`${s.capabilityId}-${i}`} className="step ok">
                <span className="cap">{i + 1}. {s.capabilityId}</span>
              </div>
            ))}
          </div>

          {selectedEngine.configFields.length > 0 && (
            <>
              <h2>Configuration</h2>
              {selectedEngine.configFields.map((f) => (
                <div className="field" key={f.key}>
                  <label>{f.label}</label>
                  <input
                    type={f.type === "number" ? "number" : "text"}
                    value={String(configuration[f.key] ?? f.default)}
                    onChange={(ev) => setConfigField(f.key, f.type === "number" ? Number(ev.target.value) : ev.target.value)}
                  />
                </div>
              ))}
            </>
          )}

          <h2>Input</h2>
          <p className="tag">Fixed small synthetic dataset for this milestone — see Input below.</p>
          <Json value={selectedEngine.defaultInput} maxLen={800} />

          <div className="row" style={{ marginTop: 14 }}>
            <button className="primary" onClick={execute}>Execute</button>
          </div>

          {lastResult && lastResult.engineId === selectedEngine.id && (
            <div style={{ marginTop: 16 }}>
              <h2>Last result</h2>
              <div className="row" style={{ marginBottom: 8 }}>
                <span className={`pill ${lastResult.status}`}>{lastResult.status}</span>
                <span className="tag">{lastResult.durationMs.toFixed(2)}ms, {lastResult.steps.length} step(s)</span>
              </div>
              <p className="tag">See the Results tab for the full structured inspection, or Challenges to test it.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

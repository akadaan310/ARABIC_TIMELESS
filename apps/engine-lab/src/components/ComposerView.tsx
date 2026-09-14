import { useState } from "react";
import type { LabState } from "../state/useLab";
import { describeBinding, type PortBinding } from "../sdk/ports";

export function ComposerView({ lab }: { lab: LabState }) {
  const { capabilities, draft, compatibilityFor, addCapability, removeLast, moveStepUp, canSwap, engineName, setEngineName, saveDraftAsEngine } = lab;
  const [configuring, setConfiguring] = useState<string | undefined>();
  const [overrides, setOverrides] = useState<Record<string, PortBinding>>({});
  const [saved, setSaved] = useState<string | undefined>();

  const handleAdd = (capabilityId: string) => {
    const compat = compatibilityFor(capabilityId);
    if (compat.status === "incompatible") return;
    if (compat.status === "requires-configuration" && configuring !== capabilityId) {
      setConfiguring(capabilityId);
      setOverrides({});
      return;
    }
    addCapability(capabilityId, overrides);
    setConfiguring(undefined);
    setOverrides({});
  };

  const handleSave = () => {
    const engine = saveDraftAsEngine();
    setSaved(engine ? `${engine.name} saved as ${engine.id}` : undefined);
  };

  return (
    <div>
      <h1>Composer</h1>
      <p className="subtitle">
        Build an Engine from real capabilities: add one at a time. Compatibility is computed from actual
        input/output port contracts (sdk/ports.ts) — never from whether two boxes could just be visually connected.
      </p>

      <h2>Chain so far</h2>
      {draft.steps.length === 0 ? (
        <p className="empty">Empty — add a capability below to start.</p>
      ) : (
        draft.steps.map((step, i) => (
          <div className="step ok" key={`${step.capabilityId}-${i}`}>
            <div className="step-head">
              <span className="cap">{i + 1}. {step.capabilityId}</span>
              {i > 0 && (
                <button disabled={!canSwap(i)} onClick={() => moveStepUp(i)} title={canSwap(i) ? "swap with previous step" : "would break a dependency"}>
                  move up
                </button>
              )}
            </div>
            <div className="tag">
              {Object.entries(step.bindings).map(([port, binding]) => `${port} ← ${describeBinding(binding)}`).join(", ") || "(no data-port bindings — config only)"}
            </div>
          </div>
        ))
      )}
      {draft.steps.length > 0 && (
        <div className="row" style={{ margin: "8px 0" }}>
          <button onClick={removeLast}>Remove last step</button>
        </div>
      )}

      <h2>Add a capability</h2>
      {capabilities.map((c) => {
        const compat = compatibilityFor(c.id);
        return (
          <div className="panel" key={c.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{c.id}</strong>
              <span className={`pill ${compat.status}`}>{compat.status}</span>
            </div>
            {compat.status === "incompatible" && compat.missingPorts.length > 0 && (
              <p className="tag" style={{ color: "var(--red)" }}>missing: {compat.missingPorts.join(", ")}</p>
            )}
            {configuring === c.id && compat.ambiguousPorts.length > 0 && (
              <div style={{ margin: "8px 0" }}>
                {compat.resolutions.filter((r) => compat.ambiguousPorts.includes(r.portKey)).map((r) => (
                  <div className="field" key={r.portKey}>
                    <label>{r.portKey} ← which source?</label>
                    <select
                      value={overrides[r.portKey] ? describeBinding(overrides[r.portKey]) : ""}
                      onChange={(ev) => {
                        const chosen = r.candidates.find((cand) => describeBinding(cand) === ev.target.value);
                        if (chosen) setOverrides((prev) => ({ ...prev, [r.portKey]: chosen }));
                      }}
                    >
                      <option value="" disabled>select a source</option>
                      {r.candidates.map((cand) => (
                        <option key={describeBinding(cand)} value={describeBinding(cand)}>{describeBinding(cand)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
            <div className="row" style={{ marginTop: 8 }}>
              <button
                disabled={compat.status === "incompatible"}
                onClick={() => handleAdd(c.id)}
              >
                {configuring === c.id ? "Confirm add" : "Add"}
              </button>
            </div>
          </div>
        );
      })}

      <h2>Save</h2>
      <div className="field">
        <label>Engine name</label>
        <input type="text" value={engineName} onChange={(ev) => setEngineName(ev.target.value)} placeholder="e.g. My Relation Probe" />
      </div>
      <div className="row">
        <button className="primary" disabled={draft.steps.length === 0 || !engineName.trim()} onClick={handleSave}>
          Save Engine
        </button>
      </div>
      {saved && <p className="tag" style={{ marginTop: 8 }}>{saved} — see the Engines tab. Re-saving under the same name creates a new version, never overwrites.</p>}
    </div>
  );
}

import { useState } from "react";
import type { LabState } from "../state/useLab";
import { Json } from "./Json";
import { compareExecutions } from "../sdk/compare";
import type { ExecutionResult } from "../sdk/types";

function stepsSignature(r: ExecutionResult) {
  return r.steps.map((s) => ({ capabilityId: s.capabilityId, output: s.output, error: s.error }));
}

export function ExperimentsView({ lab }: { lab: LabState }) {
  const { experiments, selectedExperimentId, setSelectedExperimentId, replayExperiment } = lab;
  const [replay, setReplay] = useState<{ matches: boolean; replay: ExecutionResult } | undefined>();
  const [compareId, setCompareId] = useState<string>("");

  const selected = experiments.find((e) => e.id === selectedExperimentId);
  const compareWith = experiments.find((e) => e.id === compareId);
  const comparison = selected && compareWith ? compareExecutions(selected, compareWith) : undefined;

  return (
    <div>
      <h1>Experiments</h1>
      <p className="subtitle">Every recorded run: input, configuration, result, and challenges — retained for replay and comparison.</p>

      {experiments.length === 0 ? (
        <p className="empty">No experiments recorded yet. Execute an Engine and save its result.</p>
      ) : (
        experiments.map((e) => (
          <div
            key={e.id}
            className={`list-item ${e.id === selectedExperimentId ? "selected" : ""}`}
            onClick={() => { setSelectedExperimentId(e.id); setReplay(undefined); }}
          >
            <div>
              <div className="name">{e.id}</div>
              <div className="meta">{e.engineId} @ v{e.engineVersion} — {e.createdAt}</div>
            </div>
            <div className="row">
              <span className={`pill ${e.result.status}`}>{e.result.status}</span>
              {e.challenges.map((c) => <span key={c.challengeId} className={`pill ${c.verdict.toLowerCase()}`}>{c.verdict}</span>)}
            </div>
          </div>
        ))
      )}

      {selected && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Detail — {selected.id}</h2>
          <Json value={{ input: selected.input, configuration: selected.configuration }} maxLen={800} />

          <div className="row" style={{ marginTop: 10 }}>
            <button onClick={() => setReplay(replayExperiment(selected.id))}>Replay</button>
            <select value={compareId} onChange={(ev) => setCompareId(ev.target.value)}>
              <option value="">— compare with —</option>
              {experiments.filter((e) => e.id !== selected.id).map((e) => (
                <option key={e.id} value={e.id}>{e.id} ({e.engineId})</option>
              ))}
            </select>
          </div>

          {replay && (
            <div style={{ marginTop: 12 }}>
              <div className="row">
                <span className="tag">Replay determinism:</span>
                <span className={`pill ${replay.matches ? "pass" : "fail"}`}>{replay.matches ? "MATCHES" : "DIVERGED"}</span>
              </div>
              {!replay.matches && <Json value={stepsSignature(replay.replay)} maxLen={1200} />}
            </div>
          )}

          {comparison && (
            <div style={{ marginTop: 12 }}>
              <h2>Comparison with {compareWith!.id}</h2>
              {!comparison.sameEngine && (
                <p className="tag">Different engines ({comparison.engineA.id} v{comparison.engineA.version} vs {comparison.engineB.id} v{comparison.engineB.version}).</p>
              )}
              <div className="grid">
                <div>
                  <label>configuration — {selected.id}</label>
                  <Json value={comparison.configurationA} maxLen={500} />
                </div>
                <div>
                  <label>configuration — {compareWith!.id}</label>
                  <Json value={comparison.configurationB} maxLen={500} />
                </div>
              </div>

              <label style={{ marginTop: 10 }}>steps</label>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ color: "var(--ink-3)", textAlign: "left" }}>
                    <th>#</th><th>{selected.id}</th><th>{compareWith!.id}</th><th>—</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.steps.map((row) => (
                    <tr key={row.index} style={{ borderTop: "1px solid var(--line)" }}>
                      <td>{row.index + 1}</td>
                      <td>{row.capabilityA ?? "—"}</td>
                      <td>{row.capabilityB ?? "—"}</td>
                      <td><span className={`pill ${row.same ? "pass" : "fail"}`}>{row.same ? "MATCH" : "DIFFERS"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {comparison.challenges.length > 0 && (
                <>
                  <label style={{ marginTop: 10 }}>challenges</label>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ color: "var(--ink-3)", textAlign: "left" }}>
                        <th>challenge</th><th>{selected.id}</th><th>{compareWith!.id}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.challenges.map((row) => (
                        <tr key={row.challengeId} style={{ borderTop: "1px solid var(--line)" }}>
                          <td>{row.challengeId}</td>
                          <td>{row.verdictA ? <span className={`pill ${row.verdictA.toLowerCase()}`}>{row.verdictA}</span> : "—"}</td>
                          <td>{row.verdictB ? <span className={`pill ${row.verdictB.toLowerCase()}`}>{row.verdictB}</span> : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

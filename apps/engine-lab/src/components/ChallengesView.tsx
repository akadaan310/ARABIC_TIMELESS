import { listChallenges } from "../sdk/challenges";
import type { LabState } from "../state/useLab";
import { Json } from "./Json";

export function ChallengesView({ lab }: { lab: LabState }) {
  const { lastResult, applicableChallenges, challenge, lastChallenges } = lab;
  const all = listChallenges();

  return (
    <div>
      <h1>Challenges</h1>
      <p className="subtitle">A challenge is another real computation applied to a result. Every outcome is PASS, FAIL, or INCONCLUSIVE with evidence attached.</p>

      <h2>Catalog</h2>
      {all.map((c) => (
        <div className="panel" key={c.id}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>{c.label}</strong>
            <span className="tag">{c.category}</span>
          </div>
          <p className="tag" style={{ margin: "6px 0" }}>{c.description}</p>
        </div>
      ))}

      <h2>Run against the last result</h2>
      {!lastResult ? (
        <p className="empty">No result to challenge yet — execute an Engine first.</p>
      ) : lastResult.status !== "success" ? (
        <p className="empty">The last result errored — fix the run before challenging it.</p>
      ) : applicableChallenges.length === 0 ? (
        <p className="empty">No challenges apply to engine "{lastResult.engineId}".</p>
      ) : (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            {applicableChallenges.map((c) => (
              <button key={c.id} onClick={() => challenge(c.id)}>{c.label}</button>
            ))}
          </div>
          {lastChallenges.map((outcome) => (
            <div className="panel" key={outcome.challengeId}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{outcome.challengeId}</strong>
                <span className={`pill ${outcome.verdict.toLowerCase()}`}>{outcome.verdict}</span>
              </div>
              <p className="tag" style={{ margin: "6px 0" }}>{outcome.summary}</p>
              <Json value={outcome.evidence} maxLen={1200} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

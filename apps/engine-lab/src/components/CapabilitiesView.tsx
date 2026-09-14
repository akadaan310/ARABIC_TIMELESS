import type { Capability } from "../../../../packages/capability/index";

export function CapabilitiesView({ capabilities }: { capabilities: readonly Capability[] }) {
  return (
    <div>
      <h1>Capabilities</h1>
      <p className="subtitle">
        A live read of every capability registered through the SDK's own @engine/capability package —
        not a hard-coded feature list. Each one wraps a real, independently-tested function from packages/*.
      </p>
      {capabilities.map((c) => (
        <div className="panel" key={c.id}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>{c.id}</strong>
            <span className={`pill ${c.status.toLowerCase()}`}>{c.status}</span>
          </div>
          <div className="tag" style={{ margin: "6px 0" }}>{c.label.en} — substrate: {c.substrate}</div>
          <div className="row">
            <span className="tag">in: {c.input}</span>
            <span className="tag">out: {c.output}</span>
          </div>
          {c.constraints.length > 0 && (
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--ink-3)", fontSize: 11 }}>
              {c.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

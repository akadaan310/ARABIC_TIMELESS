import { useState } from "react";
import { useLab } from "./state/useLab";
import { CapabilitiesView } from "./components/CapabilitiesView";
import { EnginesView } from "./components/EnginesView";
import { ResultView } from "./components/ResultView";
import { ChallengesView } from "./components/ChallengesView";
import { ExperimentsView } from "./components/ExperimentsView";
import { DiscoveryView } from "./components/DiscoveryView";

const TABS = ["Capabilities", "Engines", "Results", "Challenges", "Experiments", "Discovery"] as const;
type Tab = (typeof TABS)[number];

export default function App() {
  const lab = useLab();
  const [tab, setTab] = useState<Tab>("Engines");

  return (
    <div className="lab">
      <nav className="sidebar">
        <div className="brand">EngineLab<small>ENGINE SDK LABORATORY</small></div>
        {TABS.map((t) => (
          <button key={t} className={`nav-item ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>
      <main className="main">
        {tab === "Capabilities" && <CapabilitiesView capabilities={lab.capabilities} />}
        {tab === "Engines" && <EnginesView lab={lab} />}
        {tab === "Results" && <ResultView lab={lab} />}
        {tab === "Challenges" && <ChallengesView lab={lab} />}
        {tab === "Experiments" && <ExperimentsView lab={lab} />}
        {tab === "Discovery" && <DiscoveryView lab={lab} />}
      </main>
    </div>
  );
}

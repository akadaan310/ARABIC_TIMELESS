import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

/**
 * Finds #root if the host page already provides one (standalone dev/preview
 * — see index.html), otherwise creates it fresh and appends it to <body>.
 * The "create it ourselves" path matters when EngineLab is mounted inside
 * another app's React tree (see the root arabic-timeless app's app/page.tsx):
 * a server-rendered `<div id="root">` living inside THAT app's own
 * hydration tree can race its hydration pass and get wiped when EngineLab's
 * mutations are mistaken for a hydration mismatch. A div EngineLab creates
 * itself, after the host page has already loaded, was never part of the
 * host's server-rendered tree, so nothing can ever "hydrate" it away.
 */
function mountPoint(): HTMLElement {
  const existing = document.getElementById("root");
  if (existing) return existing;
  const created = document.createElement("div");
  created.id = "root";
  document.body.appendChild(created);
  return created;
}

ReactDOM.createRoot(mountPoint()).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

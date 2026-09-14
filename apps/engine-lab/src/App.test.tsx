import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import App from "./App";

function addCapabilityFromComposer(capabilityId: string) {
  const heading = screen.getByText(capabilityId);
  const panel = heading.closest(".panel") as HTMLElement;
  fireEvent.click(within(panel).getByRole("button", { name: /Add/ }));
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("App", () => {
  it("opens on Engines and lists the real registered engines", () => {
    render(<App />);
    expect(screen.getByText("EngineLab")).toBeInTheDocument();
    expect(screen.getByText(/Canonical Chain/)).toBeInTheDocument();
    expect(screen.getByText(/Invertibility Probe/)).toBeInTheDocument();
  });

  it("shows real capabilities on the Capabilities tab", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Capabilities" }));
    expect(screen.getByText("corpus.join")).toBeInTheDocument();
    expect(screen.getByText("traversal.walk")).toBeInTheDocument();
  });

  it("executes the default Engine and shows a real structured result", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Execute" }));
    fireEvent.click(screen.getByRole("button", { name: "Results" }));
    expect(screen.getByText(/canonical-chain @ v/)).toBeInTheDocument();
    expect(screen.getAllByText("success").length).toBeGreaterThan(0);
  });

  it("runs a challenge against a fresh result and records the outcome", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Execute" }));
    fireEvent.click(screen.getByRole("button", { name: "Challenges" }));
    fireEvent.click(screen.getByRole("button", { name: /Basis locality/ }));
    expect(screen.getByText("basis-locality")).toBeInTheDocument();
    expect(screen.getByText("PASS")).toBeInTheDocument();
  });

  it("saves an experiment and it appears in Experiment history", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Execute" }));
    fireEvent.click(screen.getByRole("button", { name: "Results" }));
    fireEvent.click(screen.getByRole("button", { name: /Save as Experiment/ }));
    fireEvent.click(screen.getByRole("button", { name: "Experiments" }));
    expect(screen.getByText(/canonical-chain @ v/)).toBeInTheDocument();
  });

  it("replays a saved experiment and reports it matches (deterministic)", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Execute" }));
    fireEvent.click(screen.getByRole("button", { name: "Results" }));
    fireEvent.click(screen.getByRole("button", { name: /Save as Experiment/ }));
    fireEvent.click(screen.getByRole("button", { name: "Experiments" }));
    const items = document.querySelectorAll(".list-item");
    fireEvent.click(items[0]);
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(screen.getByText("MATCHES")).toBeInTheDocument();
  });

  it("composes a new Engine from capabilities, saves it, and executes it — the composition milestone's core flow", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Composer" }));
    expect(screen.getByText("Empty — add a capability below to start.")).toBeInTheDocument();

    addCapabilityFromComposer("corpus.join");
    addCapabilityFromComposer("structure.classify");
    expect(screen.getByText("2. structure.classify")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/My Relation Probe/), { target: { value: "UI Composed Probe" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Engine" }));
    expect(screen.getByText(/UI Composed Probe saved as custom-ui-composed-probe-v1/)).toBeInTheDocument();

    // saving auto-selects the new Engine on the Engines tab
    fireEvent.click(screen.getByRole("button", { name: "Engines" }));
    expect(screen.getByText(/UI Composed Probe/)).toBeInTheDocument();
    expect(screen.getByText("composed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Execute" }));

    fireEvent.click(screen.getByRole("button", { name: "Results" }));
    expect(screen.getByText(/custom-ui-composed-probe-v1 @ v1/)).toBeInTheDocument();
    expect(screen.getAllByText("success").length).toBeGreaterThan(0);
  });

  it("refuses to add an incompatible capability from the Composer", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Composer" }));
    const heading = screen.getByText("traversal.walk");
    const panel = heading.closest(".panel") as HTMLElement;
    expect(within(panel).getByText("incompatible")).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Add" })).toBeDisabled();
  });
});

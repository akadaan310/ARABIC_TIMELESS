import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

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
});

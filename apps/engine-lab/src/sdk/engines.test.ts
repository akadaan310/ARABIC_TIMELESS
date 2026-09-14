import { describe, expect, it } from "vitest";
import { listEngines, getEngine, CAPABILITY_RUNNERS } from "./engines";
import { listCapabilities } from "./capabilities";

describe("engine registry", () => {
  it("registers the 3 real engines with distinct ids", () => {
    const ids = listEngines().map((e) => e.id);
    expect(ids).toEqual(["canonical-chain", "invertibility-probe", "shape-probe"]);
  });

  it("getEngine finds by id, undefined for unknown", () => {
    expect(getEngine("canonical-chain")?.name).toBe("Canonical Chain");
    expect(getEngine("does-not-exist")).toBeUndefined();
  });

  it("every engine step references a capability that is both registered and runnable", () => {
    const knownIds = new Set(listCapabilities().map((c) => c.id));
    for (const engine of listEngines()) {
      for (const step of engine.steps) {
        expect(knownIds.has(step.capabilityId)).toBe(true);
        expect(typeof CAPABILITY_RUNNERS[step.capabilityId]).toBe("function");
      }
    }
  });

  it("canonical-chain and shape-probe compose the same capabilities differently", () => {
    const chain = getEngine("canonical-chain")!.steps.map((s) => s.capabilityId);
    const shape = getEngine("shape-probe")!.steps.map((s) => s.capabilityId);
    expect(chain).toContain("structure.classify");
    expect(shape).toContain("structure.classify");
    expect(chain.length).toBeGreaterThan(shape.length);
  });
});

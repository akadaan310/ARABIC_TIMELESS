import { describe, expect, it } from "vitest";
import { registerCapability, capability, capabilities } from "./index";

describe("@engine/capability", () => {
  it("returns an honest UNAVAILABLE result for an unregistered id, never throws", () => {
    const result = capability("does-not-exist");
    expect(result).toEqual({ id: "does-not-exist", status: "UNAVAILABLE", reason: "no such capability is declared" });
  });

  it("declares an implemented-but-not-yet-shipped capability honestly, with a reason", () => {
    registerCapability({
      id: "traverse.join",
      label: { en: "Join two traversals" },
      substrate: "engine",
      operators: ["joinWith"],
      input: "Traversal, Traversal",
      output: "Locus | null",
      constraints: [],
      reversible: false,
      provenance: "packages/traversal",
      status: "UNAVAILABLE",
      reason: "not wired into the CLI yet",
    });
    const found = capability("traverse.join");
    expect(found.status).toBe("UNAVAILABLE");
    expect((found as { reason?: string }).reason).toBe("not wired into the CLI yet");
    expect(capabilities().some((c) => c.id === "traverse.join")).toBe(true);
  });
});

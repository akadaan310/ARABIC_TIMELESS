import { describe, expect, it } from "vitest";
import { registerRelationKind, relationKind, relationKinds, type Relation } from "./index";
import { ayahLocus } from "../corpus";
import { makeProvenance } from "../provenance";

describe("@engine/relation", () => {
  it("kind is extensible via registration, not a closed enum", () => {
    registerRelationKind({ kind: "root-echo", label: { en: "Root echo" }, description: "shared root" });
    expect(relationKind("root-echo")?.label.en).toBe("Root echo");
    expect(relationKinds().some((k) => k.kind === "root-echo")).toBe(true);
  });

  it("carries an epistemic type distinct from weight/score", () => {
    const relation: Relation<{ sharedRoot: string }> = {
      id: "r1",
      kind: "root-echo",
      endpoints: [ayahLocus(2, 255), ayahLocus(24, 35)],
      weight: 0.8,
      evidence: { sharedRoot: "ن و ر" },
      epistemicType: "textual",
      provenance: makeProvenance({
        source: "root-index", operation: "detect", algorithm: "root-return",
        corpusVersion: "tanzil-1.0", engineVersion: "0.1.0",
      }),
    };
    expect(relation.epistemicType).toBe("textual");
    expect(relation.endpoints).toHaveLength(2);
  });
});

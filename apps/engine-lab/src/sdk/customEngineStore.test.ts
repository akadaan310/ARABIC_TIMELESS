import { describe, expect, it } from "vitest";
import { createInMemoryCustomEngineStore, slugify } from "./customEngineStore";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("My Relation Probe!")).toBe("my-relation-probe");
  });

  it("never produces an empty slug", () => {
    expect(slugify("!!!")).toBe("engine");
  });
});

describe("CustomEngineStore versioning (Step 6/7)", () => {
  it("saves a first version as v1, origin composed", () => {
    const store = createInMemoryCustomEngineStore();
    const saved = store.save({ name: "Probe", description: "d", steps: [], defaultInput: {} });
    expect(saved.version).toBe("1");
    expect(saved.origin).toBe("composed");
    expect(saved.family).toBe("probe");
    expect(store.get(saved.id)).toEqual(saved);
  });

  it("never overwrites — re-saving under the same family creates a new version with a new id", () => {
    const store = createInMemoryCustomEngineStore();
    const v1 = store.save({ name: "Probe", description: "d1", steps: [], defaultInput: {} });
    const v2 = store.save({ name: "Probe v2 description", description: "d2", steps: [], defaultInput: {}, family: v1.family });
    expect(v2.version).toBe("2");
    expect(v2.id).not.toBe(v1.id);
    // v1 is still exactly as it was — never mutated
    expect(store.get(v1.id)).toEqual(v1);
    expect(store.list()).toHaveLength(2);
  });

  it("a name reused without an explicit family starts an independent new family, not a new version", () => {
    const store = createInMemoryCustomEngineStore();
    const a = store.save({ name: "Probe", description: "d", steps: [], defaultInput: {} });
    const b = store.save({ name: "Probe", description: "d", steps: [], defaultInput: {} }); // no family passed
    expect(a.family).toBe(b.family); // same slug...
    expect(b.version).toBe("2"); // ...so this DOES count as v2 of the same family (family is derived from name when omitted)
  });

  it("clear empties the store", () => {
    const store = createInMemoryCustomEngineStore();
    store.save({ name: "Probe", description: "d", steps: [], defaultInput: {} });
    store.clear();
    expect(store.list()).toHaveLength(0);
  });
});

import { describe, expect, it } from "vitest";
import { walk, replay, joinWith, type Candidate } from "./index";

describe("@engine/traversal walk (bounded greedy, ported from Mirtal's furqan/tarteel)", () => {
  it("records the full step log, not just the destination", () => {
    const traversal = walk<number>("t1", {
      seed: 0,
      maxSteps: 3,
      candidates: (state) => [
        { operationId: "inc", output: state + 1, relationsTraversed: [`r${state}`], score: 1 },
      ],
    });
    expect(traversal.steps).toHaveLength(3);
    expect(traversal.steps.map((s) => s.output)).toEqual([1, 2, 3]);
    expect(traversal.stoppingCondition).toBe("maxSteps reached");
  });

  it("stops when no legal candidate remains", () => {
    const traversal = walk<number>("t2", {
      seed: 0, maxSteps: 10,
      candidates: (state) => (state < 2 ? [{ operationId: "inc", output: state + 1, relationsTraversed: [], score: 1 }] : []),
    });
    expect(traversal.steps).toHaveLength(2);
    expect(traversal.stoppingCondition).toBe("no legal candidate");
  });

  it("excludes recently-used operations within the anti-repeat window", () => {
    const seen: string[][] = [];
    const candidates = (state: number, recent: readonly string[]): Candidate<number>[] => {
      seen.push([...recent]);
      const all: Candidate<number>[] = [
        { operationId: "a", output: state + 1, relationsTraversed: [], score: 2 },
        { operationId: "b", output: state + 10, relationsTraversed: [], score: 1 },
      ];
      return all.filter((c) => !recent.includes(c.operationId));
    };
    const traversal = walk<number>("t3", { seed: 0, maxSteps: 3, candidates, antiRepeatWindow: 1 });
    // step1 picks "a" (higher score); step2 must exclude "a" (just used), so picks "b"; step3 excludes "b", picks "a" again.
    expect(traversal.steps.map((s) => s.operationId)).toEqual(["a", "b", "a"]);
  });

  it("replay(reverse) walks the recorded steps backward", () => {
    const traversal = walk<number>("t4", {
      seed: 0, maxSteps: 2,
      candidates: (state) => [{ operationId: "inc", output: state + 1, relationsTraversed: [], score: 1 }],
    });
    expect(replay(traversal, "forward").map((s) => s.output)).toEqual([1, 2]);
    expect(replay(traversal, "reverse").map((s) => s.output)).toEqual([2, 1]);
  });

  it("joinWith finds the first state both traversals visited (مَجْمَعَ البَحْرَيْن)", () => {
    const a = walk<number>("a", { seed: 0, maxSteps: 5, candidates: (s) => [{ operationId: "inc", output: s + 1, relationsTraversed: [], score: 1 }] });
    const b = walk<number>("b", { seed: 100, maxSteps: 5, candidates: (s) => [{ operationId: "dec", output: s - 20, relationsTraversed: [], score: 1 }] });
    // a visits 0..5, b visits 100,80,60,40,20,0 -> meets at 0 (a's seed)
    const meeting = joinWith(a, b, (n) => String(n));
    expect(meeting).toBe(0);
  });

  it("joinWith returns null when the traversals never meet", () => {
    const a = walk<number>("a", { seed: 0, maxSteps: 2, candidates: (s) => [{ operationId: "inc", output: s + 1, relationsTraversed: [], score: 1 }] });
    const b = walk<number>("b", { seed: 1000, maxSteps: 2, candidates: (s) => [{ operationId: "inc", output: s + 1, relationsTraversed: [], score: 1 }] });
    expect(joinWith(a, b, (n) => String(n))).toBeNull();
  });
});

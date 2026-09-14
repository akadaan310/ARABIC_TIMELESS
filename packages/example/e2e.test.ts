/**
 * Canonical end-to-end example (Mission §25): a small, executable,
 * synthetic scenario chaining every stage of the canonical chain —
 *
 *   Corpus locus -> Observable -> Relation -> Discovery -> Structure
 *     -> Operation/Traversal -> Provenance
 *
 * Deliberately synthetic data (toy strings, not real corpus text): the
 * point of this test is to prove the chain composes and is replayable, not
 * to assert any fact about the Qur'an. Real corpus wiring is future work
 * (see ARCHITECTURE.md §12 UNRESOLVED).
 */
import { describe, expect, it } from "vitest";
import { wordLocus, buildLocusJoin, locusKey, type Locus } from "../corpus";
import { verifyInvertibility, type Observable, type Transform } from "../arabic";
import { registerRelationKind, type Relation } from "../relation";
import { reconcileState, type Discovery } from "../discovery";
import { shapeOf, describeStructure, type Vec3 } from "../structure";
import { walk, replay, joinWith } from "../traversal";
import { makeProvenance } from "../provenance";

const ENGINE_VERSION = "0.1.0-e2e-example";
const CORPUS_VERSION = "synthetic-1.0";

describe("ENGINE SDK canonical chain — executable end-to-end example", () => {
  it("corpus locus -> observable -> relation -> discovery -> structure -> traversal -> provenance", () => {
    // 1. Corpus locus: four synthetic word-level loci with synthetic subjects.
    const loci: Locus[] = [
      wordLocus(1, 1, 1), wordLocus(1, 1, 2), wordLocus(2, 5, 1), wordLocus(3, 9, 1),
    ];
    const subjects = ["abcab", "babca", "xyz", "abcab"]; // 0 and 3 share a skeleton
    const join = buildLocusJoin(loci.map((locus, i) => ({ locus, target: subjects[i] })));
    expect(join.placed.size).toBe(4);

    // 2. Observable: a toy "skeleton" reading (sorted unique letters) plus a
    // Transform (string reversal) whose invertibility we actually verify —
    // not merely declare, per the confirmed gap in EXTRACTION_LEDGER.md §F2.
    const skeleton: Observable<string, string> = {
      id: "skeleton", label: { en: "Skeleton" },
      compute: (s) => [...new Set(s.split(""))].sort().join(""),
      serialize: (v) => v, display: (v) => v,
      lossAccounting: { preserved: ["letter identity"], discarded: ["order", "repetition count"] },
    };
    const reverseStr: Transform<string> = {
      id: "reverse-str", label: { en: "Reverse" }, apply: (s) => [...s].reverse().join(""),
      invertibilityClaim: "invertible", lossAccounting: { preserved: ["all"], discarded: [] },
    };
    const invertibility = verifyInvertibility({
      transformId: reverseStr.id, claim: reverseStr.invertibilityClaim,
      apply: reverseStr.apply, invert: reverseStr.apply, // reverse is self-inverse
      samples: subjects, equals: (a, b) => a === b,
    });
    expect(invertibility.verdict).toBe("confirmed");

    // 3. Relation: loci 0 and 3 share a skeleton -> a textual (نصّي) relation,
    // settled by the data alone, not a perceptual judgment.
    registerRelationKind({ kind: "shared-skeleton", label: { en: "Shared skeleton" }, description: "same sorted-unique-letter set" });
    const relationProvenance = makeProvenance({
      source: "skeleton-index", operation: "detect", algorithm: "shared-skeleton-match",
      corpusVersion: CORPUS_VERSION, engineVersion: ENGINE_VERSION,
      bounds: { minSharedLength: 3 },
    });
    const relation: Relation<{ skeleton: string }> = {
      id: "rel-0-3", kind: "shared-skeleton", endpoints: [loci[0], loci[3]],
      weight: 1.0, evidence: { skeleton: skeleton.compute(subjects[0]) },
      epistemicType: "textual", provenance: relationProvenance,
    };
    expect(skeleton.compute(subjects[0])).toBe(skeleton.compute(subjects[3]));
    expect(relation.epistemicType).toBe("textual");

    // 4. Discovery: wrap the relation in a bound-relative lifecycle record.
    const discovery: Discovery<Relation> = {
      id: "disc-1", generatedBy: "shared-skeleton-match", parents: [],
      score: relation.weight, bounds: { minSharedLength: 3 },
      engineVersion: ENGINE_VERSION, corpusVersion: CORPUS_VERSION,
      evidence: relation, epistemicType: "textual", state: "EXHAUSTED",
      provenance: relationProvenance,
    };
    // Tightening the bound (minSharedLength 3 -> 5) invalidates the
    // EXHAUSTED claim — it demotes to KNOWN (stale), never stays EXHAUSTED
    // under bounds it was never actually checked against (ledger §D2/§D3).
    expect(reconcileState(discovery, { minSharedLength: 5 })).toBe("KNOWN");
    expect(reconcileState(discovery, { minSharedLength: 3 })).toBe("EXHAUSTED");

    // 5. Structure: PCA shape over a synthetic embedding placing the related
    // loci close together and the unrelated one far away.
    const points: Vec3[] = [[0, 0, 0], [5, 5, 5], [50, 0, 0], [0.1, 0, 0]]; // loci[0] and loci[3] are close
    const structure = describeStructure({
      members: [locusKey(loci[0]), locusKey(loci[3])],
      points: [points[0], points[3]],
      basisId: "synthetic-basis", algorithm: "pca-jacobi", confidence: 0.9,
      supportingRelations: [relation.id],
    });
    expect(structure.basisId).toBe("synthetic-basis"); // never a bare, basis-less claim (Mission §8)
    expect(shapeOf([points[0], points[3]]).linearity).toBeGreaterThanOrEqual(0);

    // 6. Traversal: walk from locus[0] to locus[3] across the one relation,
    // recording the full step (not just the destination), then replay it and
    // join it with a second traversal that starts from the far end.
    const adjacency = new Map([[locusKey(loci[0]), [{ to: loci[3], relationId: relation.id }]]]);
    const traversal = walk<Locus>("t-forward", {
      seed: loci[0], maxSteps: 3,
      candidates: (state) => (adjacency.get(locusKey(state)) ?? []).map((edge) => ({
        operationId: "hamal", // Mirtal's ops.py carry-across operator, ledger §G1
        output: edge.to, relationsTraversed: [edge.relationId], score: 1,
      })),
    });
    expect(traversal.steps).toHaveLength(1);
    expect(locusKey(traversal.steps[0].output)).toBe(locusKey(loci[3]));
    expect(replay(traversal, "reverse")[0]).toBe(traversal.steps[0]);

    const backward = walk<Locus>("t-backward", {
      seed: loci[3], maxSteps: 1, candidates: () => [], // nowhere to go — meets by starting point only
    });
    const meeting = joinWith(traversal, backward, locusKey);
    expect(meeting && locusKey(meeting)).toBe(locusKey(loci[3])); // مَجْمَعَ البَحْرَيْن

    // 7. Provenance: every derived object in this chain answers "why does
    // this object exist?" without an anonymous derived fact anywhere.
    for (const p of [relation.provenance, discovery.provenance]) {
      expect(p.algorithm).toBeTruthy();
      expect(p.corpusVersion).toBe(CORPUS_VERSION);
      expect(p.engineVersion).toBe(ENGINE_VERSION);
    }
  });
});

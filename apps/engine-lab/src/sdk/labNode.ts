/**
 * EngineLab's one shared data shape, built entirely from real Engine SDK
 * types (Locus, Vec3) plus a synthetic subject string. Every capability in
 * this app operates on collections of these — deliberately small and
 * synthetic, the same discipline the SDK's own tests and e2e example use
 * (see ../../../../packages/example/e2e.test.ts): the point is to prove the
 * SDK computes for real, not to assert anything about real corpus content.
 */
import type { Locus } from "../../../../packages/corpus/index";
import type { Vec3 } from "../../../../packages/structure/index";

export interface LabNode {
  readonly locus: Locus;
  readonly subject: string;
  readonly position: Vec3;
}

/** A small default dataset so EngineLab has something real to run against
 * the moment it opens, with no server and no corpus file required. */
export const DEFAULT_NODES: readonly LabNode[] = [
  { locus: { granularity: "word", surah: 1, ayah: 1, word: 1 }, subject: "abcab", position: [0, 0, 0] },
  { locus: { granularity: "word", surah: 1, ayah: 1, word: 2 }, subject: "babca", position: [0.2, 0.1, 0] },
  { locus: { granularity: "word", surah: 2, ayah: 5, word: 1 }, subject: "xyzxy", position: [10, 10, 10] },
  { locus: { granularity: "word", surah: 3, ayah: 9, word: 1 }, subject: "abcab", position: [0.1, 0, 0.1] },
  { locus: { granularity: "word", surah: 4, ayah: 2, word: 1 }, subject: "qrstu", position: [20, -5, 3] },
  { locus: { granularity: "word", surah: 5, ayah: 12, word: 1 }, subject: "bacab", position: [0, 0.15, 0.05] },
];

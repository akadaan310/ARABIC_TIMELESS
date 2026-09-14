/**
 * @engine/discovery — the single highest-confidence extraction in the whole
 * evidence base (EXTRACTION_LEDGER.md §D2). isnaad has NO discovery lifecycle
 * at all (confirmed absent, §D1: flat, stateless, score-sorted arrays only).
 * Mirtal independently converges on almost exactly the states this mission
 * requires — UNEXPLORED / KNOWN / EXHAUSTED / WITHHELD / INVALID — with the
 * critical, explicitly-commented design rule (majra.html:750-753):
 *
 *   "it never reports unexplored as exhausted... exhaustion is only ever
 *    made relative to the bounds in force."
 *
 * `reconcileState` below is that rule, ported and generalized: EXHAUSTED
 * demotes back to KNOWN the moment the bound signature it was computed under
 * no longer matches the current one.
 */

import { boundsMatch, type BoundSignature, type Provenance } from "../provenance";
import type { EpistemicType } from "../relation";

export type DiscoveryState = "UNEXPLORED" | "KNOWN" | "EXHAUSTED" | "WITHHELD" | "INVALID";

export interface Discovery<TEvidence = unknown> {
  readonly id: string;
  readonly generatedBy: string;
  readonly parents: readonly string[];
  readonly score: number;
  readonly bounds: BoundSignature;
  readonly engineVersion: string;
  readonly corpusVersion: string;
  readonly evidence: TEvidence;
  readonly epistemicType: EpistemicType;
  readonly state: DiscoveryState;
  readonly provenance: Provenance;
}

/**
 * Re-evaluate a stored EXHAUSTED (or KNOWN) discovery against the bound
 * signature currently in force. A discovery recorded EXHAUSTED under bounds
 * B1 is only still EXHAUSTED if the caller is asking under bounds
 * identical to B1; any change demotes it to KNOWN (stale) rather than
 * silently continuing to report exhaustion under looser or different bounds.
 * UNEXPLORED, WITHHELD and INVALID are untouched — this function only ever
 * demotes EXHAUSTED, never promotes anything to it (only an explicit search
 * that actually re-ran to completion may do that).
 */
export function reconcileState<T>(
  discovery: Discovery<T>,
  currentBounds: BoundSignature,
): DiscoveryState {
  if (discovery.state !== "EXHAUSTED") return discovery.state;
  return boundsMatch(discovery.bounds, currentBounds) ? "EXHAUSTED" : "KNOWN";
}

export interface DiscoverySummary {
  readonly total: number;
  readonly byState: Readonly<Record<DiscoveryState, number>>;
}

export function summarize(discoveries: ReadonlyArray<Discovery>): DiscoverySummary {
  const byState: Record<DiscoveryState, number> = {
    UNEXPLORED: 0, KNOWN: 0, EXHAUSTED: 0, WITHHELD: 0, INVALID: 0,
  };
  for (const d of discoveries) byState[d.state]++;
  return { total: discoveries.length, byState };
}

/**
 * The boundary set: candidates reachable from known/exhausted discoveries but
 * not themselves yet evaluated. Ported from Mirtal's discFrontier() pattern
 * (majra.html:875-886), generalized past its DMAX=4096/FRONT_MAX=500 caps —
 * callers pass their own cap.
 */
export function frontier(
  candidateIds: ReadonlyArray<string>,
  evaluatedIds: ReadonlySet<string>,
  cap: number,
): string[] {
  const out: string[] = [];
  for (const id of candidateIds) {
    if (evaluatedIds.has(id)) continue;
    out.push(id);
    if (out.length >= cap) break;
  }
  return out;
}

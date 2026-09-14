/**
 * @engine/capability — schema ported near-verbatim from Mirtal's `CAPS`
 * array (majra.html:770-835), including its "honest unavailability"
 * discipline: declare a capability that doesn't work yet, with a reason,
 * rather than omitting it silently (EXTRACTION_LEDGER.md §I1).
 *
 * REJECTED, deliberately, from Mirtal (ledger §I2): client-side `may()`
 * scope-gating as an authority mechanism. Direct code reading confirmed it
 * is bypassable from the browser console — the underlying data ships to the
 * client regardless of lock state. A `Capability.status` here may drive UI;
 * it must never be treated as a security boundary. Real enforcement belongs
 * at the server/runtime boundary, outside this package's scope entirely.
 */

export type CapabilityStatus = "KNOWN" | "DERIVED" | "UNAVAILABLE";

export interface Capability {
  readonly id: string;
  readonly label: { readonly en: string; readonly ar?: string };
  readonly substrate: string;
  readonly operators: readonly string[];
  readonly input: string;
  readonly output: string;
  readonly constraints: readonly string[];
  readonly reversible: boolean;
  readonly provenance: string;
  readonly status: CapabilityStatus;
  /** populated when status === "UNAVAILABLE" */
  readonly reason?: string;
}

export interface UnknownCapabilityResult {
  readonly id: string;
  readonly status: "UNAVAILABLE";
  readonly reason: "no such capability is declared";
}

const REGISTRY = new Map<string, Capability>();

export function registerCapability(capability: Capability): void {
  REGISTRY.set(capability.id, capability);
}

/** Mirtal's mirtal.capabilities(id?) — returns an honest UNAVAILABLE result
 * for an unknown id rather than throwing. */
export function capability(id: string): Capability | UnknownCapabilityResult {
  return REGISTRY.get(id) ?? { id, status: "UNAVAILABLE", reason: "no such capability is declared" };
}

export function capabilities(): readonly Capability[] {
  return [...REGISTRY.values()];
}

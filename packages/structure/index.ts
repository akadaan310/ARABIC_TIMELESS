/**
 * @engine/structure — PCA shape classifier, ported near-verbatim from isnaad
 * (src/lib/cosmos/structures.ts:58-130). Confirmed by direct reading to be a
 * genuine, correctly-implemented numerical method (24-sweep cyclic Jacobi
 * diagonalization of the 3x3 covariance matrix), not a stub — and fully
 * generic already: it operates on arbitrary point sets, nothing Qur'an-
 * specific in the algorithm itself (EXTRACTION_LEDGER.md §E1).
 *
 * Mission §8's requirement — "never return a bare statement such as 'this is
 * a filament' without saying under which basis, using which algorithm, with
 * which parameters, with what confidence" — is enforced by making every
 * field on `Structure` below mandatory, not optional.
 */

export type Vec3 = readonly [number, number, number];

export interface Shape {
  /** (λ1-λ2)/λ1 — near 1 is a filament */
  readonly linearity: number;
  /** (λ2-λ3)/λ1 — near 1 is a sheet */
  readonly planarity: number;
  /** λ3/λ1 — near 1 is a ball */
  readonly sphericity: number;
  readonly extent: number;
  readonly centroid: Vec3;
  readonly normal: Vec3;
}

/** PCA over a point set. Ported verbatim from isnaad's shapeOf, generalized
 * from indexed access into isnaad's global position array to a plain Vec3[]. */
export function shapeOf(points: readonly Vec3[]): Shape {
  const n = points.length;
  if (n === 0) throw new RangeError("shapeOf: at least one point is required");
  let cx = 0, cy = 0, cz = 0;
  for (const [x, y, z] of points) { cx += x / n; cy += y / n; cz += z / n; }
  const centroid: Vec3 = [cx, cy, cz];

  const cov = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  let extent = 0;
  for (const [x, y, z] of points) {
    const d = [x - cx, y - cy, z - cz];
    extent = Math.max(extent, Math.hypot(d[0], d[1], d[2]) * 2);
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) cov[a * 3 + b] += (d[a] * d[b]) / n;
  }

  const { values, vectors } = symmetricEigen(cov);
  const [l1, l2, l3] = values;
  const denom = l1 || 1;
  return {
    linearity: (l1 - l2) / denom,
    planarity: (l2 - l3) / denom,
    sphericity: l3 / denom,
    extent,
    centroid,
    normal: vectors[2],
  };
}

/**
 * Eigenvalues/eigenvectors of a symmetric 3x3 via Jacobi rotation, descending
 * by eigenvalue. Ported verbatim from isnaad's symmetricEigen — small enough
 * that a handful of sweeps converges without a linear-algebra dependency.
 */
function symmetricEigen(m: readonly number[]): { values: [number, number, number]; vectors: Vec3[] } {
  const a = [...m];
  const v = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (let sweep = 0; sweep < 24; sweep++) {
    let off = 0;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) off += a[i * 3 + j] ** 2;
    if (off < 1e-18) break;
    for (let p = 0; p < 3; p++) {
      for (let q = p + 1; q < 3; q++) {
        if (Math.abs(a[p * 3 + q]) < 1e-18) continue;
        const theta = (a[q * 3 + q] - a[p * 3 + p]) / (2 * a[p * 3 + q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        const rot = (x: number[]) => {
          for (let k = 0; k < 3; k++) {
            const xkp = x[k * 3 + p];
            const xkq = x[k * 3 + q];
            x[k * 3 + p] = c * xkp - s * xkq;
            x[k * 3 + q] = s * xkp + c * xkq;
          }
        };
        rot(a);
        for (let k = 0; k < 3; k++) {
          const apk = a[p * 3 + k];
          const aqk = a[q * 3 + k];
          a[p * 3 + k] = c * apk - s * aqk;
          a[q * 3 + k] = s * apk + c * aqk;
        }
        rot(v);
      }
    }
  }
  const order = [0, 1, 2].sort((x, y) => a[y * 3 + y] - a[x * 3 + x]);
  return {
    values: order.map((i) => Math.max(0, a[i * 3 + i])) as [number, number, number],
    vectors: order.map((i) => [v[i], v[3 + i], v[6 + i]] as Vec3),
  };
}

export interface Structure {
  readonly members: readonly string[];
  readonly shape: Shape;
  /** which Embedding (see @engine/spatial) this was computed under — mandatory */
  readonly basisId: string;
  readonly algorithm: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly confidence: number;
  readonly supportingRelations: readonly string[];
}

/**
 * Build a Structure result, enforcing that basis/algorithm/parameters are
 * always attached — the structural fix for the exact bug class documented in
 * EXTRACTION_LEDGER.md §E3 (a real system currently ships an unevaluated
 * embedding as its default and only labels the evaluated one on request).
 */
export function describeStructure(input: {
  members: readonly string[];
  points: readonly Vec3[];
  basisId: string;
  algorithm: string;
  parameters?: Readonly<Record<string, unknown>>;
  confidence: number;
  supportingRelations: readonly string[];
}): Structure {
  return {
    members: input.members,
    shape: shapeOf(input.points),
    basisId: input.basisId,
    algorithm: input.algorithm,
    parameters: input.parameters ?? {},
    confidence: input.confidence,
    supportingRelations: input.supportingRelations,
  };
}

/** Small constructors so each layer reads as its spec rather than as boilerplate. */

import type { HandCost, Layer, LayerResult, Observable, Transform, Word } from "../types";
import { addCost, ZERO_COST } from "../types";

export function observable<T>(o: Observable<T>): Observable<T> {
  return o;
}

export function transform(t: Transform): Transform {
  return t;
}

/**
 * Default analyze(): run every observable the layer declares and collect the
 * readings, with notes supplied by the layer.
 */
export function analyzeWith(
  layer: number,
  observables: Observable[],
  notes: (word: Word) => string[],
): (word: Word) => LayerResult {
  return (word: Word): LayerResult => {
    const readings = observables.map((o) => {
      const value = o.compute(word);
      return {
        observableId: o.id,
        label: o.label,
        display: o.display(value),
        value,
        cost: o.cost(word),
      };
    });
    return {
      layer,
      readings,
      notes: notes(word),
      cost: readings.length ? addCost(...readings.map((r) => r.cost)) : ZERO_COST,
    };
  };
}

export function makeLayer(
  spec: Omit<Layer, "analyze"> & { notes?: (word: Word) => string[] },
): Layer {
  const { notes = () => [], ...rest } = spec;
  return { ...rest, analyze: analyzeWith(rest.id, rest.observables, notes) };
}

export const perLetter = (word: Word, held = 1): HandCost => ({
  marks: 0,
  counts: word.letters.length,
  held,
});

export const free: HandCost = ZERO_COST;

/** Deterministic RNG so randomized transforms reproduce exactly. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

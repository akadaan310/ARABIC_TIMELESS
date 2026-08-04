/**
 * The layer registry.
 *
 * Layers register themselves here with their Observables and Transforms.
 * Nothing downstream enumerates layers by hand — Layer 14's invariance table,
 * Layer 16's cost model and the whole UI read from this list, so adding a
 * layer extends all three without touching them.
 *
 * That is the discovery mechanism: a new layer is a new row and a new column,
 * and the engine reports where it lands.
 */

import type { Band, Layer, Observable, Transform, Word } from "./types";
import { band1Layers } from "./layers/band1";
import { band2Layers } from "./layers/band2";
import { band3Layers } from "./layers/band3";
import { band4Layers } from "./layers/band4";
import { band5Layers } from "./layers/band5";

const REGISTERED: Layer[] = [
  ...band1Layers,
  ...band2Layers,
  ...band3Layers,
  ...band4Layers,
  ...band5Layers,
].sort((a, b) => a.id - b.id);

export const layers = (): Layer[] => REGISTERED;

export const layerById = (id: number): Layer | undefined =>
  REGISTERED.find((l) => l.id === id);

export const layerBySlug = (slug: string): Layer | undefined =>
  REGISTERED.find((l) => l.slug === slug);

export const layersInBand = (band: Band): Layer[] =>
  REGISTERED.filter((l) => l.band === band);

/** Every observable any layer declares. */
export const observables = (): Observable[] =>
  REGISTERED.flatMap((l) => l.observables);

/** Every transform any layer declares. */
export const transforms = (): Transform[] =>
  REGISTERED.flatMap((l) => l.transforms);

/** Register a layer discovered after the fact. */
export function register(layer: Layer): void {
  const existing = REGISTERED.findIndex((l) => l.id === layer.id);
  if (existing >= 0) REGISTERED[existing] = layer;
  else REGISTERED.push(layer);
  REGISTERED.sort((a, b) => a.id - b.id);
}

/** Run every layer over one word. */
export function analyzeAll(word: Word) {
  return REGISTERED.map((l) => ({ layer: l, result: l.analyze(word) }));
}

/** The engine, as one surface. */

export * from "./alphabet";
export * from "./types";
export * from "./text";
export * from "./variants";
export * from "./patterns";
export * from "./lexicon";
export * from "./registry";
export * from "./invariance";
export * from "./collapse";

export { orderPermutation, reflectLetter, shiftLetter, facesOf, hijaiAddress, abjadiAddress, intervals } from "./layers/band1";
export { closedIsUnionOfClasses } from "./layers/band2";
export {
  silentSubgroupOrder, medialSilentSubgroupOrder, oneFromEachClass,
  silentSubstitution, medialSilentSubstitution, rootSpace,
  weightOf, reduceValue, FEET, footOrbits, scan,
} from "./layers/band3";
export { rootsOf, consonantalResidue, isPalindrome, isUnmovable } from "./layers/band4";
export {
  pointOf, articulationPath, sharingPoint, constants,
  DAMAGE_LABELS, type DamageClass, type Constant,
} from "./layers/band5";
export { mulberry32, shuffled } from "./layers/helpers";

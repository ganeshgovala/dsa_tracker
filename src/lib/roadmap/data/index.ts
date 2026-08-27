import type { ImportedPhase } from "../import-types";
import phase1Foundation from "./phase-1-foundation.json";
import phase1Hashing from "./phase-1-hashing.json";
import phase1TwoPointers from "./phase-1-two-pointers.json";
import phase1PrefixSum from "./phase-1-prefix-sum.json";
import phase1SlidingWindow from "./phase-1-sliding-window.json";
import phase1Recursion from "./phase-1-recursion.json";
import phase1Math from "./phase-1-math.json";

/**
 * All bundled phase payloads, in import order. The seed route imports every
 * entry when called without a body; the UI fallback renders them too.
 */
export const BUNDLED_PAYLOADS = [
  phase1Foundation,
  phase1Hashing,
  phase1TwoPointers,
  phase1PrefixSum,
  phase1SlidingWindow,
  phase1Recursion,
  phase1Math,
] as unknown as ImportedPhase[];

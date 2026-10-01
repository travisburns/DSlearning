import type { AnimScript } from './engine';
import { LINEAR_ANIMS } from './scripts/linear';
import { ALGO1_ANIMS } from './scripts/algos1';
import { TIER2_ANIMS } from './scripts/tier2';

/** One animation per lesson, keyed by concept id. */
export const ANIMS: Record<string, AnimScript> = {
  ...LINEAR_ANIMS,
  ...ALGO1_ANIMS,
  ...TIER2_ANIMS,
};

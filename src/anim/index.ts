import type { AnimScript } from './engine';
import { LINEAR_ANIMS } from './scripts/linear';
import { ALGO1_ANIMS } from './scripts/algos1';
import { TIER2_ANIMS } from './scripts/tier2';
import { TIER3_ANIMS } from './scripts/tier3';
import { TIER4_ANIMS } from './scripts/tier4';
import { TIER5_ANIMS } from './scripts/tier5';
import { TIER6_ANIMS } from './scripts/tier6';
import { TIER7_ANIMS } from './scripts/tier7';
import { TIER89_ANIMS } from './scripts/tier89';
import { TIER10_ANIMS } from './scripts/tier10';
import { OS_ANIMS } from './scripts/os';
import { DB_ANIMS } from './scripts/db';
import { NET_ANIMS } from './scripts/net';
import { SD_ANIMS } from './scripts/sd';
import { ARCH_ANIMS } from './scripts/arch';

/** One animation per lesson, keyed by concept id. */
export const ANIMS: Record<string, AnimScript> = {
  ...LINEAR_ANIMS,
  ...ALGO1_ANIMS,
  ...TIER2_ANIMS,
  ...TIER3_ANIMS,
  ...TIER4_ANIMS,
  ...TIER5_ANIMS,
  ...TIER6_ANIMS,
  ...TIER7_ANIMS,
  ...TIER89_ANIMS,
  ...TIER10_ANIMS,
  ...OS_ANIMS,
  ...DB_ANIMS,
  ...NET_ANIMS,
  ...SD_ANIMS,
  ...ARCH_ANIMS,
};

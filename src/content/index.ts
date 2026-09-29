import type { Card, CardGenerator, CardType, Concept, ExtraCardType } from '../engine/types';
import { EXTRAS } from './extras';
import { LEARN } from './learn';
import { extraGenerators } from './generic';
import { pick } from '../engine/random';
import { bitsConcept, memoryConcept, pointersConcept } from './tier0';
import { staticArrayConcept } from './staticArray';
import { dynamicArrayConcept, matrixConcept, stringConcept } from './arraysPlus';
import { circularLinkedListConcept, doublyLinkedListConcept, linkedListConcept } from './linkedLists';
import { bitsetConcept } from './bitset';
import { circularBufferConcept, dequeConcept, queueConcept, stackConcept } from './stackQueue';
import { monotonicStackConcept, priorityQueueConcept } from './monoPq';
import { binaryHeapConcept, binaryTreeConcept, bstConcept, dAryHeapConcept, treeConcept, trieConcept } from './trees';
import { avlConcept, bPlusTreeConcept, bTreeConcept, redBlackConcept, splayConcept, treapConcept } from './balanced';
import { adjacencyListConcept, adjacencyMatrixConcept, edgeListConcept, graphConcept, unionFindConcept } from './graphs';
import { fenwickConcept, intervalTreeConcept, kdTreeConcept, prefixSumConcept, quadtreeConcept, segmentTreeConcept, sparseTableConcept } from './range';
import { radixTrieConcept, ropeConcept, suffixArrayConcept, suffixTreeConcept } from './strings';
import { bloomFilterConcept, countMinConcept, hyperLogLogConcept, skipListConcept } from './probabilistic';
import { lfuConcept, lruConcept, mergeableHeapsConcept, orderedMapConcept, persistentConcept, sparseMatrixConcept } from './composites';
import {
  binarySearchConcept,
  bitManipulationConcept,
  fastSlowConcept,
  hashingPatternsConcept,
  recursionConcept,
  slidingWindowConcept,
  stringMatchingConcept,
  twoPointersConcept,
} from './algoBasics';
import { countingSortConcept, heapsortConcept, insertionSortConcept, mergeSortConcept, quicksortConcept } from './sorting';
import { bfsConcept, dfsConcept, dijkstraConcept, kruskalConcept, topologicalSortConcept, treeDfsConcept } from './graphAlgos';
import { backtrackingConcept, dp1dConcept, dp2dConcept, greedyConcept } from './paradigms';
import { consistentHashingConcept, cuckooConcept, hashChainingConcept, hashFunctionConcept, hashMapConcept, hashOpenAddressingConcept } from './hashing';

export const CONCEPTS: Concept[] = [
  // Tier 0
  memoryConcept,
  pointersConcept,
  bitsConcept,
  // Tier 1
  staticArrayConcept,
  matrixConcept,
  dynamicArrayConcept,
  stringConcept,
  linkedListConcept,
  doublyLinkedListConcept,
  circularLinkedListConcept,
  bitsetConcept,
  // Tier 1 algorithms
  binarySearchConcept,
  twoPointersConcept,
  slidingWindowConcept,
  insertionSortConcept,
  countingSortConcept,
  fastSlowConcept,
  bitManipulationConcept,
  // Tier 2
  stackConcept,
  queueConcept,
  circularBufferConcept,
  dequeConcept,
  monotonicStackConcept,
  priorityQueueConcept,
  // Tier 2 algorithms
  recursionConcept,
  mergeSortConcept,
  quicksortConcept,
  backtrackingConcept,
  greedyConcept,
  // Tier 3
  hashFunctionConcept,
  hashChainingConcept,
  hashOpenAddressingConcept,
  hashMapConcept,
  cuckooConcept,
  consistentHashingConcept,
  // Tier 3 algorithms
  hashingPatternsConcept,
  stringMatchingConcept,
  dp1dConcept,
  dp2dConcept,
  // Tier 4
  treeConcept,
  binaryTreeConcept,
  bstConcept,
  binaryHeapConcept,
  dAryHeapConcept,
  trieConcept,
  // Tier 4 algorithms
  treeDfsConcept,
  heapsortConcept,
  // Tier 5
  avlConcept,
  redBlackConcept,
  splayConcept,
  treapConcept,
  bTreeConcept,
  bPlusTreeConcept,
  // Tier 6
  graphConcept,
  adjacencyMatrixConcept,
  adjacencyListConcept,
  edgeListConcept,
  unionFindConcept,
  // Tier 6 algorithms
  bfsConcept,
  dfsConcept,
  topologicalSortConcept,
  dijkstraConcept,
  kruskalConcept,
  // Tier 7
  prefixSumConcept,
  sparseTableConcept,
  segmentTreeConcept,
  fenwickConcept,
  intervalTreeConcept,
  kdTreeConcept,
  quadtreeConcept,
  // Tier 8
  radixTrieConcept,
  suffixArrayConcept,
  suffixTreeConcept,
  ropeConcept,
  // Tier 9
  skipListConcept,
  bloomFilterConcept,
  countMinConcept,
  hyperLogLogConcept,
  // Tier 10
  orderedMapConcept,
  lruConcept,
  lfuConcept,
  sparseMatrixConcept,
  mergeableHeapsConcept,
  persistentConcept,
];

for (const c of CONCEPTS) {
  c.extras = c.extras ?? EXTRAS[c.id];
  c.learn = c.learn ?? LEARN[c.id];
}

const byId = new Map(CONCEPTS.map((c) => [c.id, c]));

export const getConcept = (id: string): Concept | undefined => byId.get(id);

const generic = new Map(CONCEPTS.map((c) => [c.id, c.extras ? extraGenerators(c, CONCEPTS) : undefined]));

/** Every generator for a concept and card type: hand-written ones plus the generic ones. */
export function generatorsFor(conceptId: string, type: CardType): CardGenerator[] {
  const c = byId.get(conceptId);
  if (!c) throw new Error(`Unknown concept ${conceptId}`);
  const own = c.generators[type] ?? [];
  const gen = generic.get(conceptId)?.[type as ExtraCardType] ?? [];
  return [...own, ...gen];
}

export function generateCard(conceptId: string, type: CardType): Card {
  return pick(generatorsFor(conceptId, type))();
}

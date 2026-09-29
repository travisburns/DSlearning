import type { Card, CardType, Concept } from '../engine/types';
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
  // Tier 2
  stackConcept,
  queueConcept,
  circularBufferConcept,
  dequeConcept,
  monotonicStackConcept,
  priorityQueueConcept,
  // Tier 3
  hashFunctionConcept,
  hashChainingConcept,
  hashOpenAddressingConcept,
  hashMapConcept,
  cuckooConcept,
  consistentHashingConcept,
  // Tier 4
  treeConcept,
  binaryTreeConcept,
  bstConcept,
  binaryHeapConcept,
  dAryHeapConcept,
  trieConcept,
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
];

const byId = new Map(CONCEPTS.map((c) => [c.id, c]));

export const getConcept = (id: string): Concept | undefined => byId.get(id);

export function generateCard(conceptId: string, type: CardType): Card {
  const c = byId.get(conceptId);
  if (!c) throw new Error(`Unknown concept ${conceptId}`);
  return pick(c.generators[type])();
}

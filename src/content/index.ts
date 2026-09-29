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
];

const byId = new Map(CONCEPTS.map((c) => [c.id, c]));

export const getConcept = (id: string): Concept | undefined => byId.get(id);

export function generateCard(conceptId: string, type: CardType): Card {
  const c = byId.get(conceptId);
  if (!c) throw new Error(`Unknown concept ${conceptId}`);
  return pick(c.generators[type])();
}

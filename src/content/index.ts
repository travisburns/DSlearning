import type { Card, CardType, Concept } from '../engine/types';
import { pick } from '../engine/random';
import { memoryConcept } from './memory';
import { staticArrayConcept } from './staticArray';

export const CONCEPTS: Concept[] = [memoryConcept, staticArrayConcept];

const byId = new Map(CONCEPTS.map((c) => [c.id, c]));

export const getConcept = (id: string): Concept | undefined => byId.get(id);

export function generateCard(conceptId: string, type: CardType): Card {
  const c = byId.get(conceptId);
  if (!c) throw new Error(`Unknown concept ${conceptId}`);
  return pick(c.generators[type])();
}

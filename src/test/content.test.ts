import { describe, expect, it } from 'vitest';
import { CONCEPTS, generatorsFor } from '../content';
import { CARD_TYPES, TIERS } from '../engine/types';
import type { Scene, TreeNode } from '../engine/types';
import { walkList } from '../engine/memory';

/** Every clickable target id a scene renders. */
function targets(s: Scene): Set<string> {
  const out = new Set<string>();
  const cells = s.cells ?? [];
  for (const v of s.views) {
    switch (v.type) {
      case 'memory':
        cells.forEach((_, a) => out.add(`m:${a}`));
        break;
      case 'array':
        for (let k = 0; k < (v.capacity ?? v.length); k++) out.add(`m:${v.base + k}`);
        break;
      case 'stack':
      case 'queue':
        for (let k = 0; k < v.capacity; k++) out.add(`m:${v.base + k}`);
        break;
      case 'list':
        walkList(cells, v.head, v.doubly ? 2 : 1).forEach((a) => out.add(`m:${a}`));
        break;
      case 'row':
        v.items.forEach((_, i) => out.add(`${v.key}:${i}`));
        break;
      case 'grid':
        v.rows.forEach((r, i) => r.forEach((_, j) => out.add(`${v.key}:${i},${j}`)));
        break;
      case 'buckets':
        v.buckets.forEach((b, i) => {
          out.add(`${v.key}:${i}`);
          b.forEach((_, j) => out.add(`${v.key}:${i}.${j}`));
        });
        break;
      case 'tree': {
        const walk = (n: TreeNode | null) => {
          if (!n) return;
          out.add(`t:${n.id}`);
          n.children.forEach(walk);
        };
        walk(v.root);
        break;
      }
      case 'graph':
        v.nodes.forEach((n) => out.add(`g:${n.id}`));
        break;
    }
  }
  return out;
}

const RUNS = 300;

describe('concept graph', () => {
  const ids = new Set(CONCEPTS.map((c) => c.id));
  it('has unique ids', () => expect(ids.size).toBe(CONCEPTS.length));
  it('covers all 61 planned data structures', () => expect(CONCEPTS.length).toBe(61));
  it('every tier is non-empty', () => TIERS.forEach((_, t) => expect(CONCEPTS.some((c) => c.tier === t)).toBe(true)));
  for (const c of CONCEPTS) {
    it(`${c.id}: prerequisites exist and come from earlier or same tier`, () => {
      expect(c.tier).toBeGreaterThanOrEqual(0);
      expect(c.tier).toBeLessThan(TIERS.length);
      for (const p of c.prereqs) {
        expect(ids.has(p), `${c.id} needs unknown ${p}`).toBe(true);
        expect(CONCEPTS.find((x) => x.id === p)!.tier).toBeLessThanOrEqual(c.tier);
      }
      expect(c.hook.options.some((o) => o.good)).toBe(true);
      expect(c.extras, `${c.id} has no extras`).toBeDefined();
      const ex = c.extras!;
      expect(ex.parts.length).toBeGreaterThanOrEqual(1);
      expect(ex.uses.length).toBeGreaterThanOrEqual(1);
      expect(ex.breaks.length).toBeGreaterThanOrEqual(1);
      expect(ex.transfer.length).toBeGreaterThanOrEqual(1);
      for (const r of ex.rivals ?? []) expect(ids.has(r), `${c.id} rival ${r} unknown`).toBe(true);
    });
  }
});

describe('card generators', () => {
  for (const c of CONCEPTS) {
    for (const type of CARD_TYPES) {
      it(`${c.id} / ${type}`, () => {
        const gens = generatorsFor(c.id, type);
        expect(gens.length).toBeGreaterThan(0);
        for (const gen of gens) {
          for (let r = 0; r < RUNS; r++) {
            const card = gen();
            const ctx = `${c.id}/${type}: ${card.prompt.slice(0, 60)}`;
            expect(card.concept, ctx).toBe(c.id);
            expect(card.type, ctx).toBe(type);
            expect(card.prompt.length, ctx).toBeGreaterThan(0);
            const b = card.body;
            if (b.kind === 'choice') {
              const texts = b.options.map((o) => o.text);
              expect(new Set(texts).size, `${ctx} duplicate options ${texts}`).toBe(texts.length);
              expect(b.options.length, ctx).toBeGreaterThanOrEqual(2);
              const nCorrect = b.options.filter((o) => o.correct).length;
              if (b.multi) expect(nCorrect, ctx).toBeGreaterThanOrEqual(1);
              else expect(nCorrect, `${ctx} ${JSON.stringify(b.options)}`).toBe(1);
            } else if (b.kind === 'order') {
              expect(b.steps.length, ctx).toBeGreaterThanOrEqual(2);
              expect(new Set(b.steps).size, ctx).toBe(b.steps.length);
            } else if (b.kind === 'number') {
              expect(Number.isFinite(b.answer), ctx).toBe(true);
            } else {
              expect(b.frames.length, ctx).toBe(b.expected.length + 1);
              expect(b.expected.length, ctx).toBeGreaterThan(0);
              b.expected.forEach((t, i) => {
                const avail = targets(b.frames[i]);
                expect(avail.has(t), `${ctx} step ${i} target ${t} not rendered`).toBe(true);
              });
            }
          }
        }
      });
    }
  }
});

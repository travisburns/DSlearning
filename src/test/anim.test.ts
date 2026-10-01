import { describe, expect, it } from 'vitest';
import { ANIMS } from '../anim';
import { between } from '../anim/engine';

const RUNS = 40;

describe('animations', () => {
  for (const [id, script] of Object.entries(ANIMS)) {
    it(`${id}: every run builds well-formed frames`, () => {
      for (let r = 0; r < RUNS; r++) {
        const a = script();
        expect(a.frames.length, `${id} frames`).toBeGreaterThanOrEqual(4);
        expect(a.view.w).toBeGreaterThan(0);
        expect(a.view.h).toBeGreaterThan(0);
        expect(Number.isFinite(a.view.w + a.view.h + a.view.x + a.view.y)).toBe(true);
        a.frames.forEach((f, i) => {
          expect(f.say.trim().length, `${id} frame ${i} caption`).toBeGreaterThan(10);
          expect(f.say, `${id} frame ${i}`).not.toMatch(/undefined|NaN|\[object/);
          for (const [bid, b] of Object.entries(f.boxes)) {
            expect(Number.isFinite(b.x + b.y + b.w + b.h), `${id} frame ${i} box ${bid}`).toBe(true);
            expect(`${b.label ?? ''}${b.sub ?? ''}${b.top ?? ''}`).not.toMatch(/undefined|NaN/);
          }
          for (const [aid, ar] of Object.entries(f.arrows)) {
            expect(f.boxes[ar.from], `${id} frame ${i} arrow ${aid} from ${ar.from}`).toBeDefined();
            expect(f.boxes[ar.to], `${id} frame ${i} arrow ${aid} to ${ar.to}`).toBeDefined();
          }
          for (const [tid, t] of Object.entries(f.texts)) {
            expect(Number.isFinite(t.x + t.y), `${id} frame ${i} text ${tid}`).toBe(true);
            expect(t.text).not.toMatch(/undefined|NaN/);
          }
          if (i > 0) {
            const mid = between(a.frames[i - 1], f, 0.5);
            for (const b of mid.boxes) expect(Number.isFinite(b.v.x + b.v.y)).toBe(true);
          }
        });
      }
    });
  }
});

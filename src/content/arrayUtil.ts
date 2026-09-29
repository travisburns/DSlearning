import type { Cell, Scene, View } from '../engine/types';
import { cloneScene, emptyMemory, m, sprinkleGarbage } from '../engine/memory';

/** A contiguous block at `base` with `capacity` slots, the first items.length filled. */
export function arrayScene(base: number, items: number[], capacity: number, garbage = true): Scene {
  let cells: Cell[] = emptyMemory();
  for (let k = 0; k < capacity; k++)
    cells[base + k] = k < items.length ? { v: items[k], kind: 'val', label: `[${k}]` } : { v: null, kind: 'free', label: `[${k}]` };
  if (garbage) cells = sprinkleGarbage(cells);
  return {
    cells,
    views: [{ type: 'memory' }, { type: 'array', base, length: items.length, capacity }],
    markers: [{ name: 'base', addr: base }],
  };
}

export const arrayView = (s: Scene) => s.views.find((v): v is Extract<View, { type: 'array' }> => v.type === 'array');

export function readArray(s: Scene): number[] {
  const a = arrayView(s);
  if (!a || !s.cells) return [];
  return s.cells.slice(a.base, a.base + a.length).map((c) => c.v as number);
}

/** Insert by shifting right, one write at a time, from the far end. Returns the frames after each write. */
export function insertFrames(s: Scene, index: number, value: number): { writes: string[]; frames: Scene[] } {
  const { base, length } = arrayView(s)!;
  const frames: Scene[] = [];
  const writes: string[] = [];
  let cur = cloneScene(s);
  for (let k = length; k > index; k--) {
    cur = cloneScene(cur);
    cur.cells![base + k] = { ...cur.cells![base + k - 1], label: `[${k}]` };
    cur.highlight = [m(base + k)];
    writes.push(m(base + k));
    frames.push(cur);
  }
  cur = cloneScene(cur);
  cur.cells![base + index] = { v: value, kind: 'val', label: `[${index}]` };
  cur.highlight = [m(base + index)];
  arrayView(cur)!.length = length + 1;
  writes.push(m(base + index));
  frames.push(cur);
  return { writes, frames };
}

/** Delete by shifting left from the hole, then clearing the last slot. */
export function deleteFrames(s: Scene, index: number): { writes: string[]; frames: Scene[] } {
  const { base, length } = arrayView(s)!;
  const frames: Scene[] = [];
  const writes: string[] = [];
  let cur = cloneScene(s);
  for (let k = index; k < length - 1; k++) {
    cur = cloneScene(cur);
    cur.cells![base + k] = { ...cur.cells![base + k + 1], label: `[${k}]` };
    cur.highlight = [m(base + k)];
    writes.push(m(base + k));
    frames.push(cur);
  }
  cur = cloneScene(cur);
  cur.cells![base + length - 1] = { v: null, kind: 'free', label: `[${length - 1}]` };
  cur.highlight = [m(base + length - 1)];
  arrayView(cur)!.length = length - 1;
  writes.push(m(base + length - 1));
  frames.push(cur);
  return { writes, frames };
}

import type { Cell, Scene } from './types';
import { shuffle } from './random';

export const MEM_SIZE = 24;

export const freeCell = (): Cell => ({ v: null, kind: 'free' });

export const emptyMemory = (size = MEM_SIZE): Cell[] => Array.from({ length: size }, freeCell);

/** Fill free cells with leftover "garbage" so memory looks like real memory, not a clean slate. */
export function sprinkleGarbage(cells: Cell[], chance = 0.35): Cell[] {
  return cells.map((c) =>
    c.kind === 'free' && c.label === undefined && Math.random() < chance ? { v: Math.floor(Math.random() * 99) + 1, kind: 'free' } : c,
  );
}

export const cloneScene = (s: Scene): Scene => structuredClone(s);

export const m = (addr: number) => `m:${addr}`;

// ---------- Linked list helpers (node = [value, next] or [value, prev, next]) ----------

/** Pick `count` node addresses (each needs `width` consecutive cells) scattered in [lo, hi). */
export function scatterNodes(count: number, width = 2, lo = 0, hi = MEM_SIZE): number[] {
  const slots: number[] = [];
  for (let a = lo; a + width <= hi; a += width) slots.push(a);
  return shuffle(slots).slice(0, count);
}

export function writeNode(cells: Cell[], addr: number, value: number, next: number | null) {
  cells[addr] = { v: value, kind: 'val', label: 'val' };
  cells[addr + 1] = { v: next, kind: 'ptr', label: 'next' };
}

export function writeDNode(cells: Cell[], addr: number, value: number, prev: number | null, next: number | null) {
  cells[addr] = { v: value, kind: 'val', label: 'val' };
  cells[addr + 1] = { v: prev, kind: 'ptr', label: 'prev' };
  cells[addr + 2] = { v: next, kind: 'ptr', label: 'next' };
}

/** Walk the list from `head`, returning node addresses in order. Stops on cycles. */
export function walkList(cells: Cell[], head: number | null, nextOffset = 1): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  let cur = head;
  while (cur !== null && !seen.has(cur) && cur >= 0 && cur + nextOffset < cells.length) {
    seen.add(cur);
    out.push(cur);
    cur = cells[cur + nextOffset].v;
  }
  return out;
}

export const listValues = (cells: Cell[], head: number | null, nextOffset = 1): number[] =>
  walkList(cells, head, nextOffset).map((a) => cells[a].v as number);

// ---------- Formatting ----------

export const fmtArray = (xs: (number | string | null)[]): string => `[${xs.map((x) => (x === null ? '_' : x)).join(', ')}]`;

export const fmtList = (xs: number[]): string => (xs.length ? `head → ${xs.join(' → ')} → ∅` : 'head → ∅');

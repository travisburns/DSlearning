import type { Tone } from './engine';
import { Stage } from './engine';
import { BOX } from './engine';

export const W = BOX.w;
export const H = BOX.h;
export const GAP = 6;
export const STEP = W + GAP;

/** x of slot i in a row starting at x0. */
export const colX = (i: number, x0 = 0, step = STEP) => x0 + i * step;

/** A row of empty, dashed slots with their index above. Ids: `${key}${i}`. */
export function slotRow(
  s: Stage,
  key: string,
  n: number,
  o: { x?: number; y?: number; step?: number; top?: (i: number) => string; w?: number } = {},
) {
  const { x = 0, y = 0, step = STEP, w = W } = o;
  for (let i = 0; i < n; i++) s.box(`${key}${i}`, { x: x + i * step, y, w, h: H, shape: 'slot', top: o.top ? o.top(i) : `[${i}]` });
}

/** Put a value box exactly on top of slot `i` of a row made by `slotRow`. */
export function onSlot(s: Stage, id: string, label: string | number, i: number, o: { x?: number; y?: number; step?: number; tone?: Tone; w?: number } = {}) {
  const { x = 0, y = 0, step = STEP, w = W } = o;
  s.box(id, { x: x + i * step, y, w, h: H, label: String(label), tone: o.tone ?? 'plain' });
}

/** A named pointer/variable tag, e.g. "head" or "i". */
export function tag(s: Stage, id: string, name: string, x: number, y: number) {
  s.box(id, { x, y, w: Math.max(34, name.length * 8 + 18), h: 22, label: name, shape: 'tag' });
}

/** Place a tag centred above (or below) a box and point it at that box. */
export function point(s: Stage, tagId: string, name: string, target: string, side: 'above' | 'below' = 'above', gapY = 34) {
  const b = s.boxes[target];
  const w = Math.max(34, name.length * 8 + 18);
  tag(s, tagId, name, b.x + b.w / 2 - w / 2, side === 'above' ? b.y - gapY - 22 : b.y + b.h + gapY);
  s.arrow(`${tagId}>`, tagId, target, { tone: 'ptr' });
}

// ---------- trees ----------

export interface TNode {
  id: string;
  label: string;
  left?: TNode | null;
  right?: TNode | null;
  kids?: TNode[];
  sub?: string;
  tone?: Tone;
}

/** In-order x, depth y. Works for binary trees (left/right) and n-ary trees (kids, leaves spread out). */
export function treePos(root: TNode | null, o: { x?: number; y?: number; dx?: number; dy?: number } = {}) {
  const { x = 0, y = 0, dx = 52, dy = 66 } = o;
  const pos = new Map<string, { x: number; y: number }>();
  let slot = 0;
  const walk = (n: TNode | null | undefined, d: number): number => {
    if (!n) return NaN;
    if (n.kids) {
      const xs = n.kids.map((k) => walk(k, d + 1)).filter((v) => !Number.isNaN(v));
      const cx = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : x + slot++ * dx;
      pos.set(n.id, { x: cx, y: y + d * dy });
      return cx;
    }
    walk(n.left, d + 1);
    const cx = x + slot++ * dx;
    pos.set(n.id, { x: cx, y: y + d * dy });
    walk(n.right, d + 1);
    return cx;
  };
  walk(root, 0);
  return pos;
}

/** Draw (or re-place) a whole tree: node boxes `n<id>` as circles, edges `e<id>` from parent. */
const treeIds = new WeakMap<Stage, Map<string, Set<string>>>();

export function drawTree(
  s: Stage,
  root: TNode | null,
  o: { x?: number; y?: number; dx?: number; dy?: number; size?: number; prefix?: string; nodeW?: number } = {},
) {
  const size = o.size ?? 40;
  const pre = o.prefix ?? 'n';
  const pos = treePos(root, o);
  const keep = new Set<string>();
  const walk = (n: TNode | null | undefined, parent?: TNode) => {
    if (!n) return;
    const p = pos.get(n.id)!;
    const id = pre + n.id;
    keep.add(id);
    if (o.nodeW) s.box(id, { x: p.x, y: p.y, w: o.nodeW, h: 32, shape: 'rect', label: n.label, sub: n.sub, tone: n.tone ?? 'plain', mono: false });
    else s.box(id, { x: p.x, y: p.y, w: size, h: size, shape: 'circle', label: n.label, sub: n.sub, tone: n.tone ?? 'plain' });
    if (parent) s.arrow(`e${id}`, pre + parent.id, id, { tone: 'dim', line: true });
    else delete s.arrows[`e${id}`];
    for (const k of n.kids ?? [n.left, n.right]) walk(k, n);
  };
  walk(root);
  // Remove nodes that were in this tree last time but aren't now.
  const reg = treeIds.get(s) ?? new Map<string, Set<string>>();
  treeIds.set(s, reg);
  for (const id of reg.get(pre) ?? []) if (!keep.has(id)) s.del(id, `e${id}`);
  reg.set(pre, keep);
  return pos;
}

/** Build a BST of TNodes from keys in insertion order. Node id = key. */
export function bst(keys: number[]): TNode | null {
  let root: TNode | null = null;
  const ins = (n: TNode | null, k: number): TNode => {
    if (!n) return { id: String(k), label: String(k), left: null, right: null };
    if (k < Number(n.label)) n.left = ins(n.left ?? null, k);
    else n.right = ins(n.right ?? null, k);
    return n;
  };
  for (const k of keys) root = ins(root, k);
  return root;
}

/** Array-as-heap → tree of TNodes (ids are `h<index>`-style values given by `idOf`). */
export function heapTree(vals: (number | string)[], idOf: (i: number) => string, d = 2): TNode | null {
  const mk = (i: number): TNode | null =>
    i >= vals.length ? null : d === 2 ? { id: idOf(i), label: String(vals[i]), left: mk(2 * i + 1), right: mk(2 * i + 2) } : { id: idOf(i), label: String(vals[i]), kids: Array.from({ length: d }, (_, k) => mk(d * i + 1 + k)).filter((x): x is TNode => !!x) };
  return mk(0);
}

// ---------- graphs ----------

/** Nodes evenly on a circle (or an ellipse). */
export function ring(ids: string[], o: { cx?: number; cy?: number; rx?: number; ry?: number } = {}) {
  const { cx = 150, cy = 110, rx = 130, ry = 95 } = o;
  const pos = new Map<string, { x: number; y: number }>();
  ids.forEach((id, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / ids.length;
    pos.set(id, { x: cx + rx * Math.cos(a) - 20, y: cy + ry * Math.sin(a) - 20 });
  });
  return pos;
}

export function drawGraph(
  s: Stage,
  nodes: string[],
  edges: [string, string, (number | string)?][],
  o: { directed?: boolean; cx?: number; cy?: number; rx?: number; ry?: number } = {},
) {
  const pos = ring(nodes, o);
  for (const id of nodes) s.box(`g${id}`, { ...pos.get(id)!, w: 40, h: 40, shape: 'circle', label: id, tone: 'plain' });
  for (const [a, b, w] of edges) s.arrow(`ge${a}${b}`, `g${a}`, `g${b}`, { tone: 'dim', label: w === undefined ? undefined : String(w), line: !o.directed });
  return pos;
}

// ---------- misc ----------

export const fmt = (xs: (number | string)[]) => `[${xs.join(', ')}]`;

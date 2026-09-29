import type { TreeNode } from '../engine/types';

// ---------- Binary search trees (plain objects, then rendered as TreeNode) ----------

export interface BNode {
  key: number;
  left: BNode | null;
  right: BNode | null;
}

export function bstInsert(root: BNode | null, key: number): BNode {
  const n: BNode = { key, left: null, right: null };
  if (!root) return n;
  let cur = root;
  for (;;) {
    if (key < cur.key) {
      if (!cur.left) return (cur.left = n), root;
      cur = cur.left;
    } else {
      if (!cur.right) return (cur.right = n), root;
      cur = cur.right;
    }
  }
}

export const buildBST = (keys: number[]): BNode | null => keys.reduce<BNode | null>((r, k) => bstInsert(r, k), null);

/** Keys visited while searching for `key` (ends at the key, or at the last node before falling off). */
export function bstPath(root: BNode | null, key: number): number[] {
  const out: number[] = [];
  let cur = root;
  while (cur) {
    out.push(cur.key);
    if (key === cur.key) break;
    cur = key < cur.key ? cur.left : cur.right;
  }
  return out;
}

export function height(n: BNode | null): number {
  return n ? 1 + Math.max(height(n.left), height(n.right)) : -1;
}

export function depthOf(root: BNode | null, key: number): number {
  return bstPath(root, key).length - 1;
}

export const inorder = (n: BNode | null): number[] => (n ? [...inorder(n.left), n.key, ...inorder(n.right)] : []);
export const preorder = (n: BNode | null): number[] => (n ? [n.key, ...preorder(n.left), ...preorder(n.right)] : []);
export const postorder = (n: BNode | null): number[] => (n ? [...postorder(n.left), ...postorder(n.right), n.key] : []);
export function levelorder(n: BNode | null): number[] {
  const out: number[] = [];
  const q = n ? [n] : [];
  while (q.length) {
    const x = q.shift()!;
    out.push(x.key);
    if (x.left) q.push(x.left);
    if (x.right) q.push(x.right);
  }
  return out;
}

export function leaves(n: BNode | null): number[] {
  if (!n) return [];
  if (!n.left && !n.right) return [n.key];
  return [...leaves(n.left), ...leaves(n.right)];
}

export function countNodes(n: BNode | null): number {
  return n ? 1 + countNodes(n.left) + countNodes(n.right) : 0;
}

/** Render a BST with node ids = keys. `notes` adds small text under chosen keys. */
export function toTree(n: BNode | null, notes?: (k: number) => string | undefined, tone?: (k: number) => TreeNode['tone']): TreeNode | null {
  if (!n) return null;
  return { id: String(n.key), label: String(n.key), note: notes?.(n.key), tone: tone?.(n.key), children: [toTree(n.left, notes, tone), toTree(n.right, notes, tone)] };
}

/** A random BST with a reasonable (not degenerate) shape. */
export function randomBST(keys: number[]): BNode {
  // Insert the median first-ish so the tree isn't a stick.
  const sorted = [...keys].sort((a, b) => a - b);
  const order: number[] = [];
  const rec = (lo: number, hi: number) => {
    if (lo > hi) return;
    const mid = Math.floor((lo + hi) / 2) + (Math.random() < 0.5 && hi > lo ? 1 : 0);
    const m = Math.min(hi, mid);
    order.push(sorted[m]);
    rec(lo, m - 1);
    rec(m + 1, hi);
  };
  rec(0, sorted.length - 1);
  return buildBST(order)!;
}

// ---------- Array-backed heaps ----------

/** Render array `a` as a d-ary tree; node id = index. */
export function heapTree(a: number[], d = 2, i = 0): TreeNode | null {
  if (i >= a.length) return null;
  const kids: (TreeNode | null)[] = [];
  for (let c = 1; c <= d; c++) kids.push(heapTree(a, d, d * i + c));
  return { id: String(i), label: String(a[i]), note: `[${i}]`, children: d === 2 ? kids : kids.filter(Boolean) };
}

export const parentIdx = (i: number, d = 2) => Math.floor((i - 1) / d);

/** Min-heap insert. Returns the new array and the indexes swapped into (the path the new value climbs). */
export function heapPush(a: number[], x: number, d = 2): { arr: number[]; swaps: number[]; frames: number[][] } {
  const arr = [...a, x];
  let i = arr.length - 1;
  const swaps: number[] = [];
  const frames: number[][] = [];
  while (i > 0 && arr[parentIdx(i, d)] > arr[i]) {
    const p = parentIdx(i, d);
    [arr[p], arr[i]] = [arr[i], arr[p]];
    swaps.push(p);
    frames.push([...arr]);
    i = p;
  }
  return { arr, swaps, frames };
}

/** Min-heap removeMin. Returns the new array and the child indexes swapped with on the way down. */
export function heapPop(a: number[], d = 2): { arr: number[]; swaps: number[]; frames: number[][] } {
  const arr = [...a];
  const last = arr.pop()!;
  const swaps: number[] = [];
  const frames: number[][] = [];
  if (!arr.length) return { arr, swaps, frames };
  arr[0] = last;
  let i = 0;
  for (;;) {
    let best = i;
    for (let c = 1; c <= d; c++) {
      const k = d * i + c;
      if (k < arr.length && arr[k] < arr[best]) best = k;
    }
    if (best === i) break;
    [arr[i], arr[best]] = [arr[best], arr[i]];
    swaps.push(best);
    frames.push([...arr]);
    i = best;
  }
  return { arr, swaps, frames };
}

export function buildHeap(keys: number[], d = 2): number[] {
  return keys.reduce<number[]>((h, k) => heapPush(h, k, d).arr, []);
}

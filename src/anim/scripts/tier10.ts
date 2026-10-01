import type { AnimScript, Tone } from '../engine';
import { Stage } from '../engine';
import { distinctInts, pick, randInt, shuffle } from '../../engine/random';
import type { TNode } from '../kit';
import { H, bst, drawTree, tag, treePos } from '../kit';

// =====================================================================
// Ordered map (SortedDictionary)
// =====================================================================

const orderedMap: AnimScript = () => {
  const s = new Stage();
  const keys = distinctInts(7, 10, 99).sort((a, b) => a - b);
  const root = bst([keys[3], keys[1], keys[5], keys[0], keys[2], keys[4], keys[6]])!;
  const val = new Map(keys.map((k) => [k, pick(['ann', 'bob', 'cy', 'dee', 'eve', 'fay', 'gus'])]));
  const label = (n: TNode): TNode => ({ ...n, sub: val.get(Number(n.label)), left: n.left ? label(n.left) : null, right: n.right ? label(n.right) : null });
  const opts = { dx: 58, dy: 72 };
  drawTree(s, label(root), opts);
  s.say('An ordered map (C#’s SortedDictionary) stores key → value pairs in a balanced search tree. Unlike a hash map, it keeps the keys in sorted order.');
  const out: number[] = [];
  const io = (n: TNode | null | undefined) => {
    if (!n) return;
    io(n.left);
    out.push(Number(n.label));
    io(n.right);
  };
  io(root);
  out.forEach((k, i) => {
    s.tone(`n${k}`, 'ok');
    s.text('it', 0, 300, `foreach: ${out.slice(0, i + 1).join(', ')}`, { bold: true });
    if (i === 0 || i === out.length - 1) s.say(i === 0 ? 'foreach visits keys smallest first: an in-order walk of the tree.' : 'All keys in sorted order for free. A Dictionary would give them in no particular order.');
  });
  for (const k of keys) s.tone(`n${k}`, 'plain');
  let x = randInt(keys[0] + 1, keys[6] - 1);
  while (keys.includes(x)) x++;
  s.del('it');
  s.text('q', 0, -30, `Smallest key ≥ ${x}? (ceiling)`, { bold: true, size: 'lg', tone: 'accent' });
  s.say(`A question a hash map can't answer quickly: what is the first key at or after ${x}?`);
  let cur: TNode | null | undefined = root;
  let best: number | null = null;
  while (cur) {
    const k = Number(cur.label);
    s.tone(`n${k}`, 'hl');
    if (k >= x) {
      best = k;
      s.say(`${k} ≥ ${x}: a candidate. Something smaller but still ≥ ${x} could be in the left subtree, so go left.`);
      cur = cur.left;
    } else {
      s.say(`${k} < ${x}: too small, and so is everything to its left. Go right.`);
      cur = cur.right;
    }
    s.tone(`n${k}`, 'dim');
  }
  if (best !== null) s.tone(`n${best}`, 'ok');
  s.say(`The best candidate: ${best}. O(log n). Ordered maps are the tool for “next appointment after 3pm”, leaderboards and range queries; the price is O(log n) per operation instead of a hash map's O(1).`);
  return s.build('Ordered map: sorted keys');
};

// =====================================================================
// LRU cache
// =====================================================================

const lru: AnimScript = () => {
  const s = new Stage();
  const CAP = 3;
  const keys = shuffle(['A', 'B', 'C', 'D', 'E']);
  const list: string[] = [];
  const vals = new Map<string, number>();
  const LX = 170;
  s.box('map', { x: -10, y: -26, w: 80, h: 4 * 50 + 30, shape: 'frame', label: 'Dictionary' });
  s.text('mru', LX, -10, 'most recent', { size: 'sm', tone: 'dim', bold: true });
  s.text('lru', LX + (CAP - 1) * 90, -10, 'least recent', { size: 'sm', tone: 'dim', bold: true });
  const draw = (hot?: string, tone: Tone = 'hl') => {
    for (const k of Object.keys(s.arrows)) if (k.startsWith('nx') || k.startsWith('pt')) delete s.arrows[k];
    list.forEach((k, i) => {
      s.box(`d${k}`, { x: 0, y: i * 50, w: 60, h: 36, label: k, tone: k === hot ? tone : 'accent' });
      s.box(`n${k}`, { x: LX + i * 90, y: 60, w: 60, h: H, label: `${k}:${vals.get(k)}`, tone: k === hot ? tone : 'plain' });
      s.arrow(`pt${k}`, `d${k}`, `n${k}`, { tone: 'ptr', dashed: true });
      if (i) s.arrow(`nx${k}`, `n${list[i - 1]}`, `n${k}`, { tone: 'accent', bend: -10 });
    });
  };
  s.say(`An LRU cache keeps the ${CAP} most recently used items and throws out the Least Recently Used one when full. It combines a dictionary (find any key in O(1)) with a doubly linked list (keep the usage order).`);
  const put = (k: string) => {
    vals.set(k, randInt(1, 9));
    if (list.length === CAP) {
      const old = list[list.length - 1];
      s.tone([`n${old}`, `d${old}`], 'bad');
      s.say(`put(${k}): the cache is full. Evict the least recently used item, ${old}, from the tail of the list…`);
      list.pop();
      s.del(`n${old}`, `d${old}`);
    }
    list.unshift(k);
    draw(k, 'ok');
    s.say(`put(${k}): add a node at the FRONT (most recent) and a dictionary entry pointing at it. O(1).`);
  };
  const get = (k: string) => {
    draw(k);
    s.say(`get(${k}): the dictionary finds ${k}'s node instantly, without walking the list.`);
    list.splice(list.indexOf(k), 1);
    list.unshift(k);
    draw(k, 'ok');
    s.say(`${k} was just used, so unlink it and move it to the front. With prev/next pointers that's O(1).`);
  };
  put(keys[0]);
  put(keys[1]);
  put(keys[2]);
  get(keys[0]);
  put(keys[3]);
  draw();
  s.say(`Every operation is O(1). Browsers, databases and CPUs all use LRU-style caches.`);
  return s.build('LRU cache: dictionary + linked list');
};

// =====================================================================
// LFU cache
// =====================================================================

const lfu: AnimScript = () => {
  const s = new Stage();
  const CAP = 3;
  const [a, b, c, d] = shuffle(['A', 'B', 'C', 'D', 'E']);
  const freq = new Map<string, number>();
  const order: string[] = [];
  const draw = (hot?: string, tone: Tone = 'hl') => {
    const maxF = Math.max(3, ...freq.values());
    for (let f = 1; f <= maxF; f++) s.text(`fl${f}`, -10, (f - 1) * 56 + 26, `used ${f}×`, { anchor: 'end', size: 'sm', bold: true, tone: 'dim' });
    for (let f = 1; f <= maxF; f++) {
      const row = order.filter((k) => freq.get(k) === f);
      row.forEach((k, i) => s.box(`n${k}`, { x: i * 64, y: (f - 1) * 56, w: 56, h: H, label: k, tone: k === hot ? tone : 'plain' }));
    }
  };
  s.say(`An LFU cache evicts the Least FREQUENTLY used item. It groups keys into buckets by how many times they've been used; within a bucket, the oldest goes first. Capacity ${CAP}.`);
  const touch = (k: string) => {
    order.splice(order.indexOf(k), 1);
    order.push(k);
  };
  for (const k of [a, b, c]) {
    freq.set(k, 1);
    order.push(k);
    draw(k, 'ok');
    s.say(`put(${k}): new keys start in the “used 1×” bucket.`);
  }
  for (const k of [a, a, b]) {
    freq.set(k, freq.get(k)! + 1);
    touch(k);
    draw(k, 'ok');
    s.say(`get(${k}): ${k} has now been used ${freq.get(k)} times, so it moves up to the “used ${freq.get(k)}×” bucket. O(1) with a dictionary of buckets.`);
  }
  const minF = Math.min(...freq.values());
  const victim = order.find((k) => freq.get(k) === minF)!;
  draw(victim, 'bad');
  s.say(`put(${d}) on a full cache: the lowest bucket is “used ${minF}×”, and its oldest key is ${victim}. Evict it.`);
  freq.delete(victim);
  order.splice(order.indexOf(victim), 1);
  s.del(`n${victim}`);
  freq.set(d, 1);
  order.push(d);
  draw(d, 'ok');
  s.say(`${d} enters at “used 1×”. Popular keys survive even if not used very recently: better than LRU when some items are always hot, but more bookkeeping (and old favourites can linger).`);
  return s.build('LFU cache: evict the least used');
};

// =====================================================================
// Sparse matrix
// =====================================================================

const sparseMatrix: AnimScript = () => {
  const s = new Stage();
  const R = 5;
  const C = 8;
  const cells = shuffle(Array.from({ length: R * C }, (_, i) => i)).slice(0, 5).sort((x, y) => x - y);
  const val = new Map(cells.map((i) => [i, randInt(1, 9)]));
  const S = 34;
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      const i = r * C + c;
      s.box(`c${i}`, { x: c * S, y: r * S, w: S - 4, h: S - 4, label: String(val.get(i) ?? 0), tone: val.has(i) ? 'accent' : 'dim' });
    }
  s.say(`A ${R} × ${C} matrix with only ${cells.length} non-zero values. Stored as a normal 2D array it uses ${R * C} cells, ${R * C - cells.length} of them zeros.`);
  for (let i = 0; i < R * C; i++) if (!val.has(i)) s.del(`c${i}`);
  s.say('A sparse matrix simply doesn\'t store the zeros. Anything not stored is 0.');
  const LX = C * S + 60;
  s.text('h', LX, -8, '(row, col) → value', { bold: true, size: 'sm', tone: 'dim' });
  cells.forEach((i, k) => {
    s.box(`c${i}`, { x: LX, y: k * 36, w: 110, h: 30, label: `(${Math.floor(i / C)}, ${i % C}) → ${val.get(i)}`, tone: 'accent' });
  });
  s.say(`Coordinate format (COO): one row per non-zero: (row, col, value). ${cells.length} × 3 = ${cells.length * 3} numbers instead of ${R * C}.`);
  const rows = Array.from({ length: R + 1 }, (_, r) => cells.filter((i) => Math.floor(i / C) < r).length);
  s.text('csr', LX, cells.length * 36 + 26, `CSR row starts: [${rows.join(', ')}]`, { bold: true, tone: 'ok' });
  s.say(`Sorted by row, you can replace the row column with “where each row starts” (CSR): row r's values are entries ${rows[0]}… up to the next start. Then a whole row is a slice, which makes multiplying a matrix by a vector fast.`);
  s.say('Real sparse matrices (social networks, recommendation systems, physics simulations) are often 99.99% zeros: storing only the non-zeros is the difference between megabytes and terabytes.');
  return s.build('Sparse matrix: store only the non-zeros');
};

// =====================================================================
// Mergeable heaps (skew heap)
// =====================================================================

interface SN {
  k: number;
  l: SN | null;
  r: SN | null;
}

const mergeableHeaps: AnimScript = () => {
  const s = new Stage();
  const mkHeap = (vals: number[]): SN | null => {
    // A min-heap shaped as a small skew heap: build by repeated merge.
    let h: SN | null = null;
    for (const v of vals) h = skew(h, { k: v, l: null, r: null }, []);
    return h;
  };
  const skew = (a: SN | null, b: SN | null, path: SN[]): SN | null => {
    if (!a) return b;
    if (!b) return a;
    if (b.k < a.k) [a, b] = [b, a];
    path.push(a);
    a.r = skew(a.r, b, path);
    [a.l, a.r] = [a.r, a.l];
    return a;
  };
  const all = distinctInts(8, 1, 60);
  const A = mkHeap(all.slice(0, 4))!;
  const B = mkHeap(all.slice(4))!;
  const toT = (n: SN | null, tone: (n: SN) => Tone): TNode | null => (n ? { id: String(n.k), label: String(n.k), tone: tone(n), left: toT(n.l, tone), right: toT(n.r, tone) } : null);
  const place = (n: SN | null, x0: number, tone: (n: SN) => Tone) => {
    const t = toT(n, tone);
    const pos = treePos(t, { x: x0, dx: 48, dy: 62 });
    const walk = (m: TNode | null | undefined, parent?: TNode) => {
      if (!m) return;
      const p = pos.get(m.id)!;
      s.box(`h${m.id}`, { x: p.x, y: p.y, w: 40, h: 40, shape: 'circle', label: m.label, tone: m.tone });
      if (parent) s.arrow(`e${m.id}`, `h${parent.id}`, `h${m.id}`, { tone: 'dim', line: true });
      else delete s.arrows[`e${m.id}`];
      walk(m.left, m);
      walk(m.right, m);
    };
    walk(t);
  };
  const spine = (n: SN | null) => {
    const out = new Set<number>();
    while (n) {
      out.add(n.k);
      n = n.r;
    }
    return out;
  };
  place(A, 0, () => 'plain');
  place(B, 260, () => 'accent');
  s.text('la', 0, -24, 'heap A', { bold: true, size: 'sm', tone: 'dim' });
  s.text('lb', 260, -24, 'heap B', { bold: true, size: 'sm', tone: 'dim' });
  s.say('Two min-heaps. A normal array heap merges by re-inserting everything: O(n log n). A mergeable heap (here a skew heap, built from pointers) merges in O(log n) amortised.');
  const sa = spine(A);
  const sb = spine(B);
  place(A, 0, (n) => (sa.has(n.k) ? 'hl' : 'plain'));
  place(B, 260, (n) => (sb.has(n.k) ? 'hl' : 'accent'));
  s.say('The trick: only the RIGHT spines (highlighted) take part. Walk down both, always keeping the smaller root on top, like merging two sorted lists.');
  const path: SN[] = [];
  const M = skew(A, B, path)!;
  s.del('la', 'lb');
  const onPath = new Set(path.map((n) => n.k));
  place(M, 60, (n) => (onPath.has(n.k) ? 'ok' : 'plain'));
  s.say(`Merged. Along the merge path (green) each node took the merged rest as a child, and then its two children were swapped. The swap is what keeps right spines short on average.`);
  place(M, 60, () => 'plain');
  s.say(`One heap with all ${all.length} values, root ${M.k} (the minimum). Insert = merge with a 1-node heap; remove-min = merge the root's two children. Leftist and binomial heaps use the same merge idea with stricter shape rules.`);
  return s.build('Mergeable heaps: merging along the right spine');
};

// =====================================================================
// Persistent structures (path copying)
// =====================================================================

const persistent: AnimScript = () => {
  const s = new Stage();
  const keys = distinctInts(7, 10, 99).sort((a, b) => a - b);
  const order = [keys[3], keys[1], keys[5], keys[0], keys[2], keys[4], keys[6]];
  const root = bst(order)!;
  const opts = { dx: 56, dy: 70, x: 0, y: 40 };
  drawTree(s, root, opts);
  tag(s, 'v1', 'v1', s.boxes[`n${keys[3]}`].x - 60, 49);
  s.arrow('v1>', 'v1', `n${keys[3]}`, { tone: 'ptr' });
  s.say('A persistent structure keeps every old version after a change. Copying the whole tree each time would cost O(n). Instead: copy only what changes.');
  let x = randInt(keys[4] + 1, keys[6] - 1);
  while (keys.includes(x)) x++;
  // Path from root to where x goes.
  const path: TNode[] = [];
  let cur: TNode | null | undefined = root;
  while (cur) {
    path.push(cur);
    cur = x < Number(cur.label) ? cur.left : cur.right;
  }
  s.say(`Insert ${x} to make version 2. It goes below ${path.map((p) => p.label).join(' → ')}. Those ${path.length} nodes are the only ones whose children change.`);
  path.forEach((p, i) => {
    const o = s.boxes[`n${p.id}`];
    s.box(`c${p.id}`, { x: o.x + 22, y: o.y - 36, w: 40, h: 40, shape: 'circle', label: p.label, tone: 'ok' });
    if (i) s.arrow(`ce${p.id}`, `c${path[i - 1].id}`, `c${p.id}`, { tone: 'ok' });
    const goLeft = x < Number(p.label);
    const other = goLeft ? p.right : p.left;
    if (other) s.arrow(`cs${p.id}`, `c${p.id}`, `n${other.id}`, { tone: 'ok', dashed: true });
    s.say(i === 0 ? `Copy the root. The copy points to the same right/left subtree it doesn't change (dashed: shared, not copied).` : `Copy ${p.label} too, and link the copy from the previous copy. Its other subtree is shared.`);
  });
  const last = path[path.length - 1];
  const lo = s.boxes[`c${last.id}`];
  s.box(`new`, { x: lo.x + (x < Number(last.label) ? -30 : 30), y: lo.y + 70, w: 40, h: 40, shape: 'circle', label: String(x), tone: 'hl' });
  s.arrow('cnew', `c${last.id}`, 'new', { tone: 'ok' });
  tag(s, 'v2', 'v2', s.boxes[`c${path[0].id}`].x + 60, s.boxes[`c${path[0].id}`].y + 9);
  s.arrow('v2>', 'v2', `c${path[0].id}`, { tone: 'ptr' });
  s.say(`Add ${x} under the copied ${last.label}. Version 2 starts at the copied root.`);
  for (const p of path) s.tone(`n${p.id}`, 'dim');
  s.say(`Version 1 is untouched: follow v1 and ${x} isn't there. Version 2 shares everything else. Only ${path.length + 1} new nodes (O(log n)) for a whole new version. Git commits, undo history and C#’s ImmutableList work this way.`);
  return s.build('Persistent tree: path copying');
};

export const TIER10_ANIMS: Record<string, AnimScript> = {
  'ordered-map': orderedMap,
  'lru-cache': lru,
  'lfu-cache': lfu,
  'sparse-matrix': sparseMatrix,
  'mergeable-heaps': mergeableHeaps,
  'persistent-structures': persistent,
};


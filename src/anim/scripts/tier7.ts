import type { AnimScript, Tone } from '../engine';
import { Stage } from '../engine';
import { distinctInts, pick, randInt } from '../../engine/random';
import type { TNode } from '../kit';
import { H, STEP, W, drawTree, onSlot, slotRow } from '../kit';

// =====================================================================
// Prefix sums
// =====================================================================

const prefixSum: AnimScript = () => {
  const s = new Stage();
  const n = 7;
  const a = Array.from({ length: n }, () => randInt(1, 9));
  const P = [0];
  for (const v of a) P.push(P[P.length - 1] + v);
  s.text('la', -8, 26, 'a', { anchor: 'end', bold: true });
  slotRow(s, 'as', n, { x: STEP / 2 });
  a.forEach((v, i) => onSlot(s, `a${i}`, v, i, { x: STEP / 2 }));
  const py = H + 60;
  s.text('lp', -8, py + 26, 'P', { anchor: 'end', bold: true });
  slotRow(s, 'p', n + 1, { y: py, top: (i) => `P[${i}]` });
  s.say(`Many questions ask “what's the sum from index l to r?”. Adding up the range every time costs O(n). Prefix sums precompute running totals once.`);
  onSlot(s, 'p0', 0, 0, { y: py, tone: 'ok' });
  s.say('P[0] = 0: the sum of nothing.');
  for (let i = 0; i < n; i++) {
    onSlot(s, `p${i + 1}`, P[i + 1], i + 1, { y: py, tone: 'ok' });
    s.arrow('f1', `p${i}`, `p${i + 1}`, { tone: 'accent', bend: 20 });
    s.arrow('f2', `a${i}`, `p${i + 1}`, { tone: 'warn' });
    if (i < 3 || i === n - 1) s.say(`P[${i + 1}] = P[${i}] + a[${i}] = ${P[i]} + ${a[i]} = ${P[i + 1]}: the sum of the first ${i + 1} values.`);
    s.tone(`p${i + 1}`, 'plain');
  }
  s.del('f1', 'f2');
  s.say('Built in one pass, O(n).');
  const l = randInt(1, 3);
  const r = randInt(l + 2, n - 1);
  for (let i = l; i <= r; i++) s.tone(`a${i}`, 'hl');
  s.say(`Now: sum of a[${l}..${r}]?`);
  s.tone(`p${r + 1}`, 'ok');
  s.tone(`p${l}`, 'bad');
  s.text('f', 0, py + H + 40, `sum = P[${r + 1}] − P[${l}] = ${P[r + 1]} − ${P[l]} = ${P[r + 1] - P[l]}`, { bold: true, size: 'lg', tone: 'accent' });
  s.say(`P[${r + 1}] is everything up to a[${r}]; subtract P[${l}], everything before a[${l}]. What's left is exactly the range: ${P[r + 1] - P[l]}. Two lookups, O(1), for any range. (Only works while the array doesn't change.)`);
  return s.build('Prefix sums: any range sum in O(1)');
};

// =====================================================================
// Sparse table (range minimum)
// =====================================================================

const sparseTable: AnimScript = () => {
  const s = new Stage();
  const n = 8;
  const a = distinctInts(n, 1, 50);
  const lv: number[][] = [a];
  for (let k = 1; 1 << k <= n; k++) lv.push(Array.from({ length: n - (1 << k) + 1 }, (_, i) => Math.min(lv[k - 1][i], lv[k - 1][i + (1 << (k - 1))])));
  const y = (k: number) => k * (H + 30);
  lv.forEach((row, k) => {
    s.text(`l${k}`, -10, y(k) + 26, k === 0 ? 'array' : `min of ${1 << k}`, { anchor: 'end', size: 'sm', bold: true, tone: 'dim' });
    slotRow(s, `s${k}_`, row.length, { y: y(k), top: k ? () => '' : undefined });
  });
  a.forEach((v, i) => onSlot(s, `v0_${i}`, v, i));
  s.say('A sparse table answers “smallest value between l and r?” in O(1) for an array that never changes. It precomputes the minimum of every window whose length is a power of 2.');
  for (let k = 1; k < lv.length; k++) {
    const half = 1 << (k - 1);
    lv[k].forEach((v, i) => onSlot(s, `v${k}_${i}`, v, i, { y: y(k), tone: i === 0 ? 'ok' : 'plain' }));
    s.arrow('fa', `v${k - 1}_0`, `v${k}_0`, { tone: 'accent' });
    s.arrow('fb', `v${k - 1}_${half}`, `v${k}_0`, { tone: 'warn' });
    s.say(`Windows of ${1 << k}: each is the min of two windows of ${half} from the row above. E.g. the first = min(${lv[k - 1][0]}, ${lv[k - 1][half]}) = ${lv[k][0]}.`);
    s.tone(`v${k}_0`, 'plain');
  }
  s.del('fa', 'fb');
  s.say(`n log n values in total, built once.`);
  const l = randInt(0, 2);
  const r = randInt(l + 3, n - 1);
  const len = r - l + 1;
  const k = Math.floor(Math.log2(len));
  for (let i = l; i <= r; i++) s.tone(`v0_${i}`, 'hl');
  s.say(`Query min(a[${l}..${r}]): ${len} values. The biggest power of 2 that fits is ${1 << k}.`);
  const j = r - (1 << k) + 1;
  s.tone([`v${k}_${l}`, `v${k}_${j}`], 'ok');
  s.text('f', 0, y(lv.length) + 10, `min = min(${lv[k][l]}, ${lv[k][j]}) = ${Math.min(lv[k][l], lv[k][j])}`, { bold: true, size: 'lg', tone: 'accent' });
  s.say(`Two windows of ${1 << k}: one starting at ${l}, one ending at ${r}. Together they cover the range (overlapping is fine for min). Answer: min of two stored values, O(1).`);
  return s.build('Sparse table: range minimum in O(1)');
};

// =====================================================================
// Segment tree
// =====================================================================

const segmentTree: AnimScript = () => {
  const s = new Stage();
  const n = 8;
  const a = Array.from({ length: n }, () => randInt(1, 9));
  const sum = (l: number, r: number, arr = a) => arr.slice(l, r + 1).reduce((x, y) => x + y, 0);
  /** Nodes listed in `stale` still show their sums from before the update. */
  let before = [...a];
  let stale = new Set<string>();
  const build = (l: number, r: number, tone: (l: number, r: number) => Tone): TNode => {
    const node: TNode = { id: `${l}_${r}`, label: String(sum(l, r, stale.has(`${l}_${r}`) ? before : a)), sub: l === r ? `[${l}]` : `${l}–${r}`, tone: tone(l, r) };
    if (l === r) return node;
    const m = (l + r) >> 1;
    return { ...node, left: build(l, m, tone), right: build(m + 1, r, tone) };
  };
  const opts = { dx: 50, dy: 64, size: 38 };
  drawTree(s, build(0, n - 1, (l, r) => (l === r ? 'accent' : 'plain')), opts);
  s.say(`A segment tree: the leaves are the array (${a.join(', ')}). Every node above stores the sum of the range below it; the root covers everything.`);
  const ql = randInt(1, 3);
  const qr = randInt(ql + 2, n - 2);
  const used: string[] = [];
  const visited: string[] = [];
  const query = (l: number, r: number) => {
    visited.push(`${l}_${r}`);
    if (qr < l || r < ql) return;
    if (ql <= l && r <= qr) {
      used.push(`${l}_${r}`);
      return;
    }
    const m = (l + r) >> 1;
    query(l, m);
    query(m + 1, r);
  };
  query(0, n - 1);
  s.say(`Sum of a[${ql}..${qr}]? Start at the root and go down only where a node's range partly overlaps the query.`);
  drawTree(s, build(0, n - 1, (l, r) => (used.includes(`${l}_${r}`) ? 'ok' : visited.includes(`${l}_${r}`) ? 'hl' : 'dim')), opts);
  s.say(`Green nodes lie completely inside ${ql}..${qr}: take their stored sums without going further. ${used.map((u) => sum(Number(u.split('_')[0]), Number(u.split('_')[1]))).join(' + ')} = ${sum(ql, qr)}. Only O(log n) nodes touched.`);
  const i = randInt(0, n - 1);
  const old = a[i];
  before = [...a];
  a[i] = old + randInt(1, 5);
  const path: string[] = [];
  let l = 0;
  let r = n - 1;
  for (;;) {
    path.push(`${l}_${r}`);
    if (l === r) break;
    const m = (l + r) >> 1;
    if (i <= m) r = m;
    else l = m + 1;
  }
  stale = new Set(path.slice(0, -1));
  drawTree(s, build(0, n - 1, (l2, r2) => (`${l2}_${r2}` === `${i}_${i}` ? 'hl' : 'plain')), opts);
  s.say(`Update a[${i}] from ${old} to ${a[i]}. Change the leaf first. The sums above it are now out of date.`);
  for (let k = path.length - 2; k >= 0; k--) {
    stale.delete(path[k]);
    const [pl, pr] = path[k].split('_').map(Number);
    drawTree(s, build(0, n - 1, (l2, r2) => (`${l2}_${r2}` === path[k] ? 'ok' : path.slice(k + 1).includes(`${l2}_${r2}`) ? 'accent' : 'plain')), opts);
    s.say(`Recompute the node for ${pl}–${pr} from its two children: ${sum(pl, pr)}.${k === 0 ? ` That was the root: ${path.length - 1} nodes fixed, one per level. Query and update are both O(log n).` : ''}`);
  }
  return s.build('Segment tree: range sums with updates');
};

// =====================================================================
// Fenwick tree
// =====================================================================

const fenwick: AnimScript = () => {
  const s = new Stage();
  const n = 8;
  const a = [0, ...Array.from({ length: n }, () => randInt(1, 9))];
  const lowbit = (i: number) => i & -i;
  const T = a.map((_, i) => (i ? a.slice(i - lowbit(i) + 1, i + 1).reduce((x, y) => x + y, 0) : 0));
  const X = (i: number) => (i - 1) * STEP;
  for (let i = 1; i <= n; i++) s.box(`a${i}`, { x: X(i), y: 0, w: W, h: H, label: String(a[i]), top: `${i}` });
  s.text('la', -8, 26, 'array', { anchor: 'end', size: 'sm', bold: true, tone: 'dim' });
  s.say('A Fenwick (binary indexed) tree is one extra array where slot i holds the sum of a stretch of values ending at i. The stretch length is i’s lowest set bit.');
  const by = (lb: number) => H + 40 + Math.log2(lb) * 50;
  for (let i = 1; i <= n; i++) {
    const lb = lowbit(i);
    s.box(`t${i}`, { x: X(i - lb + 1), y: by(lb), w: lb * STEP - GAP2, h: 28, label: String(T[i]), top: `T[${i}]`, tone: 'accent' });
  }
  s.say('Each bar shows what T[i] covers. 1, 3, 5, 7 (odd) cover 1 value; 2, 6 cover 2; 4 covers 4; 8 covers all 8. Bits decide everything.');
  const q = randInt(5, 7);
  let i = q;
  const parts: number[] = [];
  while (i > 0) {
    s.tone(`t${i}`, 'ok');
    parts.push(i);
    s.say(`Prefix sum up to ${q}: take T[${i}] = ${T[i]}, then jump to i − lowbit(i) = ${i} − ${lowbit(i)} = ${i - lowbit(i)}.`);
    i -= lowbit(i);
  }
  s.text('f', 0, by(8) + 54, `sum(1..${q}) = ${parts.map((p) => T[p]).join(' + ')} = ${parts.reduce((x, p) => x + T[p], 0)}`, { bold: true, tone: 'accent', size: 'lg' });
  s.say(`Done in ${parts.length} jumps: the bars tile 1..${q} exactly. At most log n jumps.`);
  for (let k = 1; k <= n; k++) s.tone(`t${k}`, 'accent');
  s.del('f');
  const u = pick([1, 3, 5]);
  const d = randInt(1, 5);
  i = u;
  s.set(`a${u}`, { label: String(a[u] + d), tone: 'hl' });
  s.say(`Update: add ${d} to value ${u}. Every bar covering position ${u} must change.`);
  while (i <= n) {
    T[i] += d;
    s.set(`t${i}`, { label: String(T[i]), tone: 'ok' });
    s.say(`T[${i}] covers ${u}: add ${d}. Next: i + lowbit(i) = ${i} + ${lowbit(i)} = ${i + lowbit(i)}.`);
    i += lowbit(i);
  }
  s.say('Same O(log n) as a segment tree, but just one array and a few lines of code: i & −i finds the lowest set bit.');
  return s.build('Fenwick tree: bit tricks for prefix sums');
};
const GAP2 = 6;

// =====================================================================
// Interval tree (augmented BST: max end in subtree)
// =====================================================================

interface IV {
  s: number;
  e: number;
  l: IV | null;
  r: IV | null;
  max: number;
}

const intervalTree: AnimScript = () => {
  const s = new Stage();
  const starts = distinctInts(6, 0, 20);
  const ivs = starts.map((st) => ({ s: st, e: st + randInt(2, 8) }));
  let root: IV | null = null;
  const ins = (n: IV | null, v: { s: number; e: number }): IV => {
    if (!n) return { ...v, l: null, r: null, max: v.e };
    if (v.s < n.s) n.l = ins(n.l, v);
    else n.r = ins(n.r, v);
    n.max = Math.max(n.max, v.e);
    return n;
  };
  const order = [...ivs].sort((a, b) => a.s - b.s);
  const mid = [order[2], order[0], order[4], order[1], order[3], order[5]];
  for (const v of mid) root = ins(root, v);
  const toT = (n: IV | null, tone: (n: IV) => Tone): TNode | null => (n ? { id: `${n.s}`, label: `${n.s}–${n.e}`, sub: `max ${n.max}`, tone: tone(n), left: toT(n.l, tone), right: toT(n.r, tone) } : null);
  const opts = { nodeW: 64, dx: 72, dy: 72 };
  drawTree(s, toT(root, () => 'plain'), opts);
  s.say('An interval tree stores ranges like meeting times. It is a BST ordered by start time, and every node also remembers the latest END anywhere in its subtree (max).');
  const qs = randInt(5, 18);
  const qe = qs + randInt(1, 3);
  s.text('q', 0, -30, `Which intervals overlap ${qs}–${qe}?`, { bold: true, size: 'lg', tone: 'accent' });
  const hit = new Set<IV>();
  const seen = new Set<IV>();
  const skipped = new Set<IV>();
  const tone = (n: IV): Tone => (hit.has(n) ? 'ok' : skipped.has(n) ? 'dim' : seen.has(n) ? 'hl' : 'plain');
  const walk = (n: IV | null) => {
    if (!n) return;
    if (n.max < qs) {
      const mark = (m: IV | null) => {
        if (!m) return;
        skipped.add(m);
        mark(m.l);
        mark(m.r);
      };
      mark(n);
      drawTree(s, toT(root, tone), opts);
      s.say(`Subtree at ${n.s}–${n.e}: its max end is ${n.max}, before ${qs}. Nothing in there can overlap: skip the whole subtree.`);
      return;
    }
    seen.add(n);
    const ov = n.s <= qe && qs <= n.e;
    if (ov) hit.add(n);
    drawTree(s, toT(root, tone), opts);
    s.say(`${n.s}–${n.e}: ${ov ? 'overlaps! Report it.' : 'no overlap.'}${n.s > qe ? ` It starts after ${qe}, so everything to its right starts even later: don't go right.` : ''}`);
    walk(n.l);
    if (n.s <= qe) walk(n.r);
  };
  walk(root);
  s.say(`Found ${hit.size} overlapping interval${hit.size === 1 ? '' : 's'}. The max values let whole branches be skipped, so a query costs O(log n + number found) instead of checking every interval.`);
  return s.build('Interval tree: finding overlaps');
};

// =====================================================================
// k-d tree
// =====================================================================

const kdTree: AnimScript = () => {
  const s = new Stage();
  const SZ = 300;
  const pts = Array.from({ length: 7 }, (_, i) => ({ id: `p${i}`, x: randInt(10, 90), y: randInt(10, 90) }));
  const px = (v: number) => (v / 100) * SZ;
  s.box('plane', { x: 0, y: 0, w: SZ, h: SZ, shape: 'frame' });
  for (const p of pts) s.box(p.id, { x: px(p.x) - 7, y: px(p.y) - 7, w: 14, h: 14, shape: 'circle', tone: 'accent' });
  s.say('A k-d tree organises points in space (here 2D) so “what’s near here?” doesn’t need to check every point.');
  interface KD {
    p: (typeof pts)[number];
    axis: 0 | 1;
    l: KD | null;
    r: KD | null;
    box: [number, number, number, number];
  }
  const build = (ps: typeof pts, depth: number, box: [number, number, number, number]): KD | null => {
    if (!ps.length) return null;
    const axis = (depth % 2) as 0 | 1;
    const sorted = [...ps].sort((a, b) => (axis ? a.y - b.y : a.x - b.x));
    const m = sorted.length >> 1;
    const p = sorted[m];
    const [x0, y0, x1, y1] = box;
    return {
      p,
      axis,
      box,
      l: build(sorted.slice(0, m), depth + 1, axis ? [x0, y0, x1, p.y] : [x0, y0, p.x, y1]),
      r: build(sorted.slice(m + 1), depth + 1, axis ? [x0, p.y, x1, y1] : [p.x, y0, x1, y1]),
    };
  };
  const root = build(pts, 0, [0, 0, 100, 100])!;
  const lines: KD[] = [];
  const collect = (n: KD | null) => {
    if (!n) return;
    lines.push(n);
    collect(n.l);
    collect(n.r);
  };
  collect(root);
  for (const [k, n] of lines.entries()) {
    const [x0, y0, x1, y1] = n.box;
    if (n.axis === 0) s.box(`ln${k}`, { x: px(n.p.x) - 1, y: px(y0), w: 2, h: px(y1 - y0), tone: k === 0 ? 'bad' : 'warn' });
    else s.box(`ln${k}`, { x: px(x0), y: px(n.p.y) - 1, w: px(x1 - x0), h: 2, tone: 'warn' });
    s.tone(n.p.id, 'hl');
    if (k < 3 || k === lines.length - 1)
      s.say(k === 0 ? 'Split all points at the median x: a vertical line. Points left of it go to the left subtree, right of it to the right.' : k < 3 ? `Inside each half, split at the median ${n.axis ? 'y (a horizontal line)' : 'x'}. Levels alternate x, y, x, y…` : 'Keep splitting until every point has its own cell.');
    s.tone(n.p.id, 'accent');
  }
  const q = { x: randInt(15, 85), y: randInt(15, 85) };
  s.box('q', { x: px(q.x) - 9, y: px(q.y) - 9, w: 18, h: 18, shape: 'rect', tone: 'ok', label: '' });
  s.say('Nearest point to the green square? Walk down the tree like a BST, comparing x or y at each level, to the cell the square is in.');
  const d2 = (p: { x: number; y: number }) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
  let best = root.p;
  let checked = 0;
  const visit = (n: KD | null) => {
    if (!n) return;
    checked++;
    if (d2(n.p) < d2(best)) best = n.p;
    const diff = n.axis ? q.y - n.p.y : q.x - n.p.x;
    const [near, far] = diff < 0 ? [n.l, n.r] : [n.r, n.l];
    visit(near);
    if (diff * diff < d2(best)) visit(far);
  };
  visit(root);
  s.tone(best.id, 'ok');
  s.arrow('nn', 'q', best.id, { tone: 'ok' });
  s.say(`Nearest found after checking ${checked} of ${pts.length} points. On the way back up, a neighbouring cell is only searched if the dividing line is closer than the best point so far; otherwise the whole cell is skipped. With many points that's about O(log n).`);
  return s.build('k-d tree: splitting space');
};

// =====================================================================
// Quadtree
// =====================================================================

const quadtree: AnimScript = () => {
  const s = new Stage();
  const SZ = 320;
  s.box('plane', { x: 0, y: 0, w: SZ, h: SZ, shape: 'frame' });
  interface Q {
    x: number;
    y: number;
    sz: number;
    pts: { id: string; x: number; y: number }[];
    kids: Q[] | null;
  }
  const root: Q = { x: 0, y: 0, sz: SZ, pts: [], kids: null };
  let lines = 0;
  const insert = (q: Q, p: Q['pts'][number]): boolean => {
    if (q.kids) {
      const h = q.sz / 2;
      const k = (p.x >= q.x + h ? 1 : 0) + (p.y >= q.y + h ? 2 : 0);
      return insert(q.kids[k], p);
    }
    q.pts.push(p);
    if (q.pts.length <= 1 || q.sz < 40) return false;
    const h = q.sz / 2;
    q.kids = [0, 1, 2, 3].map((k) => ({ x: q.x + (k & 1 ? h : 0), y: q.y + (k & 2 ? h : 0), sz: h, pts: [], kids: null }));
    s.box(`v${lines}`, { x: q.x + h - 1, y: q.y, w: 2, h: q.sz, tone: 'warn' });
    s.box(`h${lines++}`, { x: q.x, y: q.y + h - 1, w: q.sz, h: 2, tone: 'warn' });
    const old = q.pts;
    q.pts = [];
    for (const o of old) insert(q, o);
    return true;
  };
  s.say('A quadtree splits a square region into 4 equal squares whenever a square holds too many points (here: more than 1). Busy areas get finely divided; empty areas stay big.');
  const pts = Array.from({ length: 7 }, (_, i) => ({ id: `p${i}`, x: randInt(8, SZ - 8), y: randInt(8, SZ - 8) }));
  // Cluster a few points so splitting is visible.
  pts[2] = { id: 'p2', x: pts[1].x + randInt(-30, 30), y: pts[1].y + randInt(-30, 30) };
  pts[2].x = Math.max(8, Math.min(SZ - 8, pts[2].x));
  pts[2].y = Math.max(8, Math.min(SZ - 8, pts[2].y));
  for (const p of pts) {
    s.box(p.id, { x: p.x - 7, y: p.y - 7, w: 14, h: 14, shape: 'circle', tone: 'ok' });
    const split = insert(root, p);
    s.say(split ? 'This square now has 2 points: split it into 4 quarters and push the points down into them.' : 'Add a point. Its square had room, so nothing splits.');
    s.tone(p.id, 'accent');
  }
  const rx = randInt(20, SZ / 2);
  const ry = randInt(20, SZ / 2);
  const rw = randInt(80, 130);
  const rh = randInt(80, 130);
  s.box('rq', { x: rx, y: ry, w: rw, h: rh, shape: 'frame', tone: 'ok', label: 'search area' });
  let inside = 0;
  for (const p of pts)
    if (p.x >= rx && p.x <= rx + rw && p.y >= ry && p.y <= ry + rh) {
      s.tone(p.id, 'ok');
      inside++;
    } else s.tone(p.id, 'dim');
  s.say(`Find the points in the green area: only visit squares that overlap it; any square that misses it is skipped with everything inside. ${inside} found. Used for maps, games (collision checks) and image compression.`);
  return s.build('Quadtree: dividing space into quarters');
};

export const TIER7_ANIMS: Record<string, AnimScript> = {
  'prefix-sum': prefixSum,
  'sparse-table': sparseTable,
  'segment-tree': segmentTree,
  'fenwick-tree': fenwick,
  'interval-tree': intervalTree,
  'kd-tree': kdTree,
  quadtree,
};


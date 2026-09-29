import type { Card, Concept, Scene, TreeNode, Val } from '../engine/types';
import { cloneScene, fmtArray } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions, options } from './helpers';

const t = (id: string | number) => `t:${id}`;
const small = (n: number) => Array.from({ length: n }, () => randInt(1, 9));
const prefix = (a: number[]) => a.reduce<number[]>((p, x) => [...p, p[p.length - 1] + x], [0]);
const sum = (a: number[], l: number, r: number) => a.slice(l, r + 1).reduce((s, x) => s + x, 0);

// =====================================================================
// Prefix-sum array
// =====================================================================

const PS = 'prefix-sum';

const psScene = (a: number[], showP = true): Scene => ({
  views: [
    { type: 'row', key: 'a', items: a, title: 'a' },
    ...(showP ? [{ type: 'row' as const, key: 'P', items: prefix(a), labels: prefix(a).map((_, i) => `P[${i}]`), title: 'P: P[i] = a[0] + … + a[i−1]' }] : []),
  ],
});

const predictRangeSum = (): Card => {
  const a = small(randInt(7, 9));
  const P = prefix(a);
  const l = randInt(1, 3);
  const r = randInt(l + 2, a.length - 1);
  return {
    concept: PS,
    type: 'predict',
    prompt: `Using only P, what's a[${l}] + … + a[${r}]? (P[i] is the sum of the first i elements.)`,
    scene: psScene(a),
    body: {
      kind: 'choice',
      options: options({ text: `P[${r + 1}] − P[${l}] = ${P[r + 1] - P[l]}`, why: 'Everything up to r, minus everything before l.' }, [
        { text: `P[${r}] − P[${l}] = ${P[r] - P[l]}`, why: `P[${r}] stops before a[${r}]. You need P[${r + 1}].` },
        { text: `P[${r + 1}] − P[${l + 1}] = ${P[r + 1] - P[l + 1]}`, why: `That drops a[${l}] too.` },
        { text: `P[${r + 1}] + P[${l}] = ${P[r + 1] + P[l]}`, why: 'Subtract the part before l, don’t add it.' },
      ]),
    },
    explain: `P[${r + 1}] = sum of a[0..${r}], P[${l}] = sum of a[0..${l - 1}]. Subtracting leaves exactly a[${l}..${r}] = ${sum(a, l, r)}. Two reads, any range.`,
  };
};

const predictBuildP = (): Card => {
  const a = small(randInt(5, 6));
  const P = prefix(a);
  const noZero = P.slice(1);
  return {
    concept: PS,
    type: 'predict',
    prompt: `a = ${fmtArray(a)}. What's the prefix-sum array P (with P[0] = 0)?`,
    body: {
      kind: 'choice',
      options: options({ text: fmtArray(P), why: 'Each entry adds the next element to the running total.' }, [
        { text: fmtArray([0, ...noZero.slice(0, -1).map((x, i) => x + (i % 2))]), why: 'Recheck the running total.' },
        { text: fmtArray(noZero), why: 'Missing the leading 0 (the sum of zero elements), which makes range formulas off by one.' },
        { text: fmtArray([0, ...a]), why: 'That just copies a. Each P entry is a running total.' },
      ]),
    },
    explain: `Running total: ${P.join(', ')}. One pass, O(n), then any range sum is O(1).`,
  };
};

const simulatePS = (): Card => {
  const a = small(randInt(7, 9));
  const l = randInt(1, 3);
  const r = randInt(l + 2, a.length - 1);
  const scene = psScene(a);
  const expected = [`P:${r + 1}`, `P:${l}`];
  return {
    concept: PS,
    type: 'simulate',
    prompt: `Answer sum(a[${l}..${r}]) using P. Click the P entry you read first (the end), then the one you subtract.`,
    scene,
    body: {
      kind: 'click',
      expected,
      frames: [scene, { ...cloneScene(scene), highlight: [expected[0]] }, { ...cloneScene(scene), highlight: expected }],
      wrongHint: (step, id) => (id.startsWith('a:') ? 'Use P only, not a.' : step === 0 ? `P[i] covers a[0..i−1]. To include a[${r}], you need P[${r + 1}].` : `Subtract everything before a[${l}]: P[${l}].`),
    },
    explain: `P[${r + 1}] − P[${l}] = ${sum(a, l, r)}. Two reads instead of ${r - l + 1}.`,
  };
};

const countPSUpdate = (): Card => {
  const n = randInt(8, 100);
  const i = randInt(0, n - 1);
  return {
    concept: PS,
    type: 'count',
    prompt: `a has ${n} elements and P has ${n + 1} entries. You change a[${i}]. How many entries of P must be updated?`,
    body: { kind: 'number', answer: n - i, unit: 'entries' },
    explain: `Every P[j] with j > ${i} includes a[${i}]: P[${i + 1}] … P[${n}], that's ${n - i}. Updates are O(n); that's the price of O(1) queries (Fenwick and segment trees balance it).`,
  };
};

const countPSReads = (): Card => {
  const n = randInt(1000, 1_000_000);
  return {
    concept: PS,
    type: 'count',
    prompt: `An array of ${n.toLocaleString()} numbers with a prefix-sum array. How many reads does summing any range take?`,
    body: { kind: 'number', answer: 2, unit: 'reads' },
    explain: 'P[r+1] and P[l]. Any length, same cost.',
  };
};

const growthPS = (): Card =>
  pick([
    () => growthCard(PS, 'range-sum query using P', () => 2, 0, 'Two reads, whatever the range length.'),
    () => growthCard(PS, 'update a[0] and fix P', (n) => n, 2, 'Every prefix after it changes.'),
  ])();

const psExplain = explainGenerators({
  concept: PS,
  truths: [
    'P[i] stores the sum of the first i elements, with P[0] = 0.',
    'sum(a[l..r]) = P[r+1] − P[l]: two reads for any range.',
    'Building P takes one pass: O(n).',
    'Changing one element forces all later prefix sums to change: O(n).',
  ],
  myths: [
    { text: 'sum(a[l..r]) = P[r] − P[l].', why: 'P[r] stops before a[r]; you need P[r+1].' },
    { text: 'Prefix sums make updates O(1) too.', why: 'An update ripples through every later prefix.' },
    { text: 'Prefix sums work for range minimum as well.', why: 'You can’t “subtract” a minimum.' },
  ],
  chains: [
    {
      prompt: 'Why is a range sum just P[r+1] − P[l]?',
      steps: ['P[r+1] is the sum of everything up to and including a[r].', 'P[l] is the sum of everything before a[l].', 'Subtracting removes the part before l.', 'What’s left is exactly a[l] + … + a[r].'],
    },
  ],
  summary: {
    best: 'Keep a running total at every position; then the total of any stretch is just “total at the end minus total before the start”.',
    others: [
      { text: 'A prefix sum is the sum of a prefix.', why: 'Circular.' },
      { text: 'It makes sums faster.', why: 'How, and at what cost?' },
      { text: 'It’s a cumulative array.', why: 'Names it, doesn’t explain the subtraction trick.' },
    ],
  },
});

export const prefixSumConcept: Concept = {
  id: PS,
  title: 'Prefix-Sum Array',
  tier: 7,
  prereqs: ['static-array'],
  tagline: 'Running totals: any range sum in two reads.',
  hook: {
    problem: 'A fitness app stores steps per day for years. Users constantly ask "how many steps from day 120 to day 480?", adding up to 360 numbers each time.',
    question: 'How could every such question take constant time?',
    options: [
      { text: 'Store the running total up to each day; answer = total at the end − total before the start.', good: true, feedback: 'Yes. A prefix-sum array: one pass to build, two reads per query.' },
      { text: 'Cache each answer after computing it.', feedback: 'There are ~n² possible ranges: too many to cache.' },
      { text: 'Add faster.', feedback: 'Still O(range length).' },
    ],
  },
  lens: {
    layout: 'A second array P of length n + 1, next to the data.',
    invariant: 'P[i] = a[0] + … + a[i−1] for every i.',
    payoff: 'Range sums in O(1) after O(n) preprocessing.',
    price: 'Updates are O(n); only works for invertible operations like +.',
  },
  generators: {
    predict: [predictRangeSum, predictBuildP],
    simulate: [simulatePS],
    count: [countPSUpdate, countPSReads, growthPS],
    explain: psExplain,
  },
};

// =====================================================================
// Sparse table
// =====================================================================

const ST = 'sparse-table';

function sparse(a: number[]): number[][] {
  const st = [a.slice()];
  for (let k = 1; 1 << k <= a.length; k++) {
    const prev = st[k - 1];
    const row: number[] = [];
    for (let i = 0; i + (1 << k) <= a.length; i++) row.push(Math.min(prev[i], prev[i + (1 << (k - 1))]));
    st.push(row);
  }
  return st;
}
const stScene = (a: number[]): Scene => {
  const st = sparse(a);
  return {
    views: [
      { type: 'row', key: 'a', items: a, title: 'a' },
      { type: 'grid', key: 's', rows: st.map((r) => [...r, ...Array(a.length - r.length).fill(null)] as Val[]), rowLabels: st.map((_, k) => `len ${1 << k}`), colLabels: a.map((_, i) => String(i)), title: 'st[k][i] = min of a[i .. i + 2^k − 1]' },
    ],
  };
};
function stQuery(l: number, r: number) {
  const k = Math.floor(Math.log2(r - l + 1));
  return { k, i: l, j: r - (1 << k) + 1 };
}

const predictSTCells = (): Card => {
  const n = 8;
  const a = distinctInts(n, 1, 50);
  const l = randInt(0, 3);
  const r = randInt(l + 2, n - 1);
  const { k, i, j } = stQuery(l, r);
  const L = 1 << k;
  return {
    concept: ST,
    type: 'predict',
    prompt: `Range-min query on a[${l}..${r}] (length ${r - l + 1}). Which two table entries answer it?`,
    scene: stScene(a),
    body: {
      kind: 'choice',
      options: options({ text: `st[len ${L}][${i}] and st[len ${L}][${j}]`, why: `The biggest power of 2 that fits is ${L}: one block starting at ${l}, one ending at ${r}.` }, [
        { text: `st[len ${L * 2 > r - l + 1 ? L / 2 || 1 : L * 2}][${i}] and st[len ${L * 2 > r - l + 1 ? L / 2 || 1 : L * 2}][${j}]`, why: `Use the largest power of 2 ≤ ${r - l + 1}, which is ${L}.` },
        { text: `st[len ${L}][${i}] and st[len ${L}][${i + L}]`, why: 'That second block may run past r. Anchor it to end exactly at r.' },
        { text: `st[len 1][${l}] and st[len 1][${r}]`, why: 'That only looks at the two endpoints.' },
      ]),
    },
    explain: `Two blocks of length ${L}: [${i}..${i + L - 1}] and [${j}..${r}]. They may overlap. For min, counting an element twice doesn't matter.`,
  };
};

const predictSTSum = (): Card => ({
  concept: ST,
  type: 'predict',
  prompt: 'A sparse table answers range-MIN with two overlapping blocks. Why can’t the same trick answer range-SUM?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'The overlap would be counted twice in a sum; min doesn’t care about duplicates.', correct: true, why: 'min(x, x) = x, but x + x ≠ x.' },
      { text: 'Sums are too big to store.', correct: false, why: 'Size isn’t the issue.' },
      { text: 'It can; the answer just needs halving.', correct: false, why: 'The overlap size varies; you can’t simply halve.' },
      { text: 'Sparse tables only store booleans.', correct: false, why: 'They store any values.' },
    ]),
  },
  explain: 'Overlap-friendly (“idempotent”) operations: min, max, gcd. For sums, use prefix sums instead.',
});

const simulateST = (): Card => {
  const n = 8;
  const a = distinctInts(n, 1, 50);
  const l = randInt(0, 3);
  const r = randInt(l + 2, n - 1);
  const { k, i, j } = stQuery(l, r);
  const scene = stScene(a);
  const exp = i === j ? [`s:${k},${i}`] : [`s:${k},${i}`, `s:${k},${j}`];
  return {
    concept: ST,
    type: 'simulate',
    prompt: `Answer min(a[${l}..${r}]). Click the table cell for the block starting at ${l}${i === j ? '' : `, then the block ending at ${r}`}.`,
    scene,
    body: {
      kind: 'click',
      expected: exp,
      frames: [scene, ...exp.map((_, x) => ({ ...cloneScene(scene), highlight: exp.slice(0, x + 1) }))],
      wrongHint: (step) => `Use row "len ${1 << k}" (the biggest power of 2 ≤ ${r - l + 1}); column ${step === 0 ? i : j}.`,
    },
    explain: `min(${sparse(a)[k][i]}, ${sparse(a)[k][j]}) = ${Math.min(...a.slice(l, r + 1))}. Always one or two reads.`,
  };
};

const countSTSize = (): Card => {
  const n = pick([8, 16, 32, 1024]);
  const rows = Math.floor(Math.log2(n)) + 1;
  return {
    concept: ST,
    type: 'count',
    prompt: `A sparse table over ${n} elements has a row for each block length 1, 2, 4, …, up to ${n}. How many rows?`,
    body: { kind: 'number', answer: rows, unit: 'rows' },
    explain: `Lengths 2^0 … 2^${rows - 1}: ${rows} rows of up to ${n} entries, about n log n total. That's the memory cost of O(1) queries.`,
  };
};

const growthST = (): Card => growthCard(ST, 'range-min query with a sparse table', () => 2, 0, 'Two overlapping blocks, always.');

const stExplain = explainGenerators({
  concept: ST,
  truths: [
    'st[k][i] stores the minimum of the block of length 2^k starting at i.',
    'Any range is covered by two (possibly overlapping) power-of-two blocks.',
    'Range-min queries take O(1); building takes O(n log n).',
    'It only works for operations where overlap doesn’t matter, like min, max or gcd.',
    'It doesn’t support updates without rebuilding.',
  ],
  myths: [
    { text: 'Sparse tables handle updates in O(log n).', why: 'They are static; an update can change many entries.' },
    { text: 'The two blocks must not overlap.', why: 'Overlap is fine for min: that’s the trick.' },
    { text: 'Sparse tables can do range sums in O(1) the same way.', why: 'Overlap would double-count.' },
  ],
  chains: [
    {
      prompt: 'Why do two blocks always cover the range?',
      steps: ['Let L be the biggest power of 2 not exceeding the range length.', 'A block of length L from the start covers more than half the range.', 'So does a block of length L ending at the end.', 'Together they cover everything (overlapping in the middle).'],
    },
  ],
  summary: {
    best: 'Precompute the minimum of every stretch whose length is a power of two; then any range is just two overlapping stretches, and the smaller of their minimums is the answer.',
    others: [
      { text: 'A sparse table is a table with few entries.', why: 'It has n log n entries.' },
      { text: 'It’s for range minimum queries.', why: 'What, not how.' },
      { text: 'It stores all possible ranges.', why: 'Only power-of-two lengths.' },
    ],
  },
});

export const sparseTableConcept: Concept = {
  id: ST,
  title: 'Sparse Table',
  tier: 7,
  prereqs: [PS],
  tagline: 'Power-of-two blocks. Range-min in O(1).',
  hook: {
    problem: 'Prefix sums answer range *sums* by subtraction. But "what’s the coldest day between day 120 and day 480?" can’t be done by subtracting minimums.',
    question: 'How could range-minimum queries still be O(1)?',
    options: [
      { text: 'Precompute the min of every block whose length is a power of two; any range is two overlapping such blocks.', good: true, feedback: 'Yes. Overlap doesn’t hurt a min. O(n log n) table, O(1) queries.' },
      { text: 'Precompute the min of every possible range.', feedback: 'That’s n² entries.' },
      { text: 'Keep a running minimum like a prefix sum.', feedback: 'That only answers ranges starting at 0.' },
    ],
  },
  lens: {
    layout: 'A 2D table: row k holds mins of blocks of length 2^k starting at each index.',
    invariant: 'st[k][i] = min(st[k−1][i], st[k−1][i + 2^(k−1)]).',
    payoff: 'O(1) range-min/max/gcd queries.',
    price: 'O(n log n) memory and build; static data only.',
  },
  generators: {
    predict: [predictSTCells, predictSTSum],
    simulate: [simulateST],
    count: [countSTSize, growthST],
    explain: stExplain,
  },
};

// =====================================================================
// Segment tree
// =====================================================================

const SG = 'segment-tree';

function segTree(a: number[], l = 0, r = a.length - 1): TreeNode {
  if (l === r) return { id: `${l}-${r}`, label: String(a[l]), note: `[${l}]`, children: [] };
  const m = Math.floor((l + r) / 2);
  const L = segTree(a, l, m);
  const R = segTree(a, m + 1, r);
  return { id: `${l}-${r}`, label: String(sum(a, l, r)), note: `[${l}..${r}]`, children: [L, R] };
}
function segCover(n: number, ql: number, qr: number, l = 0, r = n - 1): string[] {
  if (qr < l || r < ql) return [];
  if (ql <= l && r <= qr) return [`${l}-${r}`];
  const m = Math.floor((l + r) / 2);
  return [...segCover(n, ql, qr, l, m), ...segCover(n, ql, qr, m + 1, r)];
}
function segPath(n: number, i: number): string[] {
  const out: string[] = [];
  let l = 0;
  let r = n - 1;
  for (;;) {
    out.push(`${l}-${r}`);
    if (l === r) return out;
    const m = Math.floor((l + r) / 2);
    if (i <= m) r = m;
    else l = m + 1;
  }
}
const segScene = (a: number[]): Scene => ({ views: [{ type: 'tree', root: segTree(a), binary: true, title: 'Segment tree: each node = sum of its range' }] });

const predictSegCover = (): Card => {
  const n = 8;
  const a = small(n);
  let ql: number, qr: number, cover: string[];
  do {
    ql = randInt(0, 5);
    qr = randInt(ql + 1, 7);
    cover = segCover(n, ql, qr);
  } while (cover.length < 2);
  const fmt = (ids: string[]) => ids.map((id) => `[${id.replace('-', '..')}]`).join(' + ');
  const leaves = Array.from({ length: qr - ql + 1 }, (_, i) => `${ql + i}-${ql + i}`);
  return {
    concept: SG,
    type: 'predict',
    prompt: `Sum of a[${ql}..${qr}]. Which nodes does the segment tree combine?`,
    scene: segScene(a),
    body: {
      kind: 'choice',
      options: options({ text: fmt(cover), why: 'The fewest whole nodes that exactly tile the range.' }, [
        { text: fmt(leaves), why: 'Correct total, but it reads every leaf: O(range length). Use bigger nodes.' },
        { text: '[0..7]', why: 'The root covers too much.' },
        { text: fmt(segCover(n, Math.max(0, ql - 1), qr)), why: 'Check the left edge of the range.' },
      ]),
    },
    explain: `${fmt(cover)} = ${sum(a, ql, qr)}. At most about 2 nodes per level are needed: O(log n).`,
  };
};

const simulateSegUpdate = (): Card => {
  const n = 8;
  const a = small(n);
  const i = randInt(0, n - 1);
  const path = segPath(n, i).reverse();
  const scene = segScene(a);
  const exp = path.map(t);
  const frames = [scene];
  exp.forEach((_, x) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, x + 1) }));
  return {
    concept: SG,
    type: 'simulate',
    prompt: `Change a[${i}]. Click every node whose sum must be recomputed, from the leaf up to the root.`,
    scene,
    body: { kind: 'click', expected: exp, frames, wrongHint: (step) => (step === 0 ? `Start at leaf [${i}].` : 'Go to the parent: every range containing index ' + i + ' changes.') },
    explain: `${path.length} nodes: one per level. Only ranges containing index ${i} change.`,
  };
};

const simulateSegQuery = (): Card => {
  const n = 8;
  const a = small(n);
  let ql: number, qr: number, cover: string[];
  do {
    ql = randInt(0, 5);
    qr = randInt(ql + 1, 7);
    cover = segCover(n, ql, qr);
  } while (cover.length < 2);
  const scene = segScene(a);
  const exp = cover.map(t);
  const frames = [scene];
  exp.forEach((_, x) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, x + 1) }));
  return {
    concept: SG,
    type: 'simulate',
    prompt: `Sum a[${ql}..${qr}]: click the fewest nodes whose ranges exactly tile it, from left to right.`,
    scene,
    body: { kind: 'click', expected: exp, frames, wrongHint: () => 'Use the biggest nodes that fit entirely inside the range (their [..] is under each node).' },
    explain: `${cover.length} nodes: ${cover.map((c) => `[${c.replace('-', '..')}]`).join(' + ')} = ${sum(a, ql, qr)}.`,
  };
};

const countSegNodes = (): Card => {
  const n = pick([8, 16, 64, 1024]);
  return pick([
    {
      concept: SG,
      type: 'count' as const,
      prompt: `A segment tree over ${n} elements (n a power of 2). How many nodes does it have?`,
      body: { kind: 'number' as const, answer: 2 * n - 1, unit: 'nodes' },
      explain: `${n} leaves + ${n / 2} + … + 1 = ${2 * n - 1}. About 2n: linear memory.`,
    },
    {
      concept: SG,
      type: 'count' as const,
      prompt: `A segment tree over ${n} elements. How many nodes does a single-element update touch?`,
      body: { kind: 'number' as const, answer: Math.log2(n) + 1, unit: 'nodes' },
      explain: `One per level: log₂ ${n} + 1 = ${Math.log2(n) + 1}.`,
    },
  ]);
};

const growthSeg = (): Card => growthCard(SG, 'update one element', (n) => Math.log2(n) + 1, 1, 'One node per level of a balanced tree.');

const sgExplain = explainGenerators({
  concept: SG,
  truths: [
    'Each node stores an aggregate (like the sum) of a contiguous range.',
    'A node’s range is split in half between its two children.',
    'Any query range is covered by O(log n) whole nodes.',
    'A point update changes only the nodes on one leaf-to-root path: O(log n).',
    'It works for any combinable operation: sum, min, max, gcd…',
  ],
  myths: [
    { text: 'A range query reads every leaf in the range.', why: 'It uses big nodes that cover whole chunks.' },
    { text: 'Updating one element rebuilds the whole tree.', why: 'Only its ancestors change.' },
    { text: 'Segment trees need O(n²) memory.', why: 'About 2n nodes.' },
  ],
  chains: [
    {
      prompt: 'Why does a point update cost only O(log n)?',
      steps: ['An element belongs to exactly one range per level.', 'Those ranges form the path from its leaf to the root.', 'Only those nodes’ sums include the element.', 'A balanced tree has log n levels.'],
    },
  ],
  summary: {
    best: 'A segment tree keeps the totals of halves, quarters, eighths… of the array, so any stretch can be built from a few ready-made totals, and a change only ripples up one line.',
    others: [
      { text: 'A segment tree stores segments.', why: 'Circular.' },
      { text: 'It’s a tree for range queries.', why: 'What, not how.' },
      { text: 'It’s like a BST of array values.', why: 'Nodes hold aggregates of ranges, not searchable keys.' },
    ],
  },
});

export const segmentTreeConcept: Concept = {
  id: SG,
  title: 'Segment Tree',
  tier: 7,
  prereqs: [PS, 'binary-tree'],
  tagline: 'Totals of halves of halves. Query and update in O(log n).',
  hook: {
    problem: 'Prefix sums give O(1) queries but O(n) updates. A plain array gives O(1) updates but O(n) queries. A live leaderboard needs both, constantly.',
    question: 'How could both be O(log n)?',
    options: [
      { text: 'Store the total of the whole array, each half, each quarter… in a tree. Queries combine a few nodes; updates fix one path.', good: true, feedback: 'Yes: a segment tree.' },
      { text: 'Rebuild prefix sums lazily.', feedback: 'Still O(n) whenever something changed.' },
      { text: 'Split the array into √n blocks.', feedback: 'That works too (O(√n)), but a tree does better.' },
    ],
  },
  lens: {
    layout: 'A complete binary tree (often stored in an array like a heap). Leaves = elements; each internal node = aggregate of its children.',
    invariant: 'Every node’s value = combine(left child, right child) over its range.',
    payoff: 'Range query and point update both O(log n); flexible aggregates; lazy range updates possible.',
    price: '~2–4n memory; more code than prefix sums or a Fenwick tree.',
  },
  generators: {
    predict: [predictSegCover],
    simulate: [simulateSegUpdate, simulateSegQuery],
    count: [countSegNodes, growthSeg],
    explain: sgExplain,
  },
};

// =====================================================================
// Fenwick tree (binary indexed tree)
// =====================================================================

const FW = 'fenwick-tree';
const lowbit = (i: number) => i & -i;
function fenwick(a: number[]): number[] {
  const n = a.length;
  const f = Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) for (let j = i; j <= n; j += lowbit(j)) f[j] += a[i - 1];
  return f;
}
const fwScene = (a: number[]): Scene => {
  const f = fenwick(a);
  return {
    views: [
      { type: 'row', key: 'a', items: a, labels: a.map((_, i) => String(i + 1)), title: 'a (1-indexed)' },
      { type: 'row', key: 'f', items: f.slice(1), labels: f.slice(1).map((_, k) => `${k + 1}: (${k + 1 - lowbit(k + 1)},${k + 1}]`), title: 'Fenwick tree: f[i] = sum of a over (i − lowbit(i), i]' },
    ],
  };
};
const queryPath = (i: number) => {
  const p: number[] = [];
  for (; i > 0; i -= lowbit(i)) p.push(i);
  return p;
};
const updatePath = (i: number, n: number) => {
  const p: number[] = [];
  for (; i <= n; i += lowbit(i)) p.push(i);
  return p;
};

const predictLowbit = (): Card => {
  const i = randInt(3, 30);
  const lb = lowbit(i);
  return {
    concept: FW,
    type: 'predict',
    prompt: `In a Fenwick tree, f[${i}] covers how many elements (i.e. what's lowbit(${i}), the value of its lowest set bit)? ${i} in binary is ${i.toString(2)}.`,
    body: {
      kind: 'choice',
      options: numberOptions(
        lb,
        [
          { value: i, why: 'That would be a full prefix. Each entry covers only its lowest-bit-sized chunk.' },
          { value: i.toString(2).split('').filter((c) => c === '1').length, why: 'That’s the number of 1-bits.' },
          { value: lb * 2, why: 'Look at the rightmost 1-bit only.' },
        ],
        'The value of the rightmost 1-bit.',
      ),
    },
    explain: `${i} = ${i.toString(2)}₂; its lowest 1-bit is worth ${lb}. So f[${i}] = a[${i - lb + 1}] + … + a[${i}].`,
  };
};

const predictFWQuery = (): Card => {
  const i = randInt(5, 15);
  const p = queryPath(i);
  return {
    concept: FW,
    type: 'predict',
    prompt: `To compute prefix(${i}) = a[1] + … + a[${i}], which Fenwick entries are added? (Repeatedly: add f[i], then i −= lowbit(i).)`,
    body: {
      kind: 'choice',
      options: options({ text: p.map((x) => `f[${x}]`).join(' + '), why: 'Strip the lowest 1-bit each step.' }, [
        { text: Array.from({ length: i }, (_, k) => `f[${i - k}]`).slice(0, 4).join(' + ') + (i > 4 ? ' + …' : ''), why: 'That walks one index at a time: O(n).' },
        { text: updatePath(i, 16).map((x) => `f[${x}]`).join(' + '), why: 'That’s the *update* path (adding lowbit).' },
        { text: `f[${i}]`, why: `f[${i}] alone only covers ${lowbit(i)} element${lowbit(i) > 1 ? 's' : ''}.` },
      ]),
    },
    explain: `${p.map((x) => `${x} (${x.toString(2)})`).join(' → ')}: each step clears the lowest 1-bit, so at most log₂ n steps.`,
  };
};

const simulateFWQuery = (): Card => {
  const a = small(12);
  const i = pick([7, 11, 6, 10, 12, 5, 9]);
  const p = queryPath(i);
  const scene = fwScene(a);
  const exp = p.map((x) => `f:${x - 1}`);
  const frames = [scene];
  exp.forEach((_, k) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, k + 1) }));
  return {
    concept: FW,
    type: 'simulate',
    prompt: `Compute prefix(${i}). Click each Fenwick entry you add, starting at f[${i}] (step: i −= lowbit(i)).`,
    scene,
    body: { kind: 'click', expected: exp, frames, wrongHint: (step) => (step === 0 ? `Start at f[${i}].` : `Remove the lowest 1-bit: ${p[step - 1]} − ${lowbit(p[step - 1])} = ${p[step]}.`) },
    explain: `${p.join(' → ')}: ${p.length} entries sum to ${sum(a, 0, i - 1)}.`,
  };
};

const simulateFWUpdate = (): Card => {
  const a = small(12);
  const i = pick([1, 3, 5, 2, 6, 9]);
  const p = updatePath(i, 12);
  const scene = fwScene(a);
  const exp = p.map((x) => `f:${x - 1}`);
  const frames = [scene];
  exp.forEach((_, k) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, k + 1) }));
  return {
    concept: FW,
    type: 'simulate',
    prompt: `a[${i}] changes. Click each Fenwick entry that must be updated, starting at f[${i}] (step: i += lowbit(i), while i ≤ 12).`,
    scene,
    body: { kind: 'click', expected: exp, frames, wrongHint: (step) => (step === 0 ? `Start at f[${i}].` : `Add the lowest 1-bit: ${p[step - 1]} + ${lowbit(p[step - 1])} = ${p[step]}.`) },
    explain: `${p.join(' → ')}: exactly the entries whose range contains index ${i}.`,
  };
};

const countFW = (): Card => {
  const i = randInt(5, 200);
  const ones = i.toString(2).split('').filter((c) => c === '1').length;
  return {
    concept: FW,
    type: 'count',
    prompt: `How many Fenwick entries does prefix(${i}) add together? (${i} = ${i.toString(2)}₂)`,
    body: { kind: 'number', answer: ones, unit: 'entries' },
    explain: `One per 1-bit: ${ones}. At most log₂ n + 1.`,
  };
};

const fwExplain = explainGenerators({
  concept: FW,
  truths: [
    'A Fenwick tree is a single array where f[i] holds the sum of the lowbit(i) elements ending at i.',
    'A prefix query repeatedly subtracts the lowest set bit: O(log n) steps.',
    'An update repeatedly adds the lowest set bit: O(log n) steps.',
    'It uses exactly n extra cells, less than a segment tree.',
  ],
  myths: [
    { text: 'f[i] holds the prefix sum up to i.', why: 'It holds only a chunk of size lowbit(i).' },
    { text: 'Fenwick trees need explicit child pointers.', why: 'The structure is implied by bit patterns of the indexes.' },
    { text: 'Queries and updates walk the same path.', why: 'Queries strip bits (go down); updates add bits (go up).' },
  ],
  chains: [
    {
      prompt: 'Why does a prefix query take at most log n steps?',
      steps: ['Each step subtracts the lowest 1-bit of i.', 'That removes one 1-bit from i’s binary form.', 'i has at most log₂ n + 1 one-bits.', 'So the loop ends in O(log n) steps.'],
    },
  ],
  summary: {
    best: 'A Fenwick tree cuts every prefix into chunks whose sizes are the 1-bits of its length, so a total is just a handful of stored chunks.',
    others: [
      { text: 'A Fenwick tree is a binary indexed tree.', why: 'Another name, not an explanation.' },
      { text: 'It’s a smaller segment tree.', why: 'Related, but it works by bit tricks, not halves.' },
      { text: 'It stores prefix sums.', why: 'It stores chunks that *add up* to prefix sums.' },
    ],
  },
});

export const fenwickConcept: Concept = {
  id: FW,
  title: 'Fenwick Tree',
  tier: 7,
  prereqs: [PS, 'bits'],
  tagline: 'Prefix sums by bit tricks, in one array.',
  hook: {
    problem: 'You need prefix sums that also allow fast updates, with minimal memory and code: a segment tree feels heavy.',
    question: 'Could binary numbers themselves decide how to chunk the array?',
    options: [
      { text: 'Yes: let entry i hold the sum of a chunk whose size is i’s lowest 1-bit; any prefix is then ≤ log n chunks.', good: true, feedback: 'That’s a Fenwick (binary indexed) tree: n cells, a few lines of code, O(log n) both ways.' },
      { text: 'No: chunks need a tree of pointers.', feedback: 'The bit patterns of indexes can play the role of the tree.' },
      { text: 'Store every prefix sum twice.', feedback: 'Updates would still ripple O(n).' },
    ],
  },
  lens: {
    layout: 'One array f[1..n]; f[i] = sum of a over (i − lowbit(i), i].',
    invariant: 'Each f[i] covers exactly lowbit(i) elements ending at i.',
    payoff: 'Prefix query and point update in O(log n), n extra cells, tiny code.',
    price: 'Less flexible than a segment tree (needs invertible ops for range queries); indexes are 1-based and bit-tricky.',
  },
  generators: {
    predict: [predictLowbit, predictFWQuery],
    simulate: [simulateFWQuery, simulateFWUpdate],
    count: [countFW],
    explain: fwExplain,
  },
};

// =====================================================================
// Interval tree
// =====================================================================

const IT = 'interval-tree';

interface INode {
  s: number;
  e: number;
  max: number;
  left: INode | null;
  right: INode | null;
}
function iInsert(n: INode | null, s: number, e: number): INode {
  if (!n) return { s, e, max: e, left: null, right: null };
  if (s < n.s) n.left = iInsert(n.left, s, e);
  else n.right = iInsert(n.right, s, e);
  n.max = Math.max(n.e, n.left?.max ?? -1, n.right?.max ?? -1);
  return n;
}
function randomIntervals(): { root: INode; list: [number, number][] } {
  const starts = distinctInts(7, 1, 60);
  const sorted = [...starts].sort((a, b) => a - b);
  // Insert in a "median first" order for a bushy tree.
  const order: number[] = [];
  const rec = (lo: number, hi: number) => {
    if (lo > hi) return;
    const m = Math.floor((lo + hi) / 2);
    order.push(sorted[m]);
    rec(lo, m - 1);
    rec(m + 1, hi);
  };
  rec(0, sorted.length - 1);
  const list: [number, number][] = order.map((s) => [s, s + randInt(2, 25)]);
  const root = list.reduce<INode | null>((r, [s, e]) => iInsert(r, s, e), null)!;
  return { root, list };
}
const iTree = (n: INode | null): TreeNode | null => (n ? { id: String(n.s), label: `${n.s}–${n.e}`, note: `max ${n.max}`, children: [iTree(n.left), iTree(n.right)] } : null);
const iScene = (root: INode): Scene => ({ views: [{ type: 'tree', root: iTree(root), binary: true, title: 'Interval tree: BST by start; each node knows the max end in its subtree' }] });
const overlaps = (a: [number, number], b: [number, number]) => a[0] <= b[1] && b[0] <= a[1];
function iSearchPath(root: INode, q: [number, number]): INode[] {
  const out: INode[] = [];
  let n: INode | null = root;
  while (n) {
    out.push(n);
    if (overlaps([n.s, n.e], q)) return out;
    n = n.left && n.left.max >= q[0] ? n.left : n.right;
  }
  return out;
}

const predictOverlap = (): Card => {
  const a: [number, number] = [randInt(1, 40), 0];
  a[1] = a[0] + randInt(3, 15);
  const b: [number, number] = [randInt(1, 50), 0];
  b[1] = b[0] + randInt(3, 15);
  const yes = overlaps(a, b);
  return {
    concept: IT,
    type: 'predict',
    prompt: `Do the meetings ${a[0]}–${a[1]} and ${b[0]}–${b[1]} overlap?`,
    body: {
      kind: 'choice',
      options: [
        { text: 'Yes', correct: yes, why: `Test: ${a[0]} ≤ ${b[1]} and ${b[0]} ≤ ${a[1]}?` },
        { text: 'No', correct: !yes, why: `Test: ${a[0]} ≤ ${b[1]} and ${b[0]} ≤ ${a[1]}?` },
      ],
    },
    explain: `Two intervals overlap exactly when each starts before the other ends: ${a[0]} ≤ ${b[1]} is ${a[0] <= b[1]}, ${b[0]} ≤ ${a[1]} is ${b[0] <= a[1]}.`,
  };
};

const predictSkipLeft = (): Card => {
  const lm = randInt(10, 40);
  const qs = lm + randInt(1, 20);
  return {
    concept: IT,
    type: 'predict',
    prompt: `Searching for any interval overlapping [${qs}, ${qs + 10}]. The current node doesn't overlap, and its left subtree's max end is ${lm}. What do you do?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: 'Skip the left subtree entirely and go right.', correct: true, why: `Every interval on the left ends by ${lm} < ${qs}, before the query starts.` },
        { text: 'Search the left subtree; it has smaller starts.', correct: false, why: 'Small starts don’t help if every one of them ends too early.' },
        { text: 'Search both subtrees.', correct: false, why: 'The max tells you the left side can’t contain a match.' },
        { text: 'Stop: nothing overlaps.', correct: false, why: 'The right subtree may still overlap.' },
      ]),
    },
    explain: 'The max-end field is the trick: one number tells you whether a whole subtree can possibly reach your query.',
  };
};

const simulateISearch = (): Card => {
  let r: ReturnType<typeof randomIntervals>;
  let q: [number, number];
  let path: INode[];
  do {
    r = randomIntervals();
    const qs = randInt(5, 70);
    q = [qs, qs + randInt(0, 3)];
    path = iSearchPath(r.root, q);
  } while (path.length < 3 || !overlaps([path[path.length - 1].s, path[path.length - 1].e], q));
  const scene = iScene(r.root);
  const exp = path.map((n) => t(n.s));
  const frames = [scene];
  exp.forEach((_, k) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, k + 1) }));
  return {
    concept: IT,
    type: 'simulate',
    prompt: `Find any interval overlapping [${q[0]}, ${q[1]}]. At each node: if it overlaps, stop. Otherwise go LEFT if the left child's max ≥ ${q[0]}, else go RIGHT. Click the nodes you visit.`,
    scene,
    body: { kind: 'click', expected: exp, frames, wrongHint: (step) => (step === 0 ? 'Start at the root.' : `Check the left child's "max": is it ≥ ${q[0]}?`) },
    explain: `${path.map((n) => `${n.s}–${n.e}`).join(' → ')}. One root-to-node path: O(log n) in a balanced tree.`,
  };
};

const countIMax = (): Card => {
  const { root } = randomIntervals();
  const nodes: INode[] = [];
  const walk = (n: INode | null): void => {
    if (!n) return;
    nodes.push(n);
    walk(n.left);
    walk(n.right);
  };
  walk(root);
  const x = pick(nodes.filter((n) => n.left || n.right));
  const tree = iTree(root)!;
  const hide = (tn: TreeNode | null) => {
    if (!tn) return;
    if (tn.id === String(x.s)) tn.note = 'max ?';
    tn.children.forEach(hide);
  };
  hide(tree);
  return {
    concept: IT,
    type: 'count',
    prompt: `What should the "max" field of node ${x.s}–${x.e} be? (max of its own end and its children's max)`,
    scene: { views: [{ type: 'tree', root: tree, binary: true }] },
    body: { kind: 'number', answer: x.max },
    explain: `max(${[x.e, x.left?.max, x.right?.max].filter((v) => v !== undefined).join(', ')}) = ${x.max}. Maintained on every insert along the path.`,
  };
};

const itExplain = explainGenerators({
  concept: IT,
  truths: [
    'An interval tree is a BST ordered by interval start.',
    'Each node also stores the maximum end point in its subtree.',
    'Two intervals overlap when each starts before the other ends.',
    'If the left subtree’s max end is before the query start, the whole left side can be skipped.',
  ],
  myths: [
    { text: 'Intervals are sorted by their end points.', why: 'The BST is ordered by start; the max field handles ends.' },
    { text: 'Finding an overlap requires checking every interval.', why: 'The max field prunes whole subtrees.' },
    { text: 'Two intervals overlap only if one contains the other.', why: 'Partial overlaps count too.' },
  ],
  chains: [
    {
      prompt: 'Why can you skip a left subtree whose max end < query start?',
      steps: ['max is the latest end of any interval in that subtree.', 'If it’s before the query starts, every interval there ends too early.', 'None of them can overlap the query.', 'So the whole subtree is safely skipped.'],
    },
  ],
  summary: {
    best: 'An interval tree sorts meetings by start time and remembers, for each branch, the latest finishing time in it, so you can ignore branches that are all over before your time slot starts.',
    others: [
      { text: 'It’s a tree of intervals.', why: 'Restates the name.' },
      { text: 'It stores time ranges.', why: 'What, not how.' },
      { text: 'It’s a BST with two keys.', why: 'Misses the max-end augmentation.' },
    ],
  },
});

export const intervalTreeConcept: Concept = {
  id: IT,
  title: 'Interval Tree',
  tier: 7,
  prereqs: ['bst'],
  tagline: 'A BST of ranges that knows how far each branch reaches.',
  hook: {
    problem: 'A calendar holds thousands of meetings. "Does anything clash with 2–3pm?" Checking every meeting is O(n).',
    question: 'What extra fact per BST node would let you skip whole branches?',
    options: [
      { text: 'The latest end time anywhere in that node’s subtree.', good: true, feedback: 'Yes. If a branch’s latest end is before 2pm, nothing in it can clash: skip it.' },
      { text: 'The number of meetings below it.', feedback: 'Counts don’t tell you about times.' },
      { text: 'The earliest start time below it.', feedback: 'The BST order already gives that; ends are the missing piece.' },
    ],
  },
  lens: {
    layout: 'A (balanced) BST keyed by interval start; each node stores [start, end] and max end of its subtree.',
    invariant: 'BST order by start, and node.max = max(node.end, left.max, right.max).',
    payoff: 'Find an overlapping interval in O(log n); list all k overlaps in O(log n + k).',
    price: 'Must maintain max on every insert, delete and rotation.',
  },
  generators: {
    predict: [predictOverlap, predictSkipLeft],
    simulate: [simulateISearch],
    count: [countIMax],
    explain: itExplain,
  },
};

// =====================================================================
// k-d tree
// =====================================================================

const KD = 'kd-tree';

interface KNode {
  p: [number, number];
  left: KNode | null;
  right: KNode | null;
}
function kdInsert(n: KNode | null, p: [number, number], depth = 0): KNode {
  if (!n) return { p, left: null, right: null };
  const ax = depth % 2;
  if (p[ax] < n.p[ax]) n.left = kdInsert(n.left, p, depth + 1);
  else n.right = kdInsert(n.right, p, depth + 1);
  return n;
}
const kdId = (p: [number, number]) => `${p[0]},${p[1]}`;
const kdTree = (n: KNode | null, depth = 0): TreeNode | null =>
  n ? { id: kdId(n.p), label: `${n.p[0]},${n.p[1]}`, note: depth % 2 ? 'split y' : 'split x', children: [kdTree(n.left, depth + 1), kdTree(n.right, depth + 1)] } : null;
function kdPath(n: KNode | null, p: [number, number]): { node: KNode; depth: number }[] {
  const out: { node: KNode; depth: number }[] = [];
  let d = 0;
  while (n) {
    out.push({ node: n, depth: d });
    const ax = d % 2;
    n = p[ax] < n.p[ax] ? n.left : n.right;
    d++;
  }
  return out;
}
function randomKD() {
  const pts: [number, number][] = [];
  const seen = new Set<string>();
  while (pts.length < 7) {
    const p: [number, number] = [randInt(1, 20), randInt(1, 20)];
    if (!seen.has(kdId(p)) && !pts.some((q) => q[0] === p[0] || q[1] === p[1])) {
      seen.add(kdId(p));
      pts.push(p);
    }
  }
  const root = pts.reduce<KNode | null>((r, p) => kdInsert(r, p), null)!;
  return { pts, root };
}
const kdScene = (root: KNode): Scene => ({ views: [{ type: 'tree', root: kdTree(root), binary: true, title: 'k-d tree: levels alternate comparing x and y' }] });

const predictKDInsert = (): Card => {
  let r: ReturnType<typeof randomKD>;
  let p: [number, number];
  let path: ReturnType<typeof kdPath>;
  do {
    r = randomKD();
    p = [randInt(1, 20), randInt(1, 20)];
    path = kdPath(r.root, p);
  } while (path.length < 2 || r.pts.some((q) => q[0] === p[0] || q[1] === p[1]));
  const last = path[path.length - 1];
  const ax = last.depth % 2;
  const side = p[ax] < last.node.p[ax] ? 'left' : 'right';
  // What a plain x-only comparison would do:
  let n: KNode | null = r.root;
  let xOnly: KNode = r.root;
  while (n) {
    xOnly = n;
    n = p[0] < n.p[0] ? n.left : n.right;
  }
  return {
    concept: KD,
    type: 'predict',
    prompt: `Insert point (${p[0]}, ${p[1]}). Where does it attach?`,
    scene: kdScene(r.root),
    body: {
      kind: 'choice',
      options: options({ text: `${side} child of (${last.node.p.join(', ')})`, why: 'Alternate: compare x at even depths, y at odd depths.' }, [
        { text: `${side === 'left' ? 'right' : 'left'} child of (${last.node.p.join(', ')})`, why: `At that level you compare ${ax ? 'y' : 'x'}: ${p[ax]} vs ${last.node.p[ax]}.` },
        { text: `${p[0] < xOnly.p[0] ? 'left' : 'right'} child of (${xOnly.p.join(', ')})`, why: 'That compares x at every level. k-d trees alternate x and y.' },
        { text: 'It becomes the new root', why: 'New points are always attached at the bottom.' },
      ]),
    },
    explain: `Path: ${path.map((s) => `(${s.node.p.join(',')}) compare ${s.depth % 2 ? 'y' : 'x'}`).join(' → ')}, then ${side}.`,
  };
};

const simulateKD = (): Card => {
  let r: ReturnType<typeof randomKD>;
  let target: [number, number];
  let walk: ReturnType<typeof kdPath>;
  do {
    r = randomKD();
    target = pick(r.pts);
    const path = kdPath(r.root, target);
    walk = path.slice(0, path.findIndex((st) => kdId(st.node.p) === kdId(target)) + 1);
  } while (walk.length < 3);
  const scene = kdScene(r.root);
  const exp = walk.map((s) => t(kdId(s.node.p)));
  const frames = [scene];
  exp.forEach((_, k) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, k + 1) }));
  return {
    concept: KD,
    type: 'simulate',
    prompt: `Find the point (${target[0]}, ${target[1]}). Click each node you compare against. Even depths compare x, odd depths compare y.`,
    scene,
    body: {
      kind: 'click',
      expected: exp,
      frames,
      wrongHint: (step) => {
        const s = walk[step - 1];
        if (!s) return 'Start at the root.';
        const ax = s.depth % 2;
        return `At (${s.node.p.join(',')}) compare ${ax ? 'y' : 'x'}: ${target[ax]} ${target[ax] < s.node.p[ax] ? '<' : '≥'} ${s.node.p[ax]}, go ${target[ax] < s.node.p[ax] ? 'left' : 'right'}.`;
      },
    },
    explain: `${walk.length} comparisons. Each level halves the space along one axis, alternating.`,
  };
};

const countKDDepth = (): Card => {
  const { root, pts } = randomKD();
  const p = pick(pts);
  const d = kdPath(root, p).findIndex((s) => kdId(s.node.p) === kdId(p));
  return {
    concept: KD,
    type: 'count',
    prompt: `Points were inserted in this order: ${pts.map((q) => `(${q.join(',')})`).join(' ')}. At what depth (root = 0) does (${p.join(', ')}) sit?`,
    body: { kind: 'number', answer: d, unit: 'depth' },
    explain: `Tracing the alternating comparisons puts it at depth ${d}.`,
  };
};

const kdExplain = explainGenerators({
  concept: KD,
  truths: [
    'A k-d tree is a BST for points where each level splits on a different coordinate.',
    'In 2D, even levels compare x and odd levels compare y.',
    'Each node splits its region of space into two halves.',
    'Nearest-neighbour search can skip regions that are farther away than the best point found so far.',
  ],
  myths: [
    { text: 'A k-d tree compares all coordinates at every node.', why: 'One coordinate per level, cycling through them.' },
    { text: 'k-d trees work well in any number of dimensions.', why: 'In very high dimensions, pruning stops working well.' },
    { text: 'k-d trees are always balanced.', why: 'Like BSTs, it depends on insertion order (or median-based building).' },
  ],
  chains: [
    {
      prompt: 'Why alternate the splitting coordinate?',
      steps: ['Splitting only by x would make thin vertical strips.', 'Points close in x but far in y would share a strip.', 'Alternating x and y cuts space into boxes.', 'Boxes let a search rule out whole regions in both directions.'],
    },
  ],
  summary: {
    best: 'A k-d tree keeps cutting a map in half, first left/right, then top/bottom, then left/right again, so you can zoom in on any spot quickly.',
    others: [
      { text: 'It’s a k-dimensional tree.', why: 'The name, not the mechanism.' },
      { text: 'It’s a BST for points.', why: 'Misses the alternating axes.' },
      { text: 'It’s used for nearest neighbours.', why: 'A use, not a mechanism.' },
    ],
  },
});

export const kdTreeConcept: Concept = {
  id: KD,
  title: 'k-d Tree',
  tier: 7,
  prereqs: ['bst'],
  tagline: 'A BST for points: alternate x and y.',
  hook: {
    problem: 'A map app stores millions of restaurants as (x, y) points and needs "what’s near me?". A BST on x alone groups places that share an x but are miles apart in y.',
    question: 'How could a BST split space in both directions?',
    options: [
      { text: 'Alternate: compare x at one level, y at the next, then x again…', good: true, feedback: 'Yes. Each level cuts space in half along a different axis: a k-d tree.' },
      { text: 'Build two BSTs, one per axis, and intersect results.', feedback: 'Intersections can be huge; still slow.' },
      { text: 'Sort points by x + y.', feedback: 'Very different points share the same x + y.' },
    ],
  },
  lens: {
    layout: 'BST nodes holding a point; level d compares coordinate d mod k.',
    invariant: 'At a node splitting on axis a, left subtree has smaller a-coordinates, right has ≥.',
    payoff: 'Range and nearest-neighbour searches that prune whole regions: ~O(log n) for well-spread 2D data.',
    price: 'Balance depends on insertion; degrades in high dimensions; deletes are awkward.',
  },
  generators: {
    predict: [predictKDInsert],
    simulate: [simulateKD],
    count: [countKDDepth],
    explain: kdExplain,
  },
};

// =====================================================================
// Quadtree
// =====================================================================

const QT = 'quadtree';
const QUAD = ['NW', 'NE', 'SW', 'SE'] as const;

interface QNode {
  x: number;
  y: number;
  size: number;
  name: string;
  point: [number, number] | null;
  kids: QNode[] | null;
}
/** y grows downwards, like screen coordinates: NW = small x, small y. */
function quadOf(n: QNode, p: [number, number]) {
  const h = n.size / 2;
  return (p[1] >= n.y + h ? 2 : 0) + (p[0] >= n.x + h ? 1 : 0);
}
function qInsert(n: QNode, p: [number, number]) {
  if (!n.kids) {
    if (!n.point) {
      n.point = p;
      return;
    }
    const h = n.size / 2;
    n.kids = QUAD.map((name, i) => ({ x: n.x + (i % 2) * h, y: n.y + Math.floor(i / 2) * h, size: h, name, point: null, kids: null }));
    const old = n.point;
    n.point = null;
    qInsert(n.kids[quadOf(n, old)], old);
  }
  qInsert(n.kids![quadOf(n, p)], p);
}
const qid = (n: QNode) => `${n.x},${n.y},${n.size}`;
const qTree = (n: QNode): TreeNode => ({
  id: qid(n),
  label: n.kids ? n.name : n.point ? `${n.point[0]},${n.point[1]}` : '∅',
  note: n.kids ? `${n.size}×${n.size}` : n.name,
  tone: !n.kids && !n.point ? 'dim' : undefined,
  children: n.kids ? n.kids.map(qTree) : [],
});
function randomQuad() {
  for (;;) {
    const root: QNode = { x: 0, y: 0, size: 16, name: 'all', point: null, kids: null };
    const pts: [number, number][] = [];
    while (pts.length < 4) {
      const p: [number, number] = [randInt(0, 15), randInt(0, 15)];
      if (!pts.some((q) => q[0] === p[0] && q[1] === p[1])) pts.push(p);
    }
    pts.forEach((p) => qInsert(root, p));
    const depth = (n: QNode): number => (n.kids ? 1 + Math.max(...n.kids.map(depth)) : 0);
    if (depth(root) <= 3) return { root, pts };
  }
}
function qPath(root: QNode, p: [number, number]): QNode[] {
  const out = [root];
  let n = root;
  while (n.kids) {
    n = n.kids[quadOf(n, p)];
    out.push(n);
  }
  return out;
}

const predictQuadrant = (): Card => {
  const size = pick([16, 64, 100]);
  const p: [number, number] = [randInt(0, size - 1), randInt(0, size - 1)];
  const h = size / 2;
  const q = QUAD[(p[1] >= h ? 2 : 0) + (p[0] >= h ? 1 : 0)];
  return {
    concept: QT,
    type: 'predict',
    prompt: `A ${size}×${size} region (x grows right, y grows DOWN) is split into four quadrants at ${h}. Which quadrant holds the point (${p[0]}, ${p[1]})?`,
    body: {
      kind: 'choice',
      options: options({ text: q, why: `x ${p[0] >= h ? '≥' : '<'} ${h} → ${p[0] >= h ? 'east' : 'west'}; y ${p[1] >= h ? '≥' : '<'} ${h} → ${p[1] >= h ? 'south' : 'north'}.` }, QUAD.filter((x) => x !== q).map((x) => ({ text: x, why: 'Compare x with the middle (east/west), then y (north/south).' }))),
    },
    explain: `Two comparisons pick one of four children. Each level shrinks the region to a quarter.`,
  };
};

const simulateQuad = (): Card => {
  const { root, pts } = randomQuad();
  const cands = pts.filter((p) => qPath(root, p).length >= 3);
  const p = cands.length ? pick(cands) : pick(pts);
  const path = qPath(root, p);
  const scene: Scene = { views: [{ type: 'tree', root: qTree(root), title: 'Quadtree over a 16×16 area (each leaf holds ≤ 1 point)' }] };
  const exp = path.map((n) => t(qid(n)));
  const frames = [scene];
  exp.forEach((_, k) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, k + 1) }));
  return {
    concept: QT,
    type: 'simulate',
    prompt: `Find point (${p[0]}, ${p[1]}). Starting at the root, click each region you descend into (x grows right, y grows down).`,
    scene,
    body: {
      kind: 'click',
      expected: exp,
      frames,
      wrongHint: (step) => {
        const n = path[step - 1];
        if (!n) return 'Start at the root.';
        const h = n.size / 2;
        return `This region starts at (${n.x}, ${n.y}), size ${n.size}. Middle is x = ${n.x + h}, y = ${n.y + h}.`;
      },
    },
    explain: `${path.length - 1} quadrant choices. Empty areas stay as single empty leaves; crowded areas split deeper.`,
  };
};

const countQuadDepth = (): Card => {
  const size = pick([16, 32, 64]);
  const a: [number, number] = [randInt(0, size - 2), randInt(0, size - 2)];
  const b: [number, number] = [a[0] + randInt(0, 1), a[1] + 1];
  let n = { x: 0, y: 0, size };
  let levels = 0;
  for (;;) {
    const h = n.size / 2;
    const qa = (a[1] >= n.y + h ? 2 : 0) + (a[0] >= n.x + h ? 1 : 0);
    const qb = (b[1] >= n.y + h ? 2 : 0) + (b[0] >= n.x + h ? 1 : 0);
    levels++;
    if (qa !== qb) break;
    n = { x: n.x + (qa % 2) * h, y: n.y + Math.floor(qa / 2) * h, size: h };
  }
  return {
    concept: QT,
    type: 'count',
    prompt: `A ${size}×${size} quadtree holding at most 1 point per leaf. Points (${a.join(', ')}) and (${b.join(', ')}) are neighbours. How many times must the area be split before they land in different quadrants?`,
    body: { kind: 'number', answer: levels, unit: 'splits' },
    explain: `After ${levels} split${levels > 1 ? 's' : ''} they separate. Close points force deep subdivision; that's the cost of clustered data.`,
  };
};

const qtExplain = explainGenerators({
  concept: QT,
  truths: [
    'A quadtree splits a 2D region into four equal quadrants, recursively.',
    'A region only splits when it holds too many points.',
    'Empty or sparse areas stay as big single leaves.',
    'Clustered points force deep subdivision.',
  ],
  myths: [
    { text: 'A quadtree always has the same depth everywhere.', why: 'It adapts: crowded areas go deeper.' },
    { text: 'Quadtree nodes have two children.', why: 'Four: one per quadrant.' },
    { text: 'Quadtrees split at the median point.', why: 'Region quadtrees split space at the middle, not at data points.' },
  ],
  chains: [
    {
      prompt: 'Why do quadtrees handle empty space cheaply?',
      steps: ['A region only splits when it has more points than a leaf allows.', 'An empty region never splits.', 'So a huge empty area is a single leaf.', 'Memory follows the data, not the area.'],
    },
  ],
  summary: {
    best: 'A quadtree is like zooming into a map: split it into four squares, and keep splitting only the squares that are crowded.',
    others: [
      { text: 'A quadtree is a tree with four children.', why: 'What, not why.' },
      { text: 'It’s a 2D binary tree.', why: 'Four-way, and splits space, not values.' },
      { text: 'It stores images.', why: 'One use among many.' },
    ],
  },
});

export const quadtreeConcept: Concept = {
  id: QT,
  title: 'Quadtree',
  tier: 7,
  prereqs: ['tree'],
  tagline: 'Split space into four, only where it’s crowded.',
  hook: {
    problem: 'A game world is mostly empty, with dense clusters of units. Checking every pair of units for collisions is O(n²).',
    question: 'How could you only compare units that are near each other?',
    options: [
      { text: 'Split the world into four squares; split any crowded square again, and so on.', good: true, feedback: 'Yes: a quadtree. Units in far-apart squares never need comparing.' },
      { text: 'Use a fixed fine grid everywhere.', feedback: 'Wastes memory on empty areas and still overloads dense cells.' },
      { text: 'Sort units by x.', feedback: 'Units close in x can be far apart in y.' },
    ],
  },
  lens: {
    layout: 'A tree where each internal node is a square region with four children (NW, NE, SW, SE).',
    invariant: 'Each point lies in exactly one leaf region; leaves hold at most the capacity.',
    payoff: 'Spatial queries touch only nearby regions; adapts to clustered data.',
    price: 'Deep trees for tightly clustered points; 2D-specific (octrees for 3D).',
  },
  generators: {
    predict: [predictQuadrant],
    simulate: [simulateQuad],
    count: [countQuadDepth],
    explain: qtExplain,
  },
};

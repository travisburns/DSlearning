import type { Card, Concept, Scene, Val } from '../engine/types';
import { cloneScene } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions, options } from './helpers';
import { bstPath, inorder, randomBST, toTree } from './treeUtil';

const t = (id: string | number) => `t:${id}`;

// =====================================================================
// Ordered map / tree map
// =====================================================================

const OM = 'ordered-map';

function floorCeil(keys: number[], x: number) {
  const s = [...keys].sort((a, b) => a - b);
  const fl = [...s].reverse().find((k) => k <= x);
  const ce = s.find((k) => k >= x);
  return { fl, ce };
}

const predictFloorCeil = (): Card => {
  const keys = distinctInts(randInt(7, 9), 1, 99);
  const root = randomBST(keys);
  let x = randInt(5, 95);
  while (keys.includes(x)) x++;
  const { fl, ce } = floorCeil(keys, x);
  const which = fl === undefined ? 'ceiling' : ce === undefined ? 'floor' : pick(['floor', 'ceiling'] as const);
  const ans = which === 'floor' ? fl! : ce!;
  const other = which === 'floor' ? ce : fl;
  const sorted = inorder(root);
  return {
    concept: OM,
    type: 'predict',
    prompt: `A tree map holds these keys. What's ${which}(${x}), the ${which === 'floor' ? 'largest key ≤' : 'smallest key ≥'} ${x}?`,
    scene: { views: [{ type: 'tree', root: toTree(root), binary: true }] },
    body: {
      kind: 'choice',
      options: options({ text: String(ans), why: `In sorted order: ${sorted.join(', ')}.` }, [
        ...(other !== undefined ? [{ text: String(other), why: `That's the ${which === 'floor' ? 'ceiling' : 'floor'}.` }] : []),
        { text: String(bstPath(root, x)[bstPath(root, x).length - 1]), why: 'The last node on the search path isn’t automatically the answer.' },
        { text: 'none', why: `There is a key ${which === 'floor' ? 'below' : 'above'} ${x}.` },
        { text: String(sorted[0]), why: 'That’s the minimum key.' },
      ]),
    },
    explain: `Sorted keys: ${sorted.join(', ')}. ${which}(${x}) = ${ans}. A hash map can't answer this at all; a tree map does it in O(log n).`,
  };
};

const predictWhichMap = (): Card => {
  const c = pick([
    { s: 'Look up a user by exact ID, millions of times a second.', a: 'Hash map', why: 'Exact lookups only: O(1) average beats O(log n).' },
    { s: 'Find all orders placed between 9:00 and 9:15.', a: 'Tree map (ordered map)', why: 'Range queries need keys in order.' },
    { s: 'Find the first appointment at or after 14:30.', a: 'Tree map (ordered map)', why: 'That’s ceiling(14:30): needs order.' },
    { s: 'Count how many times each word appears in a book.', a: 'Hash map', why: 'Only exact-key updates; order not needed.' },
  ]);
  return {
    concept: OM,
    type: 'predict',
    prompt: `Which fits best? ${c.s}`,
    body: {
      kind: 'choice',
      options: options({ text: c.a, why: c.why }, [
        { text: c.a === 'Hash map' ? 'Tree map (ordered map)' : 'Hash map', why: c.a === 'Hash map' ? 'Order isn’t needed, so O(log n) is wasted.' : 'A hash map scatters keys; no order, no ranges.' },
        { text: 'Sorted array', why: 'Inserts would shift elements.' },
      ]),
    },
    explain: 'Hash map: fastest for exact keys. Tree map: keys in order, so floor/ceiling/range/min/max come for free.',
  };
};

const simulateRange = (): Card => {
  const keys = distinctInts(randInt(8, 10), 1, 99);
  const root = randomBST(keys);
  const sorted = inorder(root);
  const i = randInt(1, sorted.length - 4);
  const lo = sorted[i];
  const hi = sorted[i + randInt(2, 3)];
  const hits = sorted.filter((k) => k >= lo && k <= hi);
  const scene: Scene = { views: [{ type: 'tree', root: toTree(root), binary: true }] };
  const exp = hits.map(t);
  const frames = [scene];
  exp.forEach((_, k) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, k + 1) }));
  return {
    concept: OM,
    type: 'simulate',
    prompt: `List every key from ${lo} to ${hi}, in increasing order. Click them in the order an in-order walk would report them.`,
    scene,
    body: { kind: 'click', expected: exp, frames, wrongHint: () => 'In-order = left subtree, node, right subtree, which gives ascending keys.' },
    explain: `${hits.join(', ')}. Find the start in O(log n), then walk in order: O(log n + k).`,
  };
};

const countOM = (): Card => {
  const keys = distinctInts(randInt(8, 10), 1, 99);
  const root = randomBST(keys);
  let x = randInt(5, 95);
  while (keys.includes(x)) x++;
  return {
    concept: OM,
    type: 'count',
    prompt: `How many nodes does a ceiling(${x}) search compare against in this tree map (root down until it falls off)?`,
    scene: { views: [{ type: 'tree', root: toTree(root), binary: true }] },
    body: { kind: 'number', answer: bstPath(root, x).length, unit: 'nodes' },
    explain: `Path: ${bstPath(root, x).join(' → ')}. Remember the best candidate on the way down; O(height).`,
  };
};

const omExplain = explainGenerators({
  concept: OM,
  truths: [
    'An ordered map is a balanced BST (usually red-black) storing key → value.',
    'Lookups, inserts and deletes are O(log n), guaranteed.',
    'It supports floor, ceiling, min, max and range queries because keys are ordered.',
    'Iterating it gives keys in sorted order.',
    'A hash map is faster for exact lookups but can’t answer order questions.',
  ],
  myths: [
    { text: 'Tree maps are just slower hash maps.', why: 'They answer ordered questions hash maps can’t.' },
    { text: 'Iterating a tree map gives insertion order.', why: 'It gives sorted key order.' },
    { text: 'Tree map lookups can degrade to O(n).', why: 'The underlying tree is self-balancing.' },
  ],
  chains: [
    {
      prompt: 'Why can a tree map list a range [a, b] quickly?',
      steps: ['Keys are kept in BST order.', 'Finding the first key ≥ a takes one O(log n) descent.', 'An in-order walk from there visits keys in increasing order.', 'Stop at the first key > b: O(log n + k).'],
    },
  ],
  summary: {
    best: 'A tree map is a dictionary that keeps its words in alphabetical order, so besides looking words up you can ask “what comes just before or after this?” or “everything between these two?”.',
    others: [
      { text: 'A tree map is a map implemented with a tree.', why: 'Restates the name.' },
      { text: 'It’s like a hash map but slower.', why: 'Misses what it can do that a hash map can’t.' },
      { text: 'It’s a sorted list.', why: 'A list would make inserts O(n).' },
    ],
  },
});

export const orderedMapConcept: Concept = {
  id: OM,
  title: 'Ordered Map (Tree Map)',
  tier: 10,
  prereqs: ['red-black-tree', 'hash-map'],
  tagline: 'A map that keeps keys sorted: floor, ceiling, ranges.',
  hook: {
    problem: 'A calendar app needs "the next free slot after 14:30" and "all events this afternoon". A hash map scatters times randomly.',
    question: 'Which map can answer order questions?',
    options: [
      { text: 'A map built on a balanced BST, so keys stay sorted.', good: true, feedback: 'Yes: a tree map. Every op O(log n), plus floor/ceiling/range for free.' },
      { text: 'A hash map, then sort the keys when asked.', feedback: 'O(n log n) per question.' },
      { text: 'A sorted array of keys.', feedback: 'Great queries, but O(n) inserts.' },
    ],
  },
  lens: {
    layout: 'A self-balancing BST (red-black) whose nodes hold key + value.',
    invariant: 'BST order on keys, plus the tree’s balance rules.',
    payoff: 'O(log n) guaranteed for everything; ordered iteration, floor/ceiling, ranges, min/max.',
    price: 'Slower than a hash map for plain lookups; keys must be comparable.',
  },
  generators: {
    predict: [predictFloorCeil, predictWhichMap],
    simulate: [simulateRange],
    count: [countOM],
    explain: omExplain,
  },
};

// =====================================================================
// LRU cache
// =====================================================================

const LRU = 'lru-cache';
const LETTERS = 'ABCDEFG'.split('');

function runLRU(cap: number, seq: string[]) {
  const order: string[] = []; // front = most recent
  const evicted: string[] = [];
  let misses = 0;
  for (const k of seq) {
    const i = order.indexOf(k);
    if (i >= 0) order.splice(i, 1);
    else {
      misses++;
      if (order.length === cap) evicted.push(order.pop()!);
    }
    order.unshift(k);
  }
  return { order, evicted, misses };
}
function randomSeq(len: number, alphabet = 5) {
  return Array.from({ length: len }, () => LETTERS[randInt(0, alphabet - 1)]);
}

const predictLRUEvict = (): Card => {
  for (;;) {
    const cap = 3;
    const seq = randomSeq(randInt(5, 7), 4);
    const { order } = runLRU(cap, seq);
    if (order.length < cap) continue;
    const newKey = LETTERS.find((l) => !order.includes(l) && !seq.includes(l))!;
    return {
      concept: LRU,
      type: 'predict',
      prompt: `LRU cache, capacity ${cap}. Accesses: ${seq.join(', ')}. Now ${newKey} is accessed (a miss, cache full). Which key is evicted?`,
      body: {
        kind: 'choice',
        options: options({ text: order[cap - 1], why: 'Least recently USED: its last access is the oldest.' }, [
          { text: order[0], why: 'That’s the MOST recently used.' },
          { text: seq[0], why: 'First inserted isn’t necessarily least recently used; later accesses refresh keys.' },
          { text: order[1], why: 'Check whose last access is oldest.' },
        ]),
      },
      explain: `Recency order (newest first): ${order.join(', ')}. ${order[cap - 1]} was used longest ago.`,
    };
  }
};

const simulateLRUEvictions = (): Card => {
  let seq: string[];
  let r: ReturnType<typeof runLRU>;
  do {
    seq = randomSeq(randInt(7, 9), 5);
    r = runLRU(3, seq);
  } while (r.evicted.length < 2);
  const scene: Scene = { views: [{ type: 'row', key: 'k', items: LETTERS.slice(0, 5), labels: LETTERS.slice(0, 5).map(() => ''), title: 'Keys' }] };
  const exp = r.evicted.map((k) => `k:${LETTERS.indexOf(k)}`);
  const frames = [scene];
  exp.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: [exp[i]] }));
  return {
    concept: LRU,
    type: 'simulate',
    prompt: `LRU cache with capacity 3. Accesses: ${seq.join(', ')}. Click each key at the moment it gets evicted, in order.`,
    scene,
    body: { kind: 'click', expected: exp, frames, wrongHint: () => 'Track the three most recent distinct keys. On a miss with a full cache, the one used longest ago goes.' },
    explain: `Evicted in order: ${r.evicted.join(', ')}. Final cache (newest first): ${r.order.join(', ')}.`,
  };
};

const orderLRUGet = (): Card => ({
  concept: LRU,
  type: 'simulate',
  prompt: 'LRU cache = hash map (key → list node) + doubly linked list (front = most recent). get(k) is a HIT. Put the steps in order.',
  body: { kind: 'order', steps: ['Look up k’s node in the hash map.', 'Unlink the node from its current place in the list.', 'Insert it at the front of the list.', 'Return its value.'] },
  explain: 'Every step is O(1): the map finds the node, and a doubly linked list can unlink a node you hold without searching.',
});

const orderLRUPut = (): Card => ({
  concept: LRU,
  type: 'simulate',
  prompt: 'put(k, v) for a NEW key when the LRU cache is full. Put the steps in order.',
  body: {
    kind: 'order',
    steps: ['Take the node at the back of the list (least recently used).', 'Remove it from the list and delete its key from the hash map.', 'Create a node for (k, v) at the front of the list.', 'Add k → node to the hash map.'],
  },
  explain: 'The back of the list is always the eviction victim, so no searching is needed. O(1).',
});

const countLRUMisses = (): Card => {
  const seq = randomSeq(randInt(7, 9), 5);
  return {
    concept: LRU,
    type: 'count',
    prompt: `LRU cache, capacity 3, initially empty. Accesses: ${seq.join(', ')}. How many misses?`,
    body: { kind: 'number', answer: runLRU(3, seq).misses, unit: 'misses' },
    explain: `A miss is any access to a key not currently among the 3 most recently used distinct keys: ${runLRU(3, seq).misses}.`,
  };
};

const growthLRU = (): Card => growthCard(LRU, 'get() on an LRU cache holding n items', () => 4, 0, 'Hash lookup + unlink + relink: constant.');

const lruExplain = explainGenerators({
  concept: LRU,
  truths: [
    'An LRU cache evicts the key whose last use is the oldest.',
    'It combines a hash map (find a key’s node) with a doubly linked list (recency order).',
    'Every access moves the key’s node to the front of the list.',
    'The back of the list is always the next eviction victim.',
    'get and put are both O(1).',
  ],
  myths: [
    { text: 'LRU evicts the key that was inserted first.', why: 'Accessing a key refreshes it; that’s FIFO, not LRU.' },
    { text: 'LRU needs to search for the oldest key on each eviction.', why: 'The list keeps it at the back.' },
    { text: 'A singly linked list would work just as well.', why: 'Unlinking a node you hold needs its previous node: O(1) only with prev pointers.' },
  ],
  chains: [
    {
      prompt: 'Why does an LRU cache need BOTH a hash map and a doubly linked list?',
      steps: ['A get must find a key in O(1): that needs the hash map.', 'Each access must move that key to “most recent”.', 'Moving a node you hold in O(1) needs a doubly linked list.', 'And eviction must find the least recent in O(1): the list’s back.'],
    },
  ],
  summary: {
    best: 'An LRU cache is a short shelf where anything you touch moves to the front; when the shelf is full, whatever’s at the very back gets thrown out.',
    others: [
      { text: 'An LRU cache is a cache with an eviction policy.', why: 'Which policy, and how?' },
      { text: 'It stores the most popular items.', why: 'Most *recent*, not most frequent.' },
      { text: 'It’s a queue of items.', why: 'A queue can’t move an item from the middle.' },
    ],
  },
});

export const lruConcept: Concept = {
  id: LRU,
  title: 'LRU Cache',
  tier: 10,
  prereqs: ['hash-map', 'doubly-linked-list'],
  tagline: 'Hash map + doubly linked list: evict the least recently used.',
  hook: {
    problem: 'A cache holds 1,000 web pages. When it’s full, which page do you throw out? You need to decide in O(1).',
    question: 'What policy, and what structure makes it O(1)?',
    options: [
      { text: 'Evict the page used longest ago; keep pages in a recency list, with a hash map pointing into it.', good: true, feedback: 'Yes: LRU. The map finds a page’s node, and the doubly linked list moves it to the front or drops the back in O(1).' },
      { text: 'Evict a random page.', feedback: 'Simple, but it might throw out the page you’re about to use.' },
      { text: 'Scan all pages for the oldest timestamp.', feedback: 'O(n) per eviction.' },
    ],
  },
  lens: {
    layout: 'A hash map key → node, and a doubly linked list of nodes ordered by recency.',
    invariant: 'List order = recency order; the map contains exactly the keys in the list.',
    payoff: 'O(1) get, put and eviction.',
    price: 'Two structures to keep in sync; pointer overhead per entry; LRU isn’t ideal for every access pattern.',
  },
  generators: {
    predict: [predictLRUEvict],
    simulate: [simulateLRUEvictions, orderLRUGet, orderLRUPut],
    count: [countLRUMisses, growthLRU],
    explain: lruExplain,
  },
};

// =====================================================================
// LFU cache
// =====================================================================

const LFU = 'lfu-cache';

function runLFU(cap: number, seq: string[]) {
  const freq = new Map<string, number>();
  const last = new Map<string, number>();
  const evicted: string[] = [];
  let misses = 0;
  seq.forEach((k, time) => {
    if (!freq.has(k)) {
      misses++;
      if (freq.size === cap) {
        const victim = [...freq.keys()].sort((a, b) => freq.get(a)! - freq.get(b)! || last.get(a)! - last.get(b)!)[0];
        freq.delete(victim);
        last.delete(victim);
        evicted.push(victim);
      }
      freq.set(k, 0);
    }
    freq.set(k, freq.get(k)! + 1);
    last.set(k, time);
  });
  return { freq, last, evicted, misses };
}

const predictLFUEvict = (): Card => {
  for (;;) {
    const seq = randomSeq(randInt(6, 8), 4);
    const r = runLFU(3, seq);
    if (r.freq.size < 3) continue;
    const keys = [...r.freq.keys()];
    const victim = [...keys].sort((a, b) => r.freq.get(a)! - r.freq.get(b)! || r.last.get(a)! - r.last.get(b)!)[0];
    const lruVictim = [...keys].sort((a, b) => r.last.get(a)! - r.last.get(b)!)[0];
    const newKey = LETTERS.find((l) => !seq.includes(l))!;
    return {
      concept: LFU,
      type: 'predict',
      prompt: `LFU cache, capacity 3 (ties broken by least recently used). Accesses: ${seq.join(', ')}. Now ${newKey} arrives (a miss, cache full). Which key is evicted?`,
      body: {
        kind: 'choice',
        options: options({ text: victim, why: `Fewest uses: counts are ${keys.map((k) => `${k}×${r.freq.get(k)}`).join(', ')}.` }, [
          { text: lruVictim, why: 'That’s the LRU choice. LFU looks at how OFTEN, not how recently.' },
          ...keys.filter((k) => k !== victim).map((k) => ({ text: k, why: `${k} has been used ${r.freq.get(k)} times.` })),
        ]),
      },
      explain: `Use counts in the cache: ${keys.map((k) => `${k}×${r.freq.get(k)}`).join(', ')}. Evict the smallest count (oldest on ties): ${victim}.`,
    };
  }
};

const orderLFUGet = (): Card => ({
  concept: LFU,
  type: 'simulate',
  prompt: 'O(1) LFU cache: a key map (key → node), a frequency map (f → list of nodes with that count), and minFreq. get(k) is a hit with current count f. Put the steps in order.',
  body: {
    kind: 'order',
    steps: [
      'Find k’s node through the key map.',
      'Unlink it from the frequency-f list.',
      'If that list is now empty and f was minFreq, increase minFreq by 1.',
      'Add the node to the front of the frequency-(f+1) list.',
      'Return its value.',
    ],
  },
  explain: 'Each frequency has its own recency list, so the eviction victim is always the back of the minFreq list: O(1).',
});

const countLFUMisses = (): Card => {
  const seq = randomSeq(randInt(7, 9), 5);
  return {
    concept: LFU,
    type: 'count',
    prompt: `LFU cache (ties → least recently used), capacity 3, initially empty. Accesses: ${seq.join(', ')}. How many misses?`,
    body: { kind: 'number', answer: runLFU(3, seq).misses, unit: 'misses' },
    explain: `Evictions in order: ${runLFU(3, seq).evicted.join(', ') || 'none'}. Misses: ${runLFU(3, seq).misses}. A key's count restarts at 1 if it's evicted and comes back.`,
  };
};

const lfuExplain = explainGenerators({
  concept: LFU,
  truths: [
    'An LFU cache evicts the key with the fewest uses (ties broken by recency).',
    'It keeps, for each use count, a list of the keys with that count.',
    'A minFreq variable points at the lowest non-empty count, so eviction is O(1).',
    'Each hit moves a key from count f’s list to count f+1’s list.',
  ],
  myths: [
    { text: 'LFU and LRU always evict the same key.', why: 'A key used many times long ago survives LFU but not LRU.' },
    { text: 'LFU must scan all keys to find the least used.', why: 'Frequency lists and minFreq make it O(1).' },
    { text: 'Counts are kept for keys after they’re evicted.', why: 'In the basic version, an evicted key starts again at 1.' },
  ],
  chains: [
    {
      prompt: 'Why can LFU evict in O(1)?',
      steps: ['Keys are grouped into lists by their use count.', 'minFreq always names the lowest non-empty count.', 'The victim is the least recent key in that list: its back.', 'Removing a list’s back node is O(1).'],
    },
  ],
  summary: {
    best: 'An LFU cache keeps a tally of how often each item is used and throws out the least-used one, so long-time favourites stay even if they weren’t used just now.',
    others: [
      { text: 'It’s LRU but with frequency.', why: 'Vague about how it changes eviction.' },
      { text: 'It evicts the oldest item.', why: 'That’s FIFO.' },
      { text: 'It keeps the most recent items.', why: 'That’s LRU.' },
    ],
  },
});

export const lfuConcept: Concept = {
  id: LFU,
  title: 'LFU Cache',
  tier: 10,
  prereqs: [LRU],
  tagline: 'Evict the least frequently used, in O(1).',
  hook: {
    problem: 'LRU throws out a page that’s used every day just because a burst of one-off pages came through this morning.',
    question: 'What would protect long-time favourites?',
    options: [
      { text: 'Count uses per key and evict the key with the smallest count (ties: least recent).', good: true, feedback: 'Yes: LFU. With per-count lists and a minFreq pointer, still O(1).' },
      { text: 'Make the LRU cache bigger.', feedback: 'Helps, but a big enough burst still flushes it.' },
      { text: 'Never evict pages used more than 10 times.', feedback: 'The cache could fill with old favourites forever.' },
    ],
  },
  lens: {
    layout: 'A key map (key → node with count), a map count → doubly linked list of nodes, and minFreq.',
    invariant: 'Each node sits in the list for its current count; minFreq = the smallest non-empty count.',
    payoff: 'O(1) get/put/evict; keeps frequently used items through bursts.',
    price: 'More bookkeeping than LRU; stale favourites can linger (often fixed with ageing).',
  },
  generators: {
    predict: [predictLFUEvict],
    simulate: [orderLFUGet],
    count: [countLFUMisses],
    explain: lfuExplain,
  },
};

// =====================================================================
// Sparse matrix (CSR)
// =====================================================================

const SPM = 'sparse-matrix';

function randomSparse() {
  const rows = randInt(4, 5);
  const cols = randInt(5, 6);
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  const nnz = randInt(5, 8);
  const cells = shuffle(Array.from({ length: rows * cols }, (_, i) => i)).slice(0, nnz);
  cells.forEach((c) => (grid[Math.floor(c / cols)][c % cols] = randInt(1, 9)));
  const vals: number[] = [];
  const colIdx: number[] = [];
  const rowPtr = [0];
  grid.forEach((r) => {
    r.forEach((v, c) => {
      if (v) {
        vals.push(v);
        colIdx.push(c);
      }
    });
    rowPtr.push(vals.length);
  });
  return { grid, vals, colIdx, rowPtr, rows, cols };
}
const csrScene = (s: ReturnType<typeof randomSparse>): Scene => ({
  views: [
    { type: 'grid', key: 'g', rows: s.grid.map((r) => r.map((v) => (v ? v : null)) as Val[]), rowLabels: s.grid.map((_, i) => `r${i}`), colLabels: s.grid[0].map((_, i) => `c${i}`), title: 'The matrix (blank = 0)' },
    { type: 'row', key: 'v', items: s.vals, title: 'values (non-zeros, row by row)' },
    { type: 'row', key: 'c', items: s.colIdx, title: 'column of each value' },
    { type: 'row', key: 'p', items: s.rowPtr, title: 'rowPtr: row i’s values are at indexes rowPtr[i] … rowPtr[i+1] − 1' },
  ],
});

const predictSparseMem = (): Card => {
  const r = pick([1000, 10_000]);
  const nnz = r * pick([3, 5, 10]);
  return {
    concept: SPM,
    type: 'predict',
    prompt: `A ${r.toLocaleString()} × ${r.toLocaleString()} matrix has ${nnz.toLocaleString()} non-zeros. Stored as (row, col, value) triples, how many numbers is that, versus the dense ${(r * r).toLocaleString()}?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        3 * nnz,
        [
          { value: nnz, why: 'Each non-zero also needs its row and column.' },
          { value: r * r, why: 'That’s the dense size.' },
          { value: 2 * nnz, why: 'Row, column AND value: three numbers each.' },
        ],
        '3 numbers per non-zero.',
      ),
    },
    explain: `${(3 * nnz).toLocaleString()} numbers instead of ${(r * r).toLocaleString()}: about ${Math.round((r * r) / (3 * nnz))}× smaller. Zeros are simply not stored.`,
  };
};

const predictRowCount = (): Card => {
  const s = randomSparse();
  const i = randInt(0, s.rows - 1);
  return {
    concept: SPM,
    type: 'predict',
    prompt: `CSR format: rowPtr = [${s.rowPtr.join(', ')}]. How many non-zeros does row ${i} have?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        s.rowPtr[i + 1] - s.rowPtr[i],
        [
          { value: s.rowPtr[i + 1], why: 'That’s where row ' + i + ' ends. Subtract where it starts.' },
          { value: s.rowPtr[i], why: 'That’s where row ' + i + ' starts.' },
          { value: s.rowPtr[i + 1] - s.rowPtr[i] + 1, why: 'rowPtr[i+1] is one past the end: no +1.' },
        ],
        'rowPtr[i+1] − rowPtr[i]',
      ),
    },
    explain: `${s.rowPtr[i + 1]} − ${s.rowPtr[i]} = ${s.rowPtr[i + 1] - s.rowPtr[i]}. Like prefix sums: rowPtr is a running count of non-zeros.`,
  };
};

const simulateCSRRow = (): Card => {
  let s: ReturnType<typeof randomSparse>;
  let i: number;
  do {
    s = randomSparse();
    i = randInt(0, s.rows - 1);
  } while (s.rowPtr[i + 1] - s.rowPtr[i] < 2);
  const scene = csrScene(s);
  const exp = [`p:${i}`, `p:${i + 1}`, ...Array.from({ length: s.rowPtr[i + 1] - s.rowPtr[i] }, (_, k) => `v:${s.rowPtr[i] + k}`)];
  const frames = [scene];
  exp.forEach((_, k) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, k + 1) }));
  return {
    concept: SPM,
    type: 'simulate',
    prompt: `Read row ${i} from the CSR arrays (not the picture): click rowPtr[${i}], then rowPtr[${i + 1}], then each value in that range.`,
    scene,
    body: {
      kind: 'click',
      expected: exp,
      frames,
      wrongHint: (step, id) => (id.startsWith('g:') ? 'The grid is just the picture; use the arrays below.' : step < 2 ? `rowPtr[${step === 0 ? i : i + 1}].` : `Values from index ${s.rowPtr[i]} up to ${s.rowPtr[i + 1] - 1}.`),
    },
    explain: `Row ${i}: values ${s.vals.slice(s.rowPtr[i], s.rowPtr[i + 1]).join(', ')} in columns ${s.colIdx.slice(s.rowPtr[i], s.rowPtr[i + 1]).join(', ')}. Reading a row costs O(non-zeros in it), never O(columns).`,
  };
};

const countCSR = (): Card => {
  const rows = randInt(4, 1000);
  const nnz = randInt(rows, rows * 5);
  return {
    concept: SPM,
    type: 'count',
    prompt: `CSR storage for a matrix with ${rows} rows and ${nnz} non-zeros: values (${nnz}) + column indexes (${nnz}) + rowPtr. How many numbers in total?`,
    body: { kind: 'number', answer: 2 * nnz + rows + 1, unit: 'numbers' },
    explain: `${nnz} + ${nnz} + (${rows} + 1) = ${2 * nnz + rows + 1}. rowPtr has one extra entry so every row has an end.`,
  };
};

const spmExplain = explainGenerators({
  concept: SPM,
  truths: [
    'A sparse matrix stores only its non-zero entries.',
    'CSR keeps three arrays: values, their column indexes, and row pointers.',
    'Row i’s entries sit between rowPtr[i] and rowPtr[i+1] − 1.',
    'Memory is O(non-zeros + rows) instead of rows × columns.',
    'Random access to one cell needs a search within its row.',
  ],
  myths: [
    { text: 'Sparse formats are always better than dense ones.', why: 'For mostly-full matrices, indexes add overhead.' },
    { text: 'You can read cell (i, j) in O(1) in CSR.', why: 'You search row i’s column indexes.' },
    { text: 'rowPtr[i] is the number of non-zeros in row i.', why: 'It’s where row i starts; the count is the difference.' },
  ],
  chains: [
    {
      prompt: 'Why does rowPtr need one more entry than there are rows?',
      steps: ['Row i spans rowPtr[i] up to rowPtr[i+1] − 1.', 'The last row also needs an end marker.', 'So rowPtr has entries for every start plus one final end.', 'That’s rows + 1 entries.'],
    },
  ],
  summary: {
    best: 'A sparse matrix writes down only the cells that aren’t zero, plus where each one lives, like listing the few occupied seats instead of drawing the whole empty stadium.',
    others: [
      { text: 'It’s a compressed matrix.', why: 'Compressed how?' },
      { text: 'It’s a matrix with few rows.', why: 'Few *non-zeros*, not few rows.' },
      { text: 'It’s a hash map of cells.', why: 'One option, but CSR is arrays, not hashing.' },
    ],
  },
});

export const sparseMatrixConcept: Concept = {
  id: SPM,
  title: 'Sparse Matrix',
  tier: 10,
  prereqs: ['matrix', 'prefix-sum'],
  tagline: 'Store only what isn’t zero.',
  hook: {
    problem: 'A matrix of which users rated which movies: a million users × 100,000 movies, but each user rated ~50. Dense storage needs 10^11 cells, almost all zero.',
    question: 'How do you store just the ratings?',
    options: [
      { text: 'Store each non-zero with its position; group them by row with a running count so rows are easy to find.', good: true, feedback: 'Yes: CSR (compressed sparse row). Memory follows the actual data.' },
      { text: 'Compress the dense matrix with zip.', feedback: 'You’d have to decompress to do anything.' },
      { text: 'Use smaller numbers.', feedback: 'Still 10^11 of them.' },
    ],
  },
  lens: {
    layout: 'CSR: values[], colIdx[] (same length = non-zeros), rowPtr[] (rows + 1).',
    invariant: 'Row i’s non-zeros are values[rowPtr[i] .. rowPtr[i+1]−1], with their columns in colIdx.',
    payoff: 'Memory and row operations proportional to the non-zeros; fast matrix × vector.',
    price: 'Inserting a new non-zero shifts arrays; single-cell lookup needs a search in the row.',
  },
  generators: {
    predict: [predictSparseMem, predictRowCount],
    simulate: [simulateCSRRow],
    count: [countCSR],
    explain: spmExplain,
  },
};

// =====================================================================
// Mergeable heaps (binomial / pairing)
// =====================================================================

const MH = 'mergeable-heaps';
const pop = (n: number) => n.toString(2).split('').filter((c) => c === '1').length;
const sizesOf = (n: number) => n.toString(2).split('').reverse().map((b, i) => (b === '1' ? 2 ** i : 0)).filter(Boolean).reverse();

const predictBinomialSizes = (): Card => {
  const n = randInt(5, 60);
  const correct = sizesOf(n);
  return {
    concept: MH,
    type: 'predict',
    prompt: `A binomial heap is a forest of trees whose sizes are distinct powers of 2. With ${n} items, what are the tree sizes?`,
    body: {
      kind: 'choice',
      options: options({ text: correct.join(' + '), why: `${n} in binary is ${n.toString(2)}: one tree per 1-bit.` }, [
        { text: Array(n).fill(1).slice(0, 4).join(' + ') + ' + …', why: 'Trees of one item each would make the minimum slow to find.' },
        { text: [2 ** Math.ceil(Math.log2(n))].join(''), why: 'That’s bigger than ' + n + '.' },
        { text: sizesOf(n + 1).join(' + '), why: `That adds up to ${n + 1}.` },
      ]),
    },
    explain: `${n} = ${correct.join(' + ')} (binary ${n.toString(2)}). At most log₂ n + 1 trees, so finding the min is O(log n).`,
  };
};

const predictMergeCost = (): Card => {
  const n = pick([1000, 100_000, 1_000_000]);
  return {
    concept: MH,
    type: 'predict',
    prompt: `Merging two array-based binary heaps of ${n.toLocaleString()} items each means building one heap from all the items. What does merging two binomial heaps cost instead?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: 'O(log n): combine same-sized trees like adding two binary numbers.', correct: true, why: 'At most log n trees per heap, one link per carry.' },
        { text: 'O(n): every item must move.', correct: false, why: 'Whole trees are linked by a single pointer change.' },
        { text: 'O(1) always.', correct: false, why: 'That’s the pairing/Fibonacci heap (lazy) version; binomial does carries.' },
        { text: 'O(n log n): it re-sorts.', correct: false, why: 'Nothing gets sorted.' },
      ]),
    },
    explain: 'Linking two trees of size 2^k is one comparison + one pointer: the bigger root becomes a child of the smaller. Carries happen at most log n times.',
  };
};

const orderLink = (): Card => ({
  concept: MH,
  type: 'simulate',
  prompt: 'Link two binomial trees of the same order k (min-heap). Put the steps in order.',
  body: { kind: 'order', steps: ['Compare the two roots.', 'Make the root with the LARGER key a child of the other root.', 'The result is one tree of order k + 1, with twice as many nodes.'] },
  explain: 'One comparison and one pointer: heap order is kept because the smaller root stays on top.',
});

const orderPairing = (): Card => ({
  concept: MH,
  type: 'simulate',
  prompt: 'Merge two pairing heaps (min-heap). Put the steps in order.',
  body: { kind: 'order', steps: ['Compare the two roots.', 'Make the larger root the first child of the smaller root.', 'The smaller root is the root of the merged heap.'] },
  explain: 'O(1) merge. The work is deferred to removeMin, which pairs up the root’s children: amortized O(log n).',
});

const countLinks = (): Card => {
  const a = randInt(3, 31);
  const b = randInt(3, 31);
  return {
    concept: MH,
    type: 'count',
    prompt: `Merge binomial heaps of ${a} items (${a.toString(2)}₂) and ${b} items (${b.toString(2)}₂). Each link joins two trees into one. How many links happen?`,
    body: { kind: 'number', answer: pop(a) + pop(b) - pop(a + b), unit: 'links' },
    explain: `Trees before: ${pop(a)} + ${pop(b)}; after: ${pop(a + b)} (binary ${(a + b).toString(2)}). Each link removes one tree: ${pop(a) + pop(b) - pop(a + b)} links, exactly the carries in the binary addition.`,
  };
};

const countTrees = (): Card => {
  const n = randInt(5, 1000);
  return {
    concept: MH,
    type: 'count',
    prompt: `How many trees does a binomial heap with ${n} items have? (${n} = ${n.toString(2)}₂)`,
    body: { kind: 'number', answer: pop(n), unit: 'trees' },
    explain: `One per 1-bit: ${pop(n)}.`,
  };
};

const growthMH = (): Card => growthCard(MH, 'merge two binomial heaps of n items each (links)', (n) => Math.floor(Math.log2(n)) + 1, 1, 'At most one carry per bit: O(log n).');

const mhExplain = explainGenerators({
  concept: MH,
  truths: [
    'Mergeable heaps support fast merging of two heaps, which array heaps can’t do cheaply.',
    'A binomial heap is a forest of trees whose sizes match the 1-bits of n.',
    'Merging binomial heaps works like binary addition: same-size trees link, carrying upward.',
    'Linking two trees is one comparison and one pointer change.',
    'Pairing and Fibonacci heaps merge in O(1) by deferring work to removeMin.',
  ],
  myths: [
    { text: 'Merging heaps always costs O(n).', why: 'Only for array heaps; linked forests merge in O(log n) or O(1).' },
    { text: 'A binomial heap is one big binomial tree.', why: 'It’s a forest, one tree per 1-bit of n.' },
    { text: 'Linking trees copies their nodes.', why: 'One root just becomes a child of the other.' },
  ],
  chains: [
    {
      prompt: 'Why does a binomial-heap merge look like binary addition?',
      steps: ['A heap of n items has one tree per 1-bit of n.', 'Merging puts together trees of the same size, like adding bits.', 'Two trees of size 2^k link into one of size 2^(k+1): a carry.', 'So the result’s trees match the bits of the sum.'],
    },
  ],
  summary: {
    best: 'Mergeable heaps keep items in a few linked trees instead of one packed array, so two heaps can be combined by re-hanging trees instead of moving every item.',
    others: [
      { text: 'They’re heaps that can merge.', why: 'Restates the name.' },
      { text: 'They’re faster binary heaps.', why: 'Array heaps are usually faster at everything except merge.' },
      { text: 'They sort items by merging.', why: 'That’s merge sort, a different idea.' },
    ],
  },
});

export const mergeableHeapsConcept: Concept = {
  id: MH,
  title: 'Mergeable Heaps',
  tier: 10,
  prereqs: ['binary-heap', 'bits'],
  tagline: 'Binomial, pairing, Fibonacci: heaps that combine cheaply.',
  hook: {
    problem: 'Two print servers each keep a priority queue. One server dies and its queue must be merged into the other. With array heaps, that’s rebuilding from all items: O(n).',
    question: 'How could whole heaps be combined without moving every item?',
    options: [
      { text: 'Keep each heap as a few linked trees, so merging just hangs trees under each other.', good: true, feedback: 'Yes. Binomial heaps merge in O(log n) like binary addition; pairing/Fibonacci heaps in O(1).' },
      { text: 'Append one array to the other.', feedback: 'That breaks heap order; you’d have to re-heapify.' },
      { text: 'Keep both heaps and check both on every removeMin.', feedback: 'Works for two, not for many repeated merges.' },
    ],
  },
  lens: {
    layout: 'A forest of heap-ordered trees linked by pointers (binomial: sizes are distinct powers of 2).',
    invariant: 'Every tree is heap-ordered; binomial: at most one tree of each size.',
    payoff: 'Merge in O(log n) (binomial) or O(1) (pairing/Fibonacci); Fibonacci heaps also give O(1) amortized decrease-key.',
    price: 'Pointer-heavy and slower in practice than array heaps unless merges or decrease-keys dominate.',
  },
  generators: {
    predict: [predictBinomialSizes, predictMergeCost],
    simulate: [orderLink, orderPairing],
    count: [countLinks, countTrees, growthMH],
    explain: mhExplain,
  },
};

// =====================================================================
// Persistent (immutable) structures
// =====================================================================

const PER = 'persistent-structures';

const predictPrepend = (): Card => {
  const xs = distinctInts(3, 10, 99);
  const [v] = distinctInts(1, 100, 199);
  return {
    concept: PER,
    type: 'predict',
    prompt: `An immutable list old = ${xs.join(' → ')}. You make new = prepend(${v}, old). What happens to old, and what's shared?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: `old is unchanged; new's node ${v} points at old's first node, so all of old is shared.`, correct: true, why: 'Prepending creates one node; the rest is shared safely because nothing can change.' },
        { text: `old becomes ${v} → ${xs.join(' → ')} too.`, correct: false, why: 'Immutable: old can never change.' },
        { text: 'new is a full copy of old plus one node.', correct: false, why: 'Copying is unnecessary: old can’t change, so sharing is safe.' },
        { text: 'old is deleted to save memory.', correct: false, why: 'Both versions stay valid.' },
      ]),
    },
    explain: 'One new node, O(1). Sharing is safe only because nothing is ever modified in place.',
  };
};

const predictPathCopy = (): Card => {
  const keys = distinctInts(randInt(8, 10), 1, 99);
  const root = randomBST(keys);
  let k = randInt(1, 99);
  while (keys.includes(k)) k = randInt(1, 99);
  const path = bstPath(root, k);
  return {
    concept: PER,
    type: 'predict',
    prompt: `Persistent BST: insert ${k} WITHOUT changing the old version. Which nodes get copied?`,
    scene: { views: [{ type: 'tree', root: toTree(root), binary: true, title: 'Version 1' }] },
    body: {
      kind: 'choice',
      options: options({ text: `Only the path ${path.join(' → ')} (plus the new node)`, why: 'Each ancestor needs a new child pointer, so it’s copied; everything else is shared.' }, [
        { text: 'Every node in the tree', why: 'Subtrees off the path don’t change and can be shared.' },
        { text: `Only the new node ${k}`, why: `${k}'s parent must point to it, but the old parent can't change, so it's copied, and so on up.` },
        { text: `Only ${path[path.length - 1]} and the new node`, why: 'The parent’s copy needs a new pointer from ITS parent too, all the way to the root.' },
      ]),
    },
    explain: `${path.length} copies + 1 new node. Version 2 has a new root; both roots share every untouched subtree. O(log n) per update in a balanced tree.`,
  };
};

const simulatePathCopy = (): Card => {
  const keys = distinctInts(randInt(8, 10), 1, 99);
  const root = randomBST(keys);
  const deep = keys.filter((x) => bstPath(root, x).length >= 3);
  const k = pick(deep.length ? deep : keys);
  const path = bstPath(root, k);
  const scene: Scene = { views: [{ type: 'tree', root: toTree(root), binary: true, title: 'Version 1 (must stay unchanged)' }] };
  const exp = path.map(t);
  const frames = [scene];
  exp.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, i + 1) }));
  return {
    concept: PER,
    type: 'simulate',
    prompt: `Make version 2 where ${k}'s value is updated. Click every node that must be COPIED, from the root down.`,
    scene,
    body: { kind: 'click', expected: exp, frames, wrongHint: () => 'Copy the node being changed and every ancestor (each needs a new child pointer). Nothing off the path.' },
    explain: `${path.length} copies: ${path.join(' → ')}. The rest of the tree is shared between both versions.`,
  };
};

const countNewNodes = (): Card => {
  const keys = distinctInts(randInt(8, 10), 1, 99);
  const root = randomBST(keys);
  let k = randInt(1, 99);
  while (keys.includes(k)) k = randInt(1, 99);
  const path = bstPath(root, k);
  return {
    concept: PER,
    type: 'count',
    prompt: `Persistent insert of ${k} into this BST. How many NEW nodes are allocated in total (copies + the new leaf)?`,
    scene: { views: [{ type: 'tree', root: toTree(root), binary: true }] },
    body: { kind: 'number', answer: path.length + 1, unit: 'nodes' },
    explain: `${path.length} path copies (${path.join(' → ')}) + 1 new node for ${k}.`,
  };
};

const countVersions = (): Card => {
  const h = randInt(3, 20);
  const v = randInt(5, 100);
  return {
    concept: PER,
    type: 'count',
    prompt: `A balanced persistent tree has height ${h} (paths of ${h + 1} nodes). You make ${v} updates, each keeping every old version. How many new nodes are created in total (path copying, updating existing keys)?`,
    body: { kind: 'number', answer: v * (h + 1), unit: 'nodes' },
    explain: `${v} × ${h + 1} = ${v * (h + 1)}. Every version stays fully usable, at O(log n) memory per update, not a full O(n) copy.`,
  };
};

const perExplain = explainGenerators({
  concept: PER,
  truths: [
    'A persistent structure never changes in place; updates create a new version.',
    'Old versions stay valid and unchanged.',
    'Path copying copies only the nodes on the path to the change; the rest is shared.',
    'Sharing is safe because no version can modify shared nodes.',
    'A balanced persistent tree costs O(log n) new nodes per update.',
  ],
  myths: [
    { text: 'Immutable updates copy the whole structure.', why: 'Only the changed path is copied.' },
    { text: 'Old versions are automatically deleted.', why: 'They remain valid while anything refers to them.' },
    { text: 'Sharing nodes between versions is dangerous.', why: 'Only when nodes can be mutated. Here they can’t.' },
  ],
  chains: [
    {
      prompt: 'Why must every ancestor of a changed node be copied?',
      steps: ['The changed node gets a new copy.', 'Its parent must point to the copy, but the old parent can’t change.', 'So the parent is copied too, with the new pointer.', 'This repeats up to the root, which becomes the new version’s root.'],
    },
  ],
  summary: {
    best: 'A persistent structure never erases anything: each change makes a new version that reuses all the unchanged parts of the old one, like a family tree of edits.',
    others: [
      { text: 'Persistent means saved to disk.', why: 'Different meaning of the word.' },
      { text: 'It’s a structure that can’t be changed.', why: 'It can be “changed” by making new versions.' },
      { text: 'It keeps a full copy of every version.', why: 'Versions share almost everything.' },
    ],
  },
});

export const persistentConcept: Concept = {
  id: PER,
  title: 'Persistent Structures',
  tier: 10,
  prereqs: ['bst', 'linked-list'],
  tagline: 'Every version kept, sharing what didn’t change.',
  hook: {
    problem: 'An editor needs unlimited undo, and several threads read the data while it’s being updated. Copying everything on every change is far too slow.',
    question: 'How could every old version stay available cheaply?',
    options: [
      { text: 'Never modify nodes; on each change copy only the nodes on the path to it and share the rest.', good: true, feedback: 'Yes: path copying. Each version costs O(log n) new nodes, and old versions never break.' },
      { text: 'Save a full copy after every change.', feedback: 'O(n) time and memory per change.' },
      { text: 'Store a log of changes and replay it.', feedback: 'Reaching an old version means replaying: slow.' },
    ],
  },
  lens: {
    layout: 'Ordinary nodes (lists, trees) that are never modified; each version is a root pointer.',
    invariant: 'Nodes are immutable once created; each version’s root reaches exactly that version’s data.',
    payoff: 'Free undo/history, safe sharing across threads, cheap versions (O(1) for list prepend, O(log n) for trees).',
    price: 'Extra allocation per update, garbage collection needed, slower than in-place mutation.',
  },
  generators: {
    predict: [predictPrepend, predictPathCopy],
    simulate: [simulatePathCopy],
    count: [countNewNodes, countVersions],
    explain: perExplain,
  },
};

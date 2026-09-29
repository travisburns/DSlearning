import type { Card, Concept, Scene } from '../engine/types';
import { cloneScene, fmtArray } from '../engine/memory';
import { distinctInts, pick, randInt } from '../engine/random';
import { arrayScene, insertFrames } from './arrayUtil';
import { explainGenerators, growthCard, options } from './helpers';

// =====================================================================
// Monotonic stack / queue
// =====================================================================

const MONO = 'monotonic-stack';

/** Next greater element for each index (-1 if none), plus the stack history. */
function nextGreater(a: number[]) {
  const ans = a.map(() => -1);
  const st: number[] = []; // indexes, values decreasing bottom → top
  let pops = 0;
  const popsAt: number[][] = [];
  a.forEach((x, i) => {
    const popped: number[] = [];
    while (st.length && a[st[st.length - 1]] < x) {
      const j = st.pop()!;
      ans[j] = x;
      popped.push(j);
      pops++;
    }
    popsAt.push(popped);
    st.push(i);
  });
  return { ans, pops, popsAt };
}

const predictNGE = (): Card => {
  const a = distinctInts(randInt(6, 8), 1, 40);
  const i = randInt(0, a.length - 2);
  const { ans } = nextGreater(a);
  const rest = a.slice(i + 1);
  return {
    concept: MONO,
    type: 'predict',
    prompt: `arr = ${fmtArray(a)}. What is the "next greater element" of ${a[i]}: the first value to its right that is bigger? (−1 if none.)`,
    body: {
      kind: 'choice',
      options: options({ text: String(ans[i]), why: 'The first value to the right that is bigger.' }, [
        { text: String(Math.max(...rest)), why: 'That’s the biggest to the right, not the *first* bigger one.' },
        { text: String(a[i + 1]), why: 'That’s just the next element, bigger or not.' },
        { text: '-1', why: 'Look again: something to the right is bigger.' },
        { text: String(a[i]), why: 'That’s the element itself.' },
        { text: String(Math.min(...rest)), why: 'That’s the smallest to the right.' },
      ]),
    },
    explain: `Right of ${a[i]}: ${rest.join(', ')}. The first bigger one is ${ans[i] === -1 ? 'none, so −1' : ans[i]}. A monotonic stack finds this for *every* element in one pass.`,
  };
};

const predictStackState = (): Card => {
  const a = distinctInts(randInt(5, 7), 1, 40);
  const k = randInt(3, a.length);
  const st: number[] = [];
  for (const x of a.slice(0, k)) {
    while (st.length && st[st.length - 1] < x) st.pop();
    st.push(x);
  }
  return {
    concept: MONO,
    type: 'predict',
    prompt: `Process ${fmtArray(a.slice(0, k))} left to right with a decreasing stack: before pushing x, pop everything smaller than x. What's in the stack at the end (bottom → top)?`,
    body: {
      kind: 'choice',
      options: options({ text: fmtArray(st), why: 'Every value that met a bigger newcomer was popped.' }, [
        { text: fmtArray(a.slice(0, k)), why: 'That’s everything pushed, with no pops.' },
        { text: fmtArray([...a.slice(0, k)].sort((x, y) => y - x)), why: 'Sorting keeps values that were popped; a value leaves forever once something bigger arrives after it.' },
        { text: fmtArray([...st].reverse()), why: 'Top → bottom. The stack is decreasing from the bottom.' },
      ]),
    },
    explain: `The stack is always decreasing from bottom to top. It holds exactly the values still waiting for something bigger: ${fmtArray(st)}.`,
  };
};

const simulatePops = (): Card => {
  let a: number[];
  let i: number;
  let r: ReturnType<typeof nextGreater>;
  do {
    a = distinctInts(randInt(6, 7), 1, 40);
    r = nextGreater(a);
    i = randInt(2, a.length - 1);
  } while (r.popsAt[i].length < 1);
  // Stack contents just before element i arrives.
  const before: number[] = [];
  for (let k = 0; k < i; k++) {
    while (before.length && a[before[before.length - 1]] < a[k]) before.pop();
    before.push(k);
  }
  const scene: Scene = {
    views: [
      { type: 'row', key: 'a', items: a, title: 'The array', pointers: [{ name: `next: ${a[i]}`, index: i }] },
      { type: 'row', key: 's', items: before.map((k) => a[k]), labels: before.map((_, j) => (j === before.length - 1 ? 'top' : '')), title: 'The stack (bottom → top)' },
    ],
  };
  const popped = r.popsAt[i]; // in pop order: top first
  const expected = popped.map((k) => `s:${before.indexOf(k)}`);
  const frames = [scene];
  popped.forEach((_, j) => frames.push({ ...cloneScene(scene), highlight: expected.slice(0, j + 1) }));
  return {
    concept: MONO,
    type: 'simulate',
    prompt: `${a[i]} arrives. Click, in order, every stack item that gets popped (each one's answer becomes ${a[i]}).`,
    scene,
    body: {
      kind: 'click',
      expected,
      frames,
      wrongHint: (step) => (step === 0 ? 'Pops happen at the top of the stack.' : 'Keep popping from the top while the top is smaller than the newcomer.'),
    },
    explain: `Popped ${popped.map((k) => a[k]).join(', ')}: each was waiting for something bigger, and ${a[i]} is the first. Then ${a[i]} is pushed.`,
  };
};

const countPops = (): Card => {
  const a = distinctInts(randInt(6, 9), 1, 50);
  const { pops } = nextGreater(a);
  return {
    concept: MONO,
    type: 'count',
    prompt: `Run the next-greater-element algorithm (decreasing stack) on ${fmtArray(a)}. How many pops happen in total?`,
    body: { kind: 'number', answer: pops, unit: 'pops' },
    explain: `${pops} pops. Each element is pushed once and popped at most once, so the total work is at most 2n, however the pops bunch up.`,
  };
};

const countBound = (): Card => {
  const n = randInt(10, 5000);
  return {
    concept: MONO,
    type: 'count',
    prompt: `For an array of ${n} elements, what's the maximum possible total number of pushes + pops in the monotonic stack algorithm?`,
    body: { kind: 'number', answer: 2 * n, unit: 'operations' },
    explain: `${n} pushes (one each) + at most ${n} pops (each element leaves once) = ${2 * n}. A single step might pop many, but the total can't exceed this.`,
  };
};

const growthMono = (): Card =>
  pick([
    () => growthCard(MONO, 'next greater element for ALL items, monotonic stack (worst case)', (n) => 2 * n, 2, 'Each item pushed once, popped at most once: linear.'),
    () => growthCard(MONO, 'next greater element for ALL items, checking every pair', (n) => (n * (n - 1)) / 2, 3, 'Scanning right from each element: about n²/2.'),
  ])();

const monoExplain = explainGenerators({
  concept: MONO,
  truths: [
    'A monotonic stack keeps its items in sorted order from bottom to top.',
    'Before pushing x, you pop every item that x "beats".',
    'Popped items have just found their answer: x.',
    'Each item is pushed once and popped at most once, so the total work is O(n).',
    'Items on the stack are the ones still waiting for an answer.',
  ],
  myths: [
    { text: 'Because one push can pop many items, the algorithm is O(n²).', why: 'Each item can only be popped once in total, so pops across all steps add up to at most n.' },
    { text: 'The stack ends up holding the whole array sorted.', why: 'Popped items are gone for good. It only holds unanswered ones.' },
    { text: 'The next greater element is the maximum to the right.', why: 'It’s the *first* bigger one, not the biggest.' },
  ],
  chains: [
    {
      prompt: 'Why is the whole algorithm O(n) even though one step can pop many items?',
      steps: ['Every item is pushed exactly once.', 'An item can be popped at most once.', 'So total pops ≤ total pushes = n.', 'All steps together do at most 2n stack operations.'],
    },
    {
      prompt: 'Why is a popped item’s answer the newcomer?',
      steps: ['Items on the stack haven’t met a bigger value yet.', 'The newcomer is bigger than the items it pops.', 'And it’s the first bigger value to their right.', 'So it’s exactly their next greater element.'],
    },
  ],
  summary: {
    best: 'It’s a stack of people waiting for someone taller; each newcomer sends home everyone shorter, and each person is sent home at most once.',
    others: [
      { text: 'A monotonic stack is a stack that is monotonic.', why: 'Circular.' },
      { text: 'It’s a trick for LeetCode problems.', why: 'No mechanism.' },
      { text: 'It’s a sorted stack.', why: 'Misses why popping answers questions.' },
    ],
  },
});

export const monotonicStackConcept: Concept = {
  id: MONO,
  title: 'Monotonic Stack / Queue',
  tier: 2,
  prereqs: ['stack', 'deque'],
  tagline: 'A stack kept in order: each item waits for its answer.',
  hook: {
    problem: 'For each day’s temperature, find how many days until a warmer day. Checking every later day for every day is n² work.',
    question: 'How could one left-to-right pass answer every day?',
    options: [
      { text: 'Sort the temperatures first.', feedback: 'Sorting loses the day order, which is the whole question.' },
      { text: 'Keep a stack of days still waiting for a warmer one; a warmer day pops and answers them.', good: true, feedback: 'Yes. The stack stays in decreasing order, and each day is pushed and popped once: O(n) total.' },
      { text: 'Remember only the warmest day so far.', feedback: 'That tells you nothing about the *next* warmer day for the others.' },
    ],
  },
  lens: {
    layout: 'An ordinary stack (or deque for the sliding-window version) of indexes.',
    invariant: 'Values stay monotonic (e.g. decreasing) from bottom to top.',
    payoff: '"Next greater/smaller" and sliding-window max/min for every element in O(n) total.',
    price: 'Only answers those specific ordered questions; the stack isn’t a general sorted set.',
  },
  generators: {
    predict: [predictNGE, predictStackState],
    simulate: [simulatePops],
    count: [countPops, countBound, growthMono],
    explain: monoExplain,
  },
};

// =====================================================================
// Priority queue (the interface, with naive implementations)
// =====================================================================

const PQ = 'priority-queue';

const predictPQOrder = (): Card => {
  const ops: string[] = [];
  const pq: number[] = [];
  const out: number[] = [];
  const fifo: number[] = [];
  const fifoOut: number[] = [];
  const vals = distinctInts(6, 1, 50);
  let vi = 0;
  for (let i = 0; i < 8 && vi < vals.length; i++) {
    if (pq.length > 1 && Math.random() < 0.4) {
      pq.sort((a, b) => a - b);
      out.push(pq.shift()!);
      fifoOut.push(fifo.shift()!);
      ops.push('removeMin()');
    } else {
      pq.push(vals[vi]);
      fifo.push(vals[vi]);
      ops.push(`insert(${vals[vi++]})`);
    }
  }
  while (out.length < 2) {
    pq.sort((a, b) => a - b);
    out.push(pq.shift()!);
    fifoOut.push(fifo.shift()!);
    ops.push('removeMin()');
  }
  return {
    concept: PQ,
    type: 'predict',
    prompt: `A min-priority queue (smaller number = more urgent). Run: ${ops.join(', ')}. What do the removeMin calls return, in order?`,
    body: {
      kind: 'choice',
      options: options({ text: out.join(', '), why: 'Each removal takes the smallest item present *at that moment*.' }, [
        { text: fifoOut.join(', '), why: 'That’s arrival order: a plain queue.' },
        { text: [...out].sort((a, b) => a - b).join(', '), why: 'Sorted overall, but a removal can only see items inserted before it.' },
        { text: [...out].reverse().join(', '), why: 'Reversed.' },
      ]),
    },
    explain: 'A priority queue ignores arrival order: the most urgent item present always leaves first.',
  };
};

const predictWhichImpl = (): Card => {
  const c = pick([
    { s: 'millions of inserts, and only occasionally removeMin', a: 'Unsorted array: O(1) insert, O(n) removeMin', why: 'Cheap inserts matter most; the rare O(n) scan is acceptable.' },
    { s: 'items inserted once at startup, then removeMin called constantly', a: 'Sorted array: O(n) insert, O(1) removeMin', why: 'Pay the sorting cost once; every removal is then instant.' },
  ]);
  return {
    concept: PQ,
    type: 'predict',
    prompt: `Your workload: ${c.s}. Which simple priority-queue implementation fits better?`,
    body: {
      kind: 'choice',
      options: options({ text: c.a, why: c.why }, [
        { text: c.a.startsWith('Unsorted') ? 'Sorted array: O(n) insert, O(1) removeMin' : 'Unsorted array: O(1) insert, O(n) removeMin', why: 'This makes the *frequent* operation the slow one.' },
        { text: 'A plain queue', why: 'A queue ignores priority entirely.' },
      ]),
    },
    explain: 'Both simple versions make one operation O(n). A heap (coming later) makes both O(log n).',
  };
};

const simulateSortedInsert = (): Card => {
  const items = distinctInts(randInt(4, 6), 1, 60).sort((a, b) => a - b);
  let v = randInt(2, 59);
  while (items.includes(v)) v++;
  const idx = items.findIndex((x) => x > v);
  const i = idx === -1 ? items.length : idx;
  const base = randInt(2, 24 - items.length - 2);
  const scene = arrayScene(base, items, items.length + 1);
  const { writes, frames } = insertFrames(scene, i, v);
  return {
    concept: PQ,
    type: 'simulate',
    prompt: `This priority queue is a sorted array (smallest first). Insert ${v}. Click each cell as you write it: shift the bigger values right, then write ${v}.`,
    scene,
    body: {
      kind: 'click',
      expected: writes,
      frames: [cloneScene(scene), ...frames],
      wrongHint: (step) => (step === writes.length - 1 ? `Everything bigger than ${v} has moved. Write ${v} in the gap.` : 'Shift from the free end backwards, so nothing gets overwritten.'),
    },
    explain: `${writes.length - 1} shifts + 1 write keep the array sorted, so removeMin stays O(1): it's always at the front (or at the end, if you store largest-first).`,
  };
};

const simulateScanMin = (): Card => {
  const items = distinctInts(randInt(5, 7), 1, 99);
  const base = randInt(2, 24 - items.length - 1);
  const scene = arrayScene(base, items, items.length);
  const frames = [scene];
  items.forEach((_, k) => frames.push({ ...cloneScene(scene), highlight: Array.from({ length: k + 1 }, (_, j) => `m:${base + j}`) }));
  return {
    concept: PQ,
    type: 'simulate',
    prompt: 'This priority queue is an UNSORTED array. To find the minimum, which cells must you read? Click them in order.',
    scene,
    body: { kind: 'click', expected: items.map((_, k) => `m:${base + k}`), frames, wrongHint: () => 'Unsorted means the minimum could be anywhere. You can’t skip any cell.' },
    explain: `All ${items.length} cells: the min (${Math.min(...items)}) could have been anywhere. That's the O(n) price of O(1) inserts.`,
  };
};

const countPQ = (): Card => {
  const n = randInt(10, 500);
  return pick([
    {
      concept: PQ,
      type: 'count' as const,
      prompt: `An unsorted-array priority queue holds ${n} items. How many comparisons does removeMin need to find the smallest?`,
      body: { kind: 'number' as const, answer: n - 1, unit: 'comparisons' },
      explain: `Keep a "smallest so far" and compare it with each of the other ${n - 1} items.`,
    },
    {
      concept: PQ,
      type: 'count' as const,
      prompt: `A sorted-array priority queue (smallest at the END, so removal is a pop) holds ${n} items. You insert a value smaller than everything. How many items shift?`,
      body: { kind: 'number' as const, answer: 0, unit: 'shifts' },
      explain: 'Smallest belongs at the end, so it’s a plain append: 0 shifts. The worst case is a value bigger than everything: all n shift.',
    },
  ]);
};

const growthPQ = (): Card =>
  pick([
    () => growthCard(PQ, 'removeMin from an unsorted array', (n) => n - 1, 2, 'Must compare against every item.'),
    () => growthCard(PQ, 'insert into a sorted array (worst case)', (n) => n + 1, 2, 'Up to n shifts to keep it sorted.'),
  ])();

const pqExplain = explainGenerators({
  concept: PQ,
  truths: [
    'A priority queue always removes the most urgent item, regardless of arrival order.',
    'With an unsorted array, insert is O(1) but removeMin scans everything: O(n).',
    'With a sorted array, removeMin is O(1) but insert shifts items: O(n).',
    'It’s an interface: several structures can implement it with different costs.',
  ],
  myths: [
    { text: 'A priority queue is a queue sorted by arrival time.', why: 'Arrival time is irrelevant. Priority decides.' },
    { text: 'A priority queue must keep everything fully sorted.', why: 'Only the *next* item must be quick to find. A heap exploits this.' },
    { text: 'Both insert and removeMin can be O(1) with a simple array.', why: 'One of them has to pay: scan or shift.' },
  ],
  chains: [
    {
      prompt: 'Why does an unsorted array make removeMin O(n)?',
      steps: ['Inserts just append, with no ordering.', 'So the minimum could be in any slot.', 'Finding it means checking every slot.', 'n slots means O(n).'],
    },
  ],
  summary: {
    best: 'It’s an emergency room: whoever is most urgent is seen next, no matter when they arrived.',
    others: [
      { text: 'A priority queue is a heap.', why: 'A heap is one way to build it, not what it is.' },
      { text: 'It’s a queue with priorities.', why: 'Restates the name.' },
      { text: 'It sorts items.', why: 'It only needs the next one, not a full sort.' },
    ],
  },
});

export const priorityQueueConcept: Concept = {
  id: PQ,
  title: 'Priority Queue (interface)',
  tier: 2,
  prereqs: ['queue', 'dynamic-array'],
  tagline: 'Most urgent first. How cheap can we make it?',
  hook: {
    problem: 'An emergency room: patients arrive in any order, but the most urgent one must always be seen next.',
    question: 'What does the waiting list need to support?',
    options: [
      { text: 'A queue: first come, first served.', feedback: 'A heart attack would wait behind a sprained ankle.' },
      { text: 'Insert with a priority, and remove the most urgent.', good: true, feedback: 'Yes. That’s the priority queue interface. The question is how to make both operations cheap.' },
      { text: 'A stack: newest first.', feedback: 'Newest isn’t most urgent.' },
    ],
  },
  lens: {
    layout: 'An interface, not a layout. Simple versions: an unsorted array, or a sorted array.',
    invariant: 'removeMin always returns the smallest priority currently stored.',
    payoff: 'Unsorted: O(1) insert. Sorted: O(1) removeMin.',
    price: 'Each simple version makes the other operation O(n). The binary heap fixes that later.',
  },
  generators: {
    predict: [predictPQOrder, predictWhichImpl],
    simulate: [simulateSortedInsert, simulateScanMin],
    count: [countPQ, growthPQ],
    explain: pqExplain,
  },
};


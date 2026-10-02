import type { Card, Cell, Concept, Scene, View } from '../engine/types';
import { cloneScene, emptyMemory, fmtArray, m, sprinkleGarbage } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions, options, sequenceRebuild } from './helpers';

type Op = { kind: 'push'; v: number } | { kind: 'pop' };

/** A random push/pop sequence that never pops an empty container. */
function randomOps(count: number, vals: number[]): Op[] {
  const ops: Op[] = [];
  let size = 0;
  let vi = 0;
  for (let i = 0; i < count; i++) {
    if (size > 0 && (vi >= vals.length || Math.random() < 0.4)) {
      ops.push({ kind: 'pop' });
      size--;
    } else {
      ops.push({ kind: 'push', v: vals[vi++] });
      size++;
    }
  }
  return ops;
}

const fmtOps = (ops: Op[], push: string, pop: string) => ops.map((o) => (o.kind === 'push' ? `${push}(${o.v})` : `${pop}()`)).join(', ');

function runStack(ops: Op[]) {
  const st: number[] = [];
  const popped: number[] = [];
  for (const o of ops) o.kind === 'push' ? st.push(o.v) : popped.push(st.pop()!);
  return { st, popped };
}
function runQueue(ops: Op[]) {
  const q: number[] = [];
  const out: number[] = [];
  for (const o of ops) o.kind === 'push' ? q.push(o.v) : out.push(q.shift()!);
  return { q, out };
}

// =====================================================================
// Stack
// =====================================================================

const ST = 'stack';

function stackScene(base: number, cap: number, items: number[], garbage = true): Scene {
  let cells: Cell[] = emptyMemory();
  for (let k = 0; k < cap; k++) cells[base + k] = k < items.length ? { v: items[k], kind: 'val', label: `[${k}]` } : { v: null, kind: 'free', label: `[${k}]` };
  if (garbage) cells = sprinkleGarbage(cells, 0.25);
  return { cells, views: [{ type: 'stack', base, capacity: cap, top: items.length }, { type: 'memory' }], markers: [{ name: 'base', addr: base }] };
}

const predictStackOps = (): Card => {
  let ops: Op[];
  let r: ReturnType<typeof runStack>;
  do {
    ops = randomOps(randInt(6, 8), distinctInts(6, 10, 99));
    r = runStack(ops);
  } while (r.st.length < 2);
  const q = runQueue(ops).q;
  return {
    concept: ST,
    type: 'predict',
    prompt: `Start with an empty stack. Run: ${fmtOps(ops, 'push', 'pop')}.\n\nWhat's left in the stack, bottom → top?`,
    body: {
      kind: 'choice',
      options: options({ text: fmtArray(r.st), why: 'Each pop removed the most recently pushed item still there.' }, [
        { text: fmtArray(q), why: 'That’s what a *queue* would keep: removing the oldest first.' },
        { text: fmtArray([...r.st].reverse()), why: 'Right items, but listed top → bottom.' },
        { text: fmtArray(ops.filter((o): o is Extract<Op, { kind: 'push' }> => o.kind === 'push').map((o) => o.v).slice(0, r.st.length)), why: 'That keeps the first items pushed, as if pops took from the bottom.' },
      ]),
    },
    explain: `Pops returned ${r.popped.join(', ')}, always the newest item. Last in, first out.`,
  };
};

const BRACKETS = ['()', '[]', '{}'];
function randomBrackets(valid: boolean): string {
  const gen = (d: number): string => {
    if (d === 0) return '';
    const [o, c] = pick(BRACKETS);
    return Math.random() < 0.5 ? o + gen(d - 1) + c : o + c + gen(d - 1);
  };
  let s = gen(randInt(3, 4));
  if (!valid) {
    const i = randInt(0, s.length - 2);
    const arr = s.split('');
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    s = arr.join('');
    if (checkBrackets(s)) s = s.slice(0, -1) + (s.endsWith(')') ? ']' : ')');
  }
  return s;
}
function checkBrackets(s: string): boolean {
  const st: string[] = [];
  const pair: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  for (const ch of s) {
    if ('([{'.includes(ch)) st.push(ch);
    else if (st.pop() !== pair[ch]) return false;
  }
  return st.length === 0;
}

const predictBrackets = (): Card => {
  const s = randomBrackets(Math.random() < 0.5);
  const ok = checkBrackets(s);
  return {
    concept: ST,
    type: 'predict',
    prompt: `A stack checks brackets: push each opener; on each closer, pop and check it matches. Is "${s}" balanced?`,
    body: {
      kind: 'choice',
      options: [
        { text: 'Balanced', correct: ok, why: ok ? 'Every closer matched the most recent unclosed opener.' : 'Trace it: some closer meets the wrong opener on top, or something is left over.' },
        { text: 'Not balanced', correct: !ok, why: !ok ? 'At some point the top of the stack isn’t the matching opener (or openers are left over).' : 'Trace it again: each closer does match the top.' },
      ],
    },
    explain: `The most recently opened bracket must close first: that's exactly last-in-first-out. "${s}" is ${ok ? '' : 'not '}balanced.`,
  };
};

const simulateStack = (): Card => {
  const cap = 6;
  const base = randInt(2, 24 - cap - 1);
  const start = distinctInts(randInt(1, 2), 10, 99);
  const ops = randomOps(randInt(4, 5), distinctInts(5, 100, 199));
  // Keep within capacity.
  let size = start.length;
  const safe = ops.filter((o) => (o.kind === 'push' ? size < cap && ++size > 0 : size > 0 && size-- > 0));
  const s0 = stackScene(base, cap, start);
  const frames = [s0];
  const expected: string[] = [];
  const st = [...start];
  let cur = s0;
  for (const o of safe) {
    cur = cloneScene(cur);
    const sv = cur.views[0] as Extract<View, { type: 'stack' }>;
    if (o.kind === 'push') {
      cur.cells![base + st.length] = { v: o.v, kind: 'val', label: `[${st.length}]` };
      expected.push(m(base + st.length));
      st.push(o.v);
    } else {
      expected.push(m(base + st.length - 1));
      st.pop();
      cur.cells![base + st.length] = { v: cur.cells![base + st.length].v, kind: 'free', label: `[${st.length}]` };
    }
    sv.top = st.length;
    cur.highlight = [expected[expected.length - 1]];
    frames.push(cur);
  }
  return {
    concept: ST,
    type: 'simulate',
    prompt: `The stack lives in a block at "base"; "top" counts the items. Run ${fmtOps(safe, 'push', 'pop')}. For each operation, click the one cell it touches.`,
    scene: s0,
    body: {
      kind: 'click',
      expected,
      frames,
      wrongHint: (step) => (safe[step].kind === 'push' ? 'Push writes into the first free slot: base + top.' : 'Pop takes the item at base + top − 1, the newest one.'),
    },
    explain: `Every operation touched exactly one cell, right at the top. Nothing else ever moves.`,
  };
};

const countReverse = (): Card => {
  const n = randInt(4, 30);
  return {
    concept: ST,
    type: 'count',
    prompt: `Reverse a ${n}-character word with a stack: push every character, then pop them all. How many push + pop operations in total?`,
    body: { kind: 'number', answer: 2 * n, unit: 'operations' },
    explain: `${n} pushes + ${n} pops = ${2 * n}. Each is O(1), so reversing is O(n).`,
  };
};

const countPop = (): Card => {
  const n = randInt(10, 100000);
  return {
    concept: ST,
    type: 'count',
    prompt: `An array-backed stack holds ${n.toLocaleString()} items. How many cells does one pop touch?`,
    body: { kind: 'number', answer: 1, unit: 'cells' },
    explain: 'Read base + top − 1, decrement top. The other items never move.',
  };
};

const growthStack = (): Card => growthCard(ST, 'push onto a stack of n items', () => 1, 0, 'One write at base + top. The size never matters.');

const stExplain = explainGenerators({
  concept: ST,
  truths: [
    'A stack only lets you add or remove at one end: the top.',
    'The last item pushed is the first popped (LIFO).',
    'An array-backed stack pushes at base + top, so nothing ever shifts.',
    'Push and pop are O(1).',
    'Stacks match "most recent first" problems: undo, matching brackets, function calls.',
  ],
  myths: [
    { text: 'Pop removes the oldest item.', why: 'That’s a queue. A stack removes the newest.' },
    { text: 'Popping shifts the other items down.', why: 'Only top changes. Items stay where they are.' },
    { text: 'A stack is a special kind of memory.', why: 'It’s an ordinary array (or list) with a rule about which end you use.' },
    { text: 'You can read any item in a stack as cheaply as the top.', why: 'The *interface* only offers the top. That restriction is the whole point.' },
  ],
  chains: [
    {
      prompt: 'Why are push and pop O(1) with an array?',
      steps: ['All activity happens at one end.', 'That end is at base + top, a computed address.', 'Adding or removing there never disturbs the other items.', 'So each operation is one write/read and a counter update.'],
    },
    {
      prompt: 'Why does a stack check brackets correctly?',
      steps: ['A closer must match the most recently opened bracket.', 'The most recent opener is the top of the stack.', 'So pop and compare on every closer.', 'Leftovers or mismatches mean unbalanced.'],
    },
  ],
  summary: {
    best: 'A stack is a pile of plates: you only put on or take off the top, so the last one added is the first one out.',
    others: [
      { text: 'A stack is a LIFO data structure.', why: 'The acronym, not the idea.' },
      { text: 'A stack stores things in order.', why: 'So does everything. Misses the one-end rule.' },
      { text: 'A stack is used for recursion.', why: 'One use, not what it is.' },
    ],
  },
});

const rebuildStack = (): Card => {
  let ops: Op[];
  let r: ReturnType<typeof runStack>;
  do {
    ops = randomOps(randInt(6, 8), distinctInts(6, 10, 99));
    r = runStack(ops);
  } while (r.st.length < 2 || r.popped.length < 1);
  return sequenceRebuild(ST, `From a blank slate: run ${fmtOps(ops, 'push', 'pop')} in your head, then write the stack's contents from BOTTOM to TOP.`, r.st, r.popped, `Bottom → top: ${fmtArray(r.st)}. Popped along the way: ${r.popped.join(', ')}.`, 'Your stack (bottom → top)');
};

const stackOps: Concept['playground'] = {
  initial: () => stackScene(4, 8, [12, 5], false),
  guide: [
    { do: 'Push 7, then push 8.', see: 'Each push goes on top (the next free slot above the others). 1 write each.' },
    { do: 'Pop.', see: 'You get 8, the last thing you pushed. A stack always gives back the newest item first, like a pile of plates.' },
    { do: 'Pop until it’s empty.', see: 'Items come out in reverse order of going in. Nothing ever slides; only the “top” marker moves.' },
  ],
  ops: [
    {
      label: 'Push',
      inputs: ['value'],
      run: (s, [v]) => {
        const sv = s.views[0] as Extract<View, { type: 'stack' }>;
        if (sv.top >= sv.capacity) return { error: 'Stack overflow! The block is full.' };
        const n = cloneScene(s);
        n.cells![sv.base + sv.top] = { v, kind: 'val', label: `[${sv.top}]` };
        (n.views[0] as typeof sv).top++;
        n.highlight = [m(sv.base + sv.top)];
        return { scene: n, touches: 1, note: `Wrote ${v} at base + ${sv.top}. 1 touch.` };
      },
    },
    {
      label: 'Pop',
      run: (s) => {
        const sv = s.views[0] as Extract<View, { type: 'stack' }>;
        if (sv.top === 0) return { error: 'Stack underflow: nothing to pop.' };
        const n = cloneScene(s);
        const a = sv.base + sv.top - 1;
        n.cells![a] = { v: s.cells![a].v, kind: 'free', label: `[${sv.top - 1}]` };
        (n.views[0] as typeof sv).top--;
        n.highlight = [m(a)];
        return { scene: n, touches: 1, note: `Popped ${s.cells![a].v}. The value is still in memory, but it's past top, so it's garbage now.` };
      },
    },
  ],
};

export const stackConcept: Concept = {
  id: ST,
  title: 'Stack',
  tier: 3,
  prereqs: ['dynamic-array'],
  tagline: 'Last in, first out. One end only.',
  hook: {
    problem: 'Your editor needs Undo. Each Undo must reverse the most recent change, then the one before that, and so on.',
    question: 'How should the change history be stored?',
    options: [
      { text: 'A pile where you only add and remove at the top.', good: true, feedback: 'Yes. The newest change is always on top. That’s a stack.' },
      { text: 'A line where the oldest change leaves first.', feedback: 'Then Undo would reverse your *first* edit. Wrong end.' },
      { text: 'A sorted list by time, searched each Undo.', feedback: 'Works, but searching is pointless: you always want the newest.' },
    ],
  },
  lens: {
    layout: 'An array (usually dynamic) plus a top counter. Items sit at base + 0 .. base + top − 1.',
    invariant: 'Only the top is added or removed. The newest item is always at the top.',
    payoff: 'Push, pop and peek in O(1). Nothing ever shifts.',
    price: 'No access to anything but the top. That restriction is by design.',
  },
  playground: stackOps,
  generators: {
    predict: [predictStackOps, predictBrackets],
    simulate: [simulateStack],
    count: [countReverse, countPop, growthStack],
    explain: stExplain,
    rebuild: [rebuildStack],
  },
};

// =====================================================================
// Queue
// =====================================================================

const QU = 'queue';

const predictQueueOps = (): Card => {
  let ops: Op[];
  let r: ReturnType<typeof runQueue>;
  do {
    ops = randomOps(randInt(6, 8), distinctInts(6, 10, 99));
    r = runQueue(ops);
  } while (r.q.length < 1 || r.out.length < 1);
  const s = runStack(ops);
  return {
    concept: QU,
    type: 'predict',
    prompt: `Empty queue. Run: ${fmtOps(ops, 'enqueue', 'dequeue')}.\n\nIn what order did the dequeues return items?`,
    body: {
      kind: 'choice',
      options: options({ text: r.out.join(', '), why: 'Each dequeue returned the oldest item still waiting.' }, [
        { text: s.popped.join(', '), why: 'That’s stack behaviour: newest first.' },
        { text: [...r.out].reverse().join(', '), why: 'Right items, reversed order.' },
        { text: r.q.join(', ') || '(nothing)', why: 'Those are the items still waiting, not the ones that left.' },
      ]),
    },
    explain: `First in, first out: items leave in the order they arrived. What's still waiting: ${fmtArray(r.q)}.`,
  };
};

const predictNaiveDequeue = (): Card => {
  const n = randInt(5, 60);
  return {
    concept: QU,
    type: 'predict',
    prompt: `A naive queue keeps items in an array with the front at index 0. Dequeue removes arr[0] and slides everything left. With ${n} items waiting, how many items move on one dequeue?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        n - 1,
        [
          { value: 1, why: 'Every remaining item slides left one slot.' },
          { value: n, why: 'The removed item doesn’t move. It leaves.' },
          { value: 0, why: 'That would need a moving front index. This version slides.' },
        ],
        'All the others slide left.',
      ),
    },
    explain: `${n - 1} moves per dequeue: O(n). Fixes: keep a moving front index (a circular buffer), or use a linked list with head and tail pointers.`,
  };
};

const simulateServe = (): Card => {
  const arrivals = distinctInts(randInt(5, 6), 10, 99);
  const leaves = randInt(3, arrivals.length - 1);
  const scene: Scene = { views: [{ type: 'row', key: 'q', items: arrivals, labels: arrivals.map((_, i) => `#${i + 1}`), title: 'Customers in arrival order' }] };
  const frames = [scene];
  for (let i = 0; i < leaves; i++) frames.push({ ...cloneScene(scene), highlight: Array.from({ length: i + 1 }, (_, k) => `q:${k}`) });
  return {
    concept: QU,
    type: 'simulate',
    prompt: `Customers joined a queue in the order shown. The cashier calls dequeue ${leaves} times. Click the customers in the order they're served.`,
    scene,
    body: {
      kind: 'click',
      expected: Array.from({ length: leaves }, (_, i) => `q:${i}`),
      frames,
      wrongHint: () => 'Who has been waiting the longest?',
    },
    explain: 'Served in exactly the order they arrived. That fairness is the queue’s whole promise.',
  };
};

const orderEnqueue = (): Card => ({
  concept: QU,
  type: 'simulate',
  prompt: 'A linked-list queue has head (front) and tail (back) pointers, and it isn’t empty. Enqueue a new node N. Put the steps in order.',
  body: { kind: 'order', steps: ['Create N with N.next = ∅.', 'tail.next = N (old last node points at N).', 'tail = N (N is the new back).'] },
  explain: 'The tail pointer means you never walk the list. Enqueue is O(1).',
});

const orderDequeue = (): Card => ({
  concept: QU,
  type: 'simulate',
  prompt: 'Dequeue from a linked-list queue (head = front). Put the steps in order.',
  body: { kind: 'order', steps: ['Save x = head.value.', 'head = head.next.', 'If head is now ∅, set tail = ∅ too.', 'Return x.'] },
  explain: 'Save the value before moving head, and don’t forget the empty case: tail must not point at a removed node.',
});

const countQueue = (): Card => {
  const n = randInt(5, 40);
  return {
    concept: QU,
    type: 'count',
    prompt: `Naive array queue (front at index 0, dequeue slides everything left). Start with ${n} items and dequeue them all. How many slides in total?`,
    body: { kind: 'number', answer: (n * (n - 1)) / 2, unit: 'moves' },
    explain: `${n - 1} + ${n - 2} + … + 0 = ${(n * (n - 1)) / 2}. O(n²) just to empty it. A linked or circular queue does it with 0 slides.`,
  };
};

const growthQueue = (): Card =>
  pick([
    () => growthCard(QU, 'dequeue from a naive array queue', (n) => n - 1, 2, 'Every remaining item slides.'),
    () => growthCard(QU, 'dequeue from a linked-list queue', () => 2, 0, 'Read head, move head. Constant.'),
  ])();

const quExplain = explainGenerators({
  concept: QU,
  truths: [
    'A queue adds at the back and removes from the front.',
    'Items leave in the order they arrived (FIFO).',
    'A linked list with head and tail pointers makes both ends O(1).',
    'Sliding everything left on each dequeue makes it O(n); avoid that.',
  ],
  myths: [
    { text: 'A queue removes the newest item.', why: 'That’s a stack. A queue removes the oldest.' },
    { text: 'A queue must shift all items when one leaves.', why: 'Only in the naive version. Move the front pointer instead.' },
    { text: 'A queue needs to be sorted.', why: 'Arrival order is the only order that matters.' },
  ],
  chains: [
    {
      prompt: 'Why does a linked-list queue need a tail pointer?',
      steps: ['Enqueue adds at the back.', 'Without a tail pointer, finding the back means walking every node.', 'With it, the back is one step away.', 'So enqueue becomes O(1).'],
    },
  ],
  summary: {
    best: 'A queue is a line at a shop: people join at the back and are served from the front, so whoever came first leaves first.',
    others: [
      { text: 'A queue is a FIFO data structure.', why: 'The acronym, not the idea.' },
      { text: 'A queue is a list of tasks.', why: 'Doesn’t say which end things leave from.' },
      { text: 'A queue is a stack in reverse.', why: 'Catchy, but misleading about how it works.' },
    ],
  },
});

const rebuildQueue = (): Card => {
  let ops: Op[];
  let r: ReturnType<typeof runQueue>;
  do {
    ops = randomOps(randInt(6, 8), distinctInts(6, 10, 99));
    r = runQueue(ops);
  } while (r.q.length < 2 || r.out.length < 1);
  return sequenceRebuild(QU, `From a blank slate: run ${fmtOps(ops, 'enqueue', 'dequeue')} in your head, then write what's waiting from FRONT to BACK.`, r.q, r.out, `Front → back: ${fmtArray(r.q)}. Already served: ${r.out.join(', ')}.`, 'Your queue (front → back)');
};

export const queueConcept: Concept = {
  id: QU,
  title: 'Queue',
  tier: 3,
  prereqs: ['linked-list'],
  tagline: 'First in, first out. Fair lines.',
  hook: {
    problem: 'A printer receives jobs from many people. They should print in the order they were sent.',
    question: 'How should waiting jobs be stored?',
    options: [
      { text: 'A pile where the newest job is on top.', feedback: 'Then the latest job jumps the line. Unfair.' },
      { text: 'A line: add at the back, take from the front.', good: true, feedback: 'Yes. Oldest out first. That’s a queue.' },
      { text: 'Pick a random job each time.', feedback: 'Someone could wait forever.' },
    ],
  },
  lens: {
    layout: 'Commonly a linked list with head (front) and tail (back) pointers, or a circular buffer.',
    invariant: 'Items leave in exactly the order they arrived.',
    payoff: 'Enqueue and dequeue in O(1) with the right layout.',
    price: 'Only the front is accessible. A naive array layout makes dequeue O(n).',
  },
  generators: {
    predict: [predictQueueOps, predictNaiveDequeue],
    simulate: [simulateServe, orderEnqueue, orderDequeue],
    count: [countQueue, growthQueue],
    explain: quExplain,
    rebuild: [rebuildQueue],
  },
};

// =====================================================================
// Circular buffer
// =====================================================================

const CB = 'circular-buffer';

function ringScene(base: number, cap: number, head: number, items: number[], garbage = true): Scene {
  let cells: Cell[] = emptyMemory();
  for (let k = 0; k < cap; k++) cells[base + k] = { v: null, kind: 'free', label: `[${k}]` };
  items.forEach((v, i) => (cells[base + ((head + i) % cap)] = { v, kind: 'val', label: `[${(head + i) % cap}]` }));
  if (garbage) cells = sprinkleGarbage(cells, 0.25);
  return { cells, views: [{ type: 'queue', base, capacity: cap, head, size: items.length }, { type: 'memory' }], markers: [{ name: 'base', addr: base }] };
}

const predictTail = (): Card => {
  const cap = randInt(5, 10);
  const head = randInt(1, cap - 1);
  const size = randInt(cap - head, cap - 1);
  const tail = (head + size) % cap;
  return {
    concept: CB,
    type: 'predict',
    prompt: `A circular buffer has capacity ${cap}, head at index ${head}, and ${size} items. At which index does the next enqueue write?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        tail,
        [
          { value: head + size, why: `Index ${head + size} is past the end (last index is ${cap - 1}). Wrap with mod ${cap}.` },
          { value: size, why: 'That ignores where head is.' },
          { value: (head - 1 + cap) % cap, why: 'That’s just before the head. Enqueue goes after the last item.' },
        ],
        '(head + size) mod capacity',
      ),
    },
    explain: `(${head} + ${size}) mod ${cap} = ${tail}. The buffer wraps around: the slot after the last index is index 0.`,
  };
};

const predictAfterDequeue = (): Card => {
  const cap = randInt(5, 9);
  const head = cap - 1;
  const size = randInt(2, cap - 1);
  return {
    concept: CB,
    type: 'predict',
    prompt: `Capacity ${cap}, head = ${head}, size = ${size}. After one dequeue, what are head and size?`,
    body: {
      kind: 'choice',
      options: options({ text: `head = 0, size = ${size - 1}`, why: `head moves to (${head} + 1) mod ${cap} = 0.` }, [
        { text: `head = ${head + 1}, size = ${size - 1}`, why: `There is no index ${head + 1}. Wrap around to 0.` },
        { text: `head = ${head}, size = ${size - 1}`, why: 'The head must move past the item just removed.' },
        { text: `head = 0, size = ${size}`, why: 'One item left, so size shrinks.' },
      ]),
    },
    explain: 'Dequeue reads buffer[head], then head = (head + 1) mod capacity. No item moves; only the head index does.',
  };
};

const simulateRing = (): Card => {
  const cap = randInt(5, 6);
  const base = randInt(2, 24 - cap - 1);
  const head = randInt(2, cap - 1);
  const start = distinctInts(randInt(1, 2), 10, 99);
  const ops = randomOps(randInt(5, 6), distinctInts(6, 100, 199));
  let size = start.length;
  const safe = ops.filter((o) => (o.kind === 'push' ? size < cap && ++size > 0 : size > 0 && size-- > 0));
  const s0 = ringScene(base, cap, head, start);
  const frames = [s0];
  const expected: string[] = [];
  let cur = s0;
  for (const o of safe) {
    cur = cloneScene(cur);
    const qv = cur.views[0] as Extract<View, { type: 'queue' }>;
    if (o.kind === 'push') {
      const idx = (qv.head + qv.size) % cap;
      cur.cells![base + idx] = { v: o.v, kind: 'val', label: `[${idx}]` };
      qv.size++;
      expected.push(m(base + idx));
    } else {
      const idx = qv.head;
      cur.cells![base + idx] = { v: cur.cells![base + idx].v, kind: 'free', label: `[${idx}]` };
      qv.head = (qv.head + 1) % cap;
      qv.size--;
      expected.push(m(base + idx));
    }
    cur.highlight = [expected[expected.length - 1]];
    frames.push(cur);
  }
  return {
    concept: CB,
    type: 'simulate',
    prompt: `Run ${fmtOps(safe, 'enqueue', 'dequeue')} on this circular buffer. For each operation, click the one slot it touches. Watch for the wrap-around.`,
    scene: s0,
    body: {
      kind: 'click',
      expected,
      frames,
      wrongHint: (step) => (safe[step].kind === 'push' ? 'Enqueue writes at (head + size) mod capacity: just after the last item, wrapping to [0].' : 'Dequeue reads at head, the oldest item.'),
    },
    explain: 'Every operation touches one slot. Items never move; head and size do the work, wrapping with mod.',
  };
};

const countTailIdx = (): Card => {
  const cap = randInt(6, 20);
  const head = randInt(0, cap - 1);
  const size = randInt(1, cap - 1);
  return {
    concept: CB,
    type: 'count',
    prompt: `Capacity ${cap}, head ${head}, size ${size}. What index holds the LAST item (the newest)?`,
    body: { kind: 'number', answer: (head + size - 1) % cap },
    explain: `(head + size − 1) mod capacity = (${head} + ${size} − 1) mod ${cap} = ${(head + size - 1) % cap}.`,
  };
};

const growthRing = (): Card => growthCard(CB, 'dequeue from a circular buffer', () => 1, 0, 'Read one slot, bump the head index. Nothing slides.');

const cbExplain = explainGenerators({
  concept: CB,
  truths: [
    'A circular buffer is a fixed array where the index wraps from the end back to 0.',
    'It stores a head index and a size (or head and tail).',
    'Enqueue writes at (head + size) mod capacity.',
    'Dequeue reads at head and moves head forward; nothing slides.',
    'It has a fixed capacity; when full, you must refuse, overwrite, or grow.',
  ],
  myths: [
    { text: 'Dequeuing shifts the remaining items to the front.', why: 'Only head moves. Items stay put.' },
    { text: 'The buffer is physically circular in memory.', why: 'It’s an ordinary array. mod makes the ends meet.' },
    { text: 'When the tail reaches the last index, the buffer is full.', why: 'Free slots may exist at the start. Tail wraps to 0.' },
  ],
  chains: [
    {
      prompt: 'Why is dequeue O(1) in a circular buffer but O(n) in a naive array queue?',
      steps: ['The naive queue keeps the front fixed at index 0.', 'So removing the front forces everything to slide.', 'A circular buffer lets the front index move instead.', 'Moving an index is one step: O(1).'],
    },
  ],
  summary: {
    best: 'It’s a queue in a fixed row of slots where the front and back chase each other around, wrapping from the last slot back to the first.',
    others: [
      { text: 'A circular buffer is a ring-shaped data structure.', why: 'Memory isn’t ring-shaped; mod is the trick.' },
      { text: 'It’s a buffer that is circular.', why: 'Circular definition.' },
      { text: 'It’s used for streaming data.', why: 'A use, not a mechanism.' },
    ],
  },
});

const ringOps: Concept['playground'] = {
  initial: () => ringScene(6, 6, 3, [12, 5], false),
  guide: [
    { do: 'Enqueue 1, 2, 3, 4.', see: 'Items go in after the last one. When they reach the end of the row, the next one wraps round to slot [0].' },
    { do: 'Dequeue twice.', see: 'You get 12, then 5: the oldest items first. Nothing slides forward; the “head” marker just moves along.' },
    { do: 'Enqueue until it says Full.', see: 'The row has a fixed size. Free slots at the start get reused by wrapping round, so no space is wasted.' },
  ],
  ops: [
    {
      label: 'Enqueue',
      inputs: ['value'],
      run: (s, [v]) => {
        const qv = s.views[0] as Extract<View, { type: 'queue' }>;
        if (qv.size === qv.capacity) return { error: 'Full: all slots are in use.' };
        const n = cloneScene(s);
        const nq = n.views[0] as typeof qv;
        const idx = (qv.head + qv.size) % qv.capacity;
        n.cells![qv.base + idx] = { v, kind: 'val', label: `[${idx}]` };
        nq.size++;
        n.highlight = [m(qv.base + idx)];
        return { scene: n, touches: 1, note: `Wrote ${v} at (${qv.head} + ${qv.size}) mod ${qv.capacity} = ${idx}. 1 touch.` };
      },
    },
    {
      label: 'Dequeue',
      run: (s) => {
        const qv = s.views[0] as Extract<View, { type: 'queue' }>;
        if (qv.size === 0) return { error: 'Empty.' };
        const n = cloneScene(s);
        const nq = n.views[0] as typeof qv;
        const a = qv.base + qv.head;
        n.cells![a] = { v: s.cells![a].v, kind: 'free', label: `[${qv.head}]` };
        nq.head = (qv.head + 1) % qv.capacity;
        nq.size--;
        n.highlight = [m(a)];
        return { scene: n, touches: 1, note: `Took ${s.cells![a].v} from index ${qv.head}; head → ${nq.head}. Nothing slid.` };
      },
    },
  ],
};

export const circularBufferConcept: Concept = {
  id: CB,
  title: 'Circular Buffer',
  tier: 3,
  prereqs: [QU, 'static-array'],
  tagline: 'A queue in a fixed array that wraps around.',
  hook: {
    problem: 'An array queue that slides every item left on each dequeue is O(n). A linked queue fixes that, but allocates a node for every item.',
    question: 'How can an array-based queue avoid sliding?',
    options: [
      { text: 'Let the front index move forward, and wrap indexes past the end back to 0.', good: true, feedback: 'Yes. Front and back chase each other around the array, and mod makes the ends meet.' },
      { text: 'Only compact the array occasionally.', feedback: 'Better, but still periodic O(n) work, and wasted slots in between.' },
      { text: 'Use a much bigger array.', feedback: 'Delays the problem; doesn’t remove the sliding.' },
    ],
  },
  lens: {
    layout: 'A fixed array plus head (front index) and size. Slot after the last index is index 0.',
    invariant: 'The items are the `size` slots starting at head, wrapping with mod capacity, in arrival order.',
    payoff: 'O(1) enqueue and dequeue, no allocation per item, cache-friendly.',
    price: 'Fixed capacity: full means refuse, overwrite the oldest, or grow (copy).',
  },
  playground: ringOps,
  generators: {
    predict: [predictTail, predictAfterDequeue],
    simulate: [simulateRing],
    count: [countTailIdx, growthRing],
    explain: cbExplain,
  },
};

// =====================================================================
// Deque
// =====================================================================

const DQ = 'deque';

type DOp = 'pushFront' | 'pushBack' | 'popFront' | 'popBack';

function randomDequeRun() {
  const vals = distinctInts(6, 10, 99);
  const d: number[] = [];
  const ops: string[] = [];
  let vi = 0;
  const count = randInt(6, 8);
  for (let i = 0; i < count && vi < vals.length; i++) {
    const op: DOp = d.length > 1 ? pick<DOp>(['pushFront', 'pushBack', 'popFront', 'popBack']) : pick<DOp>(['pushFront', 'pushBack']);
    if (op === 'pushFront') {
      d.unshift(vals[vi]);
      ops.push(`pushFront(${vals[vi++]})`);
    } else if (op === 'pushBack') {
      d.push(vals[vi]);
      ops.push(`pushBack(${vals[vi++]})`);
    } else if (op === 'popFront') {
      d.shift();
      ops.push('popFront()');
    } else {
      d.pop();
      ops.push('popBack()');
    }
  }
  return { vals, d, ops, vi };
}

const predictDequeOps = (): Card => {
  let run = randomDequeRun();
  while (run.d.length < 2) run = randomDequeRun();
  const { vals, d, ops, vi } = run;
  const allBack = vals.slice(0, vi);
  return {
    concept: DQ,
    type: 'predict',
    prompt: `Empty deque. Run: ${ops.join(', ')}.\n\nWhat's in it, front → back?`,
    body: {
      kind: 'choice',
      options: options({ text: fmtArray(d), why: 'Each operation acted on the end it names.' }, [
        { text: fmtArray([...d].reverse()), why: 'Listed back → front.' },
        { text: fmtArray(allBack.slice(-d.length)), why: 'That treats every push as pushBack.' },
        { text: fmtArray(shuffle(d)), why: 'Trace each end separately.' },
      ]),
    },
    explain: `Front → back: ${fmtArray(d)}. A deque is two stacks' worth of freedom: both ends open.`,
  };
};

const predictRestrict = (): Card => {
  const pair = pick([
    { ops: 'pushBack and popBack', ans: 'A stack', why: 'Same end in and out: last in, first out.' },
    { ops: 'pushBack and popFront', ans: 'A queue', why: 'In at the back, out at the front: first in, first out.' },
    { ops: 'pushFront and popFront', ans: 'A stack', why: 'Same end in and out: last in, first out.' },
    { ops: 'pushFront and popBack', ans: 'A queue', why: 'In at one end, out at the other: first in, first out.' },
  ]);
  return {
    concept: DQ,
    type: 'predict',
    prompt: `If you only ever use ${pair.ops} on a deque, what does it behave like?`,
    body: {
      kind: 'choice',
      options: options({ text: pair.ans, why: pair.why }, [
        { text: pair.ans === 'A stack' ? 'A queue' : 'A stack', why: 'Check whether items leave from the same end they entered.' },
        { text: 'A sorted list', why: 'Nothing here sorts.' },
        { text: 'A priority queue', why: 'No priorities involved: only position.' },
      ]),
    },
    explain: 'A deque generalises both. Use one end for both operations → stack; opposite ends → queue.',
  };
};

const simulateDeque = (): Card => {
  const cap = 6;
  const base = randInt(2, 24 - cap - 1);
  const head = randInt(1, 3);
  const start = distinctInts(2, 10, 99);
  const s0 = ringScene(base, cap, head, start);
  (s0.views[0] as Extract<View, { type: 'queue' }>).title = 'Deque in a circular buffer';
  const ops: DOp[] = shuffle<DOp>(['pushFront', 'pushFront', 'pushBack', pick<DOp>(['popFront', 'popBack'])]);
  const vals = distinctInts(4, 100, 199);
  const frames = [s0];
  const expected: string[] = [];
  let cur = s0;
  let vi = 0;
  const labels: string[] = [];
  for (const op of ops) {
    cur = cloneScene(cur);
    const q = cur.views[0] as Extract<View, { type: 'queue' }>;
    let idx: number;
    if (op === 'pushFront') {
      q.head = (q.head - 1 + cap) % cap;
      idx = q.head;
      cur.cells![base + idx] = { v: vals[vi], kind: 'val', label: `[${idx}]` };
      q.size++;
      labels.push(`pushFront(${vals[vi++]})`);
    } else if (op === 'pushBack') {
      idx = (q.head + q.size) % cap;
      cur.cells![base + idx] = { v: vals[vi], kind: 'val', label: `[${idx}]` };
      q.size++;
      labels.push(`pushBack(${vals[vi++]})`);
    } else if (op === 'popFront') {
      idx = q.head;
      cur.cells![base + idx] = { v: cur.cells![base + idx].v, kind: 'free', label: `[${idx}]` };
      q.head = (q.head + 1) % cap;
      q.size--;
      labels.push('popFront()');
    } else {
      idx = (q.head + q.size - 1) % cap;
      cur.cells![base + idx] = { v: cur.cells![base + idx].v, kind: 'free', label: `[${idx}]` };
      q.size--;
      labels.push('popBack()');
    }
    expected.push(m(base + idx));
    cur.highlight = [m(base + idx)];
    frames.push(cur);
  }
  return {
    concept: DQ,
    type: 'simulate',
    prompt: `Run ${labels.join(', ')}. For each, click the slot it touches. pushFront moves head backwards (wrapping).`,
    scene: s0,
    body: {
      kind: 'click',
      expected,
      frames,
      wrongHint: (step) =>
        ({
          pushFront: 'pushFront writes just *before* head: (head − 1 + capacity) mod capacity.',
          pushBack: 'pushBack writes just after the last item: (head + size) mod capacity.',
          popFront: 'popFront takes the item at head.',
          popBack: 'popBack takes the last item: (head + size − 1) mod capacity.',
        })[ops[step]],
    },
    explain: 'Both ends move by ±1 with wrap-around. Every operation is one slot: O(1).',
  };
};

const countFrontIdx = (): Card => {
  const cap = randInt(6, 16);
  const head = randInt(0, 2);
  return {
    concept: DQ,
    type: 'count',
    prompt: `A deque in a circular buffer of capacity ${cap} has head = ${head}. pushFront writes at which index?`,
    body: { kind: 'number', answer: (head - 1 + cap) % cap },
    explain: `(head − 1 + capacity) mod capacity = ${(head - 1 + cap) % cap}. Adding capacity before mod keeps the index from going negative.`,
  };
};

const growthDeque = (): Card => growthCard(DQ, 'pushFront on a deque of n items', () => 1, 0, 'Move head back one slot and write. No shifting, unlike inserting at index 0 of an array.');

const dqExplain = explainGenerators({
  concept: DQ,
  truths: [
    'A deque allows adding and removing at both ends.',
    'Using only one end makes it a stack; using opposite ends makes it a queue.',
    'A circular buffer implements it: pushFront moves head back, pushBack writes after the last item.',
    'All four end operations are O(1).',
  ],
  myths: [
    { text: 'pushFront shifts every item right.', why: 'In a circular buffer, head just moves back one slot.' },
    { text: 'A deque allows O(1) insertion in the middle.', why: 'Only the two ends are cheap.' },
    { text: 'A deque is a special kind of stack only.', why: 'It’s both a stack and a queue, depending on which ends you use.' },
  ],
  chains: [
    {
      prompt: 'Why is pushFront O(1) in a circular-buffer deque?',
      steps: ['The front is marked by the head index, not by index 0.', 'Moving head back one slot (with wrap) opens a free slot.', 'The new item is written there.', 'No other item moves.'],
    },
  ],
  summary: {
    best: 'A deque is a line you can join or leave at either end, so it can act like a stack or a queue.',
    others: [
      { text: 'A deque is a double-ended queue.', why: 'Just expands the name.' },
      { text: 'A deque is a list.', why: 'Lists also allow the middle; the point is both ends.' },
      { text: 'A deque is faster than a queue.', why: 'Same speed; it’s about flexibility.' },
    ],
  },
});

const rebuildDeque = (): Card => {
  let run = randomDequeRun();
  while (run.d.length < 3) run = randomDequeRun();
  const gone = run.vals.slice(0, run.vi).filter((v) => !run.d.includes(v));
  return sequenceRebuild(DQ, `From a blank slate: run ${run.ops.join(', ')}, then write the deque from FRONT to BACK.`, run.d, gone, `Front → back: ${fmtArray(run.d)}.`, 'Your deque (front → back)');
};

export const dequeConcept: Concept = {
  id: DQ,
  title: 'Deque',
  tier: 3,
  prereqs: [ST, CB],
  tagline: 'Both ends open.',
  hook: {
    problem: 'A browser keeps your last 50 pages: new pages go on one end, and when there are too many, the oldest falls off the other end. You also need "back", which removes the newest.',
    question: 'What structure handles adding at one end and removing at both?',
    options: [
      { text: 'A stack.', feedback: 'A stack can’t drop the oldest item from the bottom.' },
      { text: 'A queue.', feedback: 'A queue can’t remove the newest item for "back".' },
      { text: 'Something with both ends open.', good: true, feedback: 'Yes: a double-ended queue, or deque. Both ends support add and remove in O(1).' },
    ],
  },
  lens: {
    layout: 'Usually a circular buffer (or a doubly linked list) with front and back positions.',
    invariant: 'Items stay in order between front and back; operations only touch the ends.',
    payoff: 'O(1) push and pop at both ends. It can be a stack, a queue, or a sliding window.',
    price: 'Middle access or insertion is not cheap. Circular buffers need a grow when full.',
  },
  generators: {
    predict: [predictDequeOps, predictRestrict],
    simulate: [simulateDeque],
    count: [countFrontIdx, growthDeque],
    explain: dqExplain,
    rebuild: [rebuildDeque],
  },
};

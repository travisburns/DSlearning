import type { Card, Cell, Concept, Scene, View } from '../engine/types';
import { MEM_SIZE, cloneScene, emptyMemory, m, scatterNodes, sprinkleGarbage, walkList, writeDNode, writeNode } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions, options } from './helpers';

const fmt = (xs: (number | string)[], end = '∅') => `head → ${xs.join(' → ')} → ${end}`;

// ---------- Scene builders ----------

/** Singly list: head pointer in cell 0, nodes [val, next] scattered from cell 2. */
function singly(vals: number[], garbage = true): { scene: Scene; addrs: number[] } {
  let cells: Cell[] = emptyMemory();
  const addrs = scatterNodes(vals.length, 2, 2);
  vals.forEach((v, i) => writeNode(cells, addrs[i], v, i + 1 < vals.length ? addrs[i + 1] : null));
  cells[0] = { v: addrs[0] ?? null, kind: 'ptr', label: 'head' };
  if (garbage) cells = sprinkleGarbage(cells, 0.25);
  return { scene: { cells, views: [{ type: 'list', head: addrs[0] ?? null }, { type: 'memory' }], markers: [{ name: 'head', addr: 0 }] }, addrs };
}

/** Doubly list: head in cell 0, tail in cell 1, nodes [val, prev, next] scattered from cell 2. */
function doubly(vals: number[]): { scene: Scene; addrs: number[] } {
  let cells: Cell[] = emptyMemory();
  const addrs = scatterNodes(vals.length, 3, 2);
  vals.forEach((v, i) => writeDNode(cells, addrs[i], v, i > 0 ? addrs[i - 1] : null, i + 1 < vals.length ? addrs[i + 1] : null));
  cells[0] = { v: addrs[0], kind: 'ptr', label: 'head' };
  cells[1] = { v: addrs[addrs.length - 1], kind: 'ptr', label: 'tail' };
  cells = sprinkleGarbage(cells, 0.25);
  return {
    scene: {
      cells,
      views: [{ type: 'list', head: addrs[0], doubly: true }, { type: 'memory' }],
      markers: [
        { name: 'head', addr: 0 },
        { name: 'tail', addr: 1 },
      ],
    },
    addrs,
  };
}

/** Circular list: tail pointer in cell 0, last node's next points back to the first. */
function circular(vals: number[]): { scene: Scene; addrs: number[] } {
  let cells: Cell[] = emptyMemory();
  const addrs = scatterNodes(vals.length, 2, 2);
  vals.forEach((v, i) => writeNode(cells, addrs[i], v, addrs[(i + 1) % vals.length]));
  cells[0] = { v: addrs[addrs.length - 1], kind: 'ptr', label: 'tail' };
  cells = sprinkleGarbage(cells, 0.25);
  return {
    scene: { cells, views: [{ type: 'list', head: addrs[0], circular: true, title: 'Circular linked list (tail.next is the first node)' }, { type: 'memory' }], markers: [{ name: 'tail', addr: 0 }] },
    addrs,
  };
}

const vals = (n: number) => distinctInts(n, 10, 99);

/** Just the picture of a singly list, for cards about pointer logic rather than memory. */
const listPicture = (xs: number[]): Scene => {
  const { scene } = singly(xs, false);
  return { ...scene, views: [scene.views[0]] };
};

// =====================================================================
// Singly linked list
// =====================================================================

const LL = 'linked-list';

const predictInsertAfter = (): Card => {
  const xs = vals(randInt(4, 5));
  const k = randInt(0, xs.length - 2);
  const [v] = distinctInts(1, 100, 199);
  const correct = [...xs.slice(0, k + 1), v, ...xs.slice(k + 1)];
  return {
    concept: LL,
    type: 'predict',
    prompt: `List: ${fmt(xs)}. To insert ${v} after ${xs[k]}, someone runs:\n\n  1. N.next = A.next\n  2. A.next = N\n\n(A is the node holding ${xs[k]}, N the new node.) What's the list now?`,
    scene: listPicture(xs),
    body: {
      kind: 'choice',
      options: options({ text: fmt(correct), why: 'N first grabs the rest of the list, then A points at N. Nothing is lost.' }, [
        { text: fmt([...xs.slice(0, k + 1), v]), why: 'That would happen if N.next were left empty. Step 1 kept the rest attached.' },
        { text: fmt([...xs.slice(0, k), v, ...xs.slice(k)]), why: 'That inserts *before* A. A.next = N puts N after A.' },
        { text: fmt([...xs, v]), why: 'Only the pointers around A changed. Nothing touched the end.' },
      ]),
    },
    explain: `Two pointer writes, no shifting. The order matters: N.next must grab A.next *before* A.next is overwritten.`,
  };
};

const predictWrongOrder = (): Card => {
  const xs = vals(randInt(4, 5));
  const k = randInt(0, xs.length - 3);
  const [v] = distinctInts(1, 100, 199);
  return {
    concept: LL,
    type: 'predict',
    prompt: `List: ${fmt(xs)}. Someone inserts ${v} after ${xs[k]} but does the steps in the WRONG order:\n\n  1. A.next = N\n  2. N.next = A.next\n\nWhat happens?`,
    scene: listPicture(xs),
    body: {
      kind: 'choice',
      options: shuffle([
        { text: `N points to itself; ${xs.slice(k + 1).join(', ')} are lost`, correct: true, why: 'After step 1, A.next is N. So step 2 sets N.next = N: a loop, and the only pointer to the rest is gone.' },
        { text: 'It works the same either way', correct: false, why: 'Step 1 destroys the only pointer to the rest of the list.' },
        { text: `${v} ends up at the end of the list`, correct: false, why: 'Nothing points to the old tail anymore.' },
        { text: `${xs[k]} is removed`, correct: false, why: `${xs[k]} is still there; it's everything *after* it that's lost.` },
      ]),
    },
    explain: `Writing destroys. A.next was the only way to reach ${xs[k + 1]}. Overwrite it first, and it's gone. Always save before you overwrite.`,
  };
};

const predictDeleteAfter = (): Card => {
  const xs = vals(randInt(4, 6));
  const k = randInt(0, xs.length - 2);
  return {
    concept: LL,
    type: 'predict',
    prompt: `List: ${fmt(xs)}. P is the node holding ${xs[k]}. We run: P.next = P.next.next. What's the list now?`,
    scene: listPicture(xs),
    body: {
      kind: 'choice',
      options: options({ text: fmt([...xs.slice(0, k + 1), ...xs.slice(k + 2)]), why: `P now skips over ${xs[k + 1]}, so it's unreachable.` }, [
        { text: fmt([...xs.slice(0, k), ...xs.slice(k + 1)]), why: 'P itself stays. It’s P’s *next* that gets skipped.' },
        { text: fmt(xs.slice(0, k + 1)), why: 'P.next.next is the node after the next one, not nothing.' },
        { text: fmt(xs), why: 'P.next changed, so the list changed.' },
      ]),
    },
    explain: `One pointer write removes ${xs[k + 1]}: nobody points to it anymore. No shifting like an array.`,
  };
};

const simulateSearch = (): Card => {
  const xs = vals(randInt(4, 6));
  const t = randInt(1, xs.length - 1);
  const { scene, addrs } = singly(xs);
  const frames = [scene];
  for (let i = 0; i <= t; i++) frames.push({ ...cloneScene(scene), highlight: addrs.slice(0, i + 1).map(m) });
  return {
    concept: LL,
    type: 'simulate',
    prompt: `Find ${xs[t]}. You only know where the head is. Click each node as you visit it, in memory or in the picture, until you reach ${xs[t]}.`,
    scene,
    body: {
      kind: 'click',
      expected: addrs.slice(0, t + 1).map(m),
      frames,
      wrongHint: (step) =>
        step === 0 ? 'Start where "head" points: read the number in cell 0.' : `You're at ${xs[step - 1]}. Its next pointer holds address ${addrs[step]}.`,
    },
    explain: `${t + 1} nodes visited. There's no base + i here: nodes are scattered, so the only way to node i is through nodes 0..i−1.`,
  };
};

const orderInsert = (): Card => ({
  concept: LL,
  type: 'simulate',
  prompt: 'Insert a new node N after node A. Put the steps in the only safe order.',
  body: { kind: 'order', steps: ['Create N and store the value in it.', 'N.next = A.next (N grabs the rest of the list).', 'A.next = N (A now points at N).'] },
  explain: 'N must grab the rest of the list before A.next is overwritten. Otherwise the rest is lost.',
});

const orderDelete = (): Card => ({
  concept: LL,
  type: 'simulate',
  prompt: 'Delete the node holding value x from a singly linked list. Put the steps in order.',
  body: {
    kind: 'order',
    steps: [
      'Walk from head, keeping track of the previous node P, until P.next holds x.',
      'Save T = P.next (the node to remove).',
      'P.next = T.next (skip over T).',
      'Free T’s memory.',
    ],
  },
  explain: 'In a singly list you must find the node *before* the target, because that’s the pointer that has to change. Finding it is the O(n) part.',
});

const orderInsertHead = (): Card => ({
  concept: LL,
  type: 'simulate',
  prompt: 'Insert a new node N at the very front. Put the steps in order.',
  body: { kind: 'order', steps: ['Create N with its value.', 'N.next = head.', 'head = N.'] },
  explain: 'N grabs the old first node, then head moves to N. Two writes: O(1), however long the list.',
});

const countAccess = (): Card => {
  const k = randInt(3, 40);
  return {
    concept: LL,
    type: 'count',
    prompt: `To read the value at position ${k} (counting from 0) in a singly linked list, how many nodes must you visit?`,
    body: { kind: 'number', answer: k + 1, unit: 'nodes' },
    explain: `Positions 0 through ${k}: ${k + 1} nodes. Each next address is only known once you've read the node before it.`,
  };
};

const countInsertKnown = (): Card => ({
  concept: LL,
  type: 'count',
  prompt: 'You already hold a pointer to node A in a list of a million nodes. How many pointer writes does it take to insert a new node right after A?',
  body: { kind: 'number', answer: 2, unit: 'writes' },
  explain: 'N.next = A.next, A.next = N. Nothing shifts, whatever the list length. The catch is *getting* to A.',
});

const growthLL = (): Card =>
  pick([
    () => growthCard(LL, 'read the value at position n−1 (the last node)', (n) => n, 2, 'Walk every node from head.'),
    () => growthCard(LL, 'insert at the front', () => 2, 0, 'Two pointer writes whatever the length.'),
  ])();

const llExplain = explainGenerators({
  concept: LL,
  truths: [
    'Each node holds a value and the address of the next node.',
    'Nodes can be anywhere in memory; only the pointers give the order.',
    'Reaching position k means following k pointers from the head.',
    'Inserting after a node you already hold takes two pointer writes, with no shifting.',
    'Pointer update order matters: save the rest of the list before overwriting a next pointer.',
  ],
  myths: [
    { text: 'You can jump to the k-th node with an address calculation.', why: 'Nodes are scattered. There’s no base + k. You walk.' },
    { text: 'Inserting in the middle shifts the later nodes.', why: 'Nothing moves in memory; two pointers change.' },
    { text: 'Deleting a node needs only the node itself.', why: 'In a singly list you must change the *previous* node’s next pointer.' },
    { text: 'Linked lists are always faster than arrays.', why: 'Access by position is O(n), and pointer-chasing is cache-unfriendly.' },
  ],
  chains: [
    {
      prompt: 'Why does reaching position k cost k hops?',
      steps: ['Nodes are scattered anywhere in memory.', 'Node k’s address is stored only inside node k−1.', 'So you must reach node k−1 first.', 'Repeat back to head: k hops.'],
    },
    {
      prompt: 'Why is inserting after a known node O(1)?',
      steps: ['The order lives only in the next pointers.', 'Nodes don’t have to sit side by side.', 'So nothing needs to move.', 'Two pointer writes splice the new node in.'],
    },
  ],
  summary: {
    best: 'A linked list is a treasure hunt: each box holds a value and the location of the next box, so adding a box is easy but reaching box 50 means following 50 clues.',
    others: [
      { text: 'A linked list is a linear collection of nodes.', why: 'Says nothing about pointers or cost.' },
      { text: 'Linked lists have O(1) insert and O(n) access.', why: 'The facts, without the why.' },
      { text: 'A linked list is like an array but better for inserting.', why: 'Hides the mechanism and the price.' },
    ],
  },
});

// Playground: real allocation in memory.
function llPlayInitial(): Scene {
  return singly([12, 5, 31], false).scene;
}

function llState(s: Scene) {
  const cells = s.cells!;
  const head = cells[0].v;
  return { cells, head, addrs: walkList(cells, head) };
}

function freePair(cells: Cell[]): number | null {
  for (let a = 2; a + 1 < MEM_SIZE; a += 2) if (cells[a].kind === 'free' && cells[a + 1].kind === 'free') return a;
  return null;
}

function setHead(s: Scene, head: number | null) {
  s.cells![0] = { v: head, kind: 'ptr', label: 'head' };
  (s.views[0] as Extract<View, { type: 'list' }>).head = head;
}

const llOps: Concept['playground'] = {
  initial: llPlayInitial,
  ops: [
    {
      label: 'Insert at head',
      inputs: ['value'],
      run: (s, [v]) => {
        const n = cloneScene(s);
        const a = freePair(n.cells!);
        if (a === null) return { error: 'Out of demo memory.' };
        writeNode(n.cells!, a, v, n.cells![0].v);
        setHead(n, a);
        n.highlight = [m(a), m(0)];
        return { scene: n, touches: 3, note: `New node at ${a}: wrote value + next = old head, then head = ${a}. 3 touches, whatever the length.` };
      },
    },
    {
      label: 'Insert after position',
      inputs: ['value', 'position'],
      run: (s, [v, p]) => {
        const { addrs } = llState(s);
        if (p < 0 || p >= addrs.length) return { error: `Position must be 0–${addrs.length - 1}.` };
        const n = cloneScene(s);
        const a = freePair(n.cells!);
        if (a === null) return { error: 'Out of demo memory.' };
        const A = addrs[p];
        writeNode(n.cells!, a, v, n.cells![A + 1].v);
        n.cells![A + 1] = { ...n.cells![A + 1], v: a };
        n.highlight = [...addrs.slice(0, p + 1).map(m), m(a)];
        return { scene: n, touches: p + 1 + 3, note: `Walked ${p + 1} nodes to reach position ${p}, then 3 writes. The walk is the expensive part.` };
      },
    },
    {
      label: 'Delete position',
      inputs: ['position'],
      run: (s, [p]) => {
        const { addrs } = llState(s);
        if (p < 0 || p >= addrs.length) return { error: `Position must be 0–${addrs.length - 1}.` };
        const n = cloneScene(s);
        const T = addrs[p];
        const next = n.cells![T + 1].v;
        if (p === 0) setHead(n, next);
        else n.cells![addrs[p - 1] + 1] = { ...n.cells![addrs[p - 1] + 1], v: next };
        n.cells![T] = { v: n.cells![T].v, kind: 'free' };
        n.cells![T + 1] = { v: n.cells![T + 1].v, kind: 'free' };
        n.highlight = addrs.slice(0, p).map(m);
        return { scene: n, touches: p + 1, note: `Walked to position ${p - 1 < 0 ? 'head' : p - 1}, rewired one pointer, freed the node. The old values are still in memory as garbage.` };
      },
    },
    {
      label: 'Find value',
      inputs: ['value'],
      run: (s, [v]) => {
        const { cells, addrs } = llState(s);
        const i = addrs.findIndex((a) => cells[a].v === v);
        const n = cloneScene(s);
        n.highlight = (i < 0 ? addrs : addrs.slice(0, i + 1)).map(m);
        return i < 0
          ? { scene: n, touches: addrs.length, note: `Not found after visiting all ${addrs.length} nodes.` }
          : { scene: n, touches: i + 1, note: `Found ${v} at position ${i} after ${i + 1} visits.` };
      },
    },
  ],
};

export const linkedListConcept: Concept = {
  id: LL,
  title: 'Singly Linked List',
  tier: 1,
  prereqs: ['pointers', 'static-array'],
  tagline: 'A treasure hunt of nodes. Cheap to splice, slow to reach.',
  hook: {
    problem: 'An array of a million songs is your playlist. Inserting a song near the front shifts almost a million elements, every time.',
    question: 'How could you insert without moving anything?',
    options: [
      { text: 'Leave gaps in the array for future inserts.', feedback: 'Gaps fill up, and they break base + i. You’d be back to shifting.' },
      { text: 'Let each song remember where the *next* song is, so order lives in pointers, not positions.', good: true, feedback: 'Yes. If order is stored in pointers, inserting is re-aiming two pointers. That’s a linked list.' },
      { text: 'Sort the playlist first.', feedback: 'Sorting doesn’t stop the shifting on insert.' },
    ],
  },
  lens: {
    layout: 'Nodes scattered anywhere in memory. Each node is [value, next-address]. A head pointer holds the first node’s address.',
    invariant: 'Following next from head visits every item exactly once, in order, ending at ∅.',
    payoff: 'Insert/delete next to a node you hold: O(1), just rewire pointers. Growing never copies.',
    price: 'No indexing: reaching position k costs k hops (O(n)). Extra memory for every pointer.',
  },
  playground: llOps,
  generators: {
    predict: [predictInsertAfter, predictWrongOrder, predictDeleteAfter],
    simulate: [simulateSearch, orderInsert, orderDelete, orderInsertHead],
    count: [countAccess, countInsertKnown, growthLL],
    explain: llExplain,
  },
};

// =====================================================================
// Doubly linked list
// =====================================================================

const DLL = 'doubly-linked-list';

const predictDeleteGiven = (): Card => ({
  concept: DLL,
  type: 'predict',
  prompt: 'In a doubly linked list you hold a pointer to node X in the middle. Which writes remove X?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'X.prev.next = X.next and X.next.prev = X.prev', correct: true, why: 'Both neighbours now point past X, in both directions.' },
      { text: 'Walk from head to find the node before X, then fix its next.', correct: false, why: 'That’s the singly-list workaround. X.prev already tells you the node before.' },
      { text: 'X.prev.next = X.next only', correct: false, why: 'Walking backwards would still reach X through X.next.prev.' },
      { text: 'X.next = null and X.prev = null', correct: false, why: 'The neighbours still point at X. It’s still in the list.' },
    ]),
  },
  explain: 'The prev pointer is exactly what a singly list lacks: the node before you, in one step. So deleting a node you hold is O(1).',
});

const predictBackward = (): Card => {
  const xs = vals(randInt(5, 6));
  const k = randInt(1, xs.length - 2);
  return {
    concept: DLL,
    type: 'predict',
    prompt: `Doubly linked list: ${xs.join(' ⇄ ')}. Start at the tail and follow prev ${k} time${k > 1 ? 's' : ''}. Which value are you on?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        xs[xs.length - 1 - k],
        [
          { value: xs[k], why: 'That’s k steps from the head. You started at the tail.' },
          { value: xs[xs.length - k], why: 'Off by one: the tail itself is 0 steps.' },
          { value: xs[xs.length - 2 - k], why: 'Off by one the other way.' },
        ],
        'Count back from the tail.',
      ),
    },
    explain: `Tail is ${xs[xs.length - 1]}; ${k} step${k > 1 ? 's' : ''} back is ${xs[xs.length - 1 - k]}. Walking backwards is only possible because each node stores prev.`,
  };
};

const simulateBackward = (): Card => {
  const xs = vals(randInt(4, 5));
  const t = randInt(0, xs.length - 2);
  const { scene, addrs } = doubly(xs);
  const path = addrs.slice(t).reverse();
  const frames = [scene];
  path.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: path.slice(0, i + 1).map(m) }));
  return {
    concept: DLL,
    type: 'simulate',
    prompt: `Find ${xs[t]} starting from the TAIL (cell 1 holds its address). Click each node as you visit it, walking backwards with prev.`,
    scene,
    body: {
      kind: 'click',
      expected: path.map(m),
      frames,
      wrongHint: (step) => (step === 0 ? 'Start where tail points: the number in cell 1.' : `Read the prev pointer of the node you're on: it's the middle cell of the node.`),
    },
    explain: `${path.length} nodes from the tail. With prev pointers you can start from whichever end is closer.`,
  };
};

const orderDInsert = (): Card => ({
  concept: DLL,
  type: 'simulate',
  prompt: 'Insert a new node N right after node A in a doubly linked list (A is not the tail). Put the steps in the safe order.',
  body: {
    kind: 'order',
    steps: ['N.prev = A and N.next = A.next (N points at both neighbours).', 'A.next.prev = N (the old next node looks back at N).', 'A.next = N (A looks forward at N).'],
  },
  explain: 'A.next is the only way to reach the old next node. Update that node’s prev *before* overwriting A.next, or you lose it.',
});

const orderDDelete = (): Card => ({
  concept: DLL,
  type: 'simulate',
  prompt: 'Remove node X (you hold a pointer to it) from a doubly linked list. Put the steps in order.',
  body: {
    kind: 'order',
    steps: ['Read P = X.prev and Q = X.next.', 'P.next = Q and Q.prev = P (neighbours skip X).', 'Free X.'],
  },
  explain: 'Read X’s pointers before anything else. Once X is freed, they’re garbage.',
});

const countDMemory = (): Card => {
  const n = randInt(5, 200);
  return {
    concept: DLL,
    type: 'count',
    prompt: `A doubly linked list has ${n} nodes, each [value, prev, next], one cell per field. How many cells do the nodes use?`,
    body: { kind: 'number', answer: 3 * n, unit: 'cells' },
    explain: `3 × ${n} = ${3 * n}. That's ${n} more than a singly list: the price of being able to go backwards.`,
  };
};

const countDDelete = (): Card => ({
  concept: DLL,
  type: 'count',
  prompt: 'You hold a pointer to a middle node X in a doubly linked list of a million nodes. How many pointer writes (not counting freeing) remove it?',
  body: { kind: 'number', answer: 2, unit: 'writes' },
  explain: 'X.prev.next and X.next.prev. No walking: prev gives you the previous node directly.',
});

const growthDLL = (): Card =>
  pick([
    () => growthCard(DLL, 'delete a node you hold a pointer to (doubly)', () => 2, 0, 'Two pointer writes, any length.'),
    () => growthCard(DLL, 'delete a node you hold, in a SINGLY list (find its predecessor)', (n) => Math.ceil(n / 2) + 1, 2, 'Without prev you must walk from head to find the node before it: grows with n.'),
  ])();

const dllExplain = explainGenerators({
  concept: DLL,
  truths: [
    'Each node stores both next and prev pointers.',
    'You can walk the list in both directions.',
    'Deleting a node you already hold is O(1): its prev tells you the node before.',
    'Every insert or delete must update pointers in both directions.',
    'It costs one extra pointer per node compared to a singly list.',
  ],
  myths: [
    { text: 'A doubly linked list lets you jump to the middle in one step.', why: 'Still no indexing: you walk from one end.' },
    { text: 'Deleting only needs X.prev.next updated.', why: 'X.next.prev would still point at the deleted node.' },
    { text: 'Doubly lists use the same memory as singly lists.', why: 'Each node has one more pointer.' },
    { text: 'Search becomes O(1) with prev pointers.', why: 'Searching still walks the nodes. Only removal-in-place gets faster.' },
  ],
  chains: [
    {
      prompt: 'Why can a doubly list delete a node you hold in O(1), when a singly list can’t?',
      steps: [
        'Removing X means changing the previous node’s next pointer.',
        'A singly list only knows the previous node by walking from head.',
        'A doubly list stores it in X.prev.',
        'So the previous node is one step away: O(1).',
      ],
    },
  ],
  summary: {
    best: 'Each box knows both its neighbours, so you can walk either way and pull a box out without searching for the one before it.',
    others: [
      { text: 'A doubly linked list is a linked list with two pointers.', why: 'What it is, not why it matters.' },
      { text: 'It’s a faster linked list.', why: 'Only certain operations get faster, and it costs memory.' },
      { text: 'It supports bidirectional traversal.', why: 'Jargon for “goes both ways”; misses the O(1) delete.' },
    ],
  },
});

export const doublyLinkedListConcept: Concept = {
  id: DLL,
  title: 'Doubly Linked List',
  tier: 1,
  prereqs: [LL],
  tagline: 'Nodes that know both neighbours.',
  hook: {
    problem: 'Your music player holds a pointer to the current song. "Remove this song" in a singly list means walking from the start to find the song before it.',
    question: 'How could you remove the current song without walking from the start?',
    options: [
      { text: 'Also store, in each node, the address of the node before it.', good: true, feedback: 'Yes. A prev pointer gives you the previous node in one step. That’s a doubly linked list.' },
      { text: 'Keep a separate array of all node addresses.', feedback: 'Then every insert shifts that array. The problem is back.' },
      { text: 'Just blank out the song’s value.', feedback: 'The node stays in the list as a ghost; playback would still visit it.' },
    ],
  },
  lens: {
    layout: 'Nodes [value, prev, next] scattered in memory; head and tail pointers.',
    invariant: 'For every node X: X.next.prev = X and X.prev.next = X (links agree in both directions).',
    payoff: 'Walk both ways; O(1) insert/delete at a node you hold, and at both ends.',
    price: 'An extra pointer per node, and every change must update twice as many links.',
  },
  generators: {
    predict: [predictDeleteGiven, predictBackward],
    simulate: [simulateBackward, orderDInsert, orderDDelete],
    count: [countDMemory, countDDelete, growthDLL],
    explain: dllExplain,
  },
};

// =====================================================================
// Circular linked list
// =====================================================================

const CLL = 'circular-linked-list';

const predictLap = (): Card => {
  const xs = vals(randInt(4, 6));
  const n = xs.length;
  const i = randInt(0, n - 1);
  const k = randInt(n + 1, 3 * n);
  return {
    concept: CLL,
    type: 'predict',
    prompt: `Circular list: ${xs.join(' → ')} → (back to ${xs[0]}). Start on ${xs[i]} and follow next ${k} times. Where are you?`,
    body: {
      kind: 'choice',
      options: options({ text: String(xs[(i + k) % n]), why: `${k} mod ${n} = ${k % n} net steps.` }, [
        { text: 'You fall off the end (∅)', why: 'There is no end: the last node points back to the first.' },
        { text: String(xs[k % n]), why: 'That counts from the first node. You started on ' + xs[i] + '.' },
        { text: String(xs[(i + k + 1) % n]), why: 'Off by one.' },
      ]),
    },
    explain: `Every ${n} steps is a full lap. ${k} steps = ${Math.floor(k / n)} laps + ${k % n}, landing on ${xs[(i + k) % n]}.`,
  };
};

const predictFrontWithTail = (): Card => ({
  concept: CLL,
  type: 'predict',
  prompt: 'In a circular list you keep only a TAIL pointer (the first node is tail.next). How do you insert N at the front?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'N.next = tail.next; tail.next = N', correct: true, why: 'N grabs the old first node, and the tail now wraps around to N.' },
      { text: 'Walk around the whole circle to find the front.', correct: false, why: 'tail.next *is* the front, one step away.' },
      { text: 'N.next = tail; tail = N', correct: false, why: 'That makes N the tail and breaks the circle order.' },
      { text: 'You need a separate head pointer.', correct: false, why: 'tail.next already gives you the head for free.' },
    ]),
  },
  explain: 'Holding the tail gives you both ends: the tail itself, and tail.next (the front). Both inserts are O(1).',
});

const simulateRoundRobin = (): Card => {
  const xs = vals(randInt(3, 4));
  const n = xs.length;
  const start = randInt(0, n - 1);
  const turns = randInt(n + 1, n + 3);
  const { scene, addrs } = circular(xs);
  const seq = Array.from({ length: turns }, (_, t) => addrs[(start + t) % n]);
  const frames = [scene];
  seq.forEach((a) => frames.push({ ...cloneScene(scene), highlight: [m(a)] }));
  return {
    concept: CLL,
    type: 'simulate',
    prompt: `Players take turns around the circle. Starting with ${xs[start]}, click the node for each of the next ${turns} turns (including ${xs[start]}'s turn).`,
    scene,
    body: {
      kind: 'click',
      expected: seq.map(m),
      frames,
      wrongHint: (step) => (step === 0 ? `Start on ${xs[start]}.` : `Follow next from ${xs[(start + step - 1) % n]}. After the last node, it wraps to the first.`),
    },
    explain: `The circle never ends, so turns just keep going. No "reached the end, restart at head" check needed. That's why schedulers use it.`,
  };
};

const orderAppendTail = (): Card => ({
  concept: CLL,
  type: 'simulate',
  prompt: 'Append N at the END of a circular list, holding only the tail pointer. Put the steps in order.',
  body: { kind: 'order', steps: ['N.next = tail.next (N points at the front).', 'tail.next = N (old tail points at N).', 'tail = N (N becomes the new tail).'] },
  explain: 'Same splice as inserting at the front, plus moving the tail pointer. O(1) either way.',
});

const countForward = (): Card => {
  const n = randInt(5, 30);
  const i = randInt(0, n - 1);
  let j = randInt(0, n - 1);
  if (j === i) j = (i + 1) % n;
  return {
    concept: CLL,
    type: 'count',
    prompt: `A circular list has ${n} nodes, numbered 0..${n - 1} in next-order. Moving only forward, how many steps from node ${i} to node ${j}?`,
    body: { kind: 'number', answer: (j - i + n) % n, unit: 'steps' },
    explain: `(${j} − ${i} + ${n}) mod ${n} = ${(j - i + n) % n}. ${j < i ? 'You wrap past the end back to 0.' : 'No wrap needed.'}`,
  };
};

const growthCLL = (): Card => growthCard(CLL, 'insert at the front OR back, holding the tail', () => 2, 0, 'Two pointer writes (plus a tail move for the back). Both ends are one step from tail.');

const cllExplain = explainGenerators({
  concept: CLL,
  truths: [
    'The last node’s next points back to the first node.',
    'There is no ∅ at the end; you can keep walking forever.',
    'Holding just the tail gives you both ends: tail and tail.next.',
    'Walking k steps from a node in an n-node circle lands k mod n positions ahead.',
  ],
  myths: [
    { text: 'You detect the end of a circular list by checking for ∅.', why: 'There is no ∅. Stop when you get back to where you started.' },
    { text: 'You need both head and tail pointers.', why: 'tail.next is the head.' },
    { text: 'A circular list is stored in a circle in memory.', why: 'Nodes are scattered; only the pointers form the circle.' },
  ],
  chains: [
    {
      prompt: 'Why is one tail pointer enough to reach both ends?',
      steps: ['The last node points back to the first.', 'So tail.next is the first node.', 'Tail is the last node itself.', 'Both ends are at most one step away.'],
    },
  ],
  summary: {
    best: 'It’s a linked list whose last box points back to the first, so you can go round and round, like players taking turns at a table.',
    others: [
      { text: 'A circular linked list is a list that is circular.', why: 'Circular definition. It explains nothing.' },
      { text: 'It’s a list with no end, used in operating systems.', why: 'No mechanism.' },
      { text: 'It’s stored in a ring shape in memory.', why: 'Wrong: only the pointers loop.' },
    ],
  },
});

export const circularLinkedListConcept: Concept = {
  id: CLL,
  title: 'Circular Linked List',
  tier: 1,
  prereqs: [LL],
  tagline: 'The last node points back to the first.',
  hook: {
    problem: 'A game gives each player a turn in order, forever. With a normal list, every time you reach the end you must jump back to the head, a special case every lap.',
    question: 'How could the turns just keep flowing?',
    options: [
      { text: 'Make the last node’s next point back to the first node.', good: true, feedback: 'Yes. No end, no special case. Follow next forever.' },
      { text: 'Copy the list end to end many times.', feedback: 'Wastes memory and still ends eventually.' },
      { text: 'Use an array and wrap the index with mod.', feedback: 'That works too (you’ll meet it as a circular buffer), but here we want cheap inserts of new players.' },
    ],
  },
  lens: {
    layout: 'Singly linked nodes, but the last node’s next holds the first node’s address. Keep a pointer to the tail.',
    invariant: 'Following next from any node eventually returns to it, visiting every node once per lap.',
    payoff: 'Endless rotation with no end check; O(1) insert at front and back holding only the tail.',
    price: 'Loops are easy to get wrong: a walk must stop when it returns to its start, or it never ends.',
  },
  generators: {
    predict: [predictLap, predictFrontWithTail],
    simulate: [simulateRoundRobin, orderAppendTail],
    count: [countForward, growthCLL],
    explain: cllExplain,
  },
};

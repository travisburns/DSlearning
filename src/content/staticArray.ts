import type { Card, Concept, Scene } from '../engine/types';
import { cloneScene, fmtArray, m } from '../engine/memory';
import { pick, randInt, values } from '../engine/random';
import { arrayView, deleteFrames, insertFrames, arrayScene, readArray } from './arrayUtil';
import { explainGenerators, growthCard, numberOptions, options } from './helpers';

const ID = 'static-array';

function randomArray(minLen = 4, maxLen = 7, spare = 1) {
  const length = randInt(minLen, maxLen);
  const capacity = length + spare;
  const base = randInt(1, 24 - capacity - 1);
  const items = values(length);
  return { base, items, capacity, scene: arrayScene(base, items, capacity) };
}

const predictAddress = (): Card => {
  const base = randInt(100, 900);
  const size = pick([1, 4, 8]);
  const i = randInt(2, 9);
  const addr = base + i * size;
  return {
    concept: ID,
    type: 'predict',
    prompt: `An array starts at address ${base}. Each element takes ${size} cell${size > 1 ? 's' : ''}. At what address does element [${i}] start?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        addr,
        [
          { value: base + (i + 1) * size, why: 'Off by one: element [0] is *at* the base, so [i] is i steps away, not i+1.' },
          { value: base + (i - 1) * size, why: 'Off by one the other way: [0] is at base + 0.' },
          { value: base + i, why: `Forgot the element size: each step is ${size} cells.` },
          { value: i * size, why: 'Forgot the base: the array doesn’t start at address 0.' },
        ],
        'address = base + index × size',
      ),
    },
    explain: `${base} + ${i} × ${size} = ${addr}. One multiply and one add, no matter how big i is. That's why array access is instant.`,
  };
};

const predictInsert = (): Card => {
  const { items } = randomArray(4, 6);
  const i = randInt(0, items.length - 2);
  const [v] = values(1).map((x) => (items.includes(x) ? x + 100 : x));
  const correct = [...items.slice(0, i), v, ...items.slice(i)];
  // Shifting left-to-right copies arr[i] forward over everything: the classic bug.
  const leftToRight = [...items.slice(0, i), v, ...items.slice(i).map(() => items[i])];
  const overwrite = [...items.slice(0, i), v, ...items.slice(i + 1)];
  const appended = [...items, v];
  return {
    concept: ID,
    type: 'predict',
    prompt: `arr = ${fmtArray(items)}, with one free slot at the end. Insert ${v} at index ${i}, shifting correctly. What does the array hold afterwards?`,
    body: {
      kind: 'choice',
      options: options({ text: fmtArray(correct), why: 'Everything from index i onward moved one slot right.' }, [
        { text: fmtArray(leftToRight), why: 'This is what happens if you shift starting from the *left*: each write clobbers the next value before it moves.' },
        { text: fmtArray(overwrite), why: 'Nothing was shifted, so the old value at index i was overwritten and lost.' },
        { text: fmtArray(appended), why: 'That’s an append, not an insert at index ' + i + '.' },
      ]),
    },
    explain: `Slots are fixed in place. To make room at [${i}], every element from [${i}] to the end must move right by one: ${items.length - i} moves.`,
  };
};

const predictDelete = (): Card => {
  const { items } = randomArray(4, 7);
  const i = randInt(0, items.length - 2);
  const correct = [...items.slice(0, i), ...items.slice(i + 1)];
  return {
    concept: ID,
    type: 'predict',
    prompt: `arr = ${fmtArray(items)}. Delete index ${i}, keeping the array contiguous (no gaps). What remains?`,
    body: {
      kind: 'choice',
      options: options({ text: fmtArray(correct), why: 'Everything after i slid left by one.' }, [
        { text: fmtArray([...items.slice(0, i), null, ...items.slice(i + 1)]), why: 'That leaves a hole. Then arr[k] is no longer at base + k for every k, and the address formula breaks.' },
        { text: fmtArray([...correct, items[items.length - 1]]), why: 'Shifted, but forgot to shrink the length, so the last value appears twice.' },
        { text: fmtArray(items.slice(0, -1)), why: 'That removed the last element, not index ' + i + '.' },
      ]),
    },
    explain: `The rule "arr[k] lives at base + k" only holds if there are no gaps. So deleting forces everything after it to move left.`,
  };
};

const simulateInsert = (): Card => {
  const { scene, items } = randomArray(4, 7);
  const i = randInt(0, items.length - 2);
  const [v] = values(1);
  const { writes, frames } = insertFrames(scene, i, v);
  const s0 = cloneScene(scene);
  return {
    concept: ID,
    type: 'simulate',
    prompt: `Insert ${v} at index ${i}. You're the CPU: click each cell *as you write to it*, in the order you'd write. (Each shift copies the value from its left neighbour.)`,
    scene: s0,
    body: {
      kind: 'click',
      expected: writes,
      frames: [s0, ...frames],
      wrongHint: (step, target) =>
        step < writes.length - 1 && Number(target.slice(2)) < Number(writes[step].slice(2))
          ? 'Writing there now would overwrite a value you haven’t moved yet. Start from the free end and work backwards.'
          : step === writes.length - 1
            ? `All shifted. Now write ${v} into its slot.`
            : 'Which slot must receive a value next? Work from the free slot at the end towards index ' + i + '.',
    },
    explain: `${writes.length - 1} shifts + 1 write. You must go right-to-left, because going left-to-right overwrites values before they've been moved.`,
  };
};

const simulateDelete = (): Card => {
  const { scene, items } = randomArray(4, 7, 0);
  const i = randInt(0, items.length - 2);
  const { writes, frames } = deleteFrames(scene, i);
  const s0 = cloneScene(scene);
  return {
    concept: ID,
    type: 'simulate',
    prompt: `Delete index ${i} (value ${items[i]}). Click each cell as you write to it: slide the later values left, then clear the last slot.`,
    scene: s0,
    body: {
      kind: 'click',
      expected: writes,
      frames: [s0, ...frames],
      wrongHint: (step) =>
        step === writes.length - 1 ? 'Everything has slid left. The last slot now holds a stale duplicate: clear it.' : 'Fill the hole first, then the slot after it, moving left to right.',
    },
    explain: `Deleting goes left-to-right: fill the hole, then the hole you just made, and so on. ${writes.length - 1} moves + 1 clear.`,
  };
};

const simulateRead = (): Card => {
  const { scene, base, items } = randomArray(5, 9, 0);
  scene.views = [{ type: 'memory' }]; // hide the picture: find it from the address alone
  scene.cells = scene.cells!.map((c) => (c.label ? { ...c, label: undefined } : c));
  const i = randInt(1, items.length - 1);
  const frame = cloneScene(scene);
  frame.highlight = [m(base + i)];
  return {
    concept: ID,
    type: 'simulate',
    prompt: `An array of ${items.length} elements starts at the "base" marker (address ${base}). Click the cell holding arr[${i}]. Work out the address; don't count boxes.`,
    scene,
    body: {
      kind: 'click',
      expected: [m(base + i)],
      frames: [scene, frame],
      wrongHint: (_s, t) => (t === m(base + i + 1) ? 'Off by one: arr[0] is at base itself.' : `Address = base + index = ${base} + ${i}.`),
    },
    explain: `${base} + ${i} = ${base + i}. The CPU never walks the array. It computes the address and jumps.`,
  };
};

const countInsert = (): Card => {
  const n = randInt(5, 60);
  const i = randInt(0, n - 1);
  return {
    concept: ID,
    type: 'count',
    prompt: `An array holds ${n} elements (there's spare room at the end). You insert a new value at index ${i}. How many elements have to move?`,
    body: { kind: 'number', answer: n - i, unit: 'moves' },
    explain: `Everything from index ${i} to ${n - 1} shifts right: ${n} − ${i} = ${n - i} moves. Insert at the front is the worst case (n moves); at the end it's 0.`,
  };
};

const countDelete = (): Card => {
  const n = randInt(5, 60);
  const i = randInt(0, n - 1);
  return {
    concept: ID,
    type: 'count',
    prompt: `An array holds ${n} elements. You delete index ${i}. How many elements have to move?`,
    body: { kind: 'number', answer: n - 1 - i, unit: 'moves' },
    explain: `Everything after index ${i} shifts left: indices ${i + 1}..${n - 1}, which is ${n - 1 - i} moves.`,
  };
};

const growth = (): Card =>
  pick([
    () => growthCard(ID, 'read arr[i]', () => 1, 0, 'One address calculation, one read. Size doesn’t matter.'),
    () => growthCard(ID, 'insert at the front', (n) => n + 1, 2, 'Every existing element shifts once, plus one write. The work grows with n.'),
    () => growthCard(ID, 'find a value (unsorted array)', (n) => n, 2, 'Without knowing the index you must check the slots one by one: up to n reads.'),
  ])();

const explain = explainGenerators({
  concept: ID,
  truths: [
    'Array elements sit side by side in one contiguous block of memory.',
    'The address of arr[i] is base + i × size, computed in one step.',
    'Inserting in the middle forces every later element to shift.',
    'An array has no gaps; that’s what makes the address formula work.',
    'Finding a *value* (not an index) in an unsorted array means checking elements one by one.',
  ],
  myths: [
    { text: 'Reading arr[1000] takes longer than reading arr[1].', why: 'Both are one multiply-add and one read. Position doesn’t matter.' },
    { text: 'Inserting at the front of an array is instant.', why: 'Every element must shift right to make room: n moves.' },
    { text: 'A deleted element just leaves an empty gap.', why: 'A gap breaks base + i: arr[i] would no longer be at that address.' },
    { text: 'An array can grow in place whenever you want.', why: 'The cells right after it may already belong to something else.' },
  ],
  chains: [
    {
      prompt: 'Why is reading arr[i] instant?',
      steps: [
        'All elements are stored side by side with no gaps.',
        'So element i sits exactly i slots after the start.',
        'Its address is base + i × size: one calculation.',
        'Memory reads any address in one step, so it’s O(1).',
      ],
    },
    {
      prompt: 'Why is inserting at the front slow?',
      steps: [
        'Every element must stay at base + its index.',
        'A new element at index 0 changes everyone’s index by one.',
        'So every element must physically move one slot right.',
        'n elements means n moves: O(n).',
      ],
    },
  ],
  summary: {
    best: 'An array is a row of boxes side by side, so you can jump to box number i instantly, but squeezing a new box in means shoving all the later ones along.',
    others: [
      { text: 'An array is a data structure that stores elements of the same type.', why: 'True-ish, but no mechanism: why is it fast or slow?' },
      { text: 'Arrays have O(1) access and O(n) insertion.', why: 'Just the facts to memorise, with no reason behind them.' },
      { text: 'An array is a list of things.', why: 'Too vague. It misses "side by side", which is the whole point.' },
    ],
  },
});

function playInitial(): Scene {
  return arrayScene(4, [12, 5, 31, 8], 10, false);
}

export const staticArrayConcept: Concept = {
  id: ID,
  title: 'Static Array',
  tier: 1,
  prereqs: ['memory'],
  tagline: 'Boxes side by side: instant jumps, painful inserts.',
  hook: {
    problem:
      'You have 1,000 temperatures, one per day. You constantly need "what was the temperature on day 637?" Scattering them in memory with pointers between them would mean 637 hops.',
    question: 'How could you get day 637 in a single step?',
    options: [
      { text: 'Chain them with pointers, day 1 → day 2 → …', feedback: 'Then day 637 costs 637 reads. That’s the problem we’re trying to escape.' },
      { text: 'Store them back-to-back from some start address, so day k is at start + k.', good: true, feedback: 'Exactly. If there are no gaps, the address is arithmetic, not a search. That’s an array.' },
      { text: 'Keep a separate pointer for every day.', feedback: 'That’s 1,000 pointers, and they’d have to be stored somewhere findable too… back-to-back, probably. Simplify.' },
    ],
  },
  lens: {
    layout: 'One contiguous block of cells starting at a base address. Element i sits at base + i × size.',
    invariant: 'No gaps: element i is *always* exactly at base + i.',
    payoff: 'Read or write any index in O(1): one multiply-add, one jump.',
    price: 'Inserting or deleting in the middle shifts everything after it: O(n). And the block can’t grow; its neighbours may be taken.',
  },
  playground: {
    initial: playInitial,
    ops: [
      {
        label: 'Read [i]',
        inputs: ['index'],
        run: (s, [i]) => {
          const items = readArray(s);
          const { base } = arrayView(s)!;
          if (i < 0 || i >= items.length) return { error: `Index must be 0–${items.length - 1}.` };
          const n = cloneScene(s);
          n.highlight = [m(base + i)];
          return { scene: n, touches: 1, note: `arr[${i}] at ${base} + ${i} = ${base + i} → ${items[i]}. 1 touch.` };
        },
      },
      {
        label: 'Insert value at [i]',
        inputs: ['value', 'index'],
        run: (s, [v, i]) => {
          const { length, capacity = length } = arrayView(s)!;
          if (length >= capacity) return { error: 'The block is full. A static array can’t grow; the next cells aren’t ours.' };
          if (i < 0 || i > length) return { error: `Index must be 0–${length}.` };
          const { frames } = insertFrames(s, i, v);
          const last = frames[frames.length - 1];
          last.highlight = frames.map((f) => f.highlight?.[0] ?? '');
          return { scene: last, touches: frames.length, note: `${frames.length - 1} shifts + 1 write = ${frames.length} touches.` };
        },
      },
      {
        label: 'Delete [i]',
        inputs: ['index'],
        run: (s, [i]) => {
          const { length } = arrayView(s)!;
          if (i < 0 || i >= length) return { error: `Index must be 0–${length - 1}.` };
          const { frames } = deleteFrames(s, i);
          const last = frames[frames.length - 1];
          last.highlight = frames.map((f) => f.highlight?.[0] ?? '');
          return { scene: last, touches: frames.length, note: `${frames.length - 1} shifts + 1 clear = ${frames.length} touches.` };
        },
      },
    ],
  },
  generators: {
    predict: [predictAddress, predictInsert, predictDelete],
    simulate: [simulateInsert, simulateDelete, simulateRead],
    count: [countInsert, countDelete, growth],
    explain,
  },
};

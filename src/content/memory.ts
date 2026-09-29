import type { Card, Cell, Concept, Scene } from '../engine/types';
import { MEM_SIZE, cloneScene, emptyMemory, m, sprinkleGarbage } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions } from './helpers';

const ID = 'memory';

/** A chain start → ... → value: each cell holds the address of the next; the last holds a plain value. */
function chainScene(hops: number): { scene: Scene; path: number[]; value: number } {
  const cells = sprinkleGarbage(emptyMemory());
  const path = distinctInts(hops + 1, 0, MEM_SIZE - 1);
  const [value] = distinctInts(1, 30, 99);
  path.forEach((addr, i) => {
    const last = i === path.length - 1;
    cells[addr] = last ? { v: value, kind: 'val' } : { v: path[i + 1], kind: 'ptr' };
  });
  return { scene: { cells, views: [{ type: 'memory' }], markers: [{ name: 'start', addr: path[0] }] }, path, value };
}

const predictFollow = (): Card => {
  const hops = randInt(2, 3);
  const { scene, path, value } = chainScene(hops);
  const start = path[0];
  return {
    concept: ID,
    type: 'predict',
    prompt: `Cells shown with → hold an address. Start at cell ${start} and keep following addresses until you reach a plain value. What value do you land on?`,
    scene,
    body: {
      kind: 'choice',
      options: numberOptions(
        value,
        [
          { value: path[1], why: `That's the address stored in cell ${start}, not what's at that address.` },
          { value: path[path.length - 1], why: `That's the *address* of the final cell. You want what's inside it.` },
          { value: start, why: `That's where you started, the address of the first cell.` },
        ],
        'Each pointer is just a number you use as the next address.',
      ),
    },
    explain: `Path: ${path.join(' → ')}. The last cell holds ${value}. A pointer is just a number that you treat as an address.`,
  };
};

const predictWriteThrough = (): Card => {
  const cells = sprinkleGarbage(emptyMemory());
  const [a, b] = distinctInts(2, 0, MEM_SIZE - 1);
  const [x, y] = distinctInts(2, 30, 99); // never confusable with an address (0–23)
  cells[a] = { v: x, kind: 'val', label: 'x' };
  cells[b] = { v: a, kind: 'ptr', label: 'p' };
  const scene: Scene = { cells, views: [{ type: 'memory' }], markers: [{ name: 'x', addr: a }, { name: 'p', addr: b }] };
  return {
    concept: ID,
    type: 'predict',
    prompt: `Variable x lives at cell ${a}. Variable p lives at cell ${b} and holds x's address. We do: "write ${y} at the address stored in p". Afterwards, what's in cell ${a} and cell ${b}?`,
    scene,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: `cell ${a} = ${y}, cell ${b} = ${a}`, correct: true, why: 'p still points at x; x got the new value.' },
        { text: `cell ${a} = ${x}, cell ${b} = ${y}`, correct: false, why: 'That overwrites p itself. We wrote *through* p, not *to* p.' },
        { text: `cell ${a} = ${y}, cell ${b} = ${y}`, correct: false, why: 'Only one cell is written. p keeps holding the address.' },
        { text: `cell ${a} = ${x}, cell ${b} = ${a}`, correct: false, why: 'Nothing changed? The write went to the address p holds.' },
      ]),
    },
    explain: `"Write through p" = read the address in p (${a}), then write to that cell. p itself is unchanged. This is how many names can share one piece of data.`,
  };
};

const simulateFollow = (): Card => {
  const hops = randInt(2, 4);
  const { scene, path } = chainScene(hops);
  const frames: Scene[] = [scene];
  path.forEach((_, i) => {
    const f = cloneScene(scene);
    f.highlight = path.slice(0, i + 1).map(m);
    frames.push(f);
  });
  return {
    concept: ID,
    type: 'simulate',
    prompt: `Follow the pointers by hand. Click every cell you read, starting at cell ${path[0]}, until you reach a plain value.`,
    scene,
    body: {
      kind: 'click',
      expected: path.map(m),
      frames,
      wrongHint: (step) =>
        step === 0 ? `Start at cell ${path[0]}.` : `Look inside the cell you just read: the number there is the next address.`,
    },
    explain: `You read ${path.length} cells: ${path.join(' → ')}. The CPU can't skip ahead. It only learns the next address by reading the current cell.`,
  };
};

const countChain = (): Card => {
  const hops = randInt(3, 9);
  return {
    concept: ID,
    type: 'count',
    prompt: `A chain has ${hops} pointers, then a value at the end. Starting from the first pointer cell, how many cells must you read to get the value?`,
    body: { kind: 'number', answer: hops + 1, unit: 'reads' },
    explain: `${hops} pointer cells + 1 value cell = ${hops + 1}. Every hop costs a read, because you don't know the next address until you've read it.`,
  };
};

const countDirect = (): Card => {
  const addr = randInt(0, 1_000_000);
  return {
    concept: ID,
    type: 'count',
    prompt: `Memory has a million cells. How many reads does it take to get the value in cell #${addr.toLocaleString()} if you already know its address?`,
    body: { kind: 'number', answer: 1, unit: 'reads' },
    explain: 'One. Knowing the address means jumping straight to it. Memory is "random access", so any cell costs the same.',
  };
};

const growthChain = (): Card =>
  pick([
    () => growthCard(ID, 'read the cell at a known address', () => 1, 0, 'Same cost at every size. A known address is a direct jump.'),
    () => growthCard(ID, 'follow a chain of n pointers', (n) => n + 1, 2, 'One read per hop, so the work grows with the chain length.'),
  ])();

const explain = explainGenerators({
  concept: ID,
  truths: [
    'Memory is one long row of numbered cells; the number is the address.',
    'Any cell can be read in one step if you know its address.',
    'A pointer is just a number that you use as an address.',
    'Following a pointer costs a read: you must look inside to learn where to go next.',
    'Two pointers can hold the same address, so both see the same data.',
  ],
  myths: [
    { text: 'Cells further along in memory take longer to read.', why: 'Random access: every address costs the same single step.' },
    { text: 'A pointer contains the data it points to.', why: 'It only contains an address. The data lives in another cell.' },
    { text: 'Memory knows which cells are pointers and which are values.', why: 'A cell is just a number. Only *how you use it* makes it a pointer.' },
    { text: 'Copying a pointer copies the data.', why: 'You get a second address to the *same* data, not a new copy of it.' },
  ],
  chains: [
    {
      prompt: 'Why does following a chain of pointers cost one read per hop?',
      steps: [
        'You only know the address of the first cell.',
        'The next address is stored *inside* that cell.',
        'So you must read the cell before you can jump.',
        'Each hop repeats this, so n hops = n reads.',
      ],
    },
    {
      prompt: 'Why can any cell be reached in one step?',
      steps: [
        'Every cell has a number: its address.',
        'Hardware can go to any address directly.',
        'So knowing the address means one jump, no searching.',
      ],
    },
  ],
  summary: {
    best: 'Memory is a long row of numbered boxes; a pointer is a box holding another box’s number.',
    others: [
      { text: 'Memory is where the computer stores information using pointers and references.', why: 'Vague: says nothing about how it works.' },
      { text: 'A pointer is a variable of pointer type that references heap-allocated memory.', why: 'Jargon. A 12-year-old learns nothing.' },
      { text: 'Pointers make things faster.', why: 'Not true in general, and it gives no mechanism.' },
    ],
  },
});

function initial(): Scene {
  const cells: Cell[] = emptyMemory();
  cells[3] = { v: 42, kind: 'val' };
  cells[10] = { v: 3, kind: 'ptr' };
  cells[17] = { v: 10, kind: 'ptr' };
  return { cells, views: [{ type: 'memory' }] };
}

export const memoryConcept: Concept = {
  id: ID,
  title: 'Memory & Pointers',
  tier: 0,
  prereqs: [],
  tagline: 'A row of numbered boxes, and boxes that hold box numbers.',
  hook: {
    problem:
      'Your program has a huge table of player scores. Two different parts of the program both need to read and update the *same* table. Copying the table to each part would be slow, and the copies would drift apart.',
    question: 'How could both parts work on the same table without copying it?',
    options: [
      { text: 'Give each part its own copy and sync them regularly.', feedback: 'That works, but it costs a copy every time, and the copies disagree between syncs. There’s a cheaper idea.' },
      { text: 'Tell both parts *where* the table is, not what’s in it.', good: true, feedback: 'Yes. If memory is numbered, "where" is just a number. Hand out the number, not the data. That number is a pointer.' },
      { text: 'Put the table in a global variable.', feedback: 'That’s actually the same idea in disguise: everyone knows its location. Let’s make "location" explicit.' },
    ],
  },
  lens: {
    layout: 'One long row of cells, each with a number (its address). A pointer is a cell whose content you treat as an address.',
    invariant: 'An address always means the same cell. Following a pointer always lands on whatever is *currently* in that cell.',
    payoff: 'Jump to any known address in one step. Share data by sharing its address: no copying.',
    price: 'You can’t skip ahead in a chain of pointers. Each hop needs a read to learn the next address.',
  },
  playground: {
    initial,
    ops: [
      {
        label: 'Write value → address',
        inputs: ['value', 'address'],
        run: (s, [value, addr]) => {
          const cells = s.cells!;
          if (addr < 0 || addr >= cells.length) return { error: `Address must be 0–${cells.length - 1}.` };
          const n = cloneScene(s);
          n.cells![addr] = { v: value, kind: 'val' };
          n.highlight = [m(addr)];
          return { scene: n, touches: 1, note: `Wrote ${value} into cell ${addr}. 1 touch.` };
        },
      },
      {
        label: 'Make address point at target',
        inputs: ['target address', 'address'],
        run: (s, [target, addr]) => {
          const cells = s.cells!;
          if (addr < 0 || addr >= cells.length || target < 0 || target >= cells.length)
            return { error: `Both numbers must be addresses 0–${cells.length - 1}.` };
          const n = cloneScene(s);
          n.cells![addr] = { v: target, kind: 'ptr' };
          n.highlight = [m(addr)];
          return { scene: n, touches: 1, note: `Cell ${addr} now holds ${target}. It's a pointer only because we'll use it as one.` };
        },
      },
      {
        label: 'Follow pointers from address',
        inputs: ['address'],
        run: (s, [addr]) => {
          const cells = s.cells!;
          if (addr < 0 || addr >= cells.length) return { error: `Address must be 0–${cells.length - 1}.` };
          const path = [addr];
          let cur = addr;
          while (cells[cur].kind === 'ptr' && cells[cur].v !== null && (cells[cur].v as number) < cells.length && path.length < 30) {
            cur = cells[cur].v as number;
            path.push(cur);
          }
          const n = cloneScene(s);
          n.highlight = path.map(m);
          return { scene: n, touches: path.length, note: `Read ${path.join(' → ')} and ended on ${cells[cur].v ?? 'empty'}. ${path.length} touches.` };
        },
      },
    ],
  },
  generators: {
    predict: [predictFollow, predictWriteThrough],
    simulate: [simulateFollow],
    count: [countChain, countDirect, growthChain],
    explain,
  },
};

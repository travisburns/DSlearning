import type { Card, Cell, Concept, Scene } from '../engine/types';
import { MEM_SIZE, cloneScene, emptyMemory, m, sprinkleGarbage } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions, options } from './helpers';

// =====================================================================
// Memory & addresses
// =====================================================================

const MEM = 'memory';

function namedScene(vars: { name: string; addr: number; v: number }[], junk = true): Scene {
  const cells = junk ? sprinkleGarbage(emptyMemory()) : emptyMemory();
  for (const x of vars) cells[x.addr] = { v: x.v, kind: 'val', label: x.name };
  return { cells, views: [{ type: 'memory' }], markers: vars.map((x) => ({ name: x.name, addr: x.addr })) };
}

const predictCopy = (): Card => {
  const [ax, ay] = distinctInts(2, 0, MEM_SIZE - 1);
  const [x0, y0, z] = distinctInts(3, 30, 99);
  return {
    concept: MEM,
    type: 'predict',
    prompt: `x lives at cell ${ax} and holds ${x0}; y lives at cell ${ay} and holds ${y0}. We run:\n\n  y = x\n  x = ${z}\n\nWhat's in y (cell ${ay}) now?`,
    scene: namedScene([
      { name: 'x', addr: ax, v: x0 },
      { name: 'y', addr: ay, v: y0 },
    ]),
    body: {
      kind: 'choice',
      options: numberOptions(
        x0,
        [
          { value: z, why: 'y got a *copy* of the number in x. Changing x afterwards doesn’t reach back into y’s cell.' },
          { value: y0, why: '"y = x" overwrote y’s old value.' },
          { value: ax, why: 'That’s x’s address. y = x copies the value inside, not the address.' },
        ],
        'y = x copies the number from x’s cell into y’s cell. After that, they are two separate cells.',
      ),
    },
    explain: `"y = x" reads cell ${ax} and writes that number into cell ${ay}. Later writes to cell ${ax} don't touch cell ${ay}: two variables means two cells.`,
  };
};

const predictRecord = (): Card => {
  const base = randInt(100, 900);
  const fields = pick([
    ['id', 'age', 'score', 'level'],
    ['x', 'y', 'z', 'w'],
    ['day', 'month', 'year', 'hour'],
  ]);
  const i = randInt(1, 3);
  return {
    concept: MEM,
    type: 'predict',
    prompt: `A record with fields (${fields.join(', ')}) is stored in 4 cells in a row, starting at address ${base}. At what address is "${fields[i]}"?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        base + i,
        [
          { value: base + i + 1, why: `Off by one: "${fields[0]}" is at the start address itself.` },
          { value: base + i - 1, why: 'Off by one the other way.' },
          { value: i, why: 'That’s the offset alone. Add the start address.' },
        ],
        'start + offset',
      ),
    },
    explain: `Fields sit in order, so "${fields[i]}" is at ${base} + ${i} = ${base + i}. Every structure you'll meet is some version of this: known start + computed offset.`,
  };
};

const simulateSwap = (): Card => {
  const [ax, ay, at] = distinctInts(3, 0, MEM_SIZE - 1);
  const [x, y] = distinctInts(2, 30, 99);
  const s0 = namedScene([
    { name: 'x', addr: ax, v: x },
    { name: 'y', addr: ay, v: y },
  ]);
  s0.cells![at] = { v: null, kind: 'free', label: 'tmp' };
  s0.markers!.push({ name: 'tmp', addr: at });
  const f1 = cloneScene(s0);
  f1.cells![at] = { v: x, kind: 'val', label: 'tmp' };
  f1.highlight = [m(at)];
  const f2 = cloneScene(f1);
  f2.cells![ax] = { v: y, kind: 'val', label: 'x' };
  f2.highlight = [m(ax)];
  const f3 = cloneScene(f2);
  f3.cells![ay] = { v: x, kind: 'val', label: 'y' };
  f3.highlight = [m(ay)];
  return {
    concept: MEM,
    type: 'simulate',
    prompt: `Swap x and y using the spare cell "tmp". A cell can only hold one number, and writing destroys what was there. Click each cell as you write to it, in order.`,
    scene: s0,
    body: {
      kind: 'click',
      expected: [m(at), m(ax), m(ay)],
      frames: [s0, f1, f2, f3],
      wrongHint: (step, t) =>
        step === 0 && (t === m(ax) || t === m(ay))
          ? 'Writing into x or y first destroys a value you still need. Save one of them somewhere safe first.'
          : step === 1 && t === m(ay)
            ? 'tmp holds x’s value, so y’s value only exists in y. Which cell can safely be overwritten now?'
            : 'Save → overwrite → restore.',
    },
    explain: 'tmp ← x, x ← y, y ← tmp. Three writes. Writing destroys, so anything you still need must be saved first. This idea comes up in every structure.',
  };
};

const countSwap = (): Card => ({
  concept: MEM,
  type: 'count',
  prompt: 'Swapping two cells using one spare cell. How many writes does it take?',
  body: { kind: 'number', answer: 3, unit: 'writes' },
  explain: 'tmp ← a, a ← b, b ← tmp. Three writes, however big memory is.',
});

const countDirect = (): Card => {
  const addr = randInt(0, 1_000_000);
  return {
    concept: MEM,
    type: 'count',
    prompt: `Memory has a million cells. How many reads does it take to get the value in cell #${addr.toLocaleString()} if you already know its address?`,
    body: { kind: 'number', answer: 1, unit: 'reads' },
    explain: 'One. Knowing the address means jumping straight to it. Memory is "random access", so any cell costs the same.',
  };
};

const growthDirect = (): Card =>
  growthCard(MEM, 'read the cell at a known address', () => 1, 0, 'Same cost at every size. A known address is a direct jump.');

const memExplain = explainGenerators({
  concept: MEM,
  truths: [
    'Memory is one long row of numbered cells; the number is the address.',
    'Any cell can be read in one step if you know its address.',
    'Writing to a cell destroys whatever was there before.',
    'A variable is just a name for one cell’s address.',
    'Assigning y = x copies the number; afterwards the two cells are independent.',
  ],
  myths: [
    { text: 'Cells further along in memory take longer to read.', why: 'Random access: every address costs the same single step.' },
    { text: 'After y = x, changing x also changes y.', why: 'y got a copy of the number. They are two separate cells.' },
    { text: 'Memory keeps the old value when you overwrite a cell.', why: 'A cell holds one number. Writing replaces it, and the old one is gone.' },
    { text: 'Memory knows what type of thing each cell holds.', why: 'A cell is just a number. Meaning comes from how the program uses it.' },
  ],
  chains: [
    {
      prompt: 'Why can any cell be reached in one step?',
      steps: ['Every cell has a number: its address.', 'Hardware can go to any address directly.', 'So knowing the address means one jump, no searching.'],
    },
    {
      prompt: 'Why does a swap need a spare cell?',
      steps: [
        'Each cell holds exactly one number.',
        'Writing a cell destroys its old number.',
        'So the first write would destroy a value you still need.',
        'Saving it in a spare cell first keeps it safe.',
      ],
    },
  ],
  summary: {
    best: 'Memory is one long row of numbered boxes, and you can open any box instantly if you know its number.',
    others: [
      { text: 'Memory is where the computer stores information.', why: 'True but empty: no mechanism.' },
      { text: 'RAM is volatile random-access storage.', why: 'Jargon that explains nothing to a beginner.' },
      { text: 'Memory is like a filing cabinet you search through.', why: 'Wrong: you never search. You go straight to the number.' },
    ],
  },
});

export const memoryConcept: Concept = {
  id: MEM,
  title: 'Memory & Addresses',
  tier: 0,
  prereqs: [],
  tagline: 'One long row of numbered boxes.',
  hook: {
    problem:
      'A computer needs to remember millions of numbers and get any one of them back instantly. Searching through them every time would be hopeless.',
    question: 'How could it find any number instantly?',
    options: [
      { text: 'Keep them in the order they arrived and scan until you find it.', feedback: 'Scanning a million items to find one is exactly the slowness we want to avoid.' },
      { text: 'Give every storage box a number, and remember the box number instead of searching.', good: true, feedback: 'Yes. Numbered boxes = addresses. If you know the number, you go straight there. That’s memory.' },
      { text: 'Sort them so searching is faster.', feedback: 'Better than scanning, but still searching. We can do better: never search at all.' },
    ],
  },
  lens: {
    layout: 'One long row of cells, each holding a single number. Each cell has a fixed number: its address.',
    invariant: 'An address always refers to the same cell. A cell holds exactly one number at a time.',
    payoff: 'Read or write any cell in one step if you know its address ("random access").',
    price: 'Writing destroys the old value. And you need to *know* the address; memory can’t find things for you.',
  },
  playground: {
    initial: () => namedScene([{ name: 'x', addr: 5, v: 42 }], false),
    guide: [
      { do: 'Type 5 in the box next to “Read address” and press it.', see: 'You get 42, the value stored in box 5 (the variable x lives there). The computer didn’t search: it went straight to box 5 by its number. That’s the whole idea of memory.' },
      { do: 'Now read box 20, then box 0.', see: 'They’re empty, but notice the work: always exactly 1 box touched, whichever box you ask for. Far-away boxes aren’t slower.' },
      { do: 'Write 99 into box 5 (value 99, address 5).', see: 'Box 5 held 42 (that’s the variable x). Now it holds 99 and the 42 is gone forever. A box holds one number; writing replaces it.' },
      { do: 'Copy from 5 to 10.', see: 'Box 10 now also holds 99, but it’s a separate copy. Write something new into box 5 and box 10 won’t change.' },
    ],
    ops: [
      {
        label: 'Write value → address',
        inputs: ['value', 'address'],
        run: (s, [value, addr]) => {
          if (addr < 0 || addr >= MEM_SIZE) return { error: `Address must be 0–${MEM_SIZE - 1}.` };
          const n = cloneScene(s);
          const old = n.cells![addr].v;
          n.cells![addr] = { ...n.cells![addr], v: value, kind: 'val' };
          n.highlight = [m(addr)];
          return { scene: n, touches: 1, note: `Cell ${addr}: ${old ?? 'empty'} → ${value}. The old value is gone. 1 touch.` };
        },
      },
      {
        label: 'Read address',
        inputs: ['address'],
        run: (s, [addr]) => {
          if (addr < 0 || addr >= MEM_SIZE) return { error: `Address must be 0–${MEM_SIZE - 1}.` };
          const n = cloneScene(s);
          n.highlight = [m(addr)];
          return { scene: n, touches: 1, note: `Cell ${addr} holds ${s.cells![addr].v ?? 'nothing'}. 1 touch, same as any other address.` };
        },
      },
      {
        label: 'Copy from → to',
        inputs: ['from', 'to'],
        run: (s, [from, to]) => {
          if ([from, to].some((a) => a < 0 || a >= MEM_SIZE)) return { error: `Addresses must be 0–${MEM_SIZE - 1}.` };
          const n = cloneScene(s);
          n.cells![to] = { ...n.cells![to], v: s.cells![from].v, kind: 'val' };
          n.highlight = [m(from), m(to)];
          return { scene: n, touches: 2, note: `Read cell ${from}, wrote cell ${to}. Now two independent cells hold the same number. 2 touches.` };
        },
      },
    ],
  },
  generators: {
    predict: [predictCopy, predictRecord],
    simulate: [simulateSwap],
    count: [countSwap, countDirect, growthDirect],
    explain: memExplain,
  },
};

// =====================================================================
// Pointers
// =====================================================================

const PTR = 'pointers';

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
    concept: PTR,
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
    concept: PTR,
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

const predictAlias = (): Card => {
  const [a, p, q] = distinctInts(3, 0, MEM_SIZE - 1);
  const [x, y] = distinctInts(2, 30, 99);
  return {
    concept: PTR,
    type: 'predict',
    prompt: `Cell ${a} holds ${x}. Pointers p (cell ${p}) and q (cell ${q}) both hold address ${a}. We write ${y} through p. Then we read through q. What do we get?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        y,
        [
          { value: x, why: 'q doesn’t have its own copy. It points at the same cell p just changed.' },
          { value: a, why: 'That’s the address inside q, not what’s there.' },
        ],
        'Both pointers lead to the same cell.',
      ),
    },
    explain: `p and q are two names for cell ${a}. Change it through one, and the other sees it. This is sharing without copying, and also the source of many surprise bugs.`,
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
    concept: PTR,
    type: 'simulate',
    prompt: `Follow the pointers by hand. Click every cell you read, starting at cell ${path[0]}, until you reach a plain value.`,
    scene,
    body: {
      kind: 'click',
      expected: path.map(m),
      frames,
      wrongHint: (step) => (step === 0 ? `Start at cell ${path[0]}.` : `Look inside the cell you just read: the number there is the next address.`),
    },
    explain: `You read ${path.length} cells: ${path.join(' → ')}. The CPU can't skip ahead. It only learns the next address by reading the current cell.`,
  };
};

const countChain = (): Card => {
  const hops = randInt(3, 9);
  return {
    concept: PTR,
    type: 'count',
    prompt: `A chain has ${hops} pointers, then a value at the end. Starting from the first pointer cell, how many cells must you read to get the value?`,
    body: { kind: 'number', answer: hops + 1, unit: 'reads' },
    explain: `${hops} pointer cells + 1 value cell = ${hops + 1}. Every hop costs a read, because you don't know the next address until you've read it.`,
  };
};

const growthChain = (): Card =>
  growthCard(PTR, 'follow a chain of n pointers', (n) => n + 1, 2, 'One read per hop, so the work grows with the chain length.');

const ptrExplain = explainGenerators({
  concept: PTR,
  truths: [
    'A pointer is just a number that you use as an address.',
    'Following a pointer costs a read: you must look inside to learn where to go next.',
    'Two pointers can hold the same address, so both see the same data.',
    'Handing out a pointer shares data without copying it.',
    'Changing where a pointer points is one write, no matter how big the data is.',
  ],
  myths: [
    { text: 'A pointer contains the data it points to.', why: 'It only contains an address. The data lives in another cell.' },
    { text: 'Memory knows which cells are pointers and which are values.', why: 'A cell is just a number. Only *how you use it* makes it a pointer.' },
    { text: 'Copying a pointer copies the data.', why: 'You get a second address to the *same* data, not a new copy of it.' },
    { text: 'You can jump to the 5th cell of a pointer chain in one step.', why: 'You only learn each address by reading the previous cell: 5 reads.' },
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
      prompt: 'Why does changing data through one pointer show up through another?',
      steps: ['Both pointers hold the same address.', 'So both lead to the same cell.', 'A write through either changes that one cell.', 'Reading through the other sees the new value.'],
    },
  ],
  summary: {
    best: 'A pointer is a box that holds another box’s number, so you can find (and share) data without copying it.',
    others: [
      { text: 'A pointer is a variable of pointer type that references heap-allocated memory.', why: 'Jargon. A 12-year-old learns nothing.' },
      { text: 'Pointers make things faster.', why: 'Not true in general, and it gives no mechanism.' },
      { text: 'A pointer is a copy of some data.', why: 'Wrong: it’s the *location*, not a copy.' },
    ],
  },
});

function ptrInitial(): Scene {
  const cells: Cell[] = emptyMemory();
  cells[3] = { v: 42, kind: 'val' };
  cells[10] = { v: 3, kind: 'ptr' };
  cells[17] = { v: 10, kind: 'ptr' };
  return { cells, views: [{ type: 'memory' }] };
}

export const pointersConcept: Concept = {
  id: PTR,
  title: 'Pointers',
  tier: 0,
  prereqs: [MEM],
  tagline: 'Boxes that hold box numbers.',
  hook: {
    problem:
      'Your program has a huge table of player scores. Two different parts of the program both need to read and update the *same* table. Copying the table to each part would be slow, and the copies would drift apart.',
    question: 'How could both parts work on the same table without copying it?',
    options: [
      { text: 'Give each part its own copy and sync them regularly.', feedback: 'That works, but it costs a copy every time, and the copies disagree between syncs. There’s a cheaper idea.' },
      { text: 'Tell both parts *where* the table is, not what’s in it.', good: true, feedback: 'Yes. Memory is numbered, so "where" is just a number. Hand out the number, not the data. That number is a pointer.' },
      { text: 'Put the table in a global variable.', feedback: 'That’s actually the same idea in disguise: everyone knows its location. Let’s make "location" explicit.' },
    ],
  },
  lens: {
    layout: 'A pointer is an ordinary cell whose number you treat as an address.',
    invariant: 'Following a pointer always lands on whatever is *currently* in the cell it names.',
    payoff: 'Share data by sharing its address: no copying. Re-aim a pointer with one write.',
    price: 'You can’t skip ahead in a chain of pointers. Each hop needs a read to learn the next address.',
  },
  playground: {
    initial: ptrInitial,
    guide: [
      { do: 'Look at box 17: it holds →10. Press “Follow pointers from address” with address 17.', see: 'Box 17 doesn’t hold data; it holds the NUMBER of another box (10). Box 10 points to 3, and box 3 holds the real value, 42. You had to read 3 boxes to get there.' },
      { do: 'Make box 20 point at box 3 (target 3, address 20), then follow from 20.', see: 'Now two different boxes lead to the same 42. That’s how two parts of a program share one piece of data without copying it.' },
      { do: 'Write 7 into box 3, then follow from 17 again.', see: 'The chain now ends at 7. Everything that points to box 3 sees the change.' },
    ],
    ops: [
      {
        label: 'Write value → address',
        inputs: ['value', 'address'],
        run: (s, [value, addr]) => {
          if (addr < 0 || addr >= MEM_SIZE) return { error: `Address must be 0–${MEM_SIZE - 1}.` };
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
          if (addr < 0 || addr >= MEM_SIZE || target < 0 || target >= MEM_SIZE) return { error: `Both numbers must be addresses 0–${MEM_SIZE - 1}.` };
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
    predict: [predictFollow, predictWriteThrough, predictAlias],
    simulate: [simulateFollow],
    count: [countChain, growthChain],
    explain: ptrExplain,
  },
};

// =====================================================================
// Bits & bytes
// =====================================================================

const BITS = 'bits';

const toBits = (n: number, width = 8) => n.toString(2).padStart(width, '0').split('').map(Number);
const PLACE = [128, 64, 32, 16, 8, 4, 2, 1];

const bitRow = (bits: number[]): Scene => ({
  views: [{ type: 'row', key: 'b', items: bits, labels: PLACE.map(String), title: 'One byte (place values under each bit)' }],
});

const predictDecimal = (): Card => {
  const width = pick([4, 5, 6]);
  const n = randInt(2 ** (width - 1), 2 ** width - 1);
  const bin = n.toString(2);
  const reversed = parseInt(bin.split('').reverse().join(''), 2);
  const ones = bin.split('').filter((c) => c === '1').length;
  return {
    concept: BITS,
    type: 'predict',
    prompt: `What number is binary ${bin}?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        n,
        [
          { value: reversed, why: 'You read the place values in the wrong direction. The rightmost bit is worth 1.' },
          { value: ones, why: 'That counts the 1-bits. Each bit is worth a different power of 2.' },
          { value: n + 1, why: 'Close: re-add the place values.' },
          { value: Number(bin) % 1000, why: 'That reads the digits as a normal decimal number.' },
        ],
        'Add the place values (…8, 4, 2, 1) wherever there’s a 1.',
      ),
    },
    explain: `${bin
      .split('')
      .map((c, i) => (c === '1' ? 2 ** (bin.length - 1 - i) : 0))
      .filter(Boolean)
      .join(' + ')} = ${n}. Each place is worth double the one to its right.`,
  };
};

const predictRange = (): Card => {
  const k = randInt(3, 16);
  return {
    concept: BITS,
    type: 'predict',
    prompt: `How many different values can ${k} bits represent?`,
    body: {
      kind: 'choice',
      options: options({ text: String(2 ** k), why: 'Each extra bit doubles the combinations.' }, [
        { text: String(2 ** k - 1), why: 'That’s the largest value (starting from 0), not how many values.' },
        { text: String(2 * k), why: 'Bits multiply possibilities, they don’t add them.' },
        { text: String(k * k), why: 'Squaring isn’t it: each bit doubles.' },
      ]),
    },
    explain: `Each bit is 0 or 1, independently: 2 × 2 × … (${k} times) = ${2 ** k}. That's why a byte (8 bits) holds 256 values, 0–255.`,
  };
};

const simulateEncode = (): Card => {
  const n = randInt(20, 255);
  const bits = toBits(n);
  const ones = bits.map((b, i) => (b ? i : -1)).filter((i) => i >= 0);
  const frames: Scene[] = [bitRow(Array(8).fill(0))];
  const cur = Array(8).fill(0);
  for (const i of ones) {
    cur[i] = 1;
    const f = bitRow([...cur]);
    f.highlight = [`b:${i}`];
    frames.push(f);
  }
  return {
    concept: BITS,
    type: 'simulate',
    prompt: `Store ${n} in this byte. Turn on bits by clicking them, starting from the biggest place value that fits and working right.`,
    scene: frames[0],
    body: {
      kind: 'click',
      expected: ones.map((i) => `b:${i}`),
      frames,
      wrongHint: (step) => {
        const remaining = n - ones.slice(0, step).reduce((sum, i) => sum + PLACE[i], 0);
        return `You still need ${remaining}. Which is the biggest place value that fits into ${remaining}?`;
      },
    },
    explain: `${n} = ${ones.map((i) => PLACE[i]).join(' + ')} → ${bits.join('')}. Greedy works because each place is worth more than all smaller places combined.`,
  };
};

const countBitsNeeded = (): Card => {
  const max = randInt(5, 5000);
  const bits = Math.ceil(Math.log2(max + 1));
  return {
    concept: BITS,
    type: 'count',
    prompt: `What's the fewest bits that can store every whole number from 0 to ${max}?`,
    body: { kind: 'number', answer: bits, unit: 'bits' },
    explain: `${bits} bits give ${2 ** bits} values (0–${2 ** bits - 1}), enough for ${max}. ${bits - 1} bits only reach ${2 ** (bits - 1) - 1}.`,
  };
};

const countBytes = (): Card => {
  const n = randInt(3, 50);
  const size = pick([
    { name: '32-bit integers', bytes: 4 },
    { name: '64-bit numbers', bytes: 8 },
    { name: '16-bit values', bytes: 2 },
  ]);
  return {
    concept: BITS,
    type: 'count',
    prompt: `How many bytes do ${n} ${size.name} take up, side by side?`,
    body: { kind: 'number', answer: n * size.bytes, unit: 'bytes' },
    explain: `${size.bytes * 8} bits = ${size.bytes} bytes each. ${n} × ${size.bytes} = ${n * size.bytes}. Size per element is the "× size" in every address formula.`,
  };
};

const growthBits = (): Card =>
  growthCard(BITS, 'count the bits needed to store numbers up to n', (n) => Math.ceil(Math.log2(n + 1)), 1, 'Doubling n adds just one bit. That is logarithmic growth, your first taste of O(log n).');

const bitsExplain = explainGenerators({
  concept: BITS,
  truths: [
    'Every cell really holds a pattern of bits, each 0 or 1.',
    'Each bit place is worth double the place to its right.',
    'k bits can represent 2^k different values.',
    'A byte is 8 bits, so it holds 256 values (0–255).',
    'Adding one bit doubles the range of values.',
  ],
  myths: [
    { text: '8 bits can hold numbers up to 256.', why: '256 *values*, but starting at 0, the biggest is 255.' },
    { text: 'The leftmost bit is worth 1.', why: 'The rightmost bit is worth 1; places grow to the left.' },
    { text: 'Doubling the numbers you store doubles the bits needed.', why: 'It adds just one bit: bits grow logarithmically.' },
    { text: 'Binary 1010 means one thousand and ten.', why: 'In binary it’s 8 + 2 = 10.' },
  ],
  chains: [
    {
      prompt: 'Why can k bits represent 2^k values?',
      steps: ['Each bit has 2 choices: 0 or 1.', 'Each bit’s choice is independent of the others.', 'So choices multiply: 2 × 2 × … k times.', 'That gives 2^k combinations.'],
    },
    {
      prompt: 'Why does storing numbers up to n need only about log₂(n) bits?',
      steps: ['Each extra bit doubles how many values you can store.', 'So to reach n, you double from 1 until you pass n.', 'The number of doublings to reach n is log₂(n).'],
    },
  ],
  summary: {
    best: 'Everything in memory is rows of on/off switches, and each extra switch doubles how many numbers you can spell.',
    others: [
      { text: 'Computers use binary because it’s efficient.', why: 'Says nothing about how it works.' },
      { text: 'A bit is a binary digit in base-2 positional notation.', why: 'Jargon without intuition.' },
      { text: 'Binary is just 1s and 0s.', why: 'Misses place value and doubling, the whole point.' },
    ],
  },
});

export const bitsConcept: Concept = {
  id: BITS,
  title: 'Bits & Bytes',
  tier: 0,
  prereqs: [MEM],
  tagline: 'What a cell is really made of.',
  hook: {
    problem: 'Hardware can only store "on" or "off" in each tiny switch. Yet cells hold numbers like 42 or 200.',
    question: 'How do on/off switches spell numbers?',
    options: [
      { text: 'Count how many switches are on.', feedback: 'Then 8 switches only spell 0–8. Wasteful: the *pattern* carries much more.' },
      { text: 'Give each switch a place value that doubles: 1, 2, 4, 8, …', good: true, feedback: 'Yes. Like decimal places (1, 10, 100), but doubling. 8 switches spell 0–255.' },
      { text: 'Use one switch per possible number.', feedback: 'Then 256 values would need 256 switches instead of 8.' },
    ],
  },
  lens: {
    layout: 'A cell is a fixed number of bits (8 per byte). Each bit place is worth a power of 2.',
    invariant: 'Position decides value: the same bits in a different order mean a different number.',
    payoff: 'k bits spell 2^k values: range doubles with each bit added.',
    price: 'Fixed width means a fixed range. A value too big for its bits overflows.',
  },
  generators: {
    predict: [predictDecimal, predictRange],
    simulate: [simulateEncode],
    count: [countBitsNeeded, countBytes, growthBits],
    explain: bitsExplain,
  },
};

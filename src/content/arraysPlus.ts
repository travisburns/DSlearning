import type { Card, Cell, Concept, Scene } from '../engine/types';
import { cloneScene, emptyMemory, m, sprinkleGarbage } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle, values } from '../engine/random';
import { explainGenerators, growthCard, numberOptions } from './helpers';

// =====================================================================
// 2D array (matrix)
// =====================================================================

const MAT = 'matrix';

function matrixScene(rows: number, cols: number) {
  const base = randInt(0, 24 - rows * cols);
  const vals = values(rows * cols);
  let cells: Cell[] = emptyMemory();
  vals.forEach((v, k) => (cells[base + k] = { v, kind: 'val', label: `${Math.floor(k / cols)},${k % cols}` }));
  cells = sprinkleGarbage(cells);
  const grid = Array.from({ length: rows }, (_, r) => vals.slice(r * cols, r * cols + cols));
  const scene: Scene = {
    cells,
    views: [
      { type: 'grid', key: 'g', rows: grid, rowLabels: grid.map((_, r) => `r${r}`), colLabels: grid[0].map((_, c) => `c${c}`), title: `The picture: ${rows} × ${cols} grid` },
      { type: 'memory' },
    ],
    markers: [{ name: 'base', addr: base }],
  };
  return { base, vals, grid, scene };
}

const predictMatrixAddr = (): Card => {
  const base = randInt(100, 500);
  const rows = randInt(3, 9);
  const cols = randInt(3, 9);
  const r = randInt(1, rows - 1);
  const c = randInt(1, cols - 1);
  const ans = base + r * cols + c;
  return {
    concept: MAT,
    type: 'predict',
    prompt: `A ${rows} × ${cols} grid (rows × columns) is stored row by row starting at address ${base}, one cell per element. Where is A[${r}][${c}]?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        ans,
        [
          { value: base + c * rows + r, why: 'That’s column-by-column layout. Here, whole rows are stored one after another.' },
          { value: base + r + c, why: 'Each row step skips a whole row of cells, not just one.' },
          { value: base + r * rows + c, why: 'A row is as long as the number of *columns*, not rows.' },
          { value: ans + 1, why: 'Off by one: A[0][0] is at the base.' },
        ],
        'base + row × (cells per row) + col',
      ),
    },
    explain: `Skip ${r} full rows of ${cols} cells, then ${c} more: ${base} + ${r}×${cols} + ${c} = ${ans}. A 2D grid is really a 1D array with arithmetic on top.`,
  };
};

const predictNeighbour = (): Card => {
  const cols = randInt(4, 12);
  return {
    concept: MAT,
    type: 'predict',
    prompt: `In a grid with ${cols} columns stored row by row, how far apart in memory are A[r][c] and the element directly *below* it, A[r+1][c]?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        cols,
        [
          { value: 1, why: 'That’s the element to the right. Below means a whole row later.' },
          { value: cols + 1, why: 'Off by one: exactly one row length apart.' },
          { value: cols - 1, why: 'Off by one: exactly one row length apart.' },
        ],
        'One full row apart.',
      ),
    },
    explain: `Moving down skips a whole row: ${cols} cells. That's why scanning row by row reads neighbouring cells, while scanning column by column jumps ${cols} cells each step.`,
  };
};

const simulateMatrixFind = (): Card => {
  const rows = randInt(2, 4);
  const cols = randInt(3, 5);
  const { base, scene } = matrixScene(rows, cols);
  const targets = distinctInts(2, 0, rows * cols - 1);
  const coords = targets.map((k) => [Math.floor(k / cols), k % cols]);
  const clean = cloneScene(scene);
  clean.cells = clean.cells!.map((c) => (c.label ? { ...c, label: undefined } : c));
  const frames = [clean];
  targets.forEach((k) => {
    const f = cloneScene(frames[frames.length - 1]);
    f.highlight = [...(f.highlight ?? []), m(base + k)];
    frames.push(f);
  });
  return {
    concept: MAT,
    type: 'simulate',
    prompt: `The grid is stored row by row from "base" (${base}). In the MEMORY row, click A[${coords[0][0]}][${coords[0][1]}], then A[${coords[1][0]}][${coords[1][1]}]. Work out the address; the grid is only the picture.`,
    scene: clean,
    body: {
      kind: 'click',
      expected: targets.map((k) => m(base + k)),
      frames,
      wrongHint: (step, t) =>
        t.startsWith('g:')
          ? 'That’s the picture. The computer only has the memory row. Find it there.'
          : `Address = base + row × ${cols} + col = ${base} + ${coords[step][0]}×${cols} + ${coords[step][1]}.`,
    },
    explain: `A[${coords[0][0]}][${coords[0][1]}] → ${base + targets[0]}, A[${coords[1][0]}][${coords[1][1]}] → ${base + targets[1]}. Rows sit end to end.`,
  };
};

const countMatrix = (): Card => {
  const rows = randInt(3, 40);
  const cols = randInt(3, 40);
  const r = randInt(0, rows - 1);
  return pick([
    {
      concept: MAT,
      type: 'count' as const,
      prompt: `A ${rows} × ${cols} grid stored row by row. How many cells does the whole grid occupy?`,
      body: { kind: 'number' as const, answer: rows * cols, unit: 'cells' },
      explain: `${rows} rows × ${cols} cells each = ${rows * cols}. No gaps, no extra bookkeeping.`,
    },
    {
      concept: MAT,
      type: 'count' as const,
      prompt: `A ${rows} × ${cols} grid. Inserting a brand-new row at index ${r} means every later element shifts. How many elements move?`,
      body: { kind: 'number' as const, answer: (rows - r) * cols, unit: 'moves' },
      explain: `Rows ${r}..${rows - 1} (${rows - r} rows × ${cols}) all shift down one row length. It's the static-array insert, a row at a time.`,
    },
  ]);
};

const growthMatrix = (): Card =>
  growthCard(MAT, 'read A[r][c] in an n × n grid', () => 1, 0, 'One multiply-add and one read. The grid’s size doesn’t matter.');

const matExplain = explainGenerators({
  concept: MAT,
  truths: [
    'A 2D grid is stored as one long 1D block, one row after another.',
    'A[r][c] lives at base + r × (number of columns) + c.',
    'Elements side by side in a row are neighbours in memory.',
    'Elements one above another are a whole row length apart in memory.',
    'Reading any element is one calculation and one read.',
  ],
  myths: [
    { text: 'Memory is 2D, so the grid is stored as a grid.', why: 'Memory is one long row. The grid is arithmetic laid on top.' },
    { text: 'A[r][c] is at base + r + c.', why: 'Moving down a row skips a whole row of cells, not one.' },
    { text: 'Scanning by columns reads neighbouring cells.', why: 'Down a column, each step jumps a full row length.' },
    { text: 'Finding A[50][50] means walking through the first 50 rows.', why: 'You compute the address directly: one step.' },
  ],
  chains: [
    {
      prompt: 'Why is A[r][c] at base + r × cols + c?',
      steps: [
        'Memory is a single row of cells.',
        'So the grid’s rows are placed one after another.',
        'Getting to row r means skipping r full rows of cols cells.',
        'Then step c more cells into that row.',
      ],
    },
  ],
  summary: {
    best: 'A grid is secretly one long row: the rows are laid end to end, so you find a spot by skipping whole rows and then counting across.',
    others: [
      { text: 'A 2D array is an array of arrays.', why: 'Only sometimes, and it doesn’t explain the layout or the cost.' },
      { text: 'A matrix stores data in rows and columns.', why: 'That’s the picture, not how memory holds it.' },
      { text: 'A grid is stored like a spreadsheet.', why: 'Hides the key fact: memory is 1D.' },
    ],
  },
});

export const matrixConcept: Concept = {
  id: MAT,
  title: '2D Array (Matrix)',
  tier: 1,
  prereqs: ['static-array'],
  tagline: 'A grid that’s secretly one long row.',
  hook: {
    problem: 'A chess board, a spreadsheet, an image: all grids. But memory is one long row of cells, not a grid.',
    question: 'How do you fit a grid into a single row and still find any square instantly?',
    options: [
      { text: 'Store each square with its row and column written next to it, and search.', feedback: 'That triples the memory and makes you search. Keep it arithmetic.' },
      { text: 'Lay the rows end to end; square (r, c) is r whole rows plus c cells in.', good: true, feedback: 'Yes. "Row-major" layout: one multiply and one add gets any square.' },
      { text: 'Store a separate array per row and chain them with pointers.', feedback: 'Possible (a "jagged" array), but then you pay a pointer hop. The flat version needs none.' },
    ],
  },
  lens: {
    layout: 'One contiguous block. Row 0 first, then row 1, and so on. A[r][c] is at base + r × cols + c.',
    invariant: 'Every row has exactly `cols` cells and rows sit back to back, with no gaps.',
    payoff: 'Any element in O(1). Walking along a row reads neighbouring cells, which is very cache-friendly.',
    price: 'Fixed shape: adding a row or column means moving lots of elements. Walking down a column jumps around memory.',
  },
  generators: {
    predict: [predictMatrixAddr, predictNeighbour],
    simulate: [simulateMatrixFind],
    count: [countMatrix, growthMatrix],
    explain: matExplain,
  },
};

// =====================================================================
// Dynamic array
// =====================================================================

const DYN = 'dynamic-array';

/** Total element copies made while appending n items, starting at capacity 1 and doubling when full. */
export function doublingCopies(n: number): number {
  let cap = 1;
  let copies = 0;
  for (let len = 0; len < n; len++) {
    if (len === cap) {
      copies += len;
      cap *= 2;
    }
  }
  return copies;
}

const capacityAfter = (n: number) => {
  let cap = 1;
  while (cap < n) cap *= 2;
  return cap;
};

function dynScene(oldBase: number, items: number[], newBase: number | null, newCap: number, extraSize = 24): Scene {
  let cells: Cell[] = emptyMemory(extraSize);
  items.forEach((v, k) => (cells[oldBase + k] = { v, kind: 'val', label: `[${k}]` }));
  if (newBase !== null) for (let k = 0; k < newCap; k++) cells[newBase + k] = { v: null, kind: 'free', label: `new[${k}]` };
  cells = sprinkleGarbage(cells, 0.2);
  const markers = [{ name: 'old', addr: oldBase }];
  if (newBase !== null) markers.push({ name: 'new', addr: newBase });
  return { cells, views: [{ type: 'memory' }], markers };
}

const predictGrow = (): Card => {
  const cap = pick([2, 4, 8, 16, 32]);
  return {
    concept: DYN,
    type: 'predict',
    prompt: `A dynamic array has capacity ${cap} and holds ${cap} items: it's full. You append one more. What's the capacity afterwards (doubling strategy)?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        cap * 2,
        [
          { value: cap + 1, why: 'Growing by one means copying everything on *every* append. That’s the trap doubling avoids.' },
          { value: cap, why: 'It’s full: there’s no room without growing.' },
          { value: cap * 4, why: 'Doubling, not quadrupling.' },
        ],
        'Double the capacity, copy the items, then append.',
      ),
    },
    explain: `New block of ${cap * 2}, copy ${cap} items, write the new one. Now there are ${cap - 1} free slots, so the next ${cap - 1} appends are cheap.`,
  };
};

const predictCapAfterN = (): Card => {
  const n = randInt(5, 100);
  const cap = capacityAfter(n);
  return {
    concept: DYN,
    type: 'predict',
    prompt: `A dynamic array starts with capacity 1 and doubles whenever it's full. After ${n} appends, what's its capacity?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        cap,
        [
          { value: n, why: 'Capacity only jumps at powers of 2, so it’s usually bigger than the count.' },
          { value: cap / 2, why: 'That’s too small to hold ' + n + ' items.' },
          { value: cap * 2, why: 'One doubling too many.' },
        ],
        'The smallest power of 2 that fits all the items.',
      ),
    },
    explain: `Capacities go 1, 2, 4, 8, … The first one ≥ ${n} is ${cap}. At most half the space is ever wasted.`,
  };
};

const predictStalePointer = (): Card => ({
  concept: DYN,
  type: 'predict',
  prompt: 'You save the address of arr[0] in a pointer p. Then you append to arr, and the append triggers a grow. What does p point to now?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'The old block, which has been given back and may hold garbage.', correct: true, why: 'Growing moves everything to a new block. p still holds the old address.' },
      { text: 'The new arr[0]: pointers update automatically.', correct: false, why: 'Nothing updates p. It’s just a number: the old address.' },
      { text: 'arr[1], because everything shifted.', correct: false, why: 'Nothing shifted within the block. The whole block moved elsewhere.' },
      { text: 'Nothing: p becomes null.', correct: false, why: 'p is unchanged. That’s the danger: it still looks valid.' },
    ]),
  },
  explain: 'A grow allocates a new block and copies into it. Any saved address into the old block is now stale. This is why you hold indexes, not addresses, into dynamic arrays.',
});

const simulateGrow = (): Card => {
  const cap = randInt(3, 5);
  const oldBase = randInt(0, 2);
  const newBase = randInt(oldBase + cap + 1, 24 - 2 * cap);
  const items = values(cap);
  const [v] = distinctInts(1, 100, 199);
  const s0 = dynScene(oldBase, items, newBase, cap * 2);
  const frames: Scene[] = [s0];
  let cur = s0;
  const expected: string[] = [];
  for (let k = 0; k <= cap; k++) {
    cur = cloneScene(cur);
    cur.cells![newBase + k] = { v: k < cap ? items[k] : v, kind: 'val', label: `new[${k}]` };
    cur.highlight = [m(newBase + k)];
    expected.push(m(newBase + k));
    frames.push(cur);
  }
  return {
    concept: DYN,
    type: 'simulate',
    prompt: `The array (capacity ${cap}, at "old") is full, and you're appending ${v}. A new block of ${cap * 2} has been reserved at "new". Click each cell as you write it: copy the items across in order, then write ${v}.`,
    scene: s0,
    body: {
      kind: 'click',
      expected,
      frames,
      wrongHint: (step, t) => {
        const a = Number(t.slice(2));
        if (a >= oldBase && a < oldBase + cap) return 'The old block is full and about to be freed. Writes go to the new block.';
        return step < cap ? `Copy old[${step}] into new[${step}].` : `All copied. ${v} goes right after the last copied item.`;
      },
    },
    explain: `${cap} copies + 1 write. Expensive once, but it buys ${cap - 1} cheap appends afterwards.`,
  };
};

const countTotalCopies = (): Card => {
  const n = randInt(5, 70);
  const copies = doublingCopies(n);
  return {
    concept: DYN,
    type: 'count',
    prompt: `Start with capacity 1. Append ${n} items, doubling whenever full (copying every item into the new block). How many item-copies happen in total?`,
    body: { kind: 'number', answer: copies, unit: 'copies' },
    explain: `Grows happen when the length hits 1, 2, 4, 8, …: copies = 1 + 2 + 4 + … = ${copies}. That's always less than ${n}: fewer copies than items!`,
  };
};

const countPlusOne = (): Card => {
  const n = randInt(5, 20);
  const copies = (n * (n - 1)) / 2;
  return {
    concept: DYN,
    type: 'count',
    prompt: `Bad idea: grow by just +1 each time. Start with capacity 1 holding nothing, append ${n} items. Each append beyond the first must copy all existing items. How many copies in total?`,
    body: { kind: 'number', answer: copies, unit: 'copies' },
    explain: `0 + 1 + 2 + … + ${n - 1} = ${copies}. Grows with n², where doubling stays under n. That gap is why doubling exists.`,
  };
};

const growthAmortized = (): Card =>
  pick([
    () =>
      growthCard(
        DYN,
        'total touches for n appends ÷ n (doubling)',
        (n) => Math.round(((n + doublingCopies(n)) / n) * 100) / 100,
        0,
        'The average stays under 2 no matter how big n gets. The rare big copies are "paid for" by the many cheap appends. That is amortized O(1).',
      ),
    () => growthCard(DYN, 'total copies for n appends when growing by +1', (n) => (n * (n - 1)) / 2, 3, 'Every append copies everything: 1 + 2 + … + n, about n²/2.'),
  ])();

const dynExplain = explainGenerators({
  concept: DYN,
  truths: [
    'A dynamic array is a static array plus spare capacity.',
    'When it’s full, it allocates a bigger block and copies everything over.',
    'Doubling the capacity makes appends cost O(1) on average.',
    'A grow moves the data, so old addresses into it become invalid.',
    'Reading arr[i] is still one calculation and one read.',
  ],
  myths: [
    { text: 'Every append costs a full copy.', why: 'Only appends that hit a full block copy; doubling makes those rare.' },
    { text: 'The array grows in place, extending into the next cells.', why: 'The next cells may belong to someone else. It moves to a new block.' },
    { text: 'Growing by +1 is just as good if you do it often.', why: 'That copies everything every time: n²/2 total work.' },
    { text: 'A dynamic array is secretly a linked list.', why: 'It’s still one contiguous block, which is why indexing stays O(1).' },
  ],
  chains: [
    {
      prompt: 'Why is appending O(1) on average?',
      steps: [
        'A grow doubles the capacity.',
        'So after copying k items, there are k free slots.',
        'The next k appends are cheap single writes.',
        'Spread over those appends, the big copy costs about 1 extra per append.',
      ],
    },
    {
      prompt: 'Why does a grow need a whole new block?',
      steps: [
        'An array must be one contiguous block.',
        'The cells right after it may already be in use.',
        'So a bigger contiguous block must be found elsewhere.',
        'Everything is copied there, and the old block is freed.',
      ],
    },
  ],
  summary: {
    best: 'It’s an array with spare room; when the room runs out it moves into a place twice as big, so moving is rare.',
    others: [
      { text: 'A dynamic array resizes automatically.', why: 'Hides how and what it costs.' },
      { text: 'It has amortized O(1) append.', why: 'Just the fact, with no reason behind it.' },
      { text: 'It grows one slot at a time as needed.', why: 'Wrong, and that version would be slow.' },
    ],
  },
});

function dynPlayInitial(): Scene {
  const cells = emptyMemory(32);
  cells[0] = { v: 7, kind: 'val', label: '[0]' };
  cells[1] = { v: null, kind: 'free', label: '[1]' };
  return { cells, views: [{ type: 'array', base: 0, length: 1, capacity: 2, title: 'Dynamic array' }, { type: 'memory' }], markers: [{ name: 'base', addr: 0 }] };
}

export const dynamicArrayConcept: Concept = {
  id: DYN,
  title: 'Dynamic Array',
  tier: 1,
  prereqs: ['static-array'],
  tagline: 'An array that moves house when it runs out of room.',
  hook: {
    problem: 'A static array can’t grow: the cells right after it might belong to something else. But you don’t know in advance how many items you’ll get.',
    question: 'How do you let an array keep growing?',
    options: [
      { text: 'When it’s full, move to a new block one slot bigger.', feedback: 'Then every single append copies everything: n appends cost about n²/2 copies. Ouch.' },
      { text: 'When it’s full, move to a block twice as big.', good: true, feedback: 'Yes. Copying is rare: after copying k items you get k cheap appends. Average cost per append stays constant.' },
      { text: 'Reserve a huge block up front.', feedback: 'Wastes memory, and still fails if you guess too small.' },
    ],
  },
  lens: {
    layout: 'A static array block with spare capacity at the end, plus a length and a capacity.',
    invariant: 'Items fill slots 0..length−1 with no gaps; length ≤ capacity.',
    payoff: 'O(1) indexing like any array, and appends that are O(1) on average.',
    price: 'Occasional O(n) grows (a big pause), up to half the space unused, and grows invalidate saved addresses.',
  },
  playground: {
    initial: dynPlayInitial,
    ops: [
      {
        label: 'Append value',
        inputs: ['value'],
        run: (s, [v]) => {
          const arr = s.views.find((x) => x.type === 'array') as Extract<Scene['views'][number], { type: 'array' }>;
          const { base, length, capacity = length } = arr;
          const n = cloneScene(s);
          const nArr = n.views.find((x) => x.type === 'array') as typeof arr;
          if (length < capacity) {
            n.cells![base + length] = { v, kind: 'val', label: `[${length}]` };
            nArr.length = length + 1;
            n.highlight = [m(base + length)];
            return { scene: n, touches: 1, note: `Room available: wrote ${v} at [${length}]. 1 touch.` };
          }
          const newCap = capacity * 2;
          const newBase = base + capacity;
          if (newBase + newCap > n.cells!.length) return { error: 'Out of demo memory. Reset to try again.' };
          for (let k = 0; k < newCap; k++) n.cells![newBase + k] = k < length ? { ...s.cells![base + k] } : { v: null, kind: 'free', label: `[${k}]` };
          n.cells![newBase + length] = { v, kind: 'val', label: `[${length}]` };
          for (let k = 0; k < capacity; k++) n.cells![base + k] = { v: s.cells![base + k].v, kind: 'free' };
          nArr.base = newBase;
          nArr.length = length + 1;
          nArr.capacity = newCap;
          n.markers = [{ name: 'base', addr: newBase }];
          n.highlight = Array.from({ length: length + 1 }, (_, k) => m(newBase + k));
          return { scene: n, touches: length + 1, note: `Full! New block of ${newCap} at ${newBase}, copied ${length} items, wrote ${v}. ${length + 1} touches. The old block is now garbage.` };
        },
      },
      {
        label: 'Read [i]',
        inputs: ['index'],
        run: (s, [i]) => {
          const arr = s.views.find((x) => x.type === 'array') as Extract<Scene['views'][number], { type: 'array' }>;
          if (i < 0 || i >= arr.length) return { error: `Index must be 0–${arr.length - 1}.` };
          const n = cloneScene(s);
          n.highlight = [m(arr.base + i)];
          return { scene: n, touches: 1, note: `arr[${i}] = ${s.cells![arr.base + i].v}. Still 1 touch.` };
        },
      },
    ],
  },
  generators: {
    predict: [predictGrow, predictCapAfterN, predictStalePointer],
    simulate: [simulateGrow],
    count: [countTotalCopies, countPlusOne, growthAmortized],
    explain: dynExplain,
  },
};

// =====================================================================
// String
// =====================================================================

const STR = 'string';

const WORDS = ['apple', 'apply', 'banana', 'bandit', 'cable', 'candle', 'carbon', 'cargo', 'data', 'datum', 'plane', 'planet', 'stack', 'stamp', 'trace', 'track', 'queue', 'quest'];

const strRow = (key: string, s: string, title: string): Scene['views'][number] => ({ type: 'row', key, items: s.split(''), title });

const predictCharCode = (): Card => {
  const off = randInt(2, 20);
  const upper = pick([true, false]);
  const start = upper ? 65 : 97;
  const ch = String.fromCharCode(start + off);
  return {
    concept: STR,
    type: 'predict',
    prompt: `Characters are stored as numbers. '${upper ? 'A' : 'a'}' is ${start}, and letters are numbered in alphabetical order. What number is '${ch}'?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        start + off,
        [
          { value: start + off + 1, why: `Off by one: '${upper ? 'A' : 'a'}' itself is ${start}.` },
          { value: start + off - 1, why: 'Off by one the other way.' },
          { value: off + 1, why: 'That’s its position in the alphabet, not its code.' },
        ],
        `${start} + ${off}`,
      ),
    },
    explain: `'${ch}' is ${off} letters after '${upper ? 'A' : 'a'}': ${start} + ${off} = ${start + off}. A string is just an array of these numbers.`,
  };
};

const predictConcatCost = (): Card => {
  const [a, b] = shuffle(WORDS).slice(0, 2);
  return {
    concept: STR,
    type: 'predict',
    prompt: `Strings are immutable (like in C#). s = "${a}". Then s = s + "${b}". How many characters get written?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        a.length + b.length,
        [
          { value: b.length, why: 'You can’t add onto an immutable string. A whole new one is built.' },
          { value: a.length, why: 'Both parts end up in the new string.' },
          { value: 1, why: 'Concatenation writes every character of the result.' },
        ],
        'A brand-new string of the combined length is built.',
      ),
    },
    explain: `New string of ${a.length} + ${b.length} = ${a.length + b.length} characters, all written. The old "${a}" is left behind. Do this in a loop and it adds up fast.`,
  };
};

function firstDiff(a: string, b: string) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

const predictCompare = (): Card => {
  const pairs = WORDS.flatMap((a) => WORDS.filter((b) => b !== a && firstDiff(a, b) >= 2 && firstDiff(a, b) < Math.min(a.length, b.length)).map((b) => [a, b]));
  const [a, b] = pick(pairs);
  const d = firstDiff(a, b);
  const comps = d + 1;
  return {
    concept: STR,
    type: 'predict',
    prompt: `Comparing "${a}" and "${b}" alphabetically goes character by character from the left. How many character comparisons until it knows the answer?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        comps,
        [
          { value: Math.max(a.length, b.length), why: 'It stops at the first difference. No need to read the rest.' },
          { value: 1, why: 'The first characters match, so it has to keep going.' },
          { value: d, why: 'It also has to compare the position where they differ.' },
        ],
        'Stop at the first position that differs.',
      ),
    },
    explain: `They match for ${d} character${d === 1 ? '' : 's'}, then differ at position ${d}: ${comps} comparisons. Comparing strings isn't one step. It costs up to the length of the shorter string.`,
  };
};

const simulateCompare = (): Card => {
  const pairs = WORDS.flatMap((a) => WORDS.filter((b) => b !== a && firstDiff(a, b) >= 1 && firstDiff(a, b) < Math.min(a.length, b.length)).map((b) => [a, b]));
  const [a, b] = pick(pairs);
  const d = firstDiff(a, b);
  const base: Scene = { views: [strRow('a', a, `a = "${a}"`), strRow('b', b, `b = "${b}"`)] };
  const frames: Scene[] = [base];
  for (let i = 0; i <= d; i++) frames.push({ ...cloneScene(base), highlight: Array.from({ length: i + 1 }, (_, k) => [`a:${k}`, `b:${k}`]).flat() });
  return {
    concept: STR,
    type: 'simulate',
    prompt: `Compare the two strings by hand. Click each position of string a as you compare it with b, and stop at the first difference.`,
    scene: base,
    body: {
      kind: 'click',
      expected: Array.from({ length: d + 1 }, (_, i) => `a:${i}`),
      frames,
      wrongHint: (step) => (step === 0 ? 'Start at position 0.' : `a[${step - 1}] = b[${step - 1}], so move one position right.`),
    },
    explain: `Positions 0..${d - 1} match; at ${d}, '${a[d]}' vs '${b[d]}' decides it: "${a < b ? a : b}" comes first. ${d + 1} comparisons.`,
  };
};

const countConcatLoop = (): Card => {
  const n = randInt(4, 15);
  return {
    concept: STR,
    type: 'count',
    prompt: `With immutable strings, you build a string of ${n} characters by appending one character at a time: s = s + c, starting from "". How many characters get written in total?`,
    body: { kind: 'number', answer: (n * (n + 1)) / 2, unit: 'writes' },
    explain: `Each step rebuilds the whole string: 1 + 2 + … + ${n} = ${(n * (n + 1)) / 2}. A StringBuilder (a dynamic array of chars) would write about ${n}.`,
  };
};

const growthConcat = (): Card =>
  pick([
    () => growthCard(STR, 'build a length-n string with s = s + c (immutable)', (n) => (n * (n + 1)) / 2, 3, 'Every append copies the whole string so far: about n²/2.'),
    () => growthCard(STR, 'read s[i]', () => 1, 0, 'A string is an array. Indexing is O(1).'),
    () => growthCard(STR, 'check if two length-n strings are equal (they are)', (n) => n, 2, 'Equal strings must be compared all the way to the end.'),
  ])();

const strExplain = explainGenerators({
  concept: STR,
  truths: [
    'A string is an array of character codes.',
    'Each character is stored as a number, like ‘A’ = 65.',
    'Comparing strings goes character by character and stops at the first difference.',
    'Immutable strings can’t change, so “adding” builds a whole new string.',
    'Building a string one piece at a time is best done with a growable buffer.',
  ],
  myths: [
    { text: 'Comparing two strings is a single step.', why: 'It walks the characters: up to the length of the shorter string.' },
    { text: 's = s + "x" just writes one character.', why: 'With immutable strings it copies all of s into a new string.' },
    { text: 'Getting s[i] means scanning from the start.', why: 'It’s an array: base + i, one step.' },
    { text: 'Characters are stored as little pictures of letters.', why: 'They’re numbers. The font draws the picture later.' },
  ],
  chains: [
    {
      prompt: 'Why is building a string with s = s + c in a loop slow?',
      steps: ['Strings are immutable, so s can’t be extended.', 'Each + builds a brand-new string.', 'That copies every character so far.', 'Over n steps that’s 1 + 2 + … + n ≈ n²/2 writes.'],
    },
    {
      prompt: 'Why does comparing strings cost more than comparing numbers?',
      steps: ['A string is many character codes in a row.', 'Two strings can share a long common start.', 'You must check each position until they differ.', 'So the cost grows with the string length.'],
    },
  ],
  summary: {
    best: 'A string is an array of letter-numbers; comparing walks it letter by letter, and “changing” an immutable one really builds a new one.',
    others: [
      { text: 'A string is text.', why: 'That’s the picture, not the mechanism.' },
      { text: 'Strings are sequences of UTF-16 code units.', why: 'Jargon; no intuition about cost.' },
      { text: 'Strings are special and fast to work with.', why: 'They’re arrays with the same costs, plus immutability traps.' },
    ],
  },
});

export const stringConcept: Concept = {
  id: STR,
  title: 'String',
  tier: 1,
  prereqs: ['static-array', 'bits'],
  tagline: 'An array of letter-numbers, with a copying trap.',
  hook: {
    problem: 'Memory only stores numbers, but programs are full of names, messages and words.',
    question: 'How would you store the word "cat"?',
    options: [
      { text: 'Give every possible word its own number.', feedback: 'There are endless possible words. You’d never finish the list.' },
      { text: 'Give every letter a number and store the letters side by side.', good: true, feedback: 'Yes. A string is an array of character codes: c=99, a=97, t=116.' },
      { text: 'Store each letter in a linked chain.', feedback: 'Works, but then s[5] costs 5 hops. An array gets it in one.' },
    ],
  },
  lens: {
    layout: 'An array of character codes, plus its length.',
    invariant: 'Characters stay in order, no gaps. Immutable strings never change once built.',
    payoff: 'O(1) access to any character. Immutable strings can be shared safely by many owners.',
    price: 'Comparing and searching cost O(length). Changing an immutable string means building a new one: repeated + is O(n²).',
  },
  generators: {
    predict: [predictCharCode, predictConcatCost, predictCompare],
    simulate: [simulateCompare],
    count: [countConcatLoop, growthConcat],
    explain: strExplain,
  },
};

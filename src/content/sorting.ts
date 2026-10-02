import type { Card, Concept, Scene, Val } from '../engine/types';
import { cloneScene, fmtArray } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, options } from './helpers';

const row = (items: Val[], title: string, key = 'a', labels?: string[]): Scene => ({ views: [{ type: 'row', key, items, title, labels }] });
const clickFrames = (base: Scene, expected: string[]) => {
  const frames = [base];
  expected.forEach((_, i) => frames.push({ ...cloneScene(base), highlight: expected.slice(0, i + 1) }));
  return frames;
};

// =====================================================================
// Insertion sort
// =====================================================================

const INS = 'insertion-sort';

function insertStep(a: number[], k: number): number[] {
  const b = [...a];
  const key = b[k];
  let j = k - 1;
  while (j >= 0 && b[j] > key) {
    b[j + 1] = b[j];
    j--;
  }
  b[j + 1] = key;
  return b;
}
const inversions = (a: number[]) => a.reduce((s, x, i) => s + a.slice(i + 1).filter((y) => y < x).length, 0);

const predictPass = (): Card => {
  const a = distinctInts(randInt(5, 7), 1, 50);
  const k = randInt(2, a.length - 1);
  let b = [...a];
  for (let i = 1; i < k; i++) b = insertStep(b, i);
  const after = insertStep(b, k);
  return {
    concept: INS,
    type: 'predict',
    prompt: `Insertion sort. The first ${k} values are already sorted: ${fmtArray(b)}. Now insert ${b[k]} (index ${k}) into the sorted part. What does the array look like?`,
    body: {
      kind: 'choice',
      options: options({ text: fmtArray(after), why: `${b[k]} slides left past every bigger value in the sorted part.` }, [
        { text: fmtArray([...b].sort((x, y) => x - y)), why: 'That sorts everything at once. Only one value is inserted per step.' },
        { text: fmtArray(b), why: 'Nothing moved, but it may need to.' },
        { text: fmtArray([b[k], ...b.slice(0, k), ...b.slice(k + 1)]), why: `${b[k]} only moves past values bigger than it.` },
      ]),
    },
    explain: `The sorted part grows by one: ${fmtArray(after.slice(0, k + 1))}. The rest waits its turn.`,
  };
};

const simulateInsert = (): Card => {
  let a: number[];
  let k: number;
  let writes: number[];
  do {
    const sorted = distinctInts(randInt(4, 6), 10, 90).sort((x, y) => x - y);
    const key = randInt(1, 95);
    if (sorted.includes(key)) continue;
    a = [...sorted, key, ...distinctInts(2, 1, 99).filter((x) => !sorted.includes(x) && x !== key)];
    k = sorted.length;
    writes = [];
    let j = k - 1;
    while (j >= 0 && a[j] > key) {
      writes.push(j + 1);
      j--;
    }
    writes.push(j + 1);
  } while (!writes! || writes!.length < 3);
  const key = a![k!];
  const frames: Scene[] = [row([...a!], 'Array (sorted part on the left)')];
  const cur = [...a!];
  writes!.forEach((w, i) => {
    cur[w] = i === writes!.length - 1 ? key : cur[w - 1];
    frames.push({ ...row([...cur], 'Array'), highlight: [`a:${w}`] });
  });
  return {
    concept: INS,
    type: 'simulate',
    prompt: `Insert ${key} (index ${k!}) into the sorted part. Click each position as you write to it: shift bigger values right one at a time (from right to left), then write ${key} into the gap.`,
    scene: frames[0],
    body: {
      kind: 'click',
      expected: writes!.map((w) => `a:${w}`),
      frames,
      wrongHint: (step) => (step === writes!.length - 1 ? `Everything bigger than ${key} has shifted. Write ${key} into the gap.` : `Is the value to the left bigger than ${key}? Then it shifts right into this slot.`),
    },
    explain: `${writes!.length - 1} shifts + 1 write. Values already in order don’t move at all, which is why insertion sort is fast on nearly-sorted data.`,
  };
};

const countShifts = (): Card => {
  const a = distinctInts(randInt(5, 7), 1, 50);
  return {
    concept: INS,
    type: 'count',
    prompt: `Insertion sort on ${fmtArray(a)}. How many single shifts (moving one value one place right) happen in total?`,
    body: { kind: 'number', answer: inversions(a), unit: 'shifts' },
    explain: `One shift for every pair that is out of order: ${inversions(a)}. Sorted input needs 0; reversed input needs n(n−1)/2.`,
  };
};

const growthIns = (): Card =>
  pick([
    () => growthCard(INS, 'insertion sort on REVERSED input (shifts)', (n) => (n * (n - 1)) / 2, 3, 'Every value shifts past all the ones before it.'),
    () => growthCard(INS, 'insertion sort on already-SORTED input (comparisons)', (n) => n - 1, 2, 'Each value just checks its left neighbour and stays.'),
  ])();

const insExplain = explainGenerators({
  concept: INS,
  truths: [
    'Insertion sort grows a sorted part on the left, one value at a time.',
    'Each new value slides left past every bigger value, then drops into the gap.',
    'On nearly-sorted data it is very fast; on reversed data it is O(n²).',
    'It sorts in place and keeps equal values in their original order (stable).',
  ],
  myths: [
    { text: 'Insertion sort is always O(n²).', why: 'On sorted input it’s O(n): nothing moves.' },
    { text: 'Each pass puts the smallest remaining value in place.', why: 'That’s selection sort; insertion sort places the next value among the sorted ones.' },
    { text: 'It needs a second array.', why: 'It shifts values within the same array.' },
  ],
  chains: [
    {
      prompt: 'Why is insertion sort fast on nearly-sorted data?',
      steps: ['Each value only moves past values bigger than it that come before it.', 'In nearly-sorted data there are few such values.', 'So each insert takes only a few shifts.', 'The whole sort is close to O(n).'],
    },
  ],
  summary: {
    best: 'Insertion sort is how you sort playing cards in your hand: pick up each new card and slide it left into the right place among the ones already sorted.',
    others: [
      { text: 'It’s a simple O(n²) sort.', why: 'Misses how it works and when it’s fast.' },
      { text: 'It inserts into a list.', why: 'Vague.' },
      { text: 'It swaps neighbours until sorted.', why: 'That’s bubble sort.' },
    ],
  },
});

export const insertionSortConcept: Concept = {
  id: INS,
  kind: 'algorithm',
  title: 'Insertion Sort',
  tier: 1,
  prereqs: ['static-array'],
  tagline: 'Sort like a hand of cards.',
  hook: {
    problem: 'You’re handed playing cards one at a time and want your hand to stay sorted.',
    question: 'What do you do with each new card?',
    options: [
      { text: 'Slide it left past every bigger card until it fits.', good: true, feedback: 'Yes: insertion sort. The hand on the left is always sorted.' },
      { text: 'Re-sort the whole hand from scratch each time.', feedback: 'Wasteful: the hand was already sorted.' },
      { text: 'Put it at the end.', feedback: 'Then the hand isn’t sorted.' },
    ],
  },
  lens: {
    layout: 'One array: a sorted part on the left, an unsorted part on the right.',
    invariant: 'Everything left of the current position is sorted.',
    payoff: 'Simple, in place, stable, and very fast on small or nearly-sorted arrays.',
    price: 'O(n²) on random or reversed data: every value may shift past all the earlier ones.',
  },
  learn: {
    what: 'Sorting puts items in order. Insertion sort is the simplest good way: keep the left part of the array sorted, and insert each next value into its correct place there, like sorting cards in your hand.',
    how: [
      'The first value alone is a sorted part.',
      'Take the next value. Compare it with the values to its left.',
      'Shift each bigger value one place right, then drop the value into the gap.',
      'Repeat until every value has been inserted.',
    ],
  },
  extras: {
    family: 'sorting',
    primitive: 'slots',
    parts: ['a sorted left part', 'shifting bigger values right', 'dropping the value into the gap'],
    uses: ['Keep a small list sorted as items arrive one at a time.', 'Finish sorting data that is already almost in order.'],
    rivals: ['merge-sort', 'quicksort', 'heapsort', 'counting-sort'],
    breaks: [
      {
        violation: 'You shift values right starting from the LEFT end of the sorted part.',
        result: 'Each shift overwrites the next value before it has moved, duplicating values and losing others.',
        wrong: ['It still sorts correctly.', 'It sorts in reverse.', 'It just runs slower.'],
      },
    ],
    transfer: [
      {
        problem: 'A leaderboard is sorted; one player’s score goes up. Fix the order fast.',
        answer: 'Do one insertion step: slide that player up past everyone with a lower score.',
        wrong: [
          { text: 'Re-sort the whole leaderboard.', why: 'O(n log n) when only one item moved.' },
          { text: 'Move them to the top.', why: 'They may not be the best.' },
          { text: 'Swap them with their neighbour once.', why: 'They may need to pass several players.' },
        ],
        explain: 'Only one item is out of place, so one insertion step (O(distance moved)) fixes it.',
      },
    ],
  },
  generators: {
    predict: [predictPass],
    simulate: [simulateInsert],
    count: [countShifts, growthIns],
    explain: insExplain,
  },
};

// =====================================================================
// Merge sort
// =====================================================================

const MS = 'merge-sort';

function mergeOrder(L: number[], R: number[]) {
  const out: { side: 'l' | 'r'; i: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < L.length || j < R.length) {
    if (j >= R.length || (i < L.length && L[i] <= R[j])) out.push({ side: 'l', i: i++ });
    else out.push({ side: 'r', i: j++ });
  }
  return out;
}

const predictMerge = (): Card => {
  const all = distinctInts(randInt(6, 8), 1, 60);
  const L = all.slice(0, Math.floor(all.length / 2)).sort((a, b) => a - b);
  const R = all.slice(Math.floor(all.length / 2)).sort((a, b) => a - b);
  const merged = [...L, ...R].sort((a, b) => a - b);
  return {
    concept: MS,
    type: 'predict',
    prompt: `Merge the sorted halves ${fmtArray(L)} and ${fmtArray(R)}. What's the result?`,
    body: {
      kind: 'choice',
      options: options({ text: fmtArray(merged), why: 'Repeatedly take the smaller of the two front values.' }, [
        { text: fmtArray([...L, ...R]), why: 'That just sticks them together.' },
        { text: fmtArray(L.flatMap((x, i) => (R[i] !== undefined ? [x, R[i]] : [x])).concat(R.slice(L.length))), why: 'Alternating isn’t merging: always take the smaller front value.' },
        { text: fmtArray([...merged].reverse()), why: 'Merge keeps ascending order.' },
      ]),
    },
    explain: `Compare the fronts, take the smaller, repeat: ${fmtArray(merged)}. Each value is taken once, so merging is O(n).`,
  };
};

const simulateMerge = (): Card => {
  const all = distinctInts(randInt(6, 8), 1, 60);
  const L = all.slice(0, Math.floor(all.length / 2)).sort((a, b) => a - b);
  const R = all.slice(Math.floor(all.length / 2)).sort((a, b) => a - b);
  const order = mergeOrder(L, R);
  const base: Scene = {
    views: [
      { type: 'row', key: 'l', items: L, title: 'Left half (sorted)' },
      { type: 'row', key: 'r', items: R, title: 'Right half (sorted)' },
    ],
  };
  const exp = order.map((o) => `${o.side}:${o.i}`);
  const frames: Scene[] = [base];
  const out: number[] = [];
  order.forEach((o, k) => {
    out.push(o.side === 'l' ? L[o.i] : R[o.i]);
    frames.push({ views: [...base.views, { type: 'row', key: 'm', items: [...out], title: 'Merged so far' }], highlight: exp.slice(0, k + 1) });
  });
  return {
    concept: MS,
    type: 'simulate',
    prompt: 'Merge the two sorted halves. Click the values in the order they go into the merged result (always the smaller of the two front values).',
    scene: base,
    body: { kind: 'click', expected: exp, frames, wrongHint: () => 'Look only at the first unused value of each half, and take the smaller one.' },
    explain: `Merged: ${fmtArray([...L, ...R].sort((a, b) => a - b))}. Each step is one comparison, so merging n values is O(n).`,
  };
};

const countLevels = (): Card => {
  const n = pick([4, 8, 16, 32, 64, 1024]);
  return pick([
    {
      concept: MS,
      type: 'count' as const,
      prompt: `Merge sort on ${n} values keeps halving until pieces have 1 value. How many levels of merging are there?`,
      body: { kind: 'number' as const, answer: Math.log2(n), unit: 'levels' },
      explain: `${n} → halves ${Math.log2(n)} times to reach 1. Each level merges all n values: n × log₂ n total work.`,
    },
    {
      concept: MS,
      type: 'count' as const,
      prompt: `Merge sort on ${n} values: each of the log₂ n levels moves every value once. About how many moves in total?`,
      body: { kind: 'number' as const, answer: n * Math.log2(n), unit: 'moves' },
      explain: `${n} values × ${Math.log2(n)} levels = ${n * Math.log2(n)}. That’s O(n log n).`,
    },
  ]);
};

const growthMS = (): Card => growthCard(MS, 'merge sort (moves)', (n) => n * Math.log2(n), 4, 'n moves per level, log₂ n levels.');

const msExplain = explainGenerators({
  concept: MS,
  truths: [
    'Merge sort splits the array in half, sorts each half (recursively), then merges them.',
    'Merging two sorted lists takes one comparison per value.',
    'There are about log₂ n levels of splitting, each doing O(n) work: O(n log n) always.',
    'It needs extra memory for merging and keeps equal values in order (stable).',
  ],
  myths: [
    { text: 'Merge sort is O(n²) in the worst case.', why: 'It’s O(n log n) on every input.' },
    { text: 'Merging two sorted halves needs them sorted again.', why: 'Merging just picks the smaller front value repeatedly.' },
    { text: 'Merge sort sorts in place with no extra memory.', why: 'The usual version needs O(n) extra space.' },
  ],
  chains: [
    {
      prompt: 'Why is merge sort O(n log n)?',
      steps: ['Halving n until pieces have size 1 takes log₂ n levels.', 'At each level, all n values are merged once.', 'Merging is one comparison per value.', 'So total work is n × log₂ n.'],
    },
  ],
  summary: {
    best: 'Merge sort splits the pile in half, sorts each half the same way, then zips the two sorted halves together by always taking the smaller front item.',
    others: [
      { text: 'It’s a divide-and-conquer O(n log n) sort.', why: 'Jargon without the picture.' },
      { text: 'It merges things.', why: 'Misses the splitting.' },
      { text: 'It’s the fastest sort.', why: 'Not always; quicksort is often faster in practice.' },
    ],
  },
});

export const mergeSortConcept: Concept = {
  id: MS,
  kind: 'algorithm',
  title: 'Merge Sort',
  tier: 3,
  prereqs: ['static-array', 'recursion'],
  tagline: 'Split in half, sort each, zip them together.',
  hook: {
    problem: 'Insertion sort takes about n²/2 steps on random data: for a million items that’s 500 billion.',
    question: 'Two sorted halves are easy to combine. Can you use that?',
    options: [
      { text: 'Split the list in half, sort each half the same way, then merge the two sorted halves.', good: true, feedback: 'Yes: merge sort. log₂ n levels × n work = n log n: about 20 million steps for a million items.' },
      { text: 'Run insertion sort twice.', feedback: 'Still n².' },
      { text: 'Sort only the first half.', feedback: 'Half the list stays unsorted.' },
    ],
  },
  lens: {
    layout: 'An array split recursively into halves, plus a temporary array for merging.',
    invariant: 'After merging, each piece is sorted; merging two sorted pieces keeps them sorted.',
    payoff: 'O(n log n) on every input, and stable.',
    price: 'Needs O(n) extra memory; slower than quicksort in practice for arrays.',
  },
  learn: {
    what: 'Merge sort is a fast sorting algorithm based on one easy fact: two lists that are already sorted can be combined into one sorted list quickly. It splits the list in half, sorts each half the same way, then merges.',
    how: [
      'If the list has 0 or 1 items, it’s already sorted (base case).',
      'Otherwise split it into two halves and merge-sort each half.',
      'Merge: look at the front of each half, take the smaller, repeat until both are empty.',
      'Halving takes about log₂ n levels, and each level does n work: n log n total.',
    ],
  },
  extras: {
    family: 'sorting',
    primitive: 'slots',
    parts: ['recursive halving', 'merging two sorted lists', 'a temporary array'],
    uses: ['Sort a million records with a guaranteed O(n log n), whatever the input order.', 'Sort data too big for memory by merging sorted chunks from disk.'],
    rivals: ['quicksort', 'heapsort', 'insertion-sort', 'counting-sort'],
    breaks: [
      {
        violation: 'The merge step takes from the left half until it’s empty, then the right half.',
        result: 'That just sticks the halves together: the result isn’t sorted.',
        wrong: ['It still sorts correctly.', 'It sorts in reverse.', 'It becomes O(n²).'],
      },
    ],
    transfer: [
      {
        problem: 'Count how many pairs in an array are out of order (inversions), faster than checking all pairs.',
        answer: 'During each merge, when a right-half value is taken before remaining left values, add the number of left values remaining.',
        wrong: [
          { text: 'Check every pair.', why: 'O(n²).' },
          { text: 'Count descents between neighbours.', why: 'Out-of-order pairs can be far apart.' },
          { text: 'Sort, then compare with the original.', why: 'Doesn’t count pairs.' },
        ],
        explain: 'Merging already compares across the halves; counting as you go keeps it O(n log n).',
      },
    ],
  },
  generators: {
    predict: [predictMerge],
    simulate: [simulateMerge],
    count: [countLevels, growthMS],
    explain: msExplain,
  },
};

// =====================================================================
// Quicksort
// =====================================================================

const QS = 'quicksort';

const predictPartition = (): Card => {
  const a = distinctInts(randInt(6, 8), 1, 60);
  const pivot = a[a.length - 1];
  const rest = a.slice(0, -1);
  const small = rest.filter((x) => x < pivot);
  const big = rest.filter((x) => x > pivot);
  return {
    concept: QS,
    type: 'predict',
    prompt: `Quicksort picks the LAST value, ${pivot}, as the pivot for ${fmtArray(a)}. After partitioning, where does ${pivot} end up (its index), and is that its final sorted position?`,
    body: {
      kind: 'choice',
      options: options({ text: `Index ${small.length}, and yes, that’s final`, why: `${small.length} values are smaller, so exactly ${small.length} values go before it.` }, [
        { text: `Index ${Math.floor(a.length / 2)}, the middle`, why: 'The pivot goes where the count of smaller values puts it, not the middle.' },
        { text: `Index ${small.length}, but it will move again later`, why: 'Everything smaller is left and everything bigger is right, so it never moves again.' },
        { text: `Index 0`, why: `${small.length} values are smaller than ${pivot}.` },
        { text: `Index ${big.length}`, why: 'Count the SMALLER values, not the bigger ones.' },
      ]),
    },
    explain: `Smaller: ${small.join(', ') || 'none'}. Bigger: ${big.join(', ') || 'none'}. ${pivot} lands at index ${small.length}, its final place; then each side is sorted separately.`,
  };
};

const predictWorst = (): Card => ({
  concept: QS,
  type: 'predict',
  prompt: 'Quicksort always picks the LAST value as the pivot. You give it an array that is already sorted. What happens?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'Every pivot is the biggest value, so each split removes just one value: O(n²).', correct: true, why: 'The splits are as lopsided as possible.' },
      { text: 'It finishes instantly because the data is sorted.', correct: false, why: 'Quicksort doesn’t check for that; it partitions anyway.' },
      { text: 'It’s O(n log n) as usual.', correct: false, why: 'Only when pivots split roughly in half.' },
      { text: 'It crashes.', correct: false, why: 'It works, just slowly.' },
    ]),
  },
  explain: 'That’s why real quicksorts pick a random pivot (or the median of three): bad splits become very unlikely.',
});

const simulatePartition = (): Card => {
  const a = distinctInts(randInt(6, 8), 1, 60);
  const pivot = a[a.length - 1];
  const small = a.slice(0, -1).map((x, i) => (x < pivot ? i : -1)).filter((i) => i >= 0);
  if (small.length === 0) return simulatePartition();
  const scene = row(a, `Array (pivot = ${pivot}, the last value)`, 'a', a.map((_, i) => (i === a.length - 1 ? 'pivot' : `[${i}]`)));
  const exp = small.map((i) => `a:${i}`);
  return {
    concept: QS,
    type: 'simulate',
    prompt: `Partition around the pivot ${pivot}: scan left to right and click every value that must go to the LEFT side (smaller than ${pivot}).`,
    scene,
    body: { kind: 'click', expected: exp, frames: clickFrames(scene, exp), wrongHint: () => `Only values smaller than ${pivot}, left to right.` },
    explain: `${small.length} values are smaller, so ${pivot} lands at index ${small.length}. One pass over the array: partitioning is O(n).`,
  };
};

const countQS = (): Card => {
  const n = randInt(5, 50);
  return pick([
    {
      concept: QS,
      type: 'count' as const,
      prompt: `Partitioning ${n} values around a pivot compares each of the other values with the pivot once. How many comparisons?`,
      body: { kind: 'number' as const, answer: n - 1, unit: 'comparisons' },
      explain: `${n - 1}: every value except the pivot is compared once.`,
    },
    {
      concept: QS,
      type: 'count' as const,
      prompt: `Worst case (already-sorted input, last value as pivot): partitions of size ${n}, ${n - 1}, …, 2. Total comparisons?`,
      body: { kind: 'number' as const, answer: (n * (n - 1)) / 2, unit: 'comparisons' },
      explain: `${n - 1} + ${n - 2} + … + 1 = ${(n * (n - 1)) / 2}: O(n²).`,
    },
  ]);
};

const growthQS = (): Card => growthCard(QS, 'quicksort with good (random) pivots, average comparisons', (n) => Math.round(1.39 * n * Math.log2(n)), 4, 'Splits are roughly even on average: about 1.39 n log₂ n comparisons.');

const qsExplain = explainGenerators({
  concept: QS,
  truths: [
    'Quicksort picks a pivot and moves smaller values left and bigger values right of it.',
    'After partitioning, the pivot is in its final sorted position.',
    'Each side is then sorted the same way (recursively).',
    'Average O(n log n), but O(n²) if the pivots split badly every time.',
    'It sorts in place, and is often the fastest sort in practice.',
  ],
  myths: [
    { text: 'Quicksort is always O(n log n).', why: 'Bad pivots (like on sorted input with a fixed pivot choice) give O(n²).' },
    { text: 'The pivot moves again in later steps.', why: 'After partitioning it’s already in its final place.' },
    { text: 'Quicksort merges two halves.', why: 'That’s merge sort. Quicksort partitions, then needs no merge.' },
  ],
  chains: [
    {
      prompt: 'Why is the pivot in its final place after partitioning?',
      steps: ['Every value smaller than the pivot is to its left.', 'Every value bigger is to its right.', 'So exactly as many values come before it as in the sorted result.', 'Its position is already correct.'],
    },
  ],
  summary: {
    best: 'Quicksort picks one item, puts everything smaller on its left and bigger on its right, and then does the same to each side until everything is in place.',
    others: [
      { text: 'It’s a quick sort.', why: 'Restates the name.' },
      { text: 'It’s divide and conquer.', why: 'Jargon without mechanism.' },
      { text: 'It splits the array in half.', why: 'It splits around a pivot value, not at the middle.' },
    ],
  },
});

export const quicksortConcept: Concept = {
  id: QS,
  kind: 'algorithm',
  title: 'Quicksort',
  tier: 3,
  prereqs: ['static-array', 'recursion'],
  tagline: 'Pick a pivot, split around it, repeat.',
  hook: {
    problem: 'Merge sort needs a second array as big as the first. You want fast sorting without the extra memory.',
    question: 'What if you split by VALUE instead of by position?',
    options: [
      { text: 'Pick a value (the pivot), move smaller values left and bigger right, then sort each side the same way.', good: true, feedback: 'Yes: quicksort. No merging needed, and it works in place.' },
      { text: 'Split into halves and don’t merge.', feedback: 'Then the halves aren’t in order relative to each other.' },
      { text: 'Only sort values bigger than the average.', feedback: 'The smaller values stay unsorted.' },
    ],
  },
  lens: {
    layout: 'One array, partitioned in place around a pivot value.',
    invariant: 'After a partition: everything left of the pivot is smaller, everything right is bigger.',
    payoff: 'Fast in practice (O(n log n) on average), sorts in place with little extra memory.',
    price: 'O(n²) when pivots split badly; not stable.',
  },
  learn: {
    what: 'Quicksort is usually the fastest general-purpose sort. It picks one value (the pivot), rearranges the array so smaller values are on its left and bigger ones on its right, then sorts each side the same way.',
    how: [
      'Pick a pivot (for example the last value, or a random one).',
      'Partition: one pass moves every smaller value to the left part and every bigger value to the right part.',
      'Put the pivot between them: it is now in its final sorted place.',
      'Quicksort the left part and the right part the same way. Parts of size 0 or 1 are already sorted.',
    ],
  },
  extras: {
    family: 'sorting',
    primitive: 'slots',
    parts: ['a pivot value', 'partitioning into smaller / bigger', 'recursion on each side'],
    uses: ['Sort a big array in memory as fast as possible, without a second array.', 'Find the k-th smallest value without fully sorting (quickselect).'],
    rivals: ['merge-sort', 'heapsort', 'insertion-sort', 'counting-sort'],
    breaks: [
      {
        violation: 'The pivot is always the first value, and the input is already sorted.',
        result: 'Every partition puts everything on one side, so it needs n levels: O(n²).',
        wrong: ['It sorts instantly.', 'It still runs in O(n log n).', 'It returns the array unchanged without sorting.'],
      },
    ],
    transfer: [
      {
        problem: 'Find the median of a million numbers without sorting all of them.',
        answer: 'Quickselect: partition, then recurse only into the side that contains the middle position.',
        wrong: [
          { text: 'Sort everything and take the middle.', why: 'Works, but does more work than needed.' },
          { text: 'Take the average.', why: 'The average isn’t the median.' },
          { text: 'Take the value at index 500,000 of the unsorted data.', why: 'Unsorted positions mean nothing.' },
        ],
        explain: 'After a partition, the pivot’s index tells you which side the median is on; ignore the other side. Average O(n).',
      },
    ],
  },
  generators: {
    predict: [predictPartition, predictWorst],
    simulate: [simulatePartition],
    count: [countQS, growthQS],
    explain: qsExplain,
  },
};

// =====================================================================
// Counting sort
// =====================================================================

const CS = 'counting-sort';

const predictCounts = (): Card => {
  const k = 5;
  const a = Array.from({ length: randInt(6, 9) }, () => randInt(0, k));
  const counts = Array.from({ length: k + 1 }, (_, v) => a.filter((x) => x === v).length);
  return {
    concept: CS,
    type: 'predict',
    prompt: `Counting sort on ${fmtArray(a)} (values 0–${k}). What is the count array, for values 0, 1, 2, …, ${k}?`,
    body: {
      kind: 'choice',
      options: options({ text: fmtArray(counts), why: 'How many times each value appears.' }, [
        { text: fmtArray([...a].sort((x, y) => x - y)), why: 'That’s the sorted output, not the counts.' },
        { text: fmtArray(counts.map((c) => (c > 0 ? 1 : 0))), why: 'Count every occurrence, not just whether it appears.' },
        { text: fmtArray([...counts].reverse()), why: 'Counts are listed from value 0 upwards.' },
      ]),
    },
    explain: `Then write out ${counts.map((c, v) => (c ? `${c}× ${v}` : '')).filter(Boolean).join(', ')}: sorted, without a single comparison.`,
  };
};

const predictBadCase = (): Card => ({
  concept: CS,
  type: 'predict',
  prompt: 'You need to sort 10 numbers that can be anywhere from 0 to 1,000,000,000. Is counting sort a good choice?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'No: it needs a counter for every possible value, a billion counters for 10 numbers.', correct: true, why: 'Its cost depends on the range of values, not just how many there are.' },
      { text: 'Yes: it never compares, so it’s always fastest.', correct: false, why: 'Setting up and scanning a billion counters dwarfs the work.' },
      { text: 'Yes, because there are only 10 numbers.', correct: false, why: 'The range is what matters here.' },
      { text: 'It can’t sort numbers above 9.', correct: false, why: 'It can, but needs a counter per possible value.' },
    ]),
  },
  explain: 'Counting sort is O(n + k), where k is the range of values. Great for small ranges (ages, grades), terrible for huge ones.',
});

const simulateCount = (): Card => {
  const k = 5;
  const a = Array.from({ length: randInt(5, 7) }, () => randInt(0, k));
  const labels = Array.from({ length: k + 1 }, (_, v) => `value ${v}`);
  const counts = Array(k + 1).fill(0);
  const frames: Scene[] = [];
  const mk = () => ({
    views: [
      { type: 'row' as const, key: 'a', items: a, title: 'Input' },
      { type: 'row' as const, key: 'c', items: [...counts], labels, title: 'Counters' },
    ],
  });
  frames.push(mk());
  a.forEach((v) => {
    counts[v]++;
    frames.push({ ...mk(), highlight: [`c:${v}`] });
  });
  return {
    concept: CS,
    type: 'simulate',
    prompt: 'Go through the input left to right. For each value, click the counter you add 1 to.',
    scene: frames[0],
    body: { kind: 'click', expected: a.map((v) => `c:${v}`), frames, wrongHint: (step) => `The next value is ${a[step]}: use counter ${a[step]}.` },
    explain: `Counts: ${fmtArray(counts)}. Reading counters from 0 up gives the sorted output: ${fmtArray([...a].sort((x, y) => x - y))}.`,
  };
};

const countCS = (): Card => {
  const n = randInt(100, 10000);
  const k = pick([10, 100, 256, 1000]);
  return {
    concept: CS,
    type: 'count',
    prompt: `Counting sort of ${n.toLocaleString()} values in the range 0–${k - 1}: one pass to count, then one pass over the ${k} counters to write the output. About how many steps is that (n + k)?`,
    body: { kind: 'number', answer: n + k, unit: 'steps' },
    explain: `${n} + ${k} = ${n + k}. No comparisons at all, which is how it beats the n log n limit of comparison sorts.`,
  };
};

const csExplain = explainGenerators({
  concept: CS,
  truths: [
    'Counting sort counts how many times each value appears, then writes values out in order.',
    'It never compares two values with each other.',
    'It takes O(n + k) time, where k is the range of possible values.',
    'It only works for small whole-number ranges (or things mapped to them).',
  ],
  myths: [
    { text: 'Counting sort is always faster than quicksort.', why: 'Only when the value range k is small.' },
    { text: 'Counting sort compares values to order them.', why: 'It uses the value itself as a counter index.' },
    { text: 'It works for any kind of value, like decimals or names.', why: 'It needs small whole-number keys.' },
  ],
  chains: [
    {
      prompt: 'How can counting sort beat n log n?',
      steps: ['Comparison sorts learn the order one comparison at a time, needing about n log n comparisons.', 'Counting sort uses each value directly as an array index.', 'So it never compares, just counts.', 'Its cost is n + k instead.'],
    },
  ],
  summary: {
    best: 'Counting sort is like sorting exam papers by grade into piles: count how many of each grade, then collect the piles in order. No comparing papers at all.',
    others: [
      { text: 'It counts things.', why: 'Misses how that sorts.' },
      { text: 'It’s an O(n) sort.', why: 'Only for small ranges; it’s O(n + k).' },
      { text: 'It’s a comparison sort.', why: 'It doesn’t compare at all.' },
    ],
  },
});

export const countingSortConcept: Concept = {
  id: CS,
  kind: 'algorithm',
  title: 'Counting Sort',
  tier: 1,
  prereqs: ['static-array'],
  tagline: 'Sort by counting, not comparing.',
  hook: {
    problem: 'Sort 1,000,000 exam grades, each from 0 to 100. Comparison sorts need about 20 million comparisons.',
    question: 'With only 101 possible grades, is there a shortcut?',
    options: [
      { text: 'Count how many of each grade there are, then write them out from 0 to 100.', good: true, feedback: 'Yes: counting sort. About 1,000,101 steps and zero comparisons.' },
      { text: 'Compare faster.', feedback: 'Still millions of comparisons.' },
      { text: 'Sort only the top grades.', feedback: 'Everything needs sorting.' },
    ],
  },
  lens: {
    layout: 'The input array plus an array of counters, one per possible value.',
    invariant: 'After counting, counter[v] = how many times v appears in the input.',
    payoff: 'O(n + k) with no comparisons: beats n log n when the value range k is small.',
    price: 'Needs k counters: useless for huge ranges; only whole-number keys.',
  },
  learn: {
    what: 'Counting sort sorts small whole numbers without ever comparing them. It counts how many times each value appears, then writes each value out that many times, in order.',
    how: [
      'Make a counter for each possible value (e.g. 0 to 100), all starting at 0.',
      'Go through the input: for each value v, add 1 to counter v.',
      'Go through the counters from smallest value to largest.',
      'Write each value out as many times as its counter says.',
    ],
  },
  extras: {
    family: 'sorting',
    primitive: 'slots',
    parts: ['a counter per possible value', 'one counting pass', 'one writing pass'],
    uses: ['Sort a million exam grades that are all between 0 and 100.', 'Sort people by age, which is a small whole number.'],
    rivals: ['merge-sort', 'quicksort', 'heapsort', 'insertion-sort'],
    breaks: [
      {
        violation: 'A value of 105 shows up but you only made counters for 0–100.',
        result: 'There’s no counter for it: it’s written outside the counter array or lost.',
        wrong: ['It’s sorted to the end automatically.', 'It becomes 100.', 'Nothing happens.'],
      },
    ],
    transfer: [
      {
        problem: 'Find the most common value among a million numbers between 0 and 999.',
        answer: 'Count them into 1,000 counters (the first half of counting sort) and take the biggest counter.',
        wrong: [
          { text: 'Sort with quicksort and scan.', why: 'Works, but O(n log n) vs O(n).' },
          { text: 'Compare every pair.', why: 'O(n²).' },
          { text: 'Take the average.', why: 'The average isn’t the most common value.' },
        ],
        explain: 'You only need the counts, not the sorted output: O(n + k).',
      },
    ],
  },
  generators: {
    predict: [predictCounts, predictBadCase],
    simulate: [simulateCount],
    count: [countCS],
    explain: csExplain,
  },
};

// =====================================================================
// Heapsort
// =====================================================================

const HS = 'heapsort';

const predictHeapsortOut = (): Card => {
  const a = distinctInts(randInt(5, 7), 1, 60);
  const sorted = [...a].sort((x, y) => x - y);
  return {
    concept: HS,
    type: 'predict',
    prompt: `Put ${fmtArray(a)} into a min-heap, then remove the minimum again and again. In what order do the values come out?`,
    body: {
      kind: 'choice',
      options: options({ text: sorted.join(', '), why: 'The heap always gives the smallest remaining value.' }, [
        { text: a.join(', '), why: 'That’s insertion order; a heap reorders by value.' },
        { text: [...sorted].reverse().join(', '), why: 'A MIN-heap gives the smallest first.' },
        { text: [sorted[0], ...a.filter((x) => x !== sorted[0])].join(', '), why: 'Every removal gives the smallest remaining, not just the first.' },
      ]),
    },
    explain: `Smallest first, every time: ${sorted.join(', ')}. That’s sorting! n removals × O(log n) each = O(n log n).`,
  };
};

const predictStable = (): Card => ({
  concept: HS,
  type: 'predict',
  prompt: 'In-place heapsort needs how much extra memory, and does it keep equal values in their original order?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'O(1) extra memory; not stable (equal values can swap order).', correct: true, why: 'It works inside the array, but heap swaps jump values around.' },
      { text: 'O(n) extra memory; stable.', correct: false, why: 'That describes merge sort.' },
      { text: 'O(1) extra memory; stable.', correct: false, why: 'Swaps to and from the root can reorder equal values.' },
      { text: 'O(n log n) extra memory.', correct: false, why: 'It needs only a few variables.' },
    ]),
  },
  explain: 'Heapsort is guaranteed O(n log n) with O(1) extra memory. The cost: not stable, and often slower than quicksort in practice.',
});

const orderHeapsort = (): Card => ({
  concept: HS,
  type: 'simulate',
  prompt: 'In-place heapsort (ascending) with a max-heap. Put the steps in order.',
  body: {
    kind: 'order',
    steps: [
      'Turn the whole array into a max-heap (largest value at index 0).',
      'Swap the root (the largest) with the last value of the heap part.',
      'Shrink the heap part by one: that last slot is now sorted.',
      'Sift the new root down to restore the heap.',
      'Repeat until the heap part is empty.',
    ],
  },
  explain: 'The sorted part grows from the right while the heap shrinks from the left, all inside one array.',
});

const countHS = (): Card => {
  const n = pick([7, 15, 31, 63, 1023]);
  return {
    concept: HS,
    type: 'count',
    prompt: `Heapsort on ${n} values removes the top ${n} times. Each removal sifts down at most the heap’s height. What’s that height (levels below the root) for ${n} values?`,
    body: { kind: 'number', answer: Math.floor(Math.log2(n)), unit: 'levels' },
    explain: `A complete tree of ${n} nodes has height ⌊log₂ ${n}⌋ = ${Math.floor(Math.log2(n))}. So heapsort does at most about n × log₂ n swaps.`,
  };
};

const growthHS = (): Card => growthCard(HS, 'heapsort (worst-case swaps)', (n) => n * Math.floor(Math.log2(n)), 4, 'n removals, each O(log n).');

const hsExplain = explainGenerators({
  concept: HS,
  truths: [
    'Heapsort builds a heap, then repeatedly removes the top to get values in order.',
    'Each removal costs O(log n), so the whole sort is O(n log n), guaranteed.',
    'The in-place version grows the sorted part at the end of the same array.',
    'It uses O(1) extra memory but is not stable.',
  ],
  myths: [
    { text: 'Heapsort is O(n²) on bad inputs.', why: 'It’s O(n log n) on every input.' },
    { text: 'A heap is already sorted, so heapsort just reads it.', why: 'A heap only keeps parent ≤ child; you must remove repeatedly.' },
    { text: 'Heapsort needs a second array.', why: 'The in-place version uses the same array.' },
  ],
  chains: [
    {
      prompt: 'Why does removing the minimum repeatedly produce sorted order?',
      steps: ['The heap’s top is always the smallest value left.', 'Removing it gives the next value in sorted order.', 'The heap then fixes itself in O(log n).', 'Repeating n times outputs everything, smallest first.'],
    },
  ],
  summary: {
    best: 'Heapsort pours everything into a heap, which always hands you the smallest item next, so taking items out one by one comes out sorted.',
    others: [
      { text: 'It sorts using a heap.', why: 'Restates the name.' },
      { text: 'It’s an O(n log n) in-place sort.', why: 'Facts without the idea.' },
      { text: 'It sorts a tree.', why: 'It sorts an array, using a heap.' },
    ],
  },
});

export const heapsortConcept: Concept = {
  id: HS,
  kind: 'algorithm',
  title: 'Heapsort',
  tier: 5,
  prereqs: ['binary-heap'],
  tagline: 'A heap gives the smallest next, so empty it in order.',
  hook: {
    problem: 'You want a sort that is O(n log n) on every input (quicksort isn’t) and needs no extra array (merge sort does).',
    question: 'You know a structure that always gives the smallest item next. How could it sort?',
    options: [
      { text: 'Put everything in a heap, then take the top out repeatedly.', good: true, feedback: 'Yes: heapsort. Done inside the array itself, it needs no extra memory.' },
      { text: 'Put everything in a stack.', feedback: 'A stack gives the newest, not the smallest.' },
      { text: 'Put everything in a queue.', feedback: 'A queue gives the oldest.' },
    ],
  },
  lens: {
    layout: 'One array used as a heap on the left and a sorted part on the right.',
    invariant: 'The heap part is a valid heap; the sorted part holds the biggest values in final order.',
    payoff: 'O(n log n) on every input with O(1) extra memory.',
    price: 'Not stable; usually slower than quicksort in practice (poor memory access pattern).',
  },
  learn: {
    what: 'Heapsort uses a heap to sort. Since a heap always gives you its smallest (or largest) item next, removing items one by one produces them in sorted order.',
    how: [
      'Build a heap from all the values.',
      'Remove the top: it’s the smallest (for a min-heap). That’s the first value of the sorted output.',
      'The heap fixes itself in O(log n); remove the top again.',
      'Repeat n times. In-place version: use a max-heap and move each removed top to the end of the array.',
    ],
  },
  extras: {
    family: 'sorting',
    primitive: 'slots',
    parts: ['a heap', 'repeated remove-top', 'the sorted part growing at the end'],
    uses: ['Sort with a guaranteed O(n log n) and no extra memory, even on adversarial inputs.', 'Get just the 10 smallest items out of a big list (stop after 10 removals).'],
    rivals: ['merge-sort', 'quicksort', 'insertion-sort', 'counting-sort'],
    breaks: [
      {
        violation: 'After swapping the root to the end, you forget to sift the new root down.',
        result: 'The heap rule breaks, so the next “largest” taken is wrong and the output isn’t sorted.',
        wrong: ['It still sorts.', 'It sorts in reverse.', 'It just takes longer.'],
      },
    ],
    transfer: [
      {
        problem: 'Merge 100 sorted lists into one sorted list efficiently.',
        answer: 'Put the first item of each list in a min-heap; repeatedly take the smallest and add the next item from its list.',
        wrong: [
          { text: 'Concatenate and quicksort.', why: 'Ignores that the lists are already sorted.' },
          { text: 'Merge them one at a time into a growing result.', why: 'Re-copies the growing result 100 times.' },
          { text: 'Take all first items, then all second items…', why: 'Items at the same position aren’t in order across lists.' },
        ],
        explain: 'The heap always holds one candidate per list, so each step is O(log 100).',
      },
    ],
  },
  generators: {
    predict: [predictHeapsortOut, predictStable],
    simulate: [orderHeapsort],
    count: [countHS, growthHS],
    explain: hsExplain,
  },
};

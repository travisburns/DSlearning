import type { Card, Concept, Scene, Val } from '../engine/types';
import { cloneScene, fmtArray } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions, options } from './helpers';

const rowScene = (items: Val[], title: string, key = 'a', labels?: string[], pointers?: { name: string; index: number }[]): Scene => ({
  views: [{ type: 'row', key, items, title, labels, pointers }],
});
const clickFrames = (base: Scene, expected: string[]) => {
  const frames = [base];
  expected.forEach((_, i) => frames.push({ ...cloneScene(base), highlight: expected.slice(0, i + 1) }));
  return frames;
};

// =====================================================================
// Recursion
// =====================================================================

const REC = 'recursion';

const predictRecValue = (): Card => {
  const n = randInt(3, 7);
  const f = pick([
    { def: 'sum(n) = n + sum(n − 1), and sum(0) = 0', name: 'sum', val: (n * (n + 1)) / 2, wrong: [n, n * n, (n * (n - 1)) / 2] },
    { def: 'fact(n) = n × fact(n − 1), and fact(0) = 1', name: 'fact', val: [1, 1, 2, 6, 24, 120, 720, 5040][n], wrong: [n * (n - 1), 2 ** n, [1, 1, 2, 6, 24, 120, 720, 5040][n - 1]] },
    { def: 'f(n) = f(n − 1) + 2, and f(0) = 1', name: 'f', val: 2 * n + 1, wrong: [2 * n, 2 * n - 1, n + 2] },
  ]);
  return {
    concept: REC,
    type: 'predict',
    prompt: `A function is defined as ${f.def}. What is ${f.name}(${n})?`,
    body: {
      kind: 'choice',
      options: numberOptions(f.val, f.wrong.map((v) => ({ value: v, why: 'Unfold it by hand: each call waits for the call below it, down to the base case.' })), 'Unfold down to the base case, then build back up.'),
    },
    explain: `${f.name}(${n}) calls ${f.name}(${n - 1}), which calls ${f.name}(${n - 2}), … down to the base case at 0. Then the answers combine on the way back up: ${f.val}.`,
  };
};

const predictNoBase = (): Card => ({
  concept: REC,
  type: 'predict',
  prompt: 'A recursive function has no base case: f(n) just returns f(n − 1) + 1, forever. What happens when you call f(5)?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'It keeps calling itself until the call stack runs out of space (a stack overflow).', correct: true, why: 'Every call waits for the next one, and none ever returns.' },
      { text: 'It returns 5.', correct: false, why: 'Nothing ever stops it to return anything.' },
      { text: 'It returns 0 once n goes negative.', correct: false, why: 'Nothing checks for that.' },
      { text: 'The computer notices and stops at 0.', correct: false, why: 'The computer does exactly what the code says: keep calling.' },
    ]),
  },
  explain: 'The base case is what stops the shrinking. Without it, calls pile up on the call stack until memory for it runs out.',
});

const simulateReturns = (): Card => {
  const n = randInt(3, 5);
  const frames: Val[] = Array.from({ length: n + 1 }, (_, i) => `fact(${n - i})`);
  const scene = rowScene(frames, 'Calls, in the order they START (left to right)', 'c', frames.map((_, i) => (i === 0 ? 'first call' : `depth ${i}`)));
  const exp = frames.map((_, i) => `c:${n - i}`);
  return {
    concept: REC,
    type: 'simulate',
    prompt: `fact(${n}) calls fact(${n - 1}), which calls fact(${n - 2}), … down to fact(0). Click the calls in the order they FINISH (return).`,
    scene,
    body: { kind: 'click', expected: exp, frames: clickFrames(scene, exp), wrongHint: () => 'A call can only finish after the call it made has finished. Which one finishes first?' },
    explain: `The last call started, fact(0), finishes first; then fact(1) can finish, and so on back to fact(${n}). Last in, first out: the calls live on a stack.`,
  };
};

const orderRecursion = (): Card => ({
  concept: REC,
  type: 'simulate',
  prompt: 'Put the parts of a recursive function in the order it should run them.',
  body: { kind: 'order', steps: ['Check the base case: if the problem is tiny, return the answer directly.', 'Make a smaller version of the problem and call yourself on it.', 'Use that answer to build the answer for the full problem.'] },
  explain: 'Base case first, or the function never stops. Then shrink, then combine.',
});

const countFibCalls = (): Card => {
  const n = randInt(3, 8);
  const C = [1, 1];
  for (let i = 2; i <= n; i++) C[i] = 1 + C[i - 1] + C[i - 2];
  return {
    concept: REC,
    type: 'count',
    prompt: `Naive Fibonacci: fib(n) = fib(n − 1) + fib(n − 2), with fib(0) and fib(1) returning straight away. Counting the first call, how many calls does fib(${n}) make in total?`,
    body: { kind: 'number', answer: C[n], unit: 'calls' },
    explain: `calls(n) = 1 + calls(n − 1) + calls(n − 2): ${C.slice(0, n + 1).join(', ')}. The same small problems are solved again and again, so the count explodes. Dynamic programming fixes this.`,
  };
};

const countDepth = (): Card => {
  const n = randInt(4, 50);
  return {
    concept: REC,
    type: 'count',
    prompt: `fact(${n}) calls fact(${n - 1}), and so on down to fact(0). At the deepest point, how many calls are waiting on the call stack at once?`,
    body: { kind: 'number', answer: n + 1, unit: 'calls' },
    explain: `fact(${n}) … fact(0): ${n + 1} calls, each holding its own memory until the ones below it return.`,
  };
};

const recExplain = explainGenerators({
  concept: REC,
  truths: [
    'A recursive function solves a problem by calling itself on a smaller version of it.',
    'A base case stops the recursion by answering the smallest problem directly.',
    'Each call waits on the call stack until the call it made returns.',
    'The last call to start is the first to finish.',
  ],
  myths: [
    { text: 'Recursion doesn’t use any extra memory.', why: 'Every waiting call takes space on the call stack.' },
    { text: 'The base case is optional if the input is small.', why: 'Without it, nothing ever stops the calls.' },
    { text: 'The first call made is the first to return.', why: 'It’s the last to return; it waits for all the others.' },
    { text: 'Recursion is always faster than a loop.', why: 'It’s often the same or slower; its strength is expressing the problem clearly.' },
  ],
  chains: [
    {
      prompt: 'Why does fact(4) finish last?',
      steps: ['fact(4) needs fact(3)’s answer before it can finish.', 'fact(3) needs fact(2), and so on down to fact(0).', 'fact(0) is the base case, so it returns straight away.', 'Then each waiting call finishes in reverse order, ending with fact(4).'],
    },
  ],
  summary: {
    best: 'Recursion solves a big problem by handing a slightly smaller copy of it to yourself, until the problem is so small the answer is obvious.',
    others: [
      { text: 'Recursion is when a function calls itself.', why: 'True, but doesn’t say why that works or when it stops.' },
      { text: 'Recursion is a kind of loop.', why: 'Misses the waiting calls and the base case.' },
      { text: 'Recursion is used for trees.', why: 'One use among many.' },
    ],
  },
});

export const recursionConcept: Concept = {
  id: REC,
  kind: 'algorithm',
  title: 'Recursion',
  tier: 3,
  prereqs: ['stack'],
  tagline: 'Solve a problem using a smaller copy of itself.',
  hook: {
    problem: 'To count the files in a folder, you must count the files in each subfolder, which have their own subfolders, and so on to any depth. A plain loop doesn’t know how deep to go.',
    question: 'How can code handle “a smaller version of the same problem” to any depth?',
    options: [
      { text: 'Let the function call itself on each subfolder, and stop when a folder has no subfolders.', good: true, feedback: 'Yes: recursion. The function trusts itself to handle the smaller problem, and a base case stops it.' },
      { text: 'Write one loop per level of folders.', feedback: 'You don’t know how many levels there are.' },
      { text: 'Only count the top folder.', feedback: 'Misses everything inside.' },
    ],
  },
  lens: {
    layout: 'Each active call gets a frame on the call stack holding its own variables.',
    invariant: 'Every call works on a smaller problem, and a base case answers the smallest one directly.',
    payoff: 'Problems that contain smaller copies of themselves (folders, trees, divide-and-conquer) become short and clear.',
    price: 'Waiting calls use stack memory (too deep = stack overflow), and naive recursion can redo the same work many times.',
  },
  learn: {
    what: 'Recursion is when a function solves a problem by calling itself on a smaller version of the same problem. It’s the basis of many algorithms: sorting, tree and graph searches, backtracking and dynamic programming.',
    how: [
      'Base case: if the problem is tiny (like n = 0), return the answer directly.',
      'Otherwise, call yourself on a smaller problem (like n − 1) and trust it to return the right answer.',
      'Use that answer to build the answer for your problem.',
      'While calls are waiting for answers, they sit on the call stack; the last one to start finishes first.',
    ],
  },
  extras: {
    family: 'recursion',
    primitive: 'abstract',
    parts: ['a base case', 'a call on a smaller input', 'the call stack'],
    uses: ['Count every file inside a folder and all its subfolders, to any depth.', 'Process a tree by handling each subtree the same way as the whole.'],
    breaks: [
      {
        violation: 'The recursive call is made on the SAME size of problem (f(n) calls f(n)).',
        result: 'It never gets closer to the base case, so it recurses until the stack overflows.',
        wrong: ['It returns immediately.', 'It works but slowly.', 'It returns 0.'],
      },
    ],
    transfer: [
      {
        problem: 'Add up the digits of a number (e.g. 4,213 → 10) using recursion.',
        answer: 'digitSum(n) = (n mod 10) + digitSum(n ÷ 10), with digitSum(0) = 0.',
        wrong: [
          { text: 'digitSum(n) = n + digitSum(n − 1)', why: 'That adds all numbers below n, not the digits.' },
          { text: 'digitSum(n) = digitSum(n ÷ 10)', why: 'Throws the last digit away without adding it.' },
          { text: 'digitSum(n) = n mod 10', why: 'Only the last digit; no recursion.' },
        ],
        explain: 'Peel off the last digit (mod 10), recurse on the rest (÷ 10), and stop at 0.',
      },
    ],
  },
  generators: {
    predict: [predictRecValue, predictNoBase],
    simulate: [simulateReturns, orderRecursion],
    count: [countFibCalls, countDepth],
    explain: recExplain,
  },
};

// =====================================================================
// Binary search
// =====================================================================

const BS = 'binary-search';

function bsPath(a: number[], t: number) {
  const mids: number[] = [];
  let lo = 0;
  let hi = a.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    mids.push(mid);
    if (a[mid] === t) return { mids, found: true };
    if (a[mid] < t) lo = mid + 1;
    else hi = mid - 1;
  }
  return { mids, found: false };
}

const predictFirstMid = (): Card => {
  const a = distinctInts(randInt(7, 11), 1, 99).sort((x, y) => x - y);
  const t = pick(a);
  const { mids } = bsPath(a, t);
  const second = mids[1];
  return {
    concept: BS,
    type: 'predict',
    prompt: `Binary search for ${t} in ${fmtArray(a)} (indexes 0–${a.length - 1}; middle = ⌊(low + high) ÷ 2⌋). Which value is checked SECOND?`,
    body: {
      kind: 'choice',
      options: options(
        { text: second === undefined ? `None: ${t} is the first middle` : String(a[second]), why: `First middle is index ${mids[0]} (${a[mids[0]]}). ${t} is ${t < a[mids[0]] ? 'smaller, so keep the left half' : 'bigger, so keep the right half'}.` },
        [
          { text: String(a[1]), why: 'Binary search doesn’t walk from the start.' },
          { text: String(a[Math.max(0, mids[0] - 1)]), why: 'It jumps to the middle of the remaining half, not the neighbour.' },
          { text: String(a[Math.min(a.length - 1, mids[0] + 1)]), why: 'It jumps to the middle of the remaining half, not the neighbour.' },
          { text: String(a[a.length - 1]), why: 'It never checks the ends first.' },
        ],
      ),
    },
    explain: `Checked in order: ${mids.map((i) => a[i]).join(' → ')}. Each check throws away half of what’s left.`,
  };
};

const predictUnsorted = (): Card => ({
  concept: BS,
  type: 'predict',
  prompt: 'You run binary search on an array that is NOT sorted. What can happen?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'It can report “not found” for a value that is actually in the array.', correct: true, why: 'It throws away a half based on order, and the value may be in the discarded half.' },
      { text: 'It still works, just slower.', correct: false, why: 'Speed isn’t the problem; wrong answers are.' },
      { text: 'It sorts the array first automatically.', correct: false, why: 'Nothing sorts it.' },
      { text: 'It always crashes.', correct: false, why: 'It runs fine; it just gives wrong answers.' },
    ]),
  },
  explain: 'Binary search’s whole trick, “the value must be in this half”, depends on the array being sorted.',
});

const simulateBS = (): Card => {
  let a: number[];
  let t: number;
  let r: ReturnType<typeof bsPath>;
  do {
    a = distinctInts(randInt(9, 13), 1, 99).sort((x, y) => x - y);
    t = Math.random() < 0.75 ? pick(a) : randInt(1, 99);
    r = bsPath(a, t);
  } while (r.mids.length < 3);
  const scene = rowScene(a, 'Sorted array');
  const exp = r.mids.map((i) => `a:${i}`);
  return {
    concept: BS,
    type: 'simulate',
    prompt: `Binary search for ${t}. Click each value you check, in order (middle = ⌊(low + high) ÷ 2⌋). ${r.found ? '' : 'Stop when there is nothing left to check.'}`,
    scene,
    body: {
      kind: 'click',
      expected: exp,
      frames: clickFrames(scene, exp),
      wrongHint: (step) => (step === 0 ? `Start in the middle: index ⌊(0 + ${a.length - 1}) ÷ 2⌋.` : `Compare ${t} with ${a[r.mids[step - 1]]}; keep only the half that could contain it, then take its middle.`),
    },
    explain: `${r.mids.length} checks: ${r.mids.map((i) => a[i]).join(' → ')}${r.found ? '' : ', then nothing left: not found'}. A plain scan could need ${a.length}.`,
  };
};

const countBS = (): Card => {
  const n = pick([15, 31, 63, 127, 1000, 1_000_000]);
  return {
    concept: BS,
    type: 'count',
    prompt: `A sorted array has ${n.toLocaleString()} elements. At most how many values does binary search check?`,
    body: { kind: 'number', answer: Math.floor(Math.log2(n)) + 1, unit: 'checks' },
    explain: `Each check halves what’s left: ${n.toLocaleString()} → ${Math.floor(n / 2).toLocaleString()} → … → 1. That’s ⌊log₂ ${n.toLocaleString()}⌋ + 1 = ${Math.floor(Math.log2(n)) + 1} checks.`,
  };
};

const growthBS = (): Card => growthCard(BS, 'binary search in a sorted array (worst case)', (n) => Math.floor(Math.log2(n)) + 1, 1, 'Doubling the array adds just one check.');

const bsExplain = explainGenerators({
  concept: BS,
  truths: [
    'Binary search only works on sorted data.',
    'Each check compares with the middle and throws away half of what’s left.',
    'It needs at most about log₂ n checks.',
    'It stops when it finds the value or the range becomes empty.',
  ],
  myths: [
    { text: 'Binary search works on any array.', why: 'It needs the data sorted to know which half to throw away.' },
    { text: 'Binary search checks every other element.', why: 'It jumps to middles, halving each time.' },
    { text: 'Binary search is O(n).', why: 'It’s O(log n): a million elements take about 20 checks.' },
  ],
  chains: [
    {
      prompt: 'Why can binary search skip half the array after one check?',
      steps: ['The array is sorted.', 'If the target is bigger than the middle value, everything left of the middle is too small.', 'So the target can only be in the right half.', 'The left half never needs checking.'],
    },
  ],
  summary: {
    best: 'Binary search is the “guess the number, higher or lower?” game: always guess the middle and you halve the possibilities every time.',
    others: [
      { text: 'Binary search searches in binary.', why: '“Binary” means splitting in two, not ones and zeros.' },
      { text: 'It’s an O(log n) search.', why: 'The cost without the idea.' },
      { text: 'It searches from both ends.', why: 'It searches from the middle.' },
    ],
  },
});

export const binarySearchConcept: Concept = {
  id: BS,
  kind: 'algorithm',
  title: 'Binary Search',
  tier: 1,
  prereqs: ['static-array'],
  tagline: 'Halve a sorted range with every check.',
  hook: {
    problem: 'A sorted list of a million names. Checking them one by one could take a million checks.',
    question: 'How could you use the fact that it’s sorted?',
    options: [
      { text: 'Check the middle: if your name comes later, throw away the first half, and repeat.', good: true, feedback: 'Yes: binary search. About 20 checks for a million names.' },
      { text: 'Start from the end instead of the start.', feedback: 'Still one by one.' },
      { text: 'Check every 10th name.', feedback: 'Faster, but still about 100,000 checks.' },
    ],
  },
  lens: {
    layout: 'A sorted array, plus two positions: low and high.',
    invariant: 'If the target is in the array at all, it’s between low and high.',
    payoff: 'Finds a value in O(log n) checks: about 20 for a million items.',
    price: 'The data must be sorted (and stay sorted), and it needs jump-to-any-position access like an array.',
  },
  learn: {
    what: 'Binary search finds a value in a SORTED array by checking the middle and throwing away the half that can’t contain it. Each check halves the problem, so even huge arrays take only a few checks.',
    how: [
      'Keep a range: low = 0, high = last index.',
      'Check the middle element, at ⌊(low + high) ÷ 2⌋.',
      'If it’s the target, done. If the target is bigger, move low to middle + 1; if smaller, move high to middle − 1.',
      'Repeat until found, or until low passes high (then it’s not there).',
    ],
  },
  extras: {
    family: 'search',
    primitive: 'slots',
    parts: ['a sorted array', 'a low/high range', 'compare with the middle'],
    uses: ['Look up a word in a sorted dictionary of a million entries.', 'Find the first day on which a steadily growing number crossed a threshold.'],
    breaks: [
      {
        violation: 'When the target is bigger than the middle, you set low = middle (not middle + 1).',
        result: 'When only two elements are left, the middle stays the same forever: an infinite loop.',
        wrong: ['It finds the value faster.', 'It skips the target.', 'Nothing changes.'],
      },
    ],
    transfer: [
      {
        problem: 'Find the FIRST position in a sorted array where a value ≥ x appears (even if x itself isn’t there).',
        answer: 'Binary search, but when the middle is ≥ x, remember it and keep searching the LEFT half.',
        wrong: [
          { text: 'Scan from the start.', why: 'O(n): loses the point.' },
          { text: 'Normal binary search, return −1 if not found.', why: 'The question wants a position even when x is absent.' },
          { text: 'Search the right half when middle ≥ x.', why: 'Earlier positions might also be ≥ x.' },
        ],
        explain: 'The range shrinks toward the boundary between “< x” and “≥ x”: still O(log n).',
      },
    ],
  },
  generators: {
    predict: [predictFirstMid, predictUnsorted],
    simulate: [simulateBS],
    count: [countBS, growthBS],
    explain: bsExplain,
  },
};

// =====================================================================
// Two pointers
// =====================================================================

const TP = 'two-pointers';

function pairRun(a: number[], target: number) {
  let i = 0;
  let j = a.length - 1;
  const dropped: number[] = [];
  while (i < j) {
    const s = a[i] + a[j];
    if (s === target) return { i, j, dropped };
    if (s < target) dropped.push(i++);
    else dropped.push(j--);
  }
  return { i: -1, j: -1, dropped };
}

function pairCase() {
  for (;;) {
    const a = distinctInts(randInt(7, 9), 1, 40).sort((x, y) => x - y);
    const [p, q] = distinctInts(2, 0, a.length - 1).sort((x, y) => x - y);
    const target = a[p] + a[q];
    const r = pairRun(a, target);
    if (r.i >= 0 && r.dropped.length >= 2) return { a, target, r };
  }
}

const predictMove = (): Card => {
  const a = distinctInts(randInt(6, 8), 1, 40).sort((x, y) => x - y);
  const target = randInt(a[0] + a[1], a[a.length - 1] + a[a.length - 2]);
  const s = a[0] + a[a.length - 1];
  const ans = s === target ? 'Stop: found the pair' : s < target ? 'Move the LEFT pointer right' : 'Move the RIGHT pointer left';
  return {
    concept: TP,
    type: 'predict',
    prompt: `Sorted array ${fmtArray(a)}. Looking for two values that add up to ${target}. Left pointer on ${a[0]}, right pointer on ${a[a.length - 1]}: their sum is ${s}. What do you do?`,
    body: {
      kind: 'choice',
      options: options({ text: ans, why: s < target ? 'Too small: only a bigger left value can help.' : s > target ? 'Too big: only a smaller right value can help.' : 'Exact match.' }, [
        { text: 'Move the LEFT pointer right', why: 'That makes the sum bigger.' },
        { text: 'Move the RIGHT pointer left', why: 'That makes the sum smaller.' },
        { text: 'Move both pointers inward', why: 'Moving both could skip the answer.' },
        { text: 'Stop: found the pair', why: `${s} ≠ ${target}.` },
      ]),
    },
    explain: 'Sum too small → move left up (bigger values). Too big → move right down (smaller values). Each move rules out one value for good.',
  };
};

const simulateTP = (): Card => {
  const { a, target, r } = pairCase();
  const scene = rowScene(a, 'Sorted array', 'a');
  const exp = r.dropped.map((i) => `a:${i}`);
  return {
    concept: TP,
    type: 'simulate',
    prompt: `Find two values that add up to ${target}, with one pointer at each end. Each step, one value is ruled out (its pointer moves past it). Click the values ruled out, in order, until the pair is found.`,
    scene,
    body: {
      kind: 'click',
      expected: exp,
      frames: clickFrames(scene, exp),
      wrongHint: () => 'Add the two pointer values. Too small? The left value can never be part of the answer. Too big? The right one can’t.',
    },
    explain: `Ruled out ${r.dropped.map((i) => a[i]).join(', ')}; then ${a[r.i]} + ${a[r.j]} = ${target}. At most n − 1 steps, instead of checking every pair.`,
  };
};

const countPairs = (): Card => {
  const n = randInt(10, 1000);
  return pick([
    {
      concept: TP,
      type: 'count' as const,
      prompt: `A sorted array of ${n} numbers. Checking EVERY pair for a target sum takes how many pair checks?`,
      body: { kind: 'number' as const, answer: (n * (n - 1)) / 2, unit: 'checks' },
      explain: `${n} × ${n - 1} ÷ 2 = ${((n * (n - 1)) / 2).toLocaleString()}. Two pointers need at most ${n - 1}.`,
    },
    {
      concept: TP,
      type: 'count' as const,
      prompt: `A sorted array of ${n} numbers. With two pointers, at most how many sums are checked?`,
      body: { kind: 'number' as const, answer: n - 1, unit: 'checks' },
      explain: `Each check moves one pointer inward, and they meet after at most ${n - 1} moves.`,
    },
  ]);
};

const growthTP = (): Card => growthCard(TP, 'find a pair with a given sum, two pointers on a sorted array', (n) => n - 1, 2, 'Each step rules out one element: linear.');

const tpExplain = explainGenerators({
  concept: TP,
  truths: [
    'Two pointers start at different places (often both ends) and move toward each other.',
    'On a sorted array, the sum of the two pointer values tells you which pointer to move.',
    'Each move rules out one element for good, so it takes at most n steps.',
    'It replaces checking every pair (about n²/2) with one pass.',
  ],
  myths: [
    { text: 'Two pointers work for a pair sum on an unsorted array.', why: 'The “too small → move left” logic needs sorted order.' },
    { text: 'You must move both pointers every step.', why: 'Move only the one that can improve the sum.' },
    { text: 'Two pointers check every pair, just in a different order.', why: 'They skip most pairs because they’re provably useless.' },
  ],
  chains: [
    {
      prompt: 'Why is it safe to rule out the left value when the sum is too small?',
      steps: ['The right pointer is on the biggest value still in play.', 'Even with that biggest value, the sum is too small.', 'So the left value can’t reach the target with anything.', 'It can be ruled out for good.'],
    },
  ],
  summary: {
    best: 'Two pointers walk toward each other from both ends of a sorted list, and every step one of them proves its value useless and moves on.',
    others: [
      { text: 'It uses two variables.', why: 'Misses why it’s fast.' },
      { text: 'It’s for linked lists.', why: 'It’s mostly used on arrays.' },
      { text: 'It checks pairs faster.', why: 'It avoids checking most pairs at all.' },
    ],
  },
});

export const twoPointersConcept: Concept = {
  id: TP,
  kind: 'algorithm',
  title: 'Two Pointers',
  tier: 1,
  prereqs: ['static-array'],
  tagline: 'Walk inward from both ends, ruling values out.',
  hook: {
    problem: 'Given a sorted list of prices, find two items that together cost exactly €50. Trying every pair of 10,000 items is 50 million checks.',
    question: 'How could the sorted order help?',
    options: [
      { text: 'Start with the cheapest and the most expensive. Too cheap together? Swap in a pricier cheap item. Too pricey? Swap in a cheaper expensive one.', good: true, feedback: 'Yes: two pointers. Each step rules out one item for good, so it’s at most 10,000 steps.' },
      { text: 'Pick random pairs.', feedback: 'Might never find it.' },
      { text: 'Check pairs of neighbours only.', feedback: 'The pair could be far apart.' },
    ],
  },
  lens: {
    layout: 'A sorted array and two positions, usually one at each end.',
    invariant: 'The answer (if any) always lies between the two pointers.',
    payoff: 'Pair and range problems in one O(n) pass instead of checking O(n²) pairs.',
    price: 'Needs an order to reason with (usually sorted data); only fits certain problems.',
  },
  learn: {
    what: 'The two-pointer technique uses two positions in an array that move toward each other (or in the same direction), using the array’s order to rule out possibilities without checking them.',
    how: [
      'Put one pointer at the start and one at the end of a sorted array.',
      'Look at the two values. For a target sum: if their sum is too small, move the left pointer right; if too big, move the right pointer left.',
      'Each move rules out one value that can never be part of the answer.',
      'Stop when you find the answer or the pointers meet.',
    ],
  },
  extras: {
    family: 'array-technique',
    primitive: 'slots',
    parts: ['a sorted array', 'a left and a right pointer', 'a rule for which pointer moves'],
    uses: ['Find two prices in a sorted list that add up to exactly a budget.', 'Reverse an array in place by swapping the two ends and moving inward.'],
    rivals: ['sliding-window'],
    breaks: [
      {
        violation: 'When the sum is too small, you move the RIGHT pointer left instead.',
        result: 'The sum only gets smaller, so a valid pair can be skipped and the search reports no pair.',
        wrong: ['It finds the pair faster.', 'It still always works.', 'It loops forever.'],
      },
    ],
    transfer: [
      {
        problem: 'Remove duplicates from a SORTED array in place, keeping one of each.',
        answer: 'A slow pointer marks where the next unique value goes; a fast pointer scans; copy when fast finds a new value.',
        wrong: [
          { text: 'Compare every pair and delete matches.', why: 'O(n²) and deleting shifts elements.' },
          { text: 'Use one pointer from each end.', why: 'Duplicates are next to each other, so both pointers should go the same way.' },
          { text: 'Sort it again.', why: 'It’s already sorted; that doesn’t remove anything.' },
        ],
        explain: 'Both pointers move left to right at different speeds: O(n), no extra memory.',
      },
    ],
  },
  generators: {
    predict: [predictMove],
    simulate: [simulateTP],
    count: [countPairs, growthTP],
    explain: tpExplain,
  },
};

// =====================================================================
// Sliding window
// =====================================================================

const SW = 'sliding-window';

const windowSums = (a: number[], k: number) => Array.from({ length: a.length - k + 1 }, (_, i) => a.slice(i, i + k).reduce((s, x) => s + x, 0));

const predictMaxWindow = (): Card => {
  const a = Array.from({ length: randInt(7, 9) }, () => randInt(1, 9));
  const k = randInt(2, 4);
  const sums = windowSums(a, k);
  const best = Math.max(...sums);
  return {
    concept: SW,
    type: 'predict',
    prompt: `a = ${fmtArray(a)}. What is the largest sum of ${k} neighbouring values?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        best,
        [
          { value: [...a].sort((x, y) => y - x).slice(0, k).reduce((s, x) => s + x, 0), why: 'Those biggest values aren’t all next to each other.' },
          { value: sums[0], why: 'That’s only the first window.' },
          { value: Math.min(...sums), why: 'That’s the smallest window.' },
        ],
        'Slide the window along and keep the best sum.',
      ),
    },
    explain: `Window sums: ${sums.join(', ')}. Best: ${best}.`,
  };
};

const predictNextSum = (): Card => {
  const a = Array.from({ length: randInt(7, 9) }, () => randInt(1, 9));
  const k = randInt(3, 4);
  const i = randInt(0, a.length - k - 1);
  const cur = windowSums(a, k)[i];
  const nxt = cur - a[i] + a[i + k];
  return {
    concept: SW,
    type: 'predict',
    prompt: `a = ${fmtArray(a)}. The window a[${i}..${i + k - 1}] sums to ${cur}. Slide it one step right. Without re-adding everything, what's the new sum?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        nxt,
        [
          { value: cur + a[i + k], why: `You also need to remove ${a[i]}, which left the window.` },
          { value: cur - a[i], why: `You also need to add ${a[i + k]}, which entered.` },
          { value: cur - a[i + k] + a[i], why: 'Backwards: subtract what leaves, add what enters.' },
        ],
        'Subtract what leaves, add what enters.',
      ),
    },
    explain: `${cur} − ${a[i]} + ${a[i + k]} = ${nxt}. Two operations per slide instead of ${k}.`,
  };
};

const simulateSW = (): Card => {
  const a = Array.from({ length: randInt(7, 8) }, () => randInt(1, 9));
  const k = 3;
  const slides = randInt(2, 3);
  const exp: string[] = [];
  for (let s = 0; s < slides; s++) exp.push(`a:${s}`, `a:${s + k}`);
  const scene = rowScene(a, `Window of ${k}, starting at the left`, 'a', undefined, [
    { name: 'start', index: 0 },
    { name: 'end', index: k - 1 },
  ]);
  return {
    concept: SW,
    type: 'simulate',
    prompt: `Slide a window of ${k} along the array, ${slides} times. For each slide, click the value that LEAVES the window, then the value that ENTERS it.`,
    scene,
    body: { kind: 'click', expected: exp, frames: clickFrames(scene, exp), wrongHint: (step) => (step % 2 === 0 ? 'The leftmost value of the current window leaves.' : 'The value just right of the current window enters.') },
    explain: 'Each slide touches just two values, however big the window is. That’s why sliding windows are O(n).',
  };
};

const countSW = (): Card => {
  const n = randInt(20, 200);
  const k = randInt(5, 15);
  return {
    concept: SW,
    type: 'count',
    prompt: `Array of ${n} numbers, window size ${k}. Recomputing every window from scratch, how many additions (count one per value added, ${k} per window) does that take?`,
    body: { kind: 'number', answer: (n - k + 1) * k, unit: 'additions' },
    explain: `${n - k + 1} windows × ${k} = ${(n - k + 1) * k}. Sliding needs about ${k} + 2 × ${n - k}: one add and one subtract per slide.`,
  };
};

const growthSW = (): Card => growthCard(SW, 'max sum of every window of 5, sliding (update, don’t re-add)', (n) => 5 + 2 * (n - 5 > 0 ? n - 5 : 0), 2, 'Two operations per slide: linear in n.', [8, 16, 32, 64]);

const swExplain = explainGenerators({
  concept: SW,
  truths: [
    'A sliding window is a stretch of neighbouring elements that moves along the array.',
    'When the window slides, one value leaves and one enters; update the answer instead of recomputing it.',
    'That makes the whole pass O(n) instead of O(n × k).',
    'Variable-size windows grow on the right and shrink on the left to keep a condition true.',
  ],
  myths: [
    { text: 'Each window must be summed from scratch.', why: 'Only the leaving and entering values change.' },
    { text: 'Sliding windows need the array sorted.', why: 'They work on neighbours in the original order.' },
    { text: 'The best window is always made of the biggest values.', why: 'The values must be next to each other.' },
  ],
  chains: [
    {
      prompt: 'Why is sliding faster than recomputing?',
      steps: ['Two neighbouring windows share all but two values.', 'The shared values’ total doesn’t change.', 'So update with just the value leaving and the value entering.', 'Two operations per step instead of k.'],
    },
  ],
  summary: {
    best: 'A sliding window is like a frame moving along a row: each step, one thing slides out one side and one slides in the other, so you only update what changed.',
    others: [
      { text: 'It’s a window that slides.', why: 'Restates the name.' },
      { text: 'It’s for subarrays.', why: 'What, not how.' },
      { text: 'It checks all subarrays.', why: 'It avoids re-checking them.' },
    ],
  },
});

export const slidingWindowConcept: Concept = {
  id: SW,
  kind: 'algorithm',
  title: 'Sliding Window',
  tier: 1,
  prereqs: ['static-array'],
  tagline: 'Update a moving stretch instead of recomputing it.',
  hook: {
    problem: 'Daily step counts for a year. You want the best 7-day stretch. Re-adding 7 days for each of the 359 stretches repeats almost all the work.',
    question: 'What changes between one 7-day stretch and the next?',
    options: [
      { text: 'Only one day drops off the start and one day joins at the end: subtract one, add one.', good: true, feedback: 'Yes: a sliding window. Two operations per step, whatever the window size.' },
      { text: 'Everything, so re-add it.', feedback: 'Six of the seven days are the same.' },
      { text: 'Sort the days first.', feedback: 'Then the days are no longer consecutive.' },
    ],
  },
  lens: {
    layout: 'An array and a window [start, end] over a stretch of neighbouring elements.',
    invariant: 'The running answer (sum, count…) always describes exactly the current window.',
    payoff: 'Answers about every stretch in one O(n) pass.',
    price: 'Only for questions about neighbouring stretches; the running answer must be cheap to update.',
  },
  learn: {
    what: 'A sliding window looks at a stretch of neighbouring elements and moves it along the array. Instead of recomputing everything for each position, it updates the answer with just what leaves and what enters.',
    how: [
      'Compute the answer (e.g. the sum) for the first window.',
      'Slide one step: subtract the value that leaves on the left, add the value that enters on the right.',
      'Keep track of the best answer seen.',
      'For variable-size windows: grow the right end, and shrink the left end whenever a condition breaks.',
    ],
  },
  extras: {
    family: 'array-technique',
    primitive: 'slots',
    parts: ['an array', 'a start and end of the window', 'a running total updated on each slide'],
    uses: ['Find the busiest 7-day stretch in a year of daily visits.', 'Find the longest stretch of a string with no repeated letters.'],
    rivals: ['two-pointers', 'prefix-sum'],
    breaks: [
      {
        violation: 'On each slide you add the entering value but forget to subtract the leaving one.',
        result: 'The running total keeps growing; it becomes the sum of everything so far, not the window.',
        wrong: ['The total stays correct.', 'The total shrinks.', 'Only the last window is wrong.'],
      },
    ],
    transfer: [
      {
        problem: 'Find the length of the shortest stretch of positive numbers whose sum is at least S.',
        answer: 'Variable window: grow the right end until sum ≥ S, then shrink the left end while it stays ≥ S, recording the length.',
        wrong: [
          { text: 'Try every start and every end.', why: 'O(n²).' },
          { text: 'Sort and take the biggest numbers.', why: 'The numbers must be next to each other.' },
          { text: 'Fixed window of size S.', why: 'S is a sum, not a length.' },
        ],
        explain: 'Each element enters once and leaves once, so the whole thing is O(n).',
      },
    ],
  },
  generators: {
    predict: [predictMaxWindow, predictNextSum],
    simulate: [simulateSW],
    count: [countSW, growthSW],
    explain: swExplain,
  },
};

// =====================================================================
// Fast & slow pointers
// =====================================================================

const FS = 'fast-slow-pointers';

const listRow = (vals: number[], title: string, circularTo?: number): Scene => ({
  views: [{ type: 'row', key: 'n', items: vals, labels: vals.map((_, i) => (circularTo !== undefined && i === vals.length - 1 ? `→ back to ${vals[circularTo]}` : i === vals.length - 1 ? '→ ∅' : '→')), title }],
});

const predictMiddle = (): Card => {
  const n = randInt(5, 10);
  const vals = distinctInts(n, 10, 99);
  const mid = Math.floor((n - 1) / 2);
  return {
    concept: FS,
    type: 'predict',
    prompt: `A linked list: ${vals.join(' → ')} → ∅. Slow moves 1 step, fast moves 2 steps, both starting at the first node, while fast can still take 2 steps. Where is slow when fast stops?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        vals[mid],
        [
          { value: vals[mid - 1], why: 'Count the steps: slow makes one move for each double move of fast.' },
          { value: vals[n - 1], why: 'That’s where fast is (or near it).' },
          { value: vals[0], why: 'Slow moves too.' },
        ],
        'Slow ends in the middle.',
      ),
    },
    explain: `Fast covers twice the distance, so when it can’t go further, slow is halfway: node ${mid + 1} of ${n} (${vals[mid]}). One pass, no need to know the length first.`,
  };
};

const predictCycle = (): Card => {
  const cyc = Math.random() < 0.5;
  return {
    concept: FS,
    type: 'predict',
    prompt: `A linked list ${cyc ? 'loops back on itself (its last node points to an earlier node)' : 'ends normally in ∅'}. You run slow (1 step) and fast (2 steps). What happens?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: 'Fast and slow eventually land on the same node.', correct: cyc, why: cyc ? 'Inside the loop, fast gains one node per step, so it must catch slow.' : 'Without a loop, fast just reaches the end.' },
        { text: 'Fast reaches the end (∅).', correct: !cyc, why: !cyc ? 'No loop: fast falls off the end first.' : 'There is no end in a looping list.' },
        { text: 'They both run forever without meeting.', correct: false, why: cyc ? 'Fast gains a step every move, so it catches up.' : 'Fast reaches the end.' },
      ]),
    },
    explain: 'That’s Floyd’s cycle check: meeting means a loop, reaching ∅ means none. No extra memory needed.',
  };
};

const simulateMiddle = (): Card => {
  const n = randInt(6, 9);
  const vals = distinctInts(n, 10, 99);
  const moves = Math.floor((n - 1) / 2);
  const exp = Array.from({ length: moves }, (_, i) => `n:${i + 1}`);
  const scene = listRow(vals, 'Linked list (each node points to the next)');
  return {
    concept: FS,
    type: 'simulate',
    prompt: `Slow and fast both start on ${vals[0]}. Each round, fast jumps 2 nodes and slow 1, while fast can still jump 2. Click the node slow lands on after each round.`,
    scene,
    body: { kind: 'click', expected: exp, frames: clickFrames(scene, exp), wrongHint: () => 'Slow moves just one node per round.' },
    explain: `${moves} rounds; slow ends on ${vals[moves]}, the middle.`,
  };
};

const countFS = (): Card => {
  const n = randInt(5, 200);
  return {
    concept: FS,
    type: 'count',
    prompt: `A linked list of ${n} nodes. Fast (2 steps) and slow (1 step) start at the first node and go while fast can take 2 more steps. How many steps does SLOW take?`,
    body: { kind: 'number', answer: Math.floor((n - 1) / 2), unit: 'steps' },
    explain: `Fast can take ⌊(${n} − 1) ÷ 2⌋ = ${Math.floor((n - 1) / 2)} double steps before running out; slow takes the same number of single steps.`,
  };
};

const fsExplain = explainGenerators({
  concept: FS,
  truths: [
    'Two pointers move through a list at different speeds, usually 1 and 2 steps.',
    'When fast reaches the end, slow is in the middle.',
    'In a list with a loop, fast eventually lands on the same node as slow.',
    'It needs no extra memory, only two pointers.',
  ],
  myths: [
    { text: 'You need to know the list’s length to find its middle.', why: 'Fast and slow find it in one pass.' },
    { text: 'To detect a loop you must store every visited node.', why: 'Fast/slow detects it with two pointers.' },
    { text: 'In a loop, fast can jump over slow forever.', why: 'Fast gains one node per round, so the gap shrinks to 0.' },
  ],
  chains: [
    {
      prompt: 'Why must fast catch slow inside a loop?',
      steps: ['Once both are in the loop, fast is some distance behind slow.', 'Each round, fast moves 2 and slow moves 1.', 'So the gap shrinks by exactly 1 each round.', 'It must reach 0: they meet.'],
    },
  ],
  summary: {
    best: 'Send a runner and a walker down the list: when the runner finishes, the walker is halfway; and if the path loops, the runner laps the walker.',
    others: [
      { text: 'It’s Floyd’s algorithm.', why: 'A name, not an explanation.' },
      { text: 'It uses two pointers.', why: 'Misses the different speeds.' },
      { text: 'It finds cycles.', why: 'One use; also finds middles.' },
    ],
  },
});

export const fastSlowConcept: Concept = {
  id: FS,
  kind: 'algorithm',
  title: 'Fast & Slow Pointers',
  tier: 1,
  prereqs: ['linked-list'],
  tagline: 'A runner and a walker: find middles and loops.',
  hook: {
    problem: 'You need the middle node of a linked list, but you don’t know its length. Counting first means two passes.',
    question: 'How could one pass find the middle?',
    options: [
      { text: 'Move one pointer twice as fast as another; when the fast one finishes, the slow one is halfway.', good: true, feedback: 'Yes. And the same trick detects loops: in a loop, the fast one catches the slow one.' },
      { text: 'Jump to position length ÷ 2.', feedback: 'You don’t know the length, and lists can’t jump.' },
      { text: 'Walk from both ends.', feedback: 'A singly linked list can’t go backwards.' },
    ],
  },
  lens: {
    layout: 'A linked list and two pointers moving at speeds 1 and 2.',
    invariant: 'Fast has always travelled exactly twice as far as slow.',
    payoff: 'Middle of a list, or loop detection, in one pass with no extra memory.',
    price: 'Only answers questions about positions relative to the length (middle, loops, k-th from end with a head start).',
  },
  learn: {
    what: 'Fast and slow pointers walk the same linked list at different speeds. Because fast always covers twice the distance, their positions reveal the middle of the list and whether the list loops back on itself.',
    how: [
      'Start both pointers on the first node.',
      'Each round: slow moves 1 node, fast moves 2.',
      'If fast reaches the end, slow is at the middle.',
      'If the list loops, fast will eventually land on the same node as slow: that proves there’s a loop.',
    ],
  },
  extras: {
    family: 'list-technique',
    primitive: 'links',
    parts: ['a linked list', 'a slow pointer (1 step)', 'a fast pointer (2 steps)'],
    uses: ['Find the middle node of a linked list in one pass.', 'Detect whether a chain of “next” pointers ever loops back on itself.'],
    breaks: [
      {
        violation: 'Fast moves 2 steps without checking that the next node exists.',
        result: 'On a list with no loop, fast steps past the end and the program crashes.',
        wrong: ['It finds the middle anyway.', 'Slow crashes instead.', 'Nothing happens.'],
      },
    ],
    transfer: [
      {
        problem: 'Find the k-th node from the END of a linked list in one pass.',
        answer: 'Move a lead pointer k nodes ahead, then move both one step at a time until the lead reaches the end.',
        wrong: [
          { text: 'Count the length, then walk length − k.', why: 'That’s two passes.' },
          { text: 'Move one pointer at double speed.', why: 'That finds the middle, not k from the end.' },
          { text: 'Walk backwards k steps from the end.', why: 'A singly linked list can’t go backwards.' },
        ],
        explain: 'Same idea, different spacing: a fixed gap of k instead of a speed ratio of 2.',
      },
    ],
  },
  generators: {
    predict: [predictMiddle, predictCycle],
    simulate: [simulateMiddle],
    count: [countFS],
    explain: fsExplain,
  },
};

// =====================================================================
// Counting with hash maps
// =====================================================================

const HP = 'hashing-patterns';

const predictFirstRepeat = (): Card => {
  const a = distinctInts(randInt(5, 7), 1, 30);
  const j = randInt(2, a.length - 1);
  const dupOf = randInt(0, j - 1);
  const arr = [...a.slice(0, j), a[dupOf], ...a.slice(j)];
  return {
    concept: HP,
    type: 'predict',
    prompt: `Scan ${fmtArray(arr)} left to right, remembering each value in a hash set. Which value is the first one you've already seen?`,
    body: {
      kind: 'choice',
      options: options({ text: String(a[dupOf]), why: 'It’s the first value found already in the set.' }, [
        { text: String(arr[0]), why: 'The first value can’t already be in an empty set.' },
        { text: String(arr[j - 1]), why: 'Check whether it was seen before.' },
        { text: 'None', why: 'One value does appear twice.' },
      ]),
    },
    explain: `${a[dupOf]} is seen at position ${dupOf}, then again at ${j}. One O(1) set lookup per element: O(n) total.`,
  };
};

const predictAnagram = (): Card => {
  const pairs = [
    ['listen', 'silent', true],
    ['night', 'thing', true],
    ['apple', 'paple', true],
    ['hello', 'olleh', true],
    ['cat', 'act', true],
    ['stack', 'tacks', true],
    ['queue', 'queen', false],
    ['heap', 'hoop', false],
    ['tree', 'tire', false],
    ['array', 'rayar', true],
    ['graph', 'phrag', true],
    ['list', 'lisp', false],
  ] as const;
  const [a, b, yes] = pick(pairs);
  return {
    concept: HP,
    type: 'predict',
    prompt: `Count each letter of "${a}" and "${b}" in a hash map. Are they anagrams (exactly the same letter counts)?`,
    body: {
      kind: 'choice',
      options: [
        { text: 'Yes', correct: yes, why: yes ? 'Every letter count matches.' : 'At least one letter count differs.' },
        { text: 'No', correct: !yes, why: !yes ? 'At least one letter count differs.' : 'Every letter count matches.' },
      ],
    },
    explain: 'Counting letters is O(length), instead of trying every rearrangement.',
  };
};

const simulateFirstRepeat = (): Card => {
  const a = distinctInts(randInt(6, 8), 1, 30);
  const j = randInt(3, a.length - 1);
  const dupOf = randInt(0, j - 2);
  const arr = [...a.slice(0, j), a[dupOf], ...a.slice(j)];
  const scene = rowScene(arr, 'Values');
  const exp = Array.from({ length: j + 1 }, (_, i) => `a:${i}`);
  return {
    concept: HP,
    type: 'simulate',
    prompt: 'Find the first repeated value. Click each value as you check it against the set of values seen so far, left to right. Stop at the first one already seen.',
    scene,
    body: { kind: 'click', expected: exp, frames: clickFrames(scene, exp), wrongHint: () => 'Go left to right; stop only when a value is already in your set.' },
    explain: `Checked ${j + 1} values; ${a[dupOf]} was already in the set. Each check is O(1).`,
  };
};

const countHP = (): Card => {
  const n = randInt(20, 5000);
  return {
    concept: HP,
    type: 'count',
    prompt: `To check if ${n.toLocaleString()} numbers contain a duplicate, comparing every pair takes how many comparisons? (A hash set needs about ${n.toLocaleString()} lookups.)`,
    body: { kind: 'number', answer: (n * (n - 1)) / 2, unit: 'comparisons' },
    explain: `${n} × ${n - 1} ÷ 2 = ${((n * (n - 1)) / 2).toLocaleString()}. The hash set turns that into one pass.`,
  };
};

const growthHP = (): Card => growthCard(HP, 'detect a duplicate using a hash set', (n) => n, 2, 'One O(1) lookup per element.');

const hpExplain = explainGenerators({
  concept: HP,
  truths: [
    'A hash map or set answers “have I seen this?” or “how many times?” in O(1) on average.',
    'Many pair problems become one pass: for each value, look up what you need.',
    'Counting occurrences (letters, words, values) is a single loop with a map.',
  ],
  myths: [
    { text: 'Finding duplicates always needs comparing every pair.', why: 'A set remembers what you’ve seen: one pass.' },
    { text: 'Anagrams must be checked by trying rearrangements.', why: 'Compare letter counts.' },
    { text: 'Hash maps keep things in order.', why: 'They don’t; if you need order, add it separately.' },
  ],
  chains: [
    {
      prompt: 'Why does a hash set make duplicate detection O(n)?',
      steps: ['Scan the values once.', 'For each value, ask the set: seen before?', 'Each ask is O(1) on average.', 'n values × O(1) = O(n).'],
    },
  ],
  summary: {
    best: 'Keep a notebook of what you’ve already seen, organised so you can check any entry instantly; lots of “compare everything with everything” problems become one pass.',
    others: [
      { text: 'Use a hash map.', why: 'Which question does it answer, and why is it fast?' },
      { text: 'It’s a counting algorithm.', why: 'Vague.' },
      { text: 'It sorts the data.', why: 'Nothing is sorted.' },
    ],
  },
});

export const hashingPatternsConcept: Concept = {
  id: HP,
  kind: 'algorithm',
  title: 'Counting with Hash Maps',
  tier: 4,
  prereqs: ['hash-map'],
  tagline: '“Have I seen this?” in one step turns pairs into one pass.',
  hook: {
    problem: 'Do any two of 100,000 customer IDs repeat? Comparing every pair is 5 billion comparisons.',
    question: 'What could you remember while scanning once?',
    options: [
      { text: 'Every ID seen so far, in a hash set; each new ID is checked in one step.', good: true, feedback: 'Yes. One pass, one quick check per ID.' },
      { text: 'Only the last ID.', feedback: 'Duplicates can be far apart.' },
      { text: 'Nothing; just compare pairs faster.', feedback: 'Still billions of comparisons.' },
    ],
  },
  lens: {
    layout: 'The input plus a hash map (or set) of what’s been seen, or counts.',
    invariant: 'After processing each element, the map holds exactly the information about everything seen so far.',
    payoff: 'Turns many O(n²) “compare pairs” problems into one O(n) pass.',
    price: 'Extra memory for the map; average-case speed; no ordering.',
  },
  learn: {
    what: 'Many problems that seem to need comparing everything with everything can be solved in one pass by remembering what you’ve seen in a hash map or set, which answers “seen it?” or “how many?” in a single step.',
    how: [
      'Walk through the data once.',
      'For each item, ask the map a question: have I seen this? Have I seen its partner (like target − x)? How many so far?',
      'Update the map with the current item.',
      'Each step is O(1) on average, so the whole thing is O(n).',
    ],
  },
  extras: {
    family: 'hash-technique',
    primitive: 'both',
    parts: ['a single scan', 'a hash map or set of what’s been seen', 'an O(1) question per element'],
    uses: ['Find whether any customer ID appears twice in a huge list.', 'Check whether two words are anagrams by comparing letter counts.'],
    breaks: [
      {
        violation: 'In “find two numbers summing to T”, you add x to the map BEFORE checking for T − x.',
        result: 'When T = 2x, x finds itself and you report a pair using the same element twice.',
        wrong: ['It misses every pair.', 'Nothing changes.', 'It becomes O(n²).'],
      },
    ],
    transfer: [
      {
        problem: 'Group words that are anagrams of each other (e.g. “eat”, “tea”, “ate”).',
        answer: 'Use a map whose key is each word’s letters sorted (“aet”) and whose value is the list of words.',
        wrong: [
          { text: 'Compare every pair of words.', why: 'O(n²) comparisons.' },
          { text: 'Key the map by word length.', why: 'Different words share lengths.' },
          { text: 'Key the map by first letter.', why: 'Anagrams can start with different letters.' },
        ],
        explain: 'Anagrams share the same sorted letters, so that string is a perfect grouping key.',
      },
    ],
  },
  generators: {
    predict: [predictFirstRepeat, predictAnagram],
    simulate: [simulateFirstRepeat],
    count: [countHP, growthHP],
    explain: hpExplain,
  },
};

// =====================================================================
// Bit manipulation
// =====================================================================

const BM = 'bit-manipulation';
const b4 = (x: number) => x.toString(2).padStart(4, '0');

const predictBitOp = (): Card => {
  const [a, b] = distinctInts(2, 1, 15);
  const op = pick(['AND', 'OR', 'XOR'] as const);
  const f = { AND: a & b, OR: a | b, XOR: a ^ b };
  return {
    concept: BM,
    type: 'predict',
    prompt: `a = ${b4(a)}, b = ${b4(b)}. What is a ${op} b (bit by bit)?`,
    body: {
      kind: 'choice',
      options: options({ text: b4(f[op]), why: { AND: '1 only where both are 1.', OR: '1 where either is 1.', XOR: '1 where they differ.' }[op] }, [
        { text: b4(f.AND), why: 'That’s AND: 1 only where both are 1.' },
        { text: b4(f.OR), why: 'That’s OR: 1 where either is 1.' },
        { text: b4(f.XOR), why: 'That’s XOR: 1 where they differ.' },
        { text: b4((a + b) & 15), why: 'That’s ordinary addition, with carries.' },
      ]),
    },
    explain: `a ${op} b = ${b4(f[op])} (${f[op]}). Each bit is handled separately; no carries.`,
  };
};

const predictXorUnique = (): Card => {
  const vals = distinctInts(3, 1, 20);
  const u = randInt(21, 40);
  const arr = shuffle([...vals, ...vals, u]);
  return {
    concept: BM,
    type: 'predict',
    prompt: `Every number in ${fmtArray(arr)} appears twice except one. You XOR them all together. What do you get?`,
    body: {
      kind: 'choice',
      options: numberOptions(u, [
        { value: 0, why: 'The unpaired number doesn’t cancel.' },
        { value: arr.reduce((s, x) => s + x, 0), why: 'That’s the sum, not the XOR.' },
        { value: vals[0], why: `${vals[0]} appears twice, so it cancels itself out.` },
      ], 'x XOR x = 0, so pairs cancel.'),
    },
    explain: `x XOR x = 0 and x XOR 0 = x, so every pair cancels and only ${u} remains. O(n), no extra memory.`,
  };
};

const simulateClearLowest = (): Card => {
  const x = randInt(20, 255);
  const bits = x.toString(2).padStart(8, '0').split('').map(Number);
  const ones = bits.map((b, i) => (b ? i : -1)).filter((i) => i >= 0).reverse(); // lowest (rightmost) first
  const labels = [128, 64, 32, 16, 8, 4, 2, 1].map(String);
  const frames: Scene[] = [];
  const cur = [...bits];
  frames.push(rowScene([...cur], `x = ${x}`, 'b', labels));
  ones.forEach((i) => {
    cur[i] = 0;
    frames.push({ ...rowScene([...cur], 'x after x & (x − 1)', 'b', labels), highlight: [`b:${i}`] });
  });
  return {
    concept: BM,
    type: 'simulate',
    prompt: `x = ${x}. Count its 1-bits with the trick x = x & (x − 1), which clears the LOWEST 1-bit each time. Click the bit each step clears.`,
    scene: frames[0],
    body: { kind: 'click', expected: ones.map((i) => `b:${i}`), frames, wrongHint: () => 'x − 1 flips the rightmost 1 (and the 0s after it); AND-ing clears exactly that 1.' },
    explain: `${ones.length} steps = ${ones.length} one-bits. The loop runs once per 1-bit, not once per bit.`,
  };
};

const countShift = (): Card => {
  const x = randInt(1, 20);
  const k = randInt(1, 5);
  return {
    concept: BM,
    type: 'count',
    prompt: `What is ${x} << ${k} (shift the bits of ${x} left by ${k} places)?`,
    body: { kind: 'number', answer: x * 2 ** k },
    explain: `Each left shift doubles: ${x} × 2^${k} = ${x * 2 ** k}.`,
  };
};

const countPop = (): Card => {
  const x = randInt(1, 255);
  const ones = x.toString(2).split('').filter((c) => c === '1').length;
  return {
    concept: BM,
    type: 'count',
    prompt: `How many times does the loop "while x ≠ 0: x = x & (x − 1)" run for x = ${x} (${x.toString(2)} in binary)?`,
    body: { kind: 'number', answer: ones, unit: 'times' },
    explain: `Once per 1-bit: ${ones}.`,
  };
};

const bmExplain = explainGenerators({
  concept: BM,
  truths: [
    'AND gives 1 only where both bits are 1; OR where either is; XOR where they differ.',
    'Shifting left by k multiplies by 2^k; shifting right divides by 2^k.',
    'x & (x − 1) clears the lowest 1-bit of x.',
    'x XOR x = 0, so XOR-ing a list cancels out pairs.',
  ],
  myths: [
    { text: 'XOR is the same as OR.', why: 'XOR is 0 when both bits are 1.' },
    { text: 'Bit operations are slower than arithmetic.', why: 'They’re among the fastest things a CPU does.' },
    { text: 'x & (x − 1) clears the highest bit.', why: 'It clears the lowest 1-bit.' },
  ],
  chains: [
    {
      prompt: 'Why does x & (x − 1) clear the lowest 1-bit?',
      steps: ['Subtracting 1 turns the lowest 1-bit into 0.', 'The 0s to its right all become 1s; bits to its left don’t change.', 'AND keeps only bits that are 1 in both.', 'So everything from the lowest 1-bit rightwards becomes 0, and the rest is unchanged.'],
    },
  ],
  summary: {
    best: 'Bit manipulation treats a number as a row of switches and flips, tests or combines them all at once, which is as fast as computing gets.',
    others: [
      { text: 'It’s low-level programming.', why: 'Vague.' },
      { text: 'It’s binary arithmetic.', why: 'It’s mostly not arithmetic: bits are handled independently.' },
      { text: 'It’s for saving memory.', why: 'One use; also speed and clever tricks.' },
    ],
  },
});

export const bitManipulationConcept: Concept = {
  id: BM,
  kind: 'algorithm',
  title: 'Bit Manipulation',
  tier: 1,
  prereqs: ['bits'],
  tagline: 'Flip, test and combine bits directly.',
  hook: {
    problem: 'Among millions of numbers, every value appears twice except one. Storing counts would use lots of memory.',
    question: 'Is there a way for the pairs to cancel themselves out?',
    options: [
      { text: 'XOR everything together: x XOR x = 0, so pairs vanish and the single one remains.', good: true, feedback: 'Yes. One pass, zero extra memory.' },
      { text: 'Add them all up.', feedback: 'Pairs don’t cancel when you add.' },
      { text: 'Sort them first.', feedback: 'Works, but O(n log n).' },
    ],
  },
  lens: {
    layout: 'Numbers seen as rows of bits.',
    invariant: 'Each bit position is handled independently by AND, OR, XOR and shifts.',
    payoff: 'Set/check/clear flags, multiply or divide by powers of 2, and clever tricks in a single fast instruction.',
    price: 'Easy to get wrong and hard to read; limited to fixed-width numbers.',
  },
  learn: {
    what: 'Bit manipulation works directly on the bits of a number. Operations like AND, OR, XOR and shifts change all the bits at once in a single step, which enables compact and very fast tricks.',
    how: [
      'AND (&): 1 only where both are 1. Used to test or clear bits.',
      'OR (|): 1 where either is 1. Used to set bits.',
      'XOR (^): 1 where they differ. x ^ x = 0, so it cancels pairs.',
      'Shifts: x << k multiplies by 2^k; x >> k divides by 2^k. Handy: x & (x − 1) clears the lowest 1-bit.',
    ],
  },
  extras: {
    family: 'bits-technique',
    primitive: 'bits',
    parts: ['AND, OR, XOR', 'shifts', 'masks that pick out certain bits'],
    uses: ['Find the one number without a pair in a huge list, using no extra memory.', 'Check whether a number is a power of 2 in one step.'],
    breaks: [
      {
        violation: 'To test bit 3 you use (x AND 3) instead of (x AND 8).',
        result: '3 is binary 0011, so you’re testing bits 0 and 1, not bit 3.',
        wrong: ['It tests bit 3 correctly.', 'It tests all bits.', 'It clears bit 3.'],
      },
    ],
    transfer: [
      {
        problem: 'Check whether a positive number x is a power of 2.',
        answer: 'x & (x − 1) == 0: a power of 2 has exactly one 1-bit, and clearing it leaves 0.',
        wrong: [
          { text: 'x mod 2 == 0', why: 'That only checks it’s even (6 is even but not a power of 2).' },
          { text: 'x & 1 == 1', why: 'That checks it’s odd.' },
          { text: 'Divide by 2 until you reach 1.', why: 'Works, but takes log x steps; the trick is one step.' },
        ],
        explain: 'Powers of 2 look like 1000…0 in binary: exactly one 1-bit.',
      },
    ],
  },
  generators: {
    predict: [predictBitOp, predictXorUnique],
    simulate: [simulateClearLowest],
    count: [countShift, countPop],
    explain: bmExplain,
  },
};

// =====================================================================
// String matching
// =====================================================================

const SM = 'string-matching';
const TEXTS = ['abracadabra', 'banananana', 'mississippi', 'abcabcabd', 'aaabaaab', 'hellohello', 'datastructures'];

function firstMatch(t: string, p: string) {
  for (let i = 0; i + p.length <= t.length; i++) if (t.startsWith(p, i)) return i;
  return -1;
}

const predictFirstMatch = (): Card => {
  const t = pick(TEXTS);
  const i = randInt(1, t.length - 3);
  const p = t.slice(i, i + randInt(2, 3));
  const f = firstMatch(t, p);
  const all = Array.from({ length: t.length }, (_, k) => k).filter((k) => t.startsWith(p, k));
  return {
    concept: SM,
    type: 'predict',
    prompt: `Search for "${p}" in "${t}" (positions start at 0). Where is the first match?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        f,
        [
          { value: all[all.length - 1], why: 'That’s the last match, not the first.' },
          { value: f + 1, why: 'Positions start at 0.' },
          { value: t.indexOf(p[p.length - 1]), why: 'The whole pattern must match, starting there.' },
        ],
        'Try each start position left to right.',
      ),
    },
    explain: `"${p}" occurs at ${all.join(', ')}; the first is ${f}.`,
  };
};

const predictRolling = (): Card => {
  const t = pick(TEXTS);
  const m = 3;
  const i = randInt(0, t.length - m - 1);
  const v = (c: string) => c.charCodeAt(0) - 96;
  const h = [...t.slice(i, i + m)].reduce((s, c) => s + v(c), 0);
  const nh = h - v(t[i]) + v(t[i + m]);
  return {
    concept: SM,
    type: 'predict',
    prompt: `A simple rolling hash: the sum of letter values (a = 1, b = 2, …). The window "${t.slice(i, i + m)}" has hash ${h}. Slide one letter right to "${t.slice(i + 1, i + 1 + m)}". What's the new hash, updated without re-adding?`,
    body: {
      kind: 'choice',
      options: numberOptions(nh, [
        { value: h + v(t[i + m]), why: `Also subtract '${t[i]}' (${v(t[i])}), which left.` },
        { value: h - v(t[i]), why: `Also add '${t[i + m]}' (${v(t[i + m])}), which entered.` },
        { value: h, why: 'The window changed, so the hash usually changes.' },
      ], 'Subtract the letter leaving, add the letter entering.'),
    },
    explain: `${h} − ${v(t[i])} + ${v(t[i + m])} = ${nh}. Only windows whose hash equals the pattern’s hash need a real letter-by-letter check.`,
  };
};

const simulateNaive = (): Card => {
  let t: string, p: string, f: number;
  do {
    t = pick(TEXTS);
    const i = randInt(2, t.length - 3);
    p = t.slice(i, i + randInt(2, 3));
    f = firstMatch(t, p);
  } while (f < 2);
  const scene = rowScene(t.split(''), `Text "${t}"`, 't');
  const exp = Array.from({ length: f + 1 }, (_, k) => `t:${k}`);
  return {
    concept: SM,
    type: 'simulate',
    prompt: `Naive search for "${p}": try each starting position from the left. Click each start position you try, until the pattern matches.`,
    scene,
    body: { kind: 'click', expected: exp, frames: clickFrames(scene, exp), wrongHint: () => 'Try start positions in order: 0, 1, 2, … and stop at the first full match.' },
    explain: `Tried ${f + 1} starting positions; "${p}" matches at ${f}. Each try can compare up to ${p.length} letters.`,
  };
};

const countNaive = (): Card => {
  const n = randInt(20, 1000);
  const m = randInt(3, 10);
  return {
    concept: SM,
    type: 'count',
    prompt: `Naive search, worst case: a text of ${n} letters, a pattern of ${m}. How many letter comparisons at most? (Try every start position, compare all ${m} letters each time.)`,
    body: { kind: 'number', answer: (n - m + 1) * m, unit: 'comparisons' },
    explain: `${n - m + 1} start positions × ${m} letters = ${(n - m + 1) * m}. Rolling hashes (Rabin–Karp) or KMP bring it close to ${n}.`,
  };
};

const smExplain = explainGenerators({
  concept: SM,
  truths: [
    'Naive string search tries every start position and compares letter by letter.',
    'Its worst case is about (text length × pattern length) comparisons.',
    'A rolling hash updates a window’s hash in O(1) as it slides.',
    'Only windows whose hash matches the pattern’s need a full letter-by-letter check.',
  ],
  myths: [
    { text: 'Matching hashes means the strings are equal.', why: 'Different strings can share a hash; always confirm.' },
    { text: 'Naive search compares every letter of the text once.', why: 'It can re-compare letters for many start positions.' },
    { text: 'A rolling hash is recomputed from scratch each step.', why: 'It’s updated with the letter leaving and the letter entering.' },
  ],
  chains: [
    {
      prompt: 'Why does a rolling hash speed up search?',
      steps: ['Comparing letter by letter at each position is slow.', 'A hash summarises a window in one number.', 'Sliding updates it in O(1).', 'So most positions are rejected with one number comparison.'],
    },
  ],
  summary: {
    best: 'To find a word in a long text, slide it along and compare, but use a quick fingerprint of each window so you only compare letters when the fingerprints match.',
    others: [
      { text: 'It’s Ctrl+F.', why: 'That’s the use, not the method.' },
      { text: 'It compares strings.', why: 'Too vague.' },
      { text: 'It uses a hash map.', why: 'It uses rolling hashes of windows, not a map.' },
    ],
  },
});

export const stringMatchingConcept: Concept = {
  id: SM,
  kind: 'algorithm',
  title: 'String Search',
  tier: 4,
  prereqs: ['string', 'hash-function'],
  tagline: 'Find a pattern in text, with rolling fingerprints.',
  hook: {
    problem: 'Find a word in a 10-million-letter document. Trying every position and comparing letter by letter can mean enormous numbers of comparisons.',
    question: 'How could you reject most positions quickly?',
    options: [
      { text: 'Give each window of text a quick fingerprint (hash), updated as you slide, and only compare letters when the fingerprint matches the word’s.', good: true, feedback: 'Yes: the Rabin–Karp idea. Most positions are rejected with one number comparison.' },
      { text: 'Only check positions that start with a capital letter.', feedback: 'The word could be anywhere.' },
      { text: 'Sort the letters of the document.', feedback: 'That destroys the text.' },
    ],
  },
  lens: {
    layout: 'A text, a pattern, and a window the size of the pattern sliding along the text.',
    invariant: 'Every start position before the current one has been ruled in or out.',
    payoff: 'Rolling hashes make each slide O(1), so search is close to O(text length).',
    price: 'Hash matches still need confirming; naive search can be O(n × m).',
  },
  learn: {
    what: 'String search finds where a pattern (like a word) occurs in a text. The simple way tries every starting position. Faster ways avoid re-comparing letters, for example with a rolling hash that fingerprints each window.',
    how: [
      'Naive: for each start position, compare the pattern letter by letter; move on at the first mismatch.',
      'Rolling hash: compute a number for the pattern and for the first window of text.',
      'Slide the window: update its number by removing the letter that leaves and adding the one that enters.',
      'Only when the numbers match, compare the letters to confirm.',
    ],
  },
  extras: {
    family: 'string-technique',
    primitive: 'slots',
    parts: ['a text and a pattern', 'a sliding window', 'a rolling hash to reject windows quickly'],
    uses: ['Find every occurrence of a word in a huge document (Ctrl+F).', 'Detect copied passages between two long texts.'],
    breaks: [
      {
        violation: 'You report a match whenever the window’s hash equals the pattern’s, without checking the letters.',
        result: 'Different windows can share a hash, so you report false matches.',
        wrong: ['Nothing: equal hashes mean equal strings.', 'You miss real matches.', 'It gets slower.'],
      },
    ],
    transfer: [
      {
        problem: 'Find the first repeated 10-letter sequence in a long DNA string.',
        answer: 'Roll a hash over every 10-letter window and store hashes in a hash set; a repeat hash (confirmed by letters) is a repeat.',
        wrong: [
          { text: 'Compare every pair of windows.', why: 'O(n²) comparisons.' },
          { text: 'Sort the letters.', why: 'Destroys the sequences.' },
          { text: 'Use binary search.', why: 'The windows aren’t sorted.' },
        ],
        explain: 'Rolling hashes give every window’s fingerprint in O(1) each; the set spots repeats.',
      },
    ],
  },
  generators: {
    predict: [predictFirstMatch, predictRolling],
    simulate: [simulateNaive],
    count: [countNaive],
    explain: smExplain,
  },
};


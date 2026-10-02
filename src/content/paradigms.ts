import type { Card, Concept, Scene, TreeNode, Val } from '../engine/types';
import { cloneScene, fmtArray } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions } from './helpers';

const clickFrames = (base: Scene, expected: string[]) => {
  const frames = [base];
  expected.forEach((_, i) => frames.push({ ...cloneScene(base), highlight: expected.slice(0, i + 1) }));
  return frames;
};

// =====================================================================
// Backtracking
// =====================================================================

const BT = 'backtracking';

/** All subsets in the order backtracking produces them (include-first). */
function subsets(xs: string[]): string[][] {
  const out: string[][] = [];
  const go = (i: number, cur: string[]) => {
    if (i === xs.length) return out.push([...cur]);
    cur.push(xs[i]);
    go(i + 1, cur);
    cur.pop();
    go(i + 1, cur);
  };
  go(0, []);
  return out;
}

function permutations(xs: string[]): string[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

/** Decision tree for choosing subsets of `xs` (left = take, right = skip). */
function decisionTree(xs: string[]): TreeNode {
  let id = 0;
  const go = (i: number, cur: string[]): TreeNode => ({
    id: String(id++),
    label: cur.length ? cur.join('') : '∅',
    children: i === xs.length ? [] : [go(i + 1, [...cur, xs[i]]), go(i + 1, cur)],
  });
  return go(0, []);
}

const predictSubsetCount = (): Card => {
  const n = randInt(3, 6);
  const xs = 'abcdef'.slice(0, n).split('');
  return {
    concept: BT,
    type: 'predict',
    prompt: `Backtracking lists every subset of {${xs.join(', ')}} by deciding, for each item, “take it or skip it”. How many subsets come out?`,
    body: {
      kind: 'choice',
      options: numberOptions(2 ** n, [
        { value: n, why: 'That’s one subset per item.' },
        { value: n * n, why: 'Each item doubles the count; it isn’t n².' },
        { value: 2 ** n - 1, why: 'Don’t forget the empty subset.' },
        { value: 2 * n, why: 'Choices multiply, they don’t add.' },
      ], `${n} yes/no choices: 2 × 2 × … = 2^${n}.`),
    },
    explain: `2^${n} = ${2 ** n}. Each extra item doubles the work, which is why backtracking is exponential.`,
  };
};

const predictPrune = (): Card => {
  const vals = distinctInts(4, 1, 9).sort((a, b) => a - b);
  const target = vals[0] + vals[2];
  return {
    concept: BT,
    type: 'predict',
    prompt: `Find subsets of ${fmtArray(vals)} (all positive) that add up to ${target}. Your partial choice already sums to more than ${target}. What should backtracking do?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: 'Stop exploring this branch and go back: adding more positive numbers can only make it bigger.', correct: true, why: 'That’s pruning: skip branches that can’t lead to an answer.' },
        { text: 'Keep adding items; the sum might come back down.', correct: false, why: 'All numbers are positive: the sum only grows.' },
        { text: 'Restart from the empty subset.', correct: false, why: 'Just undo the last choice and try the next option.' },
        { text: 'Report it as an answer.', correct: false, why: 'It overshoots the target.' },
      ]),
    },
    explain: 'Pruning is what makes backtracking practical: dead branches are cut before their whole subtree is explored.',
  };
};

const simulateBT = (): Card => {
  const xs = 'abc'.slice(0, pick([2, 3])).split('');
  const root = decisionTree(xs);
  const leaves: string[] = [];
  const walk = (t: TreeNode) => (t.children.length ? t.children.forEach((c) => c && walk(c)) : leaves.push(t.id));
  walk(root);
  const scene: Scene = { views: [{ type: 'tree', root, binary: true, title: 'Decision tree: left = take the next item, right = skip it' }] };
  const exp = leaves.map((l) => `t:${l}`);
  return {
    concept: BT,
    type: 'simulate',
    prompt: 'Backtracking explores this decision tree depth-first, trying “take” (left) before “skip” (right). Click the finished subsets (the leaves) in the order they are reached.',
    scene,
    body: { kind: 'click', expected: exp, frames: clickFrames(scene, exp), wrongHint: () => 'Always go left (take) first; when you reach a leaf, back up to the nearest choice you haven’t tried.' },
    explain: `Order: ${subsets(xs).map((s) => (s.length ? s.join('') : '∅')).join(', ')}. Choose, explore, un-choose, try the next option.`,
  };
};

const countPerms = (): Card => {
  const n = randInt(3, 6);
  const xs = 'ABCDEF'.slice(0, n).split('');
  const f = permutations(xs).length;
  return {
    concept: BT,
    type: 'count',
    prompt: `Backtracking lists every ordering of ${xs.join(', ')}: ${n} choices for the first spot, then one fewer each time. How many orderings?`,
    body: { kind: 'number', answer: f, unit: 'orderings' },
    explain: `${xs.map((_, i) => n - i).join(' × ')} = ${f} (n!). Grows even faster than 2^n.`,
  };
};

const countSubsets = (): Card => {
  const n = randInt(3, 10);
  return {
    concept: BT,
    type: 'count',
    prompt: `The take-or-skip decision tree for ${n} items: how many leaves (finished subsets) does it have?`,
    body: { kind: 'number', answer: 2 ** n, unit: 'leaves' },
    explain: `Each level doubles the branches: 2^${n} = ${2 ** n}. Exponential, faster-growing than any n^k.`,
  };
};

const btExplain = explainGenerators({
  concept: BT,
  truths: [
    'Backtracking builds a solution one choice at a time and undoes a choice to try the next option.',
    'It explores a tree of decisions depth-first, using recursion.',
    'Pruning skips branches that can’t lead to a valid answer.',
    'Without pruning it tries every combination: often exponential (2^n, n!).',
  ],
  myths: [
    { text: 'Backtracking runs in polynomial time.', why: 'It usually explores exponentially many options.' },
    { text: 'Backtracking restarts from scratch after each dead end.', why: 'It only undoes the last choice.' },
    { text: 'Pruning can remove correct answers.', why: 'Good pruning only cuts branches that can’t succeed.' },
  ],
  chains: [
    {
      prompt: 'Why does backtracking “undo” a choice after exploring it?',
      steps: ['The same partial solution is reused for every branch.', 'After exploring “take item x”, x must be removed.', 'Then the “skip item x” branch starts from the right state.', 'So one shared list serves the whole search.'],
    },
  ],
  summary: {
    best: 'Backtracking tries options like walking a maze of choices: pick one, keep going, and when it can’t work out, step back and try the next option.',
    others: [
      { text: 'It’s brute force.', why: 'Misses the undo step and pruning.' },
      { text: 'It’s recursion.', why: 'The tool, not the idea.' },
      { text: 'It goes backwards through an array.', why: 'Not what the name means.' },
    ],
  },
});

export const backtrackingConcept: Concept = {
  id: BT,
  kind: 'algorithm',
  title: 'Backtracking',
  tier: 3,
  prereqs: ['recursion'],
  tagline: 'Choose, explore, un-choose.',
  hook: {
    problem: 'Solve a Sudoku, or list every way to pick items that fit a rule. There are too many combinations to write loops for.',
    question: 'How can one piece of code try every combination?',
    options: [
      { text: 'Make one choice, recursively solve the rest, then undo the choice and try the next option.', good: true, feedback: 'Yes: backtracking. Recursion walks the tree of choices for you.' },
      { text: 'Write one nested loop per choice.', feedback: 'You don’t know in advance how many loops you’d need.' },
      { text: 'Guess randomly until it works.', feedback: 'No guarantee of finding it or of knowing there’s none.' },
    ],
  },
  lens: {
    layout: 'A partial solution (a list), grown and shrunk by recursive calls: a depth-first walk of a decision tree.',
    invariant: 'The partial solution always holds exactly the choices on the current path; each choice is undone when its branch is finished.',
    payoff: 'Finds every solution (or proves there is none), and pruning skips hopeless branches early.',
    price: 'Exponential in the worst case (2^n subsets, n! orderings).',
  },
  learn: {
    what: 'Backtracking is a way to try every combination of choices without writing a loop for each one. It makes a choice, explores what follows (recursively), then undoes the choice and tries the next. Puzzles, subsets and orderings are its home ground.',
    how: [
      'If the partial solution is complete, record it (base case).',
      'Otherwise, for each option for the next choice: make it (add to the list).',
      'Recurse to fill in the remaining choices.',
      'Undo the choice (remove it from the list) and try the next option. Prune: skip options that can’t possibly work.',
    ],
  },
  extras: {
    family: 'search-all',
    primitive: 'abstract',
    parts: ['make a choice', 'recurse on the rest', 'undo the choice'],
    uses: ['Solve a Sudoku by trying digits and undoing them when stuck.', 'List every way to choose a team from a group of players.'],
    rivals: ['dp-1d', 'greedy'],
    breaks: [
      {
        violation: 'After exploring “take item x”, the code forgets to remove x before exploring “skip item x”.',
        result: 'x stays in the list, so later subsets wrongly contain it.',
        wrong: ['It still lists every subset correctly.', 'It lists subsets in reverse.', 'It runs forever.'],
      },
    ],
    transfer: [
      {
        problem: 'Place 8 queens on a chessboard so none attack each other.',
        answer: 'Place a queen row by row; if no column in a row is safe, go back and move the previous queen.',
        wrong: [
          { text: 'Try all 64-choose-8 placements.', why: 'Billions of options; no pruning.' },
          { text: 'Place queens greedily and never move them.', why: 'Early choices can make later rows impossible.' },
          { text: 'Sort the squares.', why: 'Sorting doesn’t help place queens.' },
        ],
        explain: 'Backtracking with pruning (skip attacked squares) solves it after trying only a few thousand positions.',
      },
    ],
  },
  generators: {
    predict: [predictSubsetCount, predictPrune],
    simulate: [simulateBT],
    count: [countPerms, countSubsets],
    explain: btExplain,
  },
};

// =====================================================================
// Dynamic programming (1D)
// =====================================================================

const D1 = 'dp-1d';

const stairs = (n: number) => {
  const w = [1, 1];
  for (let i = 2; i <= n; i++) w[i] = w[i - 1] + w[i - 2];
  return w;
};

const predictStairs = (): Card => {
  const n = randInt(4, 9);
  const w = stairs(n);
  return {
    concept: D1,
    type: 'predict',
    prompt: `Climbing ${n} stairs, taking 1 or 2 steps at a time. ways(${n - 1}) = ${w[n - 1]} and ways(${n - 2}) = ${w[n - 2]}. How many ways to climb ${n}?`,
    body: {
      kind: 'choice',
      options: numberOptions(w[n], [
        { value: w[n - 1] * w[n - 2], why: 'The last step is 1 OR 2, so the counts add, not multiply.' },
        { value: w[n - 1] + 1, why: 'All the ways to reach step n−2 also count.' },
        { value: 2 * w[n - 1], why: 'ways(n−2) is smaller than ways(n−1).' },
        { value: n, why: 'There are many more orderings than that.' },
      ], `The last move was 1 step (from ${n - 1}) or 2 steps (from ${n - 2}): ${w[n - 1]} + ${w[n - 2]}.`),
    },
    explain: `ways(n) = ways(n−1) + ways(n−2) = ${w[n]}. Each answer is built from smaller answers you already have.`,
  };
};

const predictMemo = (): Card => ({
  concept: D1,
  type: 'predict',
  prompt: 'Plain recursive fib(40) makes over 300 million calls. You add a table that remembers each fib(k) the first time it’s computed. Roughly how many calls now?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'About 80: each fib(k) is computed once, the rest are table lookups.', correct: true, why: 'Only 41 distinct subproblems, each with 2 calls.' },
      { text: 'About half as many: 150 million.', correct: false, why: 'Remembering removes all repeated work, not half.' },
      { text: 'The same: remembering doesn’t save calls.', correct: false, why: 'Repeated calls become instant lookups.' },
      { text: 'Exactly 1.', correct: false, why: 'Each value still has to be computed once.' },
    ]),
  },
  explain: 'That is dynamic programming: overlapping subproblems solved once and reused. Exponential → linear.',
});

const simulateD1 = (): Card => {
  const n = randInt(5, 7);
  const w = stairs(n);
  const labels = Array.from({ length: n + 1 }, (_, i) => `ways(${i})`);
  const frames: Scene[] = [];
  const cells: Val[] = w.map((v, i) => (i < 2 ? v : ''));
  const mk = () => ({ views: [{ type: 'row' as const, key: 'd', items: [...cells], labels, title: 'Table (fill left to right)' }] });
  frames.push(mk());
  const exp: string[] = [];
  for (let i = 2; i <= n; i++) {
    exp.push(`d:${i - 2}`, `d:${i - 1}`);
    frames.push({ ...mk(), highlight: [`d:${i - 2}`] });
    cells[i] = w[i];
    frames.push({ ...mk(), highlight: [`d:${i - 2}`, `d:${i - 1}`, `d:${i}`] });
  }
  return {
    concept: D1,
    type: 'simulate',
    prompt: `Fill the table for climbing stairs (1 or 2 steps): ways(i) = ways(i−2) + ways(i−1). For each empty cell from left to right, click the two cells it is built from (i−2 first, then i−1).`,
    scene: frames[0],
    body: { kind: 'click', expected: exp, frames, wrongHint: (step) => `Building ways(${Math.floor(step / 2) + 2}): it uses the two cells just before it.` },
    explain: `Table: ${fmtArray(w)}. Each cell is computed once from two earlier cells: O(n).`,
  };
};

const countD1 = (): Card => {
  const n = randInt(5, 12);
  return {
    concept: D1,
    type: 'count',
    prompt: `Climbing stairs, 1 or 2 steps at a time. How many different ways to climb ${n} stairs? (ways(0) = 1, ways(1) = 1.)`,
    body: { kind: 'number', answer: stairs(n)[n], unit: 'ways' },
    explain: `Table: ${stairs(n).join(', ')}.`,
  };
};

const growthD1 = (): Card => growthCard(D1, 'climbing stairs with a table (cells computed)', (n) => n + 1, 2, 'One cell per step, each from two earlier cells.');

const d1Explain = explainGenerators({
  concept: D1,
  truths: [
    'Dynamic programming solves each smaller subproblem once and stores the answer.',
    'It works when the same subproblems come up again and again (overlapping subproblems).',
    'The answer is built from answers to smaller versions (a recurrence).',
    'Memoisation (top-down) and a table filled bottom-up are two ways to do it.',
  ],
  myths: [
    { text: 'Dynamic programming means the program changes while running.', why: 'It just means reusing answers to subproblems.' },
    { text: 'Memoisation makes recursion slower.', why: 'It removes repeated work, often exponential → linear.' },
    { text: 'DP works for any recursive problem.', why: 'It only helps when subproblems repeat.' },
  ],
  chains: [
    {
      prompt: 'Why does storing answers make fib(n) linear?',
      steps: ['Plain recursion recomputes the same fib(k) many times.', 'There are only n + 1 different subproblems.', 'With a table, each is computed once; repeats are lookups.', 'So the work is about n.'],
    },
  ],
  summary: {
    best: 'Dynamic programming is writing down answers to small questions so that when a bigger question needs them, you look them up instead of working them out again.',
    others: [
      { text: 'It’s recursion with a cache.', why: 'Close, but misses why it helps.' },
      { text: 'It’s a fancy loop.', why: 'Misses reuse of subproblems.' },
      { text: 'It tries every option.', why: 'That’s backtracking; DP avoids repeat work.' },
    ],
  },
});

export const dp1dConcept: Concept = {
  id: D1,
  kind: 'algorithm',
  title: 'Dynamic Programming (1D)',
  tier: 4,
  prereqs: ['recursion', 'hash-map'],
  tagline: 'Solve each small problem once; reuse the answer.',
  hook: {
    problem: 'Recursive fib(40) takes seconds, because fib(38) is computed twice, fib(37) three times, and so on.',
    question: 'How do you stop doing the same work over and over?',
    options: [
      { text: 'Store each answer the first time you compute it, and look it up after that.', good: true, feedback: 'Yes: dynamic programming. 300 million calls → about 80.' },
      { text: 'Use a faster computer.', feedback: 'Exponential growth outruns any computer.' },
      { text: 'Recurse in a different order.', feedback: 'The repeats remain unless you remember answers.' },
    ],
  },
  lens: {
    layout: 'A table (array or hash map) indexed by subproblem, e.g. dp[i] for “the answer for the first i items”.',
    invariant: 'Every table entry holds the correct answer to its subproblem, built only from entries already filled.',
    payoff: 'Exponential recursion becomes (number of subproblems) × (work per subproblem), often O(n).',
    price: 'Memory for the table; you must find the right subproblem and recurrence.',
  },
  learn: {
    what: 'Dynamic programming (DP) speeds up recursion when the same smaller problems keep coming back. You solve each one once, store the answer in a table, and reuse it. The hard part is spotting the recurrence: how the answer for n is built from smaller answers.',
    how: [
      'Define the subproblem: e.g. ways(i) = number of ways to reach stair i.',
      'Find the recurrence: ways(i) = ways(i−1) + ways(i−2) (the last step was 1 or 2).',
      'Set the base cases: ways(0) = 1, ways(1) = 1.',
      'Fill the table from small to large (or recurse with a memo) and read off the answer.',
    ],
  },
  extras: {
    family: 'dynamic-programming',
    primitive: 'slots',
    parts: ['a subproblem definition', 'a recurrence', 'a table of stored answers'],
    uses: ['Count the ways to climb stairs taking 1 or 2 steps.', 'Find the fewest coins that make an amount, when greedy picking fails.'],
    rivals: ['greedy', 'backtracking', 'dp-2d'],
    breaks: [
      {
        violation: 'The table is filled right-to-left, so dp[i] reads dp[i−1] before dp[i−1] has been computed.',
        result: 'It uses empty (wrong) values, so every answer built on them is wrong.',
        wrong: ['The answers are still right.', 'It just takes longer.', 'It gives the answers in reverse.'],
      },
    ],
    transfer: [
      {
        problem: 'Houses in a row hold different amounts of money. You can’t rob two neighbours. What’s the most you can take?',
        answer: 'best(i) = max(best(i−1), best(i−2) + money[i]); fill it left to right.',
        wrong: [
          { text: 'Take every other house starting from the first.', why: 'Skipping two in a row can be better.' },
          { text: 'Take the richest houses first.', why: 'Greedy picks can block better combinations.' },
          { text: 'Try every subset.', why: '2^n: correct but far too slow.' },
        ],
        explain: 'For each house: skip it (best(i−1)) or take it plus the best up to two before. Each subproblem once: O(n).',
      },
    ],
  },
  generators: {
    predict: [predictStairs, predictMemo],
    simulate: [simulateD1],
    count: [countD1, growthD1],
    explain: d1Explain,
  },
};

// =====================================================================
// Dynamic programming (2D)
// =====================================================================

const D2 = 'dp-2d';

function gridPaths(r: number, c: number) {
  const t = Array.from({ length: r }, () => Array(c).fill(1) as number[]);
  for (let i = 1; i < r; i++) for (let j = 1; j < c; j++) t[i][j] = t[i - 1][j] + t[i][j - 1];
  return t;
}

function lcs(a: string, b: string) {
  const t = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0) as number[]);
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) t[i][j] = a[i - 1] === b[j - 1] ? t[i - 1][j - 1] + 1 : Math.max(t[i - 1][j], t[i][j - 1]);
  return t;
}

const randWord = (n: number) => Array.from({ length: n }, () => pick('ABCD'.split(''))).join('');

const predictGrid = (): Card => {
  const r = randInt(3, 4);
  const c = randInt(3, 5);
  const t = gridPaths(r, c);
  const shown: Val[][] = t.map((row, i) => row.map((v, j) => (i === r - 1 && j === c - 1 ? '?' : v)));
  const ans = t[r - 1][c - 1];
  return {
    concept: D2,
    type: 'predict',
    prompt: 'A robot moves only right or down. Each cell holds the number of paths from the top-left to it. What goes in the “?” cell?',
    scene: { views: [{ type: 'grid', key: 'g', rows: shown, title: 'Paths to each cell' }] },
    body: {
      kind: 'choice',
      options: numberOptions(ans, [
        { value: t[r - 2][c - 1] * t[r - 1][c - 2], why: 'You arrive from above OR from the left: add.' },
        { value: t[r - 2][c - 1], why: 'That’s only the paths arriving from above.' },
        { value: t[r - 1][c - 2], why: 'That’s only the paths arriving from the left.' },
        { value: ans + 1, why: 'Add just the two neighbours.' },
      ], 'Cell above + cell to the left.'),
    },
    explain: `${t[r - 2][c - 1]} + ${t[r - 1][c - 2]} = ${ans}. Each cell is built from two cells already filled.`,
  };
};

const predictLcs = (): Card => {
  const a = randWord(randInt(4, 5));
  const b = randWord(randInt(4, 5));
  const t = lcs(a, b);
  const ans = t[a.length][b.length];
  return {
    concept: D2,
    type: 'predict',
    prompt: `Longest common subsequence: the longest string of letters appearing in order (not necessarily together) in both “${a}” and “${b}”. How long is it?`,
    body: {
      kind: 'choice',
      options: numberOptions(ans, [
        { value: ans + 1, why: 'Letters must appear in the same order in both.' },
        { value: ans - 1, why: 'There’s a longer common sequence.' },
        { value: new Set([...a].filter((x) => b.includes(x))).size === ans ? ans + 2 : new Set([...a].filter((x) => b.includes(x))).size, why: 'Counting shared letters ignores order and repeats.' },
      ], 'Fill the table: match → diagonal + 1, otherwise the best of above and left.'),
    },
    explain: `LCS length = ${ans}. dp[i][j] = the LCS of the first i letters of “${a}” and the first j of “${b}”.`,
  };
};

const simulateD2 = (): Card => {
  const r = 3;
  const c = randInt(3, 4);
  const t = gridPaths(r, c);
  const cells: Val[][] = t.map((row, i) => row.map((v, j) => (i === 0 || j === 0 ? v : '')));
  const mk = (): Scene => ({ views: [{ type: 'grid', key: 'g', rows: cells.map((x) => [...x]), title: 'Paths to each cell (right/down moves only)' }] });
  const frames: Scene[] = [mk()];
  const exp: string[] = [];
  for (let i = 1; i < r; i++)
    for (let j = 1; j < c; j++) {
      exp.push(`g:${i},${j}`);
      cells[i][j] = t[i][j];
      frames.push({ ...mk(), highlight: [`g:${i},${j}`] });
    }
  return {
    concept: D2,
    type: 'simulate',
    prompt: 'The first row and column have 1 path each. Fill the rest: click the empty cells in the order a DP fills them (row by row, left to right). Each = above + left.',
    scene: frames[0],
    body: { kind: 'click', expected: exp, frames, wrongHint: () => 'A cell can only be filled once the cell above AND the cell to its left are filled: go row by row, left to right.' },
    explain: `Bottom-right: ${t[r - 1][c - 1]} paths. Filling in this order guarantees both inputs are ready.`,
  };
};

const countD2 = (): Card => {
  const r = randInt(3, 5);
  const c = randInt(3, 5);
  return {
    concept: D2,
    type: 'count',
    prompt: `A robot moves only right or down on a ${r} × ${c} grid (rows × columns). How many different paths from the top-left cell to the bottom-right cell?`,
    body: { kind: 'number', answer: gridPaths(r, c)[r - 1][c - 1], unit: 'paths' },
    explain: `Fill the table (each cell = above + left): the corner is ${gridPaths(r, c)[r - 1][c - 1]}.`,
  };
};

const growthD2 = (): Card => growthCard(D2, 'LCS of two strings of length n (table cells filled)', (n) => n * n, 3, 'An n × n table, O(1) per cell.');

const d2Explain = explainGenerators({
  concept: D2,
  truths: [
    'When a subproblem needs two numbers to describe it, the DP table is a grid.',
    'Each cell is built from neighbouring cells that are already filled (e.g. above, left, diagonal).',
    'Filling row by row guarantees the inputs of each cell are ready.',
    'Time and space are usually rows × columns.',
  ],
  myths: [
    { text: 'A 2D DP must use recursion.', why: 'Filling the grid with two loops works too.' },
    { text: 'Cells can be filled in any order.', why: 'A cell’s inputs must be filled first.' },
    { text: 'The longest common subsequence must be one unbroken block.', why: 'That’s a substring; a subsequence can skip letters.' },
  ],
  chains: [
    {
      prompt: 'Why is paths(i, j) = paths(i−1, j) + paths(i, j−1)?',
      steps: ['The robot can only move right or down.', 'So its last move into (i, j) came from above or from the left.', 'Those two groups of paths don’t overlap.', 'So the counts add.'],
    },
  ],
  summary: {
    best: '2D dynamic programming fills in a grid of answers, where each square is worked out from squares next to it that are already done.',
    others: [
      { text: 'It’s DP with two dimensions.', why: 'Restates the name.' },
      { text: 'It’s a matrix algorithm.', why: 'Vague.' },
      { text: 'It tries every path.', why: 'It counts them without listing them.' },
    ],
  },
});

export const dp2dConcept: Concept = {
  id: D2,
  kind: 'algorithm',
  title: 'Dynamic Programming (2D)',
  tier: 4,
  prereqs: ['dp-1d', 'matrix'],
  tagline: 'A grid of answers, each built from its neighbours.',
  hook: {
    problem: 'Compare two documents: what’s the longest sequence of words they share, in order? Checking every subsequence is hopeless.',
    question: 'What if the subproblem is “the first i words of one vs the first j words of the other”?',
    options: [
      { text: 'Fill a grid of answers for every (i, j), each from its neighbours above, left and diagonal.', good: true, feedback: 'Yes: 2D dynamic programming. rows × columns cells, O(1) each.' },
      { text: 'Compare word by word at the same position.', feedback: 'Shared words can be at different positions.' },
      { text: 'Count shared words.', feedback: 'Ignores order.' },
    ],
  },
  lens: {
    layout: 'A 2D table (matrix) where cell [i][j] answers the subproblem described by two numbers.',
    invariant: 'Each cell is computed only from cells already filled (above, left, diagonal).',
    payoff: 'Problems on pairs (two strings, a grid) in O(rows × columns) instead of exponential.',
    price: 'O(rows × columns) memory (often reducible to one row); finding the recurrence is the hard part.',
  },
  learn: {
    what: 'Some DP problems need two numbers to describe a subproblem: a position in a grid, or how far along two strings you are. Then the table is a grid, and each cell is built from nearby cells that are already done.',
    how: [
      'Define dp[i][j]: e.g. the number of paths to cell (i, j), or the LCS of the first i and first j letters.',
      'Write the recurrence: paths(i, j) = paths(i−1, j) + paths(i, j−1).',
      'Fill the edges (base cases): the first row and column.',
      'Fill the rest row by row, left to right, so each cell’s inputs are ready. The answer is in the last cell.',
    ],
  },
  extras: {
    family: 'dynamic-programming',
    primitive: 'slots',
    parts: ['a two-index subproblem', 'a grid-shaped table', 'a fill order that respects dependencies'],
    uses: ['Show the differences between two versions of a file (longest common subsequence).', 'Count the routes across a city grid moving only east or south.'],
    rivals: ['dp-1d', 'backtracking', 'greedy'],
    breaks: [
      {
        violation: 'The grid is filled column by column from the bottom up, but each cell uses the cell ABOVE it.',
        result: 'The cell above isn’t filled yet, so every cell is computed from empty values.',
        wrong: ['The answer is unchanged.', 'It only runs slower.', 'The answer comes out mirrored.'],
      },
    ],
    transfer: [
      {
        problem: 'A spell-checker suggests the dictionary word needing the fewest single-letter edits (insert, delete, replace) to match the typo.',
        answer: 'Edit distance: dp[i][j] = fewest edits turning the first i letters into the first j letters, from the neighbour cells.',
        wrong: [
          { text: 'Count letters in different positions.', why: 'One insertion shifts everything.' },
          { text: 'Compare word lengths.', why: 'Same length doesn’t mean similar.' },
          { text: 'Try every sequence of edits.', why: 'Exponential.' },
        ],
        explain: 'Each cell: match (diagonal), or 1 + the best of insert / delete / replace neighbours. O(length × length).',
      },
    ],
  },
  generators: {
    predict: [predictGrid, predictLcs],
    simulate: [simulateD2],
    count: [countD2, growthD2],
    explain: d2Explain,
  },
};

// =====================================================================
// Greedy
// =====================================================================

const GR = 'greedy';

function randomIntervals(n = randInt(5, 6)) {
  const out: { name: string; s: number; e: number }[] = [];
  'ABCDEFG'.slice(0, n).split('').forEach((name) => {
    const s = randInt(0, 14);
    out.push({ name, s, e: s + randInt(1, 5) });
  });
  return out;
}
function schedule(iv: ReturnType<typeof randomIntervals>) {
  const sorted = [...iv].sort((a, b) => a.e - b.e || a.name.localeCompare(b.name));
  const out: typeof iv = [];
  let end = -Infinity;
  for (const x of sorted)
    if (x.s >= end) {
      out.push(x);
      end = x.e;
    }
  return { sorted, out };
}
const fmtIv = (x: { name: string; s: number; e: number }) => `${x.name} ${x.s}–${x.e}`;

const predictSchedule = (): Card => {
  const iv = randomIntervals();
  const { out } = schedule(iv);
  const byStart = [...iv].sort((a, b) => a.s - b.s);
  let end = -Infinity;
  const startPick = byStart.filter((x) => (x.s >= end ? ((end = x.e), true) : false));
  return {
    concept: GR,
    type: 'predict',
    prompt: `Meetings (start–end): ${iv.map(fmtIv).join(', ')}. One room. What’s the MOST meetings you can hold without overlaps (one can start when another ends)?`,
    body: {
      kind: 'choice',
      options: numberOptions(out.length, [
        ...(startPick.length !== out.length ? [{ value: startPick.length, why: 'Picking by earliest START can pick one long meeting that blocks others.' }] : []),
        { value: out.length - 1, why: 'You can fit one more.' },
        { value: out.length + 1, why: 'That many would overlap.' },
        { value: iv.length, why: 'Some overlap.' },
      ], 'Always pick the meeting that ENDS first among those that still fit.'),
    },
    explain: `Earliest end first: ${out.map(fmtIv).join(', ')} = ${out.length}. Finishing early leaves the most room for the rest.`,
  };
};

const predictCoins = (): Card => {
  const amount = pick([6, 6, 10]);
  const greedy = amount === 6 ? '4 + 1 + 1 (3 coins)' : '4 + 4 + 1 + 1 (4 coins)';
  const best = amount === 6 ? '3 + 3 (2 coins)' : '3 + 3 + 4 (3 coins)';
  return {
    concept: GR,
    type: 'predict',
    prompt: `Coins are 1, 3 and 4. Make ${amount} with the fewest coins. Greedy (always take the biggest coin that fits) gives ${greedy}. Is that the best?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: `No: ${best} is better. Greedy fails for these coins.`, correct: true, why: 'Taking the 4 first rules out the better combination.' },
        { text: 'Yes: the biggest coin first is always best.', correct: false, why: 'Only for some coin systems (like 1, 5, 10, 25).' },
        { text: 'Yes: fewer, bigger coins are always better.', correct: false, why: 'Check: there’s a combination with fewer coins.' },
        { text: 'There’s no way to know without trying all options.', correct: false, why: 'Here you can find the better one directly; in general DP solves it.' },
      ]),
    },
    explain: 'Greedy only works when a proof shows the local best choice is safe. For coins like these, use dynamic programming instead.',
  };
};

const simulateGreedy = (): Card => {
  const iv = randomIntervals();
  const { sorted, out } = schedule(iv);
  const scene: Scene = { views: [{ type: 'row', key: 'i', items: sorted.map(fmtIv), title: 'Meetings, sorted by END time' }] };
  const exp = out.map((x) => `i:${sorted.indexOf(x)}`);
  return {
    concept: GR,
    type: 'simulate',
    prompt: 'Interval scheduling: go through the meetings sorted by end time. Click each one you KEEP: keep it if it starts at or after the end of the last kept meeting.',
    scene,
    body: { kind: 'click', expected: exp, frames: clickFrames(scene, exp), wrongHint: () => 'Take the next meeting (by end time) whose start is not before the end of the last one you kept.' },
    explain: `Kept: ${out.map(fmtIv).join(', ')}. One pass after sorting: O(n log n).`,
  };
};

const countGreedy = (): Card => {
  const iv = randomIntervals();
  const { out } = schedule(iv);
  return {
    concept: GR,
    type: 'count',
    prompt: `Meetings (start–end): ${iv.map(fmtIv).join(', ')}. One room; a meeting can start when another ends. Maximum number of meetings?`,
    body: { kind: 'number', answer: out.length, unit: 'meetings' },
    explain: `Earliest end first: ${out.map(fmtIv).join(', ')}.`,
  };
};

const growthGreedy = (): Card => growthCard(GR, 'interval scheduling: sort by end time, then one pass', (n) => Math.round(n * Math.log2(n)) + n, 4, 'Sorting dominates: O(n log n).');

const grExplain = explainGenerators({
  concept: GR,
  truths: [
    'A greedy algorithm makes the best-looking choice at each step and never reconsiders.',
    'It’s correct only when you can prove the local choice is always safe.',
    'For interval scheduling, picking the meeting that ends first is provably optimal.',
    'Greedy algorithms are usually fast: often just a sort and one pass.',
  ],
  myths: [
    { text: 'Greedy always finds the best answer.', why: 'Coins 1, 3, 4 making 6: greedy gives 3 coins, best is 2.' },
    { text: 'Greedy tries all choices and keeps the best.', why: 'It commits to one choice per step.' },
    { text: 'For meetings, picking the shortest meeting first is optimal.', why: 'A short meeting can overlap two others; earliest END is the safe rule.' },
  ],
  chains: [
    {
      prompt: 'Why is “earliest end first” safe for meetings?',
      steps: ['Take any best schedule.', 'Swap its first meeting for the one that ends earliest overall.', 'That one ends no later, so it can’t clash with the rest.', 'So some best schedule starts with the greedy choice; repeat for the rest.'],
    },
  ],
  summary: {
    best: 'Greedy grabs what looks best right now and never looks back; it’s fast, but only right when you can show the grab never costs you later.',
    others: [
      { text: 'It takes the biggest thing.', why: 'The “best” choice depends on the problem.' },
      { text: 'It’s always optimal.', why: 'Often it isn’t.' },
      { text: 'It’s like DP.', why: 'DP considers all subproblems; greedy commits.' },
    ],
  },
});

export const greedyConcept: Concept = {
  id: GR,
  kind: 'algorithm',
  title: 'Greedy Algorithms',
  tier: 3,
  prereqs: ['merge-sort'],
  tagline: 'Take the best-looking choice and never look back.',
  hook: {
    problem: 'One meeting room, many requested meetings with start and end times. Fit in as many as possible.',
    question: 'Which meeting should you book first?',
    options: [
      { text: 'The one that ends earliest: it leaves the most time for everything else.', good: true, feedback: 'Yes: a greedy choice that is provably optimal here.' },
      { text: 'The one that starts earliest.', feedback: 'It might run all day and block everything.' },
      { text: 'The shortest one.', feedback: 'A short meeting can overlap two others that would both fit.' },
    ],
  },
  lens: {
    layout: 'Usually a sorted array of options, scanned once.',
    invariant: 'Each step commits to the locally best choice, and a proof shows that choice is part of some optimal answer.',
    payoff: 'Very fast (often a sort plus one pass) and simple.',
    price: 'Wrong whenever the local best choice isn’t safe (e.g. coins 1, 3, 4); needs a proof.',
  },
  learn: {
    what: 'A greedy algorithm builds an answer by repeatedly taking the choice that looks best right now, never undoing it. It’s fast and simple, but only correct for problems where the best-looking choice never hurts later.',
    how: [
      'Decide what “best right now” means (e.g. the meeting that ends earliest).',
      'Sort the options by that rule.',
      'Go through them once, taking each option that still fits.',
      'Check it: find a proof or a counterexample. Coins 1, 3, 4 for 6: greedy 4+1+1, best 3+3.',
    ],
  },
  extras: {
    family: 'greedy',
    primitive: 'slots',
    parts: ['a rule for the best-looking choice', 'sorting by that rule', 'one pass committing to choices'],
    uses: ['Fit the most meetings into one room.', 'Give change with the fewest coins in a normal currency (1, 5, 10, 25).'],
    rivals: ['dp-1d', 'backtracking'],
    breaks: [
      {
        violation: 'Meetings are picked by earliest START instead of earliest end.',
        result: 'A long early meeting can be picked and block several shorter ones: fewer meetings fit.',
        wrong: ['The result is the same.', 'Meetings overlap.', 'It becomes slower but still optimal.'],
      },
    ],
    transfer: [
      {
        problem: 'Jobs each have a deadline; you can do one per day. Choose an order to finish as many jobs as possible on time.',
        answer: 'Sort by deadline and do the earliest-deadline jobs first.',
        wrong: [
          { text: 'Do the longest jobs first.', why: 'Unrelated to deadlines.' },
          { text: 'Try all orders.', why: 'n! orders.' },
          { text: 'Do jobs in the order given.', why: 'Ignores deadlines.' },
        ],
        explain: 'Earliest deadline first is a greedy rule with a swap proof, like earliest end for meetings.',
      },
    ],
  },
  generators: {
    predict: [predictSchedule, predictCoins],
    simulate: [simulateGreedy],
    count: [countGreedy, growthGreedy],
    explain: grExplain,
  },
};

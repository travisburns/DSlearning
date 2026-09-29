import type { Card, Concept, Scene, TreeNode, View } from '../engine/types';
import { cloneScene } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions, options, sequenceRebuild } from './helpers';
import type { BNode } from './treeUtil';
import { bstPath, buildBST, levelorder, randomBST, toTree } from './treeUtil';

const t = (id: string | number) => `t:${id}`;

// =====================================================================
// AVL tree
// =====================================================================

const AVL = 'avl-tree';

interface ANode {
  key: number;
  h: number;
  left: ANode | null;
  right: ANode | null;
}
const ah = (n: ANode | null) => (n ? n.h : -1);
const upd = (n: ANode) => ((n.h = 1 + Math.max(ah(n.left), ah(n.right))), n);
const bf = (n: ANode) => ah(n.left) - ah(n.right);
function rotRight(y: ANode): ANode {
  const x = y.left!;
  y.left = x.right;
  x.right = y;
  upd(y);
  return upd(x);
}
function rotLeft(x: ANode): ANode {
  const y = x.right!;
  x.right = y.left;
  y.left = x;
  upd(x);
  return upd(y);
}
type Fix = { at: number; kind: 'right' | 'left' | 'left-right' | 'right-left' };
function avlInsert(n: ANode | null, k: number, fixes: Fix[]): ANode {
  if (!n) return { key: k, h: 0, left: null, right: null };
  if (k < n.key) n.left = avlInsert(n.left, k, fixes);
  else n.right = avlInsert(n.right, k, fixes);
  upd(n);
  const b = bf(n);
  if (b > 1) {
    if (k < n.left!.key) return fixes.push({ at: n.key, kind: 'right' }), rotRight(n);
    fixes.push({ at: n.key, kind: 'left-right' });
    n.left = rotLeft(n.left!);
    return rotRight(n);
  }
  if (b < -1) {
    if (k > n.right!.key) return fixes.push({ at: n.key, kind: 'left' }), rotLeft(n);
    fixes.push({ at: n.key, kind: 'right-left' });
    n.right = rotRight(n.right!);
    return rotLeft(n);
  }
  return n;
}
const buildAVL = (keys: number[]) => keys.reduce<ANode | null>((r, k) => avlInsert(r, k, []), null);
const aToB = (n: ANode | null): BNode | null => (n ? { key: n.key, left: aToB(n.left), right: aToB(n.right) } : null);
const avlTree = (n: ANode | null): TreeNode | null =>
  n ? { id: String(n.key), label: String(n.key), note: `bf ${bf(n) > 0 ? '+' : ''}${bf(n)}`, tone: Math.abs(bf(n)) > 1 ? 'red' : undefined, children: [avlTree(n.left), avlTree(n.right)] } : null;
const avlScene = (n: ANode | null): Scene => ({ views: [{ type: 'tree', root: avlTree(n), binary: true, title: 'AVL tree (bf = left height − right height)' }] });

/** Plain BST insert (no rebalancing), for showing the moment of imbalance. */
function plainInsert(n: ANode | null, k: number): ANode {
  if (!n) return { key: k, h: 0, left: null, right: null };
  if (k < n.key) n.left = plainInsert(n.left, k);
  else n.right = plainInsert(n.right, k);
  return upd(n);
}
const cloneA = (n: ANode | null): ANode | null => (n ? { ...n, left: cloneA(n.left), right: cloneA(n.right) } : null);

function imbalanceCase() {
  for (;;) {
    const keys = distinctInts(randInt(4, 7), 1, 99);
    const root = buildAVL(keys);
    let k = randInt(1, 99);
    while (keys.includes(k)) k = randInt(1, 99);
    const fixes: Fix[] = [];
    avlInsert(cloneA(root), k, fixes);
    if (fixes.length) return { root, k, fix: fixes[0], before: plainInsert(cloneA(root), k) };
  }
}

const predictRotation = (): Card => {
  const { k, fix, before } = imbalanceCase();
  const names: Record<Fix['kind'], string> = {
    right: 'Single right rotation (left-left case)',
    left: 'Single left rotation (right-right case)',
    'left-right': 'Double rotation: left, then right (left-right case)',
    'right-left': 'Double rotation: right, then left (right-left case)',
  };
  return {
    concept: AVL,
    type: 'predict',
    prompt: `Insert ${k} into this AVL tree. Node ${fix.at} becomes unbalanced (see the tree after a plain insert). Which fix is needed at ${fix.at}?`,
    scene: avlScene(before),
    body: {
      kind: 'choice',
      options: options(
        { text: names[fix.kind], why: 'Look at which child of the unbalanced node, then which grandchild, the new key went down.' },
        (Object.keys(names) as Fix['kind'][]).filter((x) => x !== fix.kind).map((x) => ({ text: names[x], why: 'Trace the path from the unbalanced node towards the new key: first step, then second step.' })),
      ),
    },
    explain: `The new key went ${fix.kind === 'right' ? 'left, then left' : fix.kind === 'left' ? 'right, then right' : fix.kind === 'left-right' ? 'left, then right' : 'right, then left'} from ${fix.at}. Straight lines need one rotation; zig-zags need two.`,
  };
};

const predictRootAfter = (): Card => {
  const [a, b, c] = distinctInts(3, 10, 99).sort((x, y) => x - y);
  const order = pick([
    [c, b, a],
    [a, b, c],
    [c, a, b],
    [a, c, b],
  ]);
  return {
    concept: AVL,
    type: 'predict',
    prompt: `Insert ${order.join(', ')} into an empty AVL tree. What's the root at the end?`,
    body: {
      kind: 'choice',
      options: options({ text: String(b), why: 'The middle key always ends up on top: that’s what balancing a 3-node chain does.' }, [
        { text: String(order[0]), why: 'That was the root of the plain BST, but 3 keys in a chain are unbalanced and get rotated.' },
        { text: String(order[2]), why: 'The last key inserted doesn’t become root by default.' },
      ]),
    },
    explain: `A plain BST would be a chain with root ${order[0]}. AVL sees a balance factor of ±2 and rotates so the middle key ${b} becomes the root, with ${a} and ${c} as children.`,
  };
};

const simulateFindUnbalanced = (): Card => {
  const { k, fix, before } = imbalanceCase();
  const b = aToB(before);
  const path = bstPath(b, k).slice(0, -1).reverse();
  const idx = path.indexOf(fix.at);
  const scene = avlScene(before);
  const expected = path.slice(0, idx + 1).map(t);
  const frames = [scene];
  expected.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: expected.slice(0, i + 1) }));
  return {
    concept: AVL,
    type: 'simulate',
    prompt: `${k} was just inserted (plain BST insert; balance factors shown). Walk back UP from ${k}'s parent towards the root, clicking each ancestor you check, and stop at the first one with |bf| > 1.`,
    scene,
    body: {
      kind: 'click',
      expected,
      frames,
      wrongHint: (step) => (step === 0 ? `Start at ${k}'s parent.` : 'Move up one level to the next ancestor.'),
    },
    explain: `${fix.at} is the lowest unbalanced ancestor. Fixing it restores its old height, so nothing above needs fixing: one fix per insert.`,
  };
};

const orderRotate = (): Card => ({
  concept: AVL,
  type: 'simulate',
  prompt: 'Right-rotate at node Y, whose left child is X. Put the pointer updates in a safe order.',
  body: {
    kind: 'order',
    steps: ['Let X = Y.left.', 'Y.left = X.right (X’s right subtree moves under Y).', 'X.right = Y.', 'Whatever pointed at Y (its parent or the root) now points at X.', 'Update the heights of Y, then X.'],
  },
  explain: 'Only three pointers change, and the BST order is preserved: X’s right subtree was between X and Y, and it still is.',
});

const countMinNodes = (): Card => {
  const h = randInt(2, 7);
  const N = [1, 2];
  for (let i = 2; i <= h; i++) N[i] = N[i - 1] + N[i - 2] + 1;
  return {
    concept: AVL,
    type: 'count',
    prompt: `What's the FEWEST nodes an AVL tree of height ${h} can have? (Height 0 = 1 node, height 1 = 2 nodes; the sparsest tree of height h has sparsest subtrees of heights h−1 and h−2.)`,
    body: { kind: 'number', answer: N[h], unit: 'nodes' },
    explain: `N(h) = N(h−1) + N(h−2) + 1: ${N.slice(0, h + 1).join(', ')}. This grows like Fibonacci (exponentially), so height stays O(log n).`,
  };
};

const countSortedHeight = (): Card => {
  const n = randInt(7, 31);
  const r = buildAVL(Array.from({ length: n }, (_, i) => i + 1));
  return {
    concept: AVL,
    type: 'count',
    prompt: `Insert 1, 2, 3, …, ${n} (sorted) into an empty AVL tree. What's its height at the end? (A plain BST would have height ${n - 1}.)`,
    body: { kind: 'number', answer: ah(r), unit: 'edges' },
    explain: `Height ${ah(r)}. Rotations keep it near log₂ ${n} ≈ ${Math.log2(n).toFixed(1)}, even for the worst-case input for a plain BST.`,
  };
};

const growthAVL = (): Card => growthCard(AVL, 'height after inserting 1..n in sorted order', (n) => ah(buildAVL(Array.from({ length: n }, (_, i) => i + 1))), 1, 'Rotations keep the height logarithmic no matter the insertion order.');

const avlExplain = explainGenerators({
  concept: AVL,
  truths: [
    'An AVL tree is a BST where every node’s subtree heights differ by at most 1.',
    'After an insert, the lowest unbalanced ancestor is fixed with one single or double rotation.',
    'Rotations change a few pointers but keep the BST order.',
    'The height is always O(log n), so search/insert/delete are O(log n) guaranteed.',
  ],
  myths: [
    { text: 'AVL trees rebuild the whole tree when unbalanced.', why: 'A rotation changes just a few pointers locally.' },
    { text: 'Every node must have exactly two children.', why: 'Only the heights of the two subtrees must be within 1.' },
    { text: 'A rotation breaks the sorted order, which is restored later.', why: 'Rotations preserve BST order at every moment.' },
    { text: 'Inserting sorted keys still creates a stick.', why: 'Rotations fix each imbalance as it appears.' },
  ],
  chains: [
    {
      prompt: 'Why does one rotation after insert fix the whole tree?',
      steps: ['The insert raised heights along one path.', 'The lowest unbalanced node is where the path got 2 taller on one side.', 'A rotation there restores that subtree’s original height.', 'So every ancestor above sees the same height as before: still balanced.'],
    },
  ],
  summary: {
    best: 'An AVL tree is a BST that checks after every insert that no side got more than one level taller, and twists the tree back into shape when one does.',
    others: [
      { text: 'An AVL tree is a self-balancing BST.', why: 'Balancing how, and why does it matter?' },
      { text: 'It rotates nodes.', why: 'Mechanism without purpose.' },
      { text: 'It keeps the tree perfectly balanced.', why: 'Almost: heights may differ by 1.' },
    ],
  },
});

const rebuildAVL = (): Card => {
  const order = distinctInts(randInt(5, 6), 1, 99).sort((a, b) => (Math.random() < 0.6 ? a - b : b - a));
  const lv = levelorder(aToB(buildAVL(order)));
  return sequenceRebuild(AVL, `Insert ${order.join(', ')} into an empty AVL tree (rotating whenever a node's sides differ by more than 1). Write the final tree in LEVEL ORDER.`, lv, [], `Level order: ${lv.join(', ')}. A plain BST of this input would be ${order.every((x, i) => i === 0 || (x > order[i - 1]) === (order[1] > order[0])) ? 'a stick' : 'lopsided'}; rotations keep it bushy.`, 'Your AVL tree, level by level');
};

const avlOps: Concept['playground'] = {
  initial: () => avlScene(buildAVL([30, 20, 40])),
  guide: [
    { do: 'Insert 10.', see: 'Each node shows bf: left height minus right height. Everything is still within ±1.' },
    { do: 'Insert 5.', see: 'The left side of 20 is now 2 deeper, so the tree rotates to fix it. Watch the shape stay short.' },
    { do: 'Insert 50, 60, 70, 80 (one at a time).', see: 'Sorted inserts would make a plain BST a long chain. Here rotations keep it bushy.' },
  ],
  ops: [
    {
      label: 'Insert',
      inputs: ['key'],
      run: (s, [k]) => {
        const tv = s.views[0] as Extract<View, { type: 'tree' }>;
        const keys: number[] = [];
        const walk = (n: TreeNode | null) => {
          if (!n) return;
          keys.push(Number(n.id));
          n.children.forEach(walk);
        };
        walk(tv.root);
        if (keys.includes(k)) return { error: `${k} is already there.` };
        const r = buildAVL(keys);
        const fixes: Fix[] = [];
        const nr = avlInsert(r, k, fixes);
        return {
          scene: { ...avlScene(nr), highlight: [t(k)] },
          touches: ah(r) + 1,
          note: fixes.length ? `Inserted ${k}; node ${fixes[0].at} was unbalanced → ${fixes[0].kind} rotation. Height ${ah(nr)}.` : `Inserted ${k}; still balanced. Height ${ah(nr)}.`,
        };
      },
    },
  ],
};

export const avlConcept: Concept = {
  id: AVL,
  title: 'AVL Tree',
  tier: 5,
  prereqs: ['bst'],
  tagline: 'A BST that rotates to stay short.',
  hook: {
    problem: 'Insert sorted data into a BST and it turns into a stick: every search is O(n). You can’t control the order data arrives in.',
    question: 'How could the tree stay short whatever the insertion order?',
    options: [
      { text: 'After each insert, check subtree heights on the way up and rotate any node whose sides differ by more than 1.', good: true, feedback: 'Yes. That’s AVL: a tiny local rotation keeps every node balanced, so height stays O(log n).' },
      { text: 'Shuffle the input before inserting.', feedback: 'Helps on average, but you don’t always have all the data up front.' },
      { text: 'Rebuild the whole tree every 100 inserts.', feedback: 'O(n) rebuilds, and bad in between.' },
    ],
  },
  lens: {
    layout: 'A BST whose nodes also store their height (or balance factor).',
    invariant: 'For every node, |height(left) − height(right)| ≤ 1.',
    payoff: 'Height ≤ ~1.44 log₂ n: guaranteed O(log n) search, insert, delete.',
    price: 'Extra height field, rotation logic, and more rebalancing work on updates than looser schemes.',
  },
  playground: avlOps,
  generators: {
    predict: [predictRotation, predictRootAfter],
    simulate: [simulateFindUnbalanced, orderRotate],
    count: [countMinNodes, countSortedHeight, growthAVL],
    explain: avlExplain,
    rebuild: [rebuildAVL],
  },
};

// =====================================================================
// Red-black tree
// =====================================================================

const RB = 'red-black-tree';

type RBProblem = 'valid' | 'red root' | 'red node with a red child' | 'unequal black counts';

/** A perfect tree (height 2 or 3) coloured by level, optionally broken in a specific way. */
function rbCase(problem: RBProblem) {
  const h = pick([2, 3]);
  const n = 2 ** (h + 1) - 1;
  const keys = Array.from({ length: n }, (_, i) => (i + 1) * 5);
  const root = buildBST(perfectOrder(keys))!;
  const depth = new Map<number, number>();
  const rec = (b: BNode | null, d: number) => {
    if (!b) return;
    depth.set(b.key, d);
    rec(b.left, d + 1);
    rec(b.right, d + 1);
  };
  rec(root, 0);
  // Valid: some non-adjacent levels (never 0) are red.
  const redLevels = new Set<number>(h === 2 ? pick([[], [1], [2]]) : pick([[], [1], [2], [3], [1, 3]]));
  const red = new Set([...depth].filter(([, d]) => redLevels.has(d)).map(([k]) => k));
  if (problem === 'red root') red.add(root.key);
  if (problem === 'red node with a red child') {
    const l = pick([...depth].filter(([, d]) => d >= 1 && d < h).map(([k]) => k));
    red.add(l);
    // Make one of its children red too (and that child's whole level to keep black counts equal).
    const lvl = depth.get(l)! + 1;
    [...depth].filter(([, d]) => d === lvl || d === depth.get(l)).forEach(([k]) => red.add(k));
  }
  if (problem === 'unequal black counts') {
    const blackLeaves = [...depth].filter(([k, d]) => d === h && !red.has(k)).map(([k]) => k);
    const x = pick(blackLeaves.length ? blackLeaves : [...depth].filter(([k, d]) => d > 0 && !red.has(k)).map(([k]) => k));
    red.add(x);
    // Ensure we didn't accidentally create red-red: parent must be black.
    const parentKey = bstPath(root, x).slice(-2)[0];
    red.delete(parentKey);
    if (parentKey === root.key) red.delete(root.key);
  }
  const tree = toTree(root, undefined, (k) => (red.has(k) ? 'red' : 'black'));
  return { root, red, tree, h };
}
function perfectOrder(sorted: number[]): number[] {
  if (!sorted.length) return [];
  const m = Math.floor(sorted.length / 2);
  return [sorted[m], ...perfectOrder(sorted.slice(0, m)), ...perfectOrder(sorted.slice(m + 1))];
}
function rbCheck(root: BNode, red: Set<number>): RBProblem {
  if (red.has(root.key)) return 'red root';
  let redRed = false;
  const counts = new Set<number>();
  const rec = (b: BNode | null, parentRed: boolean, blacks: number) => {
    if (!b) return void counts.add(blacks);
    const r = red.has(b.key);
    if (r && parentRed) redRed = true;
    rec(b.left, r, blacks + (r ? 0 : 1));
    rec(b.right, r, blacks + (r ? 0 : 1));
  };
  rec(root, false, 0);
  if (redRed) return 'red node with a red child';
  if (counts.size > 1) return 'unequal black counts';
  return 'valid';
}

const predictRBValid = (): Card => {
  const c = rbCase(pick<RBProblem>(['valid', 'red root', 'red node with a red child', 'unequal black counts']));
  const actual = rbCheck(c.root, c.red);
  const all: RBProblem[] = ['valid', 'red root', 'red node with a red child', 'unequal black counts'];
  const text = (p: RBProblem) => (p === 'valid' ? 'It’s a valid red-black tree' : `Broken: ${p}`);
  return {
    concept: RB,
    type: 'predict',
    prompt: 'Red nodes have a red outline, black nodes a thick dark outline. Is this a valid red-black tree? If not, which rule breaks?',
    scene: { views: [{ type: 'tree', root: c.tree, binary: true }] },
    body: {
      kind: 'choice',
      options: all.map((p) => ({ text: text(p), correct: p === actual, why: p === actual ? 'Check each rule: black root, no red-red, equal black counts on every root-to-empty path.' : undefined })),
    },
    explain: `Rules: root black; a red node's children are black; every path from the root to an empty child has the same number of black nodes. This tree: ${actual}.`,
  };
};

const predictRBHeight = (): Card => {
  const short = randInt(3, 8);
  return {
    concept: RB,
    type: 'predict',
    prompt: `In a red-black tree, the shortest root-to-empty path has ${short} nodes (all black). What's the LONGEST any root-to-empty path can be?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        2 * short,
        [
          { value: short + 1, why: 'Red nodes can be inserted between every pair of blacks, not just one.' },
          { value: short, why: 'Red nodes can make some paths longer.' },
          { value: short * short, why: 'The red-red rule caps it at alternating red and black.' },
        ],
        'Same number of blacks, at most one red after each black.',
      ),
    },
    explain: `Every path has the same ${short} blacks; reds can't be adjacent, so at most one red per black: ${2 * short}. Longest ≤ 2 × shortest, so height is O(log n).`,
  };
};

const simulateBlackPath = (): Card => {
  const c = rbCase('valid');
  const leaf = pick([...leavesOf(c.root)]);
  const path = bstPath(c.root, leaf).filter((k) => !c.red.has(k));
  const scene: Scene = { views: [{ type: 'tree', root: c.tree, binary: true }] };
  const frames = [scene];
  path.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: path.slice(0, i + 1).map(t) }));
  return {
    concept: RB,
    type: 'simulate',
    prompt: `Walk from the root down to ${leaf}. Click only the BLACK nodes on the way, in order.`,
    scene,
    body: { kind: 'click', expected: path.map(t), frames, wrongHint: () => 'Only black nodes (thick dark outline), from the root down towards ' + leaf + '.' },
    explain: `${path.length} black nodes. Every root-to-empty path in a valid red-black tree has exactly this many.`,
  };
};
function leavesOf(b: BNode | null): number[] {
  if (!b) return [];
  if (!b.left && !b.right) return [b.key];
  return [...leavesOf(b.left), ...leavesOf(b.right)];
}

const countBlackHeight = (): Card => {
  const c = rbCase('valid');
  let bh = 0;
  let cur: BNode | null = c.root;
  while (cur) {
    if (!c.red.has(cur.key)) bh++;
    cur = cur.left;
  }
  return {
    concept: RB,
    type: 'count',
    prompt: 'How many black nodes are on each path from the root down to an empty child in this red-black tree?',
    scene: { views: [{ type: 'tree', root: c.tree, binary: true }] },
    body: { kind: 'number', answer: bh, unit: 'black nodes' },
    explain: `${bh} (the “black height”). It’s the same on every path; that’s the rule that keeps the tree balanced.`,
  };
};

const countRBMin = (): Card => {
  const b = randInt(2, 8);
  return {
    concept: RB,
    type: 'count',
    prompt: `A red-black tree has ${b} black nodes on every root-to-empty path. What's the fewest nodes it can have?`,
    body: { kind: 'number', answer: 2 ** b - 1, unit: 'nodes' },
    explain: `With no reds at all, it's a perfect tree of ${b} levels: 2^${b} − 1 = ${2 ** b - 1}. So n ≥ 2^(bh) − 1, meaning bh ≤ log₂(n+1) and height ≤ 2 log₂(n+1).`,
  };
};

const rbExplain = explainGenerators({
  concept: RB,
  truths: [
    'Every node is red or black, and the root is black.',
    'A red node never has a red child.',
    'Every root-to-empty path has the same number of black nodes.',
    'Those rules force the longest path to be at most twice the shortest, so height is O(log n).',
    'It rebalances with recolouring plus at most a couple of rotations per insert.',
  ],
  myths: [
    { text: 'Red-black trees are perfectly balanced.', why: 'Paths can differ by up to 2×. That looseness means cheaper updates.' },
    { text: 'The colours mean something about the keys.', why: 'Colours are pure bookkeeping for balance.' },
    { text: 'Two red nodes in a row are fine as long as black counts match.', why: 'The no-red-red rule is what caps path length.' },
    { text: 'Red-black trees rotate after every single insert.', why: 'Often only recolouring is needed.' },
  ],
  chains: [
    {
      prompt: 'Why is a red-black tree’s height at most about 2 log n?',
      steps: ['Every path has the same number of black nodes, b.', 'The all-black part alone forms a tree with at least 2^b − 1 nodes, so b ≤ log₂(n+1).', 'Reds can’t be adjacent, so a path has at most b reds.', 'So every path has at most 2b nodes: height ≤ 2 log₂(n+1).'],
    },
  ],
  summary: {
    best: 'A red-black tree colours its nodes so that no path can be more than twice as long as any other, which keeps it short without fussing over perfect balance.',
    others: [
      { text: 'It’s a self-balancing BST with colours.', why: 'Why colours? How do they balance?' },
      { text: 'Red nodes are new and black nodes are old.', why: 'Colours don’t track age.' },
      { text: 'It’s what TreeMap uses.', why: 'A use, not a mechanism.' },
    ],
  },
});

export const redBlackConcept: Concept = {
  id: RB,
  title: 'Red-Black Tree',
  tier: 5,
  prereqs: [AVL],
  tagline: 'Looser balance, cheaper updates. Colour rules cap the height.',
  hook: {
    problem: 'AVL trees keep heights within 1, but that strictness means lots of rebalancing on inserts and deletes. Many systems insert and delete constantly.',
    question: 'Could a looser rule still guarantee O(log n) height?',
    options: [
      { text: 'Yes: colour nodes red/black with rules that keep every path within 2× of every other.', good: true, feedback: 'That’s a red-black tree. Height ≤ 2 log n, and fixes are mostly cheap recolourings.' },
      { text: 'No: any looseness can create a stick.', feedback: 'Not if the rule caps the ratio between path lengths.' },
      { text: 'Only rebalance when the tree gets really bad.', feedback: 'Without a precise rule, “really bad” can still mean O(n) operations.' },
    ],
  },
  lens: {
    layout: 'A BST where each node also stores one bit: red or black.',
    invariant: 'Root black; no red node has a red child; every root-to-empty path has the same number of black nodes.',
    payoff: 'Height ≤ 2 log₂(n+1); inserts and deletes need at most a few rotations. Used in Java TreeMap and C++ std::map.',
    price: 'Complex case analysis for insert/delete; searches are slightly deeper than in AVL.',
  },
  generators: {
    predict: [predictRBValid, predictRBHeight],
    simulate: [simulateBlackPath],
    count: [countBlackHeight, countRBMin],
    explain: rbExplain,
  },
};

// =====================================================================
// Splay tree
// =====================================================================

const SP = 'splay-tree';

const predictSplayCase = (): Card => {
  const keys = distinctInts(randInt(8, 10), 1, 99);
  const root = randomBST(keys);
  const deep = keys.filter((k) => bstPath(root, k).length >= 2);
  const x = pick(deep);
  const path = bstPath(root, x);
  const p = path[path.length - 2];
  let answer: string;
  let why: string;
  if (path.length === 2) {
    answer = 'Zig: a single rotation with its parent';
    why = `${x}'s parent ${p} is the root.`;
  } else {
    const g = path[path.length - 3];
    const same = (x < p) === (p < g);
    answer = same ? 'Zig-zig: rotate the parent first, then X' : 'Zig-zag: rotate X with its parent, then with its new parent';
    why = same ? `${x} and ${p} are on the same side (both ${x < p ? 'left' : 'right'} children).` : `${x} is a ${x < p ? 'left' : 'right'} child but ${p} is a ${p < g ? 'left' : 'right'} child.`;
  }
  return {
    concept: SP,
    type: 'predict',
    prompt: `You access ${x}, so it must be splayed to the root. What's the FIRST splay step?`,
    scene: { views: [{ type: 'tree', root: toTree(root), binary: true }] },
    body: {
      kind: 'choice',
      options: options({ text: answer, why }, [
        { text: 'Zig: a single rotation with its parent', why: 'Zig is only used when the parent is the root.' },
        { text: 'Zig-zig: rotate the parent first, then X', why: 'Zig-zig is for when X and its parent are on the same side.' },
        { text: 'Zig-zag: rotate X with its parent, then with its new parent', why: 'Zig-zag is for when X and its parent are on opposite sides.' },
      ]),
    },
    explain: `${why} Splaying repeats these steps until ${x} is the root.`,
  };
};

const predictSplayEffect = (): Card => ({
  concept: SP,
  type: 'predict',
  prompt: 'In a splay tree, you look up the same key 1,000 times in a row. What happens?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'The first lookup splays it to the root; the other 999 find it immediately.', correct: true, why: 'Accessed keys move to the root, so repeats are O(1).' },
      { text: 'Every lookup costs the same O(log n).', correct: false, why: 'After the first access, the key sits at the root.' },
      { text: 'The tree gets rebuilt 1,000 times.', correct: false, why: 'Splaying the root is a no-op.' },
      { text: 'The key sinks to the bottom to make room.', correct: false, why: 'The opposite: it rises to the top.' },
    ]),
  },
  explain: 'Splay trees adapt: recently and frequently used keys stay near the top. Great for caches and skewed workloads.',
});

const orderZigZig = (): Card => ({
  concept: SP,
  type: 'simulate',
  prompt: 'X is a left child, and its parent P is also a left child of G (zig-zig). Put the splay step in order.',
  body: { kind: 'order', steps: ['Rotate P up over G (right rotation at G).', 'Rotate X up over P (right rotation at P).', 'X now sits where G was; continue splaying from there.'] },
  explain: 'Zig-zig rotates the *grandparent* first. Doing X first would still bring X up, but loses the path-halving effect that makes splay trees O(log n) amortized.',
});

const orderZigZag = (): Card => ({
  concept: SP,
  type: 'simulate',
  prompt: 'X is a right child, and its parent P is a left child of G (zig-zag). Put the splay step in order.',
  body: { kind: 'order', steps: ['Rotate X up over P (left rotation at P).', 'Rotate X up over G (right rotation at G).', 'X now sits where G was; continue splaying from there.'] },
  explain: 'Zig-zag rotates X twice: first past its parent, then past its old grandparent.',
});

const countSplaySteps = (): Card => {
  const d = randInt(1, 12);
  return {
    concept: SP,
    type: 'count',
    prompt: `A key sits at depth ${d}. Each zig-zig/zig-zag step lifts it 2 levels; a final zig lifts it 1. How many splay steps bring it to the root?`,
    body: { kind: 'number', answer: Math.ceil(d / 2), unit: 'steps' },
    explain: `${Math.floor(d / 2)} double steps${d % 2 ? ' + 1 zig' : ''} = ${Math.ceil(d / 2)}.`,
  };
};

const spExplain = explainGenerators({
  concept: SP,
  truths: [
    'Every access moves the accessed node to the root with rotations (splaying).',
    'Splay steps are zig, zig-zig and zig-zag, depending on the node’s position.',
    'Operations are O(log n) amortized, even though a single one can be O(n).',
    'Frequently accessed keys stay near the root.',
    'Splay trees store no balance information at all.',
  ],
  myths: [
    { text: 'Every splay-tree operation is O(log n) in the worst case.', why: 'One operation can be O(n); it’s the average over a sequence that’s O(log n).' },
    { text: 'Splay trees store heights or colours.', why: 'No extra fields: the restructuring alone does the job.' },
    { text: 'Only inserts reshape a splay tree.', why: 'Every access, including lookups, splays.' },
  ],
  chains: [
    {
      prompt: 'Why are repeated lookups of one key cheap in a splay tree?',
      steps: ['A lookup splays the key to the root.', 'Nothing moves it away until another key is accessed.', 'The next lookup finds it at the root immediately.'],
    },
  ],
  summary: {
    best: 'A splay tree moves whatever you just used to the top, so the things you use most are always close at hand.',
    others: [
      { text: 'A splay tree is a self-adjusting BST.', why: 'Adjusting how, and why?' },
      { text: 'It is always balanced.', why: 'It can be temporarily very unbalanced.' },
      { text: 'It’s a tree that splays out.', why: 'Meaningless.' },
    ],
  },
});

export const splayConcept: Concept = {
  id: SP,
  title: 'Splay Tree',
  tier: 5,
  prereqs: [AVL],
  tagline: 'Whatever you touch moves to the top.',
  hook: {
    problem: 'In real workloads, a few keys are accessed far more than others (think: popular products). A balanced BST treats every key the same: always ~log n deep.',
    question: 'How could popular keys become cheaper to reach?',
    options: [
      { text: 'After every access, rotate that key all the way up to the root.', good: true, feedback: 'Yes. That’s splaying. Popular keys hover near the top, and the amortized cost is still O(log n).' },
      { text: 'Keep a count per key and re-sort by popularity.', feedback: 'Re-sorting is expensive, and popularity changes.' },
      { text: 'Duplicate popular keys near the root.', feedback: 'Duplicates break the BST rule and complicate updates.' },
    ],
  },
  lens: {
    layout: 'A plain BST: no heights, no colours.',
    invariant: 'BST order only. After each access, the accessed node is the root.',
    payoff: 'O(log n) amortized; recently used keys are fast; simple nodes.',
    price: 'A single operation can be O(n); even lookups modify the tree (bad for concurrency).',
  },
  generators: {
    predict: [predictSplayCase, predictSplayEffect],
    simulate: [orderZigZig, orderZigZag],
    count: [countSplaySteps],
    explain: spExplain,
  },
};

// =====================================================================
// Treap
// =====================================================================

const TP = 'treap';

interface TNode {
  key: number;
  pri: number;
  left: TNode | null;
  right: TNode | null;
}
/** Treap = the BST you get by inserting keys in increasing priority order (smallest priority on top). */
function buildTreap(pairs: { key: number; pri: number }[]): TNode | null {
  const byPri = [...pairs].sort((a, b) => a.pri - b.pri);
  let root: TNode | null = null;
  for (const p of byPri) {
    const n: TNode = { ...p, left: null, right: null };
    if (!root) {
      root = n;
      continue;
    }
    let cur = root;
    for (;;) {
      if (p.key < cur.key) {
        if (!cur.left) {
          cur.left = n;
          break;
        }
        cur = cur.left;
      } else {
        if (!cur.right) {
          cur.right = n;
          break;
        }
        cur = cur.right;
      }
    }
  }
  return root;
}
const treapTree = (n: TNode | null): TreeNode | null => (n ? { id: String(n.key), label: String(n.key), note: `p${n.pri}`, children: [treapTree(n.left), treapTree(n.right)] } : null);
const treapScene = (n: TNode | null): Scene => ({ views: [{ type: 'tree', root: treapTree(n), binary: true, title: 'Treap: BST by key, min-heap by priority (p)' }] });
const tPath = (root: TNode | null, k: number) => {
  const out: TNode[] = [];
  let c = root;
  while (c) {
    out.push(c);
    c = k < c.key ? c.left : c.right;
  }
  return out;
};

function treapCase() {
  const keys = distinctInts(randInt(6, 8), 1, 99);
  const pris = distinctInts(keys.length, 10, 99);
  const pairs = keys.map((key, i) => ({ key, pri: pris[i] }));
  let k = randInt(1, 99);
  while (keys.includes(k)) k = randInt(1, 99);
  return { pairs, root: buildTreap(pairs), k };
}

const predictTreapRoot = (): Card => {
  const { pairs } = treapCase();
  const top = [...pairs].sort((a, b) => a.pri - b.pri)[0];
  const byKey = [...pairs].sort((a, b) => a.key - b.key);
  return {
    concept: TP,
    type: 'predict',
    prompt: `A treap holds (key, priority): ${pairs.map((p) => `(${p.key}, ${p.pri})`).join(' ')}. Smaller priority = higher in the tree. Which key is the root?`,
    body: {
      kind: 'choice',
      options: options({ text: String(top.key), why: 'The smallest priority must be on top (heap order).' }, [
        { text: String(byKey[Math.floor(byKey.length / 2)].key), why: 'The median key would be a balanced BST’s root, but treaps put the smallest *priority* on top.' },
        { text: String(pairs[0].key), why: 'Insertion order doesn’t decide it; priorities do.' },
        { text: String([...pairs].sort((a, b) => b.pri - a.pri)[0].key), why: 'That has the *largest* priority; here smaller means higher.' },
      ]),
    },
    explain: `Key ${top.key} has priority ${top.pri}, the smallest, so it's the root. The whole shape is fixed by the priorities: it's the BST you'd get inserting keys in priority order.`,
  };
};

const predictTreapNewRoot = (): Card => {
  const { pairs, k } = treapCase();
  const minP = Math.min(...pairs.map((p) => p.pri));
  const newP = randInt(1, minP - 1);
  return {
    concept: TP,
    type: 'predict',
    prompt: `Insert key ${k} with priority ${newP} into a treap whose smallest priority is ${minP}. Where does ${k} end up?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: 'At the root, after rotating up past every ancestor.', correct: true, why: `${newP} < ${minP}: it beats everyone, so heap order puts it on top.` },
        { text: 'As a leaf, where the BST insert put it.', correct: false, why: 'It starts there, but its small priority makes it rotate up.' },
        { text: 'One level up from where it was inserted.', correct: false, why: 'It keeps rotating while its priority is smaller than its parent’s.' },
        { text: 'It replaces the old root, which is deleted.', correct: false, why: 'Nothing is deleted; rotations just rearrange.' },
      ]),
    },
    explain: 'Insert as a BST leaf, then rotate up while its priority is smaller than its parent’s. Random priorities make the expected depth O(log n).',
  };
};

const simulateTreapRotate = (): Card => {
  let c: ReturnType<typeof treapCase>;
  let pri = 0;
  let climb: TNode[] = [];
  do {
    c = treapCase();
    const path = tPath(c.root, c.k).reverse();
    pri = randInt(1, 60);
    climb = [];
    for (const a of path) {
      if (a.pri > pri) climb.push(a);
      else break;
    }
  } while (climb.length < 2 || c.pairs.some((p) => p.pri === pri));
  const before = buildTreap(c.pairs);
  const plain = cloneTN(before)!;
  const leafParent = tPath(plain, c.k).pop()!;
  const n: TNode = { key: c.k, pri, left: null, right: null };
  if (c.k < leafParent.key) leafParent.left = n;
  else leafParent.right = n;
  const frames: Scene[] = [{ ...treapScene(plain), highlight: [t(c.k)] }];
  const after = buildTreap([...c.pairs, { key: c.k, pri }]);
  climb.forEach((_, i) => frames.push({ ...treapScene(i === climb.length - 1 ? after : plain), highlight: [t(c.k), ...climb.slice(0, i + 1).map((a) => t(a.key))] }));
  return {
    concept: TP,
    type: 'simulate',
    prompt: `${c.k} (priority ${pri}) was inserted as a leaf. Rotate it up while its priority is smaller than its parent's: click each ancestor it rotates past, bottom to top.`,
    scene: frames[0],
    body: {
      kind: 'click',
      expected: climb.map((a) => t(a.key)),
      frames,
      wrongHint: (step) => (step === 0 ? `Start with ${c.k}'s parent.` : 'Next ancestor up. Stop when an ancestor has a smaller priority.'),
    },
    explain: `${c.k} climbs past ${climb.map((a) => `${a.key} (p${a.pri})`).join(', ')}. Each rotation keeps BST order and fixes heap order one level.`,
  };
};
const cloneTN = (n: TNode | null): TNode | null => (n ? { ...n, left: cloneTN(n.left), right: cloneTN(n.right) } : null);

const countTreapRot = (): Card => {
  const { pairs, root, k } = treapCase();
  const pri = randInt(1, 99);
  let climb = 0;
  for (const a of tPath(root, k).reverse()) {
    if (a.pri > pri) climb++;
    else break;
  }
  return {
    concept: TP,
    type: 'count',
    prompt: `Insert key ${k} with priority ${pri} into this treap. How many rotations happen?`,
    scene: treapScene(buildTreap(pairs)),
    body: { kind: 'number', answer: climb, unit: 'rotations' },
    explain: `Walk up from where ${k} lands as a leaf; it rotates past each ancestor with a bigger priority, stopping at the first smaller one: ${climb}.`,
  };
};

const tpExplain = explainGenerators({
  concept: TP,
  truths: [
    'Each node has a key (BST order) and a random priority (heap order).',
    'The shape is exactly the BST you’d get by inserting keys in priority order.',
    'Random priorities make the tree behave like a randomly built BST: expected depth O(log n).',
    'Insert places a leaf, then rotates it up while its priority beats its parent’s.',
  ],
  myths: [
    { text: 'The root of a treap is the median key.', why: 'The root is the key with the smallest (or largest) priority.' },
    { text: 'Treaps guarantee O(log n) in the worst case.', why: 'Only in expectation, thanks to random priorities.' },
    { text: 'Priorities are chosen to balance the tree.', why: 'They’re random. Balance emerges on average.' },
  ],
  chains: [
    {
      prompt: 'Why does a treap stay balanced on average even with sorted input?',
      steps: ['The shape depends only on the priorities, not on insertion order.', 'Priorities are random.', 'So the tree looks like a BST built from a random insertion order.', 'Random BSTs have expected depth O(log n).'],
    },
  ],
  summary: {
    best: 'A treap gives every key a random lottery ticket and keeps the lowest ticket on top, which shuffles away any bad insertion order.',
    others: [
      { text: 'A treap is a tree plus a heap.', why: 'The pun, not the mechanism.' },
      { text: 'Treaps are always perfectly balanced.', why: 'Only balanced on average.' },
      { text: 'It’s a heap with keys.', why: 'Misses the BST ordering by key.' },
    ],
  },
});

export const treapConcept: Concept = {
  id: TP,
  title: 'Treap',
  tier: 5,
  prereqs: ['bst', 'binary-heap'],
  tagline: 'A BST shuffled by random priorities.',
  hook: {
    problem: 'A BST is only O(log n) if keys arrive in a random-ish order. AVL and red-black fix bad orders with complicated rules.',
    question: 'Is there a simpler way to make any insertion order behave like a random one?',
    options: [
      { text: 'Give each key a random priority, and keep priorities in heap order while keys stay in BST order.', good: true, feedback: 'Yes. The shape then only depends on the random priorities, so it’s balanced on average, whatever the input order.' },
      { text: 'Shuffle all the input first.', feedback: 'Only works if you have all the data up front.' },
      { text: 'Rebuild the tree periodically.', feedback: 'Expensive, and bad in between.' },
    ],
  },
  lens: {
    layout: 'BST nodes with an extra random priority field.',
    invariant: 'BST order by key, and heap order by priority (parent priority < child priority).',
    payoff: 'Expected O(log n) operations with simple rotation code; easy split/merge.',
    price: 'Only expected, not guaranteed; needs a random number per node.',
  },
  generators: {
    predict: [predictTreapRoot, predictTreapNewRoot],
    simulate: [simulateTreapRotate],
    count: [countTreapRot],
    explain: tpExplain,
  },
};

// =====================================================================
// B-tree (max 3 keys per node: a 2-3-4 tree)
// =====================================================================

const BTR = 'b-tree';
const MAXK = 3;

interface KNode {
  keys: number[];
  kids: KNode[];
}
function bSplitChild(p: KNode, i: number) {
  const c = p.kids[i];
  const mid = c.keys[1];
  const right: KNode = { keys: c.keys.slice(2), kids: c.kids.slice(2) };
  c.keys = c.keys.slice(0, 1);
  c.kids = c.kids.slice(0, 2);
  p.keys.splice(i, 0, mid);
  p.kids.splice(i + 1, 0, right);
}
function bInsert(root: KNode | null, k: number): KNode {
  if (!root) return { keys: [k], kids: [] };
  if (root.keys.length === MAXK) {
    const r: KNode = { keys: [], kids: [root] };
    bSplitChild(r, 0);
    root = r;
  }
  let n = root;
  for (;;) {
    if (!n.kids.length) {
      n.keys.push(k);
      n.keys.sort((a, b) => a - b);
      return root;
    }
    let i = n.keys.findIndex((x) => k < x);
    if (i === -1) i = n.keys.length;
    if (n.kids[i].keys.length === MAXK) {
      bSplitChild(n, i);
      if (k > n.keys[i]) i++;
    }
    n = n.kids[i];
  }
}
const buildB = (keys: number[]) => keys.reduce<KNode | null>((r, k) => bInsert(r, k), null)!;
function bTree(n: KNode): TreeNode {
  return { id: n.keys.join('|'), label: n.keys.join(' | '), children: n.kids.map(bTree) };
}
const bScene = (n: KNode, title = 'B-tree (up to 3 keys per node)'): Scene => ({ views: [{ type: 'tree', root: bTree(n), title }] });
function bSearchPath(n: KNode, k: number): KNode[] {
  const out = [n];
  while (n.kids.length && !n.keys.includes(k)) {
    let i = n.keys.findIndex((x) => k < x);
    if (i === -1) i = n.keys.length;
    n = n.kids[i];
    out.push(n);
  }
  return out;
}
const bHeight = (n: KNode): number => (n.kids.length ? 1 + bHeight(n.kids[0]) : 0);

const predictBChild = (): Card => {
  const keys = distinctInts(3, 10, 90).sort((a, b) => a - b);
  const k = randInt(1, 99);
  const slot = keys.findIndex((x) => k < x) === -1 ? keys.length : keys.findIndex((x) => k < x);
  const label = (i: number) => (i === 0 ? `child 0 (keys < ${keys[0]})` : i === keys.length ? `child ${i} (keys > ${keys[keys.length - 1]})` : `child ${i} (between ${keys[i - 1]} and ${keys[i]})`);
  if (keys.includes(k))
    return {
      concept: BTR,
      type: 'predict',
      prompt: `A B-tree node holds keys [${keys.join(', ')}]. Searching for ${k}: what happens here?`,
      body: { kind: 'choice', options: options({ text: 'Found it in this node', why: `${k} is one of the keys.` }, [0, 1, 2, 3].map((i) => ({ text: label(i), why: `${k} is in this node already.` }))) },
      explain: 'B-tree nodes store real keys, so a search can end at an internal node.',
    };
  return {
    concept: BTR,
    type: 'predict',
    prompt: `A B-tree node holds keys [${keys.join(', ')}] and has 4 children. Searching for ${k}: which child do you go to?`,
    body: {
      kind: 'choice',
      options: options({ text: label(slot), why: `${k} fits in that gap.` }, [0, 1, 2, 3].filter((i) => i !== slot).map((i) => ({ text: label(i), why: `${k} doesn't fit that range.` }))),
    },
    explain: `The ${keys.length} keys split the number line into ${keys.length + 1} ranges, one per child. ${k} falls in range ${slot}. One node = one multi-way decision.`,
  };
};

const predictBSplit = (): Card => {
  const leaf = distinctInts(3, 10, 90).sort((a, b) => a - b);
  let k = randInt(5, 95);
  while (leaf.includes(k)) k++;
  const all = [...leaf, k].sort((a, b) => a - b);
  // Proactive split: [a, b, c] splits around b before inserting.
  const mid = leaf[1];
  const left = [leaf[0]];
  const right = [leaf[2]];
  (k < mid ? left : right).push(k);
  left.sort((a, b) => a - b);
  right.sort((a, b) => a - b);
  return {
    concept: BTR,
    type: 'predict',
    prompt: `Nodes hold at most 3 keys. A full leaf [${leaf.join(', ')}] must take ${k}. It splits: the middle key moves up to the parent. What's the result?`,
    body: {
      kind: 'choice',
      options: options({ text: `${mid} goes up; leaves [${left.join(', ')}] and [${right.join(', ')}]`, why: `The full node splits around its middle key ${mid}; then ${k} goes into the correct half.` }, [
        { text: `${all[2]} goes up; leaves [${all.slice(0, 2).join(', ')}] and [${all.slice(3).join(', ')}]`, why: 'The split happens around the middle of the *full* node, before adding the new key.' },
        { text: `Leaf becomes [${all.join(', ')}]`, why: 'That’s 4 keys, over the limit of 3.' },
        { text: `${k} goes up; the leaf stays [${leaf.join(', ')}]`, why: 'The new key goes into a leaf; the middle of the old node goes up.' },
      ]),
    },
    explain: 'Splitting pushes a key up. If the root splits, a new root appears on top, which is the only way a B-tree gets taller, so all leaves always stay at the same depth.',
  };
};

const simulateBSearch = (): Card => {
  let root: KNode;
  let k: number;
  let path: KNode[];
  do {
    const keys = distinctInts(randInt(12, 18), 1, 99);
    root = buildB(shuffle(keys));
    k = pick(keys);
    path = bSearchPath(root, k);
  } while (path.length < 2);
  const scene = bScene(root);
  const ids = path.map((n) => t(n.keys.join('|')));
  const frames = [scene];
  ids.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: ids.slice(0, i + 1) }));
  return {
    concept: BTR,
    type: 'simulate',
    prompt: `Search for ${k}. Click each node you read (each would be one disk read), starting at the root.`,
    scene,
    body: { kind: 'click', expected: ids, frames, wrongHint: (step) => (step === 0 ? 'Start at the root.' : 'Pick the child whose key range contains ' + k + '.') },
    explain: `${path.length} nodes read. Each node holds several keys, so the tree is very short. For disks, fewer reads is everything.`,
  };
};

const countBKeys = (): Card => {
  const m = pick([3, 4, 10, 100]);
  const L = randInt(2, 3);
  return {
    concept: BTR,
    type: 'count',
    prompt: `A B-tree node can have up to ${m} children (so up to ${m - 1} keys). With ${L} levels (root + ${L - 1} below), what's the MOST keys it can hold?`,
    body: { kind: 'number', answer: m ** L - 1, unit: 'keys' },
    explain: `Level i has up to ${m}^i nodes of ${m - 1} keys each, so the total is ${m}^${L} − 1 = ${(m ** L - 1).toLocaleString()}. With 100-way nodes, 3 levels reach a million keys: 3 disk reads.`,
  };
};

const countBHeight = (): Card => {
  const keys = distinctInts(randInt(10, 20), 1, 99);
  const root = buildB(keys);
  return {
    concept: BTR,
    type: 'count',
    prompt: `Insert ${keys.length} keys into a B-tree with at most 3 keys per node (${keys.join(', ')}). How many levels below the root does it end up with?`,
    body: { kind: 'number', answer: bHeight(root), unit: 'levels' },
    explain: `Height ${bHeight(root)}. Each split of the root adds one level; all leaves stay at the same depth.`,
  };
};

const growthB = (): Card => growthCard(BTR, 'disk reads to search a B-tree with 100-way nodes', (n) => Math.round(Math.log(n) / Math.log(100)), 1, 'Each 100× more keys adds just one level: log base 100 of n.', [100, 10_000, 1_000_000, 100_000_000]);

const bExplain = explainGenerators({
  concept: BTR,
  truths: [
    'A B-tree node holds many sorted keys and has one more child than keys.',
    'Keys in a node split the key range into sections, one per child.',
    'All leaves are at the same depth.',
    'A full node splits, pushing its middle key up; the tree only grows taller when the root splits.',
    'Wide nodes make the tree very short, minimising slow disk reads.',
  ],
  myths: [
    { text: 'A B-tree is a binary tree.', why: 'Nodes can have many children: that’s the point.' },
    { text: 'B-trees grow taller at the leaves.', why: 'They grow at the root, when it splits.' },
    { text: 'Leaves can be at different depths.', why: 'Splits keep all leaves at exactly the same depth.' },
    { text: 'B-trees are only useful in memory.', why: 'They were designed for disks, where each node is one block read.' },
  ],
  chains: [
    {
      prompt: 'Why do databases use B-trees instead of binary search trees?',
      steps: ['Reading from disk is slow, and each read fetches a whole block.', 'A B-tree node fills a block with hundreds of keys.', 'So each read eliminates all but one of hundreds of branches.', 'Millions of keys need only 3–4 reads.'],
    },
  ],
  summary: {
    best: 'A B-tree is a very bushy search tree where each node is a whole page of sorted keys, so even millions of entries are only three or four page-turns away.',
    others: [
      { text: 'A B-tree is a balanced tree.', why: 'Balanced how, and why so wide?' },
      { text: 'B stands for binary.', why: 'It isn’t binary.' },
      { text: 'It’s a tree used by databases.', why: 'A use, not a mechanism.' },
    ],
  },
});

export const bTreeConcept: Concept = {
  id: BTR,
  title: 'B-tree',
  tier: 5,
  prereqs: [AVL],
  tagline: 'Wide nodes, very short tree. Built for disks.',
  hook: {
    problem: 'A database holds a billion rows on disk. A balanced binary tree is ~30 levels deep, and each level is a slow disk read (milliseconds).',
    question: 'How could a search need only 3–4 disk reads?',
    options: [
      { text: 'Put hundreds of sorted keys in each node, so each read chooses among hundreds of children.', good: true, feedback: 'Yes. A B-tree: height is log base ~500 of n. A billion keys ≈ 4 levels.' },
      { text: 'Cache the whole tree in memory.', feedback: 'A billion rows won’t fit.' },
      { text: 'Use a hash table on disk.', feedback: 'Fine for exact lookups, but no range queries or ordering.' },
    ],
  },
  lens: {
    layout: 'Nodes of up to m − 1 sorted keys and m child pointers, each sized to a disk block.',
    invariant: 'Keys sorted within nodes; child i holds keys between key i−1 and key i; every node (except root) at least half full; all leaves at the same depth.',
    payoff: 'Height O(log_m n): very few disk reads; ordered, supports range scans.',
    price: 'More complex splitting/merging; each node visit scans several keys.',
  },
  generators: {
    predict: [predictBChild, predictBSplit],
    simulate: [simulateBSearch],
    count: [countBKeys, countBHeight, growthB],
    explain: bExplain,
  },
};

// =====================================================================
// B+ tree
// =====================================================================

const BP = 'b-plus-tree';

interface PNode {
  id: string;
  keys: number[];
  kids: PNode[];
  leaf: boolean;
}

function buildBPlus(sortedKeys: number[]) {
  const leaves: PNode[] = [];
  let i = 0;
  let li = 0;
  while (i < sortedKeys.length) {
    const rem = sortedKeys.length - i;
    const size = rem <= 3 ? rem : rem === 4 ? 2 : pick([2, 3]);
    leaves.push({ id: `L${li++}`, keys: sortedKeys.slice(i, i + size), kids: [], leaf: true });
    i += size;
  }
  let level: PNode[] = leaves;
  let ni = 0;
  while (level.length > 1) {
    const next: PNode[] = [];
    let j = 0;
    while (j < level.length) {
      const rem = level.length - j;
      const size = rem <= 3 ? rem : rem === 4 ? 2 : pick([2, 3]);
      const kids = level.slice(j, j + size);
      const minKey = (n: PNode): number => (n.leaf ? n.keys[0] : minKey(n.kids[0]));
      next.push({ id: `I${ni++}`, keys: kids.slice(1).map(minKey), kids, leaf: false });
      j += size;
    }
    level = next;
  }
  return { root: level[0], leaves };
}
const pTree = (n: PNode): TreeNode => ({ id: n.id, label: n.keys.join(' | '), tone: n.leaf ? 'accent' : undefined, children: n.kids.map(pTree) });
const bpScene = (root: PNode, leaves: PNode[]): Scene => ({
  views: [
    { type: 'tree', root: pTree(root), title: 'B+ tree: internal nodes only guide; data lives in the leaves (blue)' },
    { type: 'row', key: 'l', items: leaves.map((l) => l.keys.join(' ')), labels: leaves.map((_, i) => (i < leaves.length - 1 ? `L${i} →` : `L${i}`)), title: 'The leaves, linked left to right' },
  ],
});
function bpLeafPath(root: PNode, k: number): PNode[] {
  const out = [root];
  let n = root;
  while (!n.leaf) {
    let i = n.keys.findIndex((x) => k < x);
    if (i === -1) i = n.keys.length;
    n = n.kids[i];
    out.push(n);
  }
  return out;
}

const predictWhereData = (): Card => {
  const keys = distinctInts(randInt(10, 14), 1, 99).sort((a, b) => a - b);
  const { root } = buildBPlus(keys);
  const sep = root.keys[0];
  return {
    concept: BP,
    type: 'predict',
    prompt: `In a B+ tree, the root holds the key ${sep}. You search for ${sep}. Where is its actual data (the row)?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: 'In a leaf. Internal keys are only signposts, copied from the leaves.', correct: true, why: 'B+ internal nodes hold routing copies; every record lives in a leaf.' },
        { text: 'In the root, since that’s where the key is.', correct: false, why: 'That’s a plain B-tree. B+ keeps data only in leaves.' },
        { text: 'In both the root and the leaf.', correct: false, why: 'Only the key is copied up, not the data.' },
        { text: 'In a separate hash table.', correct: false, why: 'The leaves hold the data.' },
      ]),
    },
    explain: 'Every search goes all the way to a leaf. Internal nodes hold only keys, so more of them fit per block: an even shorter tree.',
  };
};

const predictRangeLeaves = (): Card => {
  const keys = distinctInts(randInt(12, 16), 1, 99).sort((a, b) => a - b);
  const { root, leaves } = buildBPlus(keys);
  const a = pick(keys.slice(0, keys.length - 5));
  const b = keys[keys.indexOf(a) + randInt(3, 5)];
  const hit = leaves.filter((l) => l.keys.some((k) => k >= a && k <= b)).length;
  return {
    concept: BP,
    type: 'predict',
    prompt: `Range query: all keys from ${a} to ${b}. After descending once to the leaf containing ${a}, how many leaves do you read in total (following the leaf links)?`,
    scene: bpScene(root, leaves),
    body: {
      kind: 'choice',
      options: numberOptions(
        hit,
        [
          { value: leaves.length, why: 'You stop once you pass ' + b + '. No need to read every leaf.' },
          { value: 1, why: 'The range spills over into neighbouring leaves.' },
          { value: hit + 1, why: 'Count only leaves holding keys in the range.' },
        ],
        'Descend once, then walk right along the leaf chain.',
      ),
    },
    explain: `One descent to the leaf with ${a}, then follow "next leaf" links until passing ${b}: ${hit} leaves. No going back up the tree.`,
  };
};

const simulateRange = (): Card => {
  const keys = distinctInts(randInt(12, 16), 1, 99).sort((a, b) => a - b);
  const { root, leaves } = buildBPlus(keys);
  const a = pick(keys.slice(0, keys.length - 5));
  const b = keys[keys.indexOf(a) + randInt(3, 5)];
  const down = bpLeafPath(root, a);
  const startLeaf = leaves.indexOf(down[down.length - 1]);
  const more = leaves.slice(startLeaf + 1).filter((l) => l.keys[0] <= b);
  const expected = [...down.map((n) => t(n.id)), ...more.map((l) => `l:${leaves.indexOf(l)}`)];
  const scene = bpScene(root, leaves);
  const frames = [scene];
  expected.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: expected.slice(0, i + 1) }));
  return {
    concept: BP,
    type: 'simulate',
    prompt: `Find all keys from ${a} to ${b}. Click the nodes on the way down to the leaf holding ${a}, then click each further leaf in the leaf chain (bottom row) you need.`,
    scene,
    body: {
      kind: 'click',
      expected,
      frames,
      wrongHint: (step) => (step < down.length ? (step === 0 ? 'Start at the root.' : `Choose the child whose range contains ${a}.`) : `Follow the leaf chain to the right (bottom row), while keys are ≤ ${b}.`),
    },
    explain: `${down.length} nodes down, then ${more.length} more leaf${more.length === 1 ? '' : 'ves'} sideways. Range scans are why databases prefer B+ trees.`,
  };
};

const countBPLeaves = (): Card => {
  const keys = distinctInts(randInt(12, 16), 1, 99).sort((a, b) => a - b);
  const { root, leaves } = buildBPlus(keys);
  const k = pick(keys);
  return {
    concept: BP,
    type: 'count',
    prompt: `How many nodes does a search for ${k} read in this B+ tree (root to leaf, inclusive)?`,
    scene: bpScene(root, leaves),
    body: { kind: 'number', answer: bpLeafPath(root, k).length, unit: 'nodes' },
    explain: `Every B+ search reaches a leaf: ${bpLeafPath(root, k).length} nodes, always the full height, even if ${k} appears in an internal node.`,
  };
};

const bpExplain = explainGenerators({
  concept: BP,
  truths: [
    'In a B+ tree, all data lives in the leaves; internal nodes hold only routing keys.',
    'Leaves are linked left to right, so range scans walk sideways without going back up.',
    'Every search goes all the way down to a leaf.',
    'Internal nodes hold only keys, so more fit per block and the tree is even shorter.',
  ],
  myths: [
    { text: 'A search can stop at an internal node if the key is there.', why: 'Internal keys are copies; the data is in the leaf.' },
    { text: 'A range scan re-descends from the root for each key.', why: 'It descends once, then follows leaf links.' },
    { text: 'B+ trees store each record twice.', why: 'Only keys are copied into internal nodes, not records.' },
  ],
  chains: [
    {
      prompt: 'Why are B+ trees great for "find everything between a and b"?',
      steps: ['Descend once to the leaf containing a.', 'All keys are in the leaves, in sorted order.', 'Leaves are linked to their right neighbour.', 'So walk right until passing b: no more descents needed.'],
    },
  ],
  summary: {
    best: 'A B+ tree is a B-tree where the upper floors are just signposts and all the real stuff sits on the ground floor in one long, connected row, perfect for “give me everything from here to there”.',
    others: [
      { text: 'A B+ tree is a better B-tree.', why: 'Better for what, and how?' },
      { text: 'It’s a B-tree with more pointers.', why: 'Misses where data lives.' },
      { text: 'It’s a database index.', why: 'A use, not a mechanism.' },
    ],
  },
});

export const bPlusTreeConcept: Concept = {
  id: BP,
  title: 'B+ Tree',
  tier: 5,
  prereqs: [BTR],
  tagline: 'Signposts on top, all data in linked leaves.',
  hook: {
    problem: 'A B-tree scatters records through every level. "All orders from March 1 to March 31" means hopping up and down the tree to visit them in order.',
    question: 'How could range queries become a straight walk?',
    options: [
      { text: 'Keep all records in the leaves, link the leaves left to right, and use internal nodes only as signposts.', good: true, feedback: 'Yes. Descend once, then stroll along the leaves. That’s a B+ tree, the structure behind most database indexes.' },
      { text: 'Sort the records into a separate array.', feedback: 'Then inserts shift the array.' },
      { text: 'Add parent pointers to the B-tree.', feedback: 'Still up-and-down hopping between levels.' },
    ],
  },
  lens: {
    layout: 'Internal nodes of routing keys + child pointers; leaves hold keys + records and a pointer to the next leaf.',
    invariant: 'All records are in leaves at the same depth; leaves are linked in key order; internal keys route correctly.',
    payoff: 'Very short trees (internal nodes pack more keys) and fast range scans via the leaf chain.',
    price: 'Every lookup goes to a leaf; separator keys are duplicated in internal nodes.',
  },
  generators: {
    predict: [predictWhereData, predictRangeLeaves],
    simulate: [simulateRange],
    count: [countBPLeaves],
    explain: bpExplain,
  },
};


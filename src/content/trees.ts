import type { Card, Concept, Scene, TreeNode, View } from '../engine/types';
import { cloneScene, fmtArray } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions, options, sequenceRebuild } from './helpers';
import type { BNode } from './treeUtil';
import {
  bstInsert,
  bstPath,
  buildBST,
  buildHeap,
  depthOf,
  heapPop,
  heapPush,
  heapTree,
  height,
  inorder,
  leaves,
  levelorder,
  parentIdx,
  postorder,
  preorder,
  randomBST,
  toTree,
} from './treeUtil';

const t = (id: string | number) => `t:${id}`;

// =====================================================================
// Tree basics
// =====================================================================

const TR = 'tree';

interface GNode {
  id: string;
  children: GNode[];
}

function randomTree(n: number): GNode {
  const letters = 'ABCDEFGHIJKLMN'.split('');
  const root: GNode = { id: letters[0], children: [] };
  const all: { node: GNode; depth: number }[] = [{ node: root, depth: 0 }];
  for (let i = 1; i < n; i++) {
    const hosts = all.filter((x) => x.node.children.length < 3 && x.depth < 3);
    const host = pick(hosts);
    const node: GNode = { id: letters[i], children: [] };
    host.node.children.push(node);
    all.push({ node, depth: host.depth + 1 });
  }
  return root;
}

const gToTree = (g: GNode): TreeNode => ({ id: g.id, label: g.id, children: g.children.map(gToTree) });
const gHeight = (g: GNode): number => (g.children.length ? 1 + Math.max(...g.children.map(gHeight)) : 0);
const gLeaves = (g: GNode): string[] => (g.children.length ? g.children.flatMap(gLeaves) : [g.id]);
const gAll = (g: GNode): GNode[] => [g, ...g.children.flatMap(gAll)];
function gPath(g: GNode, id: string): string[] | null {
  if (g.id === id) return [id];
  for (const c of g.children) {
    const p = gPath(c, id);
    if (p) return [g.id, ...p];
  }
  return null;
}
const treeScene = (g: GNode): Scene => ({ views: [{ type: 'tree', root: gToTree(g) }] });

const predictTreeFacts = (): Card => {
  let g: GNode;
  do g = randomTree(randInt(7, 10));
  while (gHeight(g) < 2);
  const q = pick(['height', 'leaves'] as const);
  const h = gHeight(g);
  const lv = gLeaves(g).length;
  return {
    concept: TR,
    type: 'predict',
    prompt: q === 'height' ? 'What is the HEIGHT of this tree (edges on the longest root-to-leaf path)?' : 'How many LEAVES (nodes with no children) does this tree have?',
    scene: treeScene(g),
    body: {
      kind: 'choice',
      options:
        q === 'height'
          ? numberOptions(h, [
              { value: h + 1, why: 'That counts nodes on the path. Height counts edges.' },
              { value: gAll(g).length, why: 'That’s the number of nodes.' },
              { value: h - 1, why: 'Find the deepest leaf.' },
            ], 'Longest root-to-leaf path, in edges.')
          : numberOptions(lv, [
              { value: gAll(g).length - lv, why: 'That’s the internal (non-leaf) nodes.' },
              { value: lv + 1, why: 'The root isn’t a leaf unless it has no children.' },
              { value: g.children.length, why: 'That’s the root’s children.' },
            ], 'Leaves have no children.'),
    },
    explain: q === 'height' ? `Height ${h}. The deepest leaf is ${h} edges below the root.` : `Leaves: ${gLeaves(g).join(', ')}.`,
  };
};

const predictParent = (): Card => {
  const g = randomTree(randInt(7, 9));
  const nodes = gAll(g).slice(1);
  const x = pick(nodes);
  const path = gPath(g, x.id)!;
  const parent = path[path.length - 2];
  return {
    concept: TR,
    type: 'predict',
    prompt: `Who is the parent of ${x.id}? And how deep is ${x.id} (edges from the root)?`,
    scene: treeScene(g),
    body: {
      kind: 'choice',
      options: options({ text: `parent ${parent}, depth ${path.length - 1}`, why: 'One edge up is the parent; depth counts edges from the root.' }, [
        { text: `parent ${parent}, depth ${path.length}`, why: 'Depth counts edges, not nodes on the path.' },
        { text: `parent ${g.id}, depth ${path.length - 1}`, why: 'The root is an ancestor, but the parent is the node directly above.' },
        { text: `parent ${x.children[0]?.id ?? 'none'}, depth ${path.length - 1}`, why: 'That’s a child (below), not the parent.' },
      ]),
    },
    explain: `Path from root: ${path.join(' → ')}. Every node except the root has exactly one parent.`,
  };
};

const simulateLeaves = (): Card => {
  const g = randomTree(randInt(7, 10));
  const lv = gLeaves(g);
  const scene = treeScene(g);
  const frames = [scene];
  lv.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: lv.slice(0, i + 1).map(t) }));
  return {
    concept: TR,
    type: 'simulate',
    prompt: 'Click every leaf, from left to right.',
    scene,
    body: { kind: 'click', expected: lv.map(t), frames, wrongHint: (_s, id) => (gAll(g).find((n) => t(n.id) === id)?.children.length ? 'That node has children, so it isn’t a leaf.' : 'Go left to right.') },
    explain: `Leaves: ${lv.join(', ')}. In a file system, these are the files; the internal nodes are folders.`,
  };
};

const simulatePath = (): Card => {
  const g = randomTree(randInt(8, 10));
  const deep = gAll(g).filter((n) => (gPath(g, n.id)?.length ?? 0) >= 3);
  const x = pick(deep.length ? deep : gAll(g).slice(1));
  const path = gPath(g, x.id)!;
  const scene = treeScene(g);
  const frames = [scene];
  path.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: path.slice(0, i + 1).map(t) }));
  return {
    concept: TR,
    type: 'simulate',
    prompt: `Starting at the root, click each node on the way down to ${x.id}.`,
    scene,
    body: { kind: 'click', expected: path.map(t), frames, wrongHint: (step) => (step === 0 ? 'Start at the root (top).' : `Which child of ${path[step - 1]} leads to ${x.id}?`) },
    explain: `${path.join(' → ')}. There is exactly one path from the root to any node.`,
  };
};

const countEdges = (): Card => {
  const n = randInt(5, 500);
  return {
    concept: TR,
    type: 'count',
    prompt: `A tree has ${n} nodes. How many edges (parent–child links) does it have?`,
    body: { kind: 'number', answer: n - 1, unit: 'edges' },
    explain: `Every node except the root has exactly one parent link: ${n} − 1 = ${n - 1}.`,
  };
};

const countDepth = (): Card => {
  const g = randomTree(randInt(8, 10));
  const x = pick(gAll(g));
  return {
    concept: TR,
    type: 'count',
    prompt: `What is the depth of ${x.id} (edges from the root)?`,
    scene: treeScene(g),
    body: { kind: 'number', answer: gPath(g, x.id)!.length - 1, unit: 'edges' },
    explain: `${gPath(g, x.id)!.join(' → ')}.`,
  };
};

const growthTree = (): Card => growthCard(TR, 'find a value in a tree with no ordering rule', (n) => n, 2, 'Without a rule, any node could hold it: visit them all.');

const trExplain = explainGenerators({
  concept: TR,
  truths: [
    'A tree is nodes linked parent → children, starting from one root.',
    'Every node except the root has exactly one parent.',
    'There is exactly one path from the root to each node.',
    'A tree with n nodes has n − 1 edges.',
    'Leaves are nodes with no children.',
  ],
  myths: [
    { text: 'A node can have two parents in a tree.', why: 'Then it would be a graph, not a tree.' },
    { text: 'Height counts nodes on the longest path.', why: 'Height counts edges.' },
    { text: 'Trees are stored in memory as a tree shape.', why: 'Nodes are scattered; child pointers make the shape.' },
    { text: 'Every tree is sorted.', why: 'Only special trees (like BSTs) have an ordering rule.' },
  ],
  chains: [
    {
      prompt: 'Why does a tree with n nodes have n − 1 edges?',
      steps: ['Every edge connects a child to its parent.', 'Every node except the root has exactly one parent.', 'So there is one edge per non-root node.', 'That’s n − 1 edges.'],
    },
  ],
  summary: {
    best: 'A tree is a family tree upside down: one ancestor at the top, and every other person hangs from exactly one parent.',
    others: [
      { text: 'A tree is a hierarchical data structure.', why: 'Jargon; no mechanism.' },
      { text: 'A tree is a graph.', why: 'True but unhelpful: which graphs?' },
      { text: 'A tree is a list that branches.', why: 'Close, but misses the one-parent rule.' },
    ],
  },
});

export const treeConcept: Concept = {
  id: TR,
  title: 'Tree Basics',
  tier: 5,
  prereqs: ['linked-list'],
  tagline: 'One root, and every node hangs from one parent.',
  hook: {
    problem: 'Folders contain files and other folders, which contain more. A linked list can only say "next", but a folder has many children.',
    question: 'How do you represent “contains many”?',
    options: [
      { text: 'Let each node hold pointers to all of its children.', good: true, feedback: 'Yes. A linked list with many "next" pointers per node is a tree.' },
      { text: 'One flat list of all files and folders.', feedback: 'Loses who-contains-what.' },
      { text: 'Give each file the full path as a string.', feedback: 'Works for lookup, but moving a folder means rewriting every path inside it.' },
    ],
  },
  lens: {
    layout: 'Nodes scattered in memory, each with a value and pointers to its children. A root pointer.',
    invariant: 'Every node except the root has exactly one parent; no cycles.',
    payoff: 'Represents hierarchy naturally; exactly one path from the root to any node.',
    price: 'Without an ordering rule, finding a value means visiting every node: O(n).',
  },
  generators: {
    predict: [predictTreeFacts, predictParent],
    simulate: [simulateLeaves, simulatePath],
    count: [countEdges, countDepth, growthTree],
    explain: trExplain,
  },
};

// =====================================================================
// Binary tree + traversals
// =====================================================================

const BT = 'binary-tree';

type Trav = 'preorder' | 'inorder' | 'postorder' | 'level order';
const TRAV: Record<Trav, { fn: (n: BNode) => number[]; rule: string }> = {
  preorder: { fn: preorder, rule: 'node, then left subtree, then right subtree' },
  inorder: { fn: inorder, rule: 'left subtree, then node, then right subtree' },
  postorder: { fn: postorder, rule: 'left subtree, then right subtree, then node' },
  'level order': { fn: levelorder, rule: 'row by row, top to bottom, left to right' },
};

/** Binary tree with arbitrary labels, so inorder isn't "just sorted". */
function randomBinary(n: number): { root: BNode; tree: TreeNode } {
  const keys = distinctInts(n, 1, 60);
  const root = randomBST(keys);
  // Relabel with shuffled values so traversals aren't trivially sorted.
  const mixed = shuffle(keys);
  const labelsFor = new Map(inorder(root).map((k, i) => [k, mixed[i]]));
  const relabel = (b: BNode | null): BNode | null => (b ? { key: labelsFor.get(b.key)!, left: relabel(b.left), right: relabel(b.right) } : null);
  const r = relabel(root)!;
  return { root: r, tree: toTree(r)! };
}

const predictTraversal = (): Card => {
  const { root, tree } = randomBinary(randInt(6, 7));
  const kind = pick<Trav>(['preorder', 'inorder', 'postorder', 'level order']);
  const seq = (k: Trav) => TRAV[k].fn(root).join(', ');
  return {
    concept: BT,
    type: 'predict',
    prompt: `What is the ${kind} traversal of this tree? (${TRAV[kind].rule})`,
    scene: { views: [{ type: 'tree', root: tree, binary: true }] },
    body: {
      kind: 'choice',
      options: options(
        { text: seq(kind), why: TRAV[kind].rule },
        (Object.keys(TRAV) as Trav[]).filter((k) => k !== kind).map((k) => ({ text: seq(k), why: `That’s ${k}: ${TRAV[k].rule}.` })),
      ),
    },
    explain: `${kind}: ${seq(kind)}. The three depth-first orders differ only in *when* you visit the node relative to its subtrees.`,
  };
};

const simulateTraversal = (): Card => {
  const { root, tree } = randomBinary(randInt(6, 7));
  const kind = pick<Trav>(['preorder', 'inorder', 'postorder', 'level order']);
  const seq = TRAV[kind].fn(root);
  const scene: Scene = { views: [{ type: 'tree', root: tree, binary: true }] };
  const frames = [scene];
  seq.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: seq.slice(0, i + 1).map(t) }));
  return {
    concept: BT,
    type: 'simulate',
    prompt: `Visit the nodes in ${kind.toUpperCase()} (${TRAV[kind].rule}). Click them in order.`,
    scene,
    body: { kind: 'click', expected: seq.map(t), frames, wrongHint: () => `Rule: ${TRAV[kind].rule}. Apply it recursively at every subtree.` },
    explain: `${kind}: ${seq.join(', ')}.`,
  };
};

const countBinary = (): Card => {
  const h = randInt(2, 9);
  const variant = pick(['max', 'level', 'minHeight'] as const);
  if (variant === 'max')
    return {
      concept: BT,
      type: 'count',
      prompt: `What's the most nodes a binary tree of height ${h} can have?`,
      body: { kind: 'number', answer: 2 ** (h + 1) - 1, unit: 'nodes' },
      explain: `Levels 0..${h} hold 1 + 2 + 4 + … + 2^${h} = 2^${h + 1} − 1 = ${2 ** (h + 1) - 1}.`,
    };
  if (variant === 'level')
    return {
      concept: BT,
      type: 'count',
      prompt: `At most how many nodes can sit at depth ${h} of a binary tree?`,
      body: { kind: 'number', answer: 2 ** h, unit: 'nodes' },
      explain: `Each level can double the one above: 2^${h} = ${2 ** h}.`,
    };
  const n = randInt(10, 5000);
  return {
    concept: BT,
    type: 'count',
    prompt: `${n} nodes in a binary tree. What's the smallest possible height?`,
    body: { kind: 'number', answer: Math.floor(Math.log2(n)), unit: 'edges' },
    explain: `A full tree of height h holds up to 2^(h+1) − 1 nodes. The smallest h with 2^(h+1) − 1 ≥ ${n} is ${Math.floor(Math.log2(n))}. Height can be as small as log₂ n, or as big as n − 1 (a stick).`,
  };
};

const growthBT = (): Card => growthCard(BT, 'minimum height of a binary tree with n nodes', (n) => Math.floor(Math.log2(n)), 1, 'Each level doubles capacity, so height grows like log₂ n.');

const btExplain = explainGenerators({
  concept: BT,
  truths: [
    'Each node has at most two children: left and right.',
    'Depth-first traversals (pre/in/post-order) differ only in when the node is visited relative to its subtrees.',
    'Level-order traversal uses a queue to go row by row.',
    'A binary tree of height h holds at most 2^(h+1) − 1 nodes.',
    'With n nodes, height is at least about log₂ n and at most n − 1.',
  ],
  myths: [
    { text: 'Inorder traversal always gives sorted output.', why: 'Only for binary *search* trees.' },
    { text: 'A binary tree with n nodes always has height log₂ n.', why: 'It can be a stick of height n − 1.' },
    { text: 'Preorder visits leaves first.', why: 'Preorder visits the node before its subtrees: root first.' },
  ],
  chains: [
    {
      prompt: 'Why can a binary tree be as short as log₂ n?',
      steps: ['Each node can have two children.', 'So each level can hold twice as many nodes as the one above.', 'After h levels there’s room for about 2^h nodes.', 'Fitting n nodes needs only about log₂ n levels.'],
    },
  ],
  summary: {
    best: 'Every node has up to two children, so each level can double, which is why a well-shaped binary tree is very short even with lots of nodes.',
    others: [
      { text: 'A binary tree stores binary numbers.', why: '“Binary” means two children.' },
      { text: 'A binary tree is sorted.', why: 'That’s a BST.' },
      { text: 'A tree with two branches.', why: 'Each *node* has up to two, not the whole tree.' },
    ],
  },
});

export const binaryTreeConcept: Concept = {
  id: BT,
  title: 'Binary Tree',
  tier: 5,
  prereqs: [TR, 'queue'],
  tagline: 'At most two children. Levels double.',
  hook: {
    problem: 'A general tree node can have any number of children, so each node needs a list of child pointers.',
    question: 'What if every node had at most two children?',
    options: [
      { text: 'Each node gets exactly two fixed pointer fields: left and right.', good: true, feedback: 'Yes. Fixed-size nodes, simple code, and each level can double: short trees.' },
      { text: 'It would be too limited to be useful.', feedback: 'Surprisingly not: search trees, heaps and expression trees all use it.' },
      { text: 'It would be the same as a linked list.', feedback: 'Only if every node uses just one child. Two children let levels double.' },
    ],
  },
  lens: {
    layout: 'Nodes [value, left, right] scattered in memory; a root pointer.',
    invariant: 'Each node has at most two children, distinguished as left and right.',
    payoff: 'Simple fixed-size nodes; height can be as small as ~log₂ n; four standard traversal orders.',
    price: 'Nothing guarantees a good shape: a binary tree can be a stick of height n − 1.',
  },
  generators: {
    predict: [predictTraversal],
    simulate: [simulateTraversal],
    count: [countBinary, growthBT],
    explain: btExplain,
  },
};

// =====================================================================
// Binary search tree
// =====================================================================

const BST = 'bst';
const bstScene = (root: BNode | null): Scene => ({ views: [{ type: 'tree', root: toTree(root), binary: true }] });

function bstWithKey() {
  const keys = distinctInts(randInt(7, 9), 1, 99);
  const root = randomBST(keys);
  let k = randInt(1, 99);
  while (keys.includes(k)) k = randInt(1, 99);
  return { keys, root, k };
}

const predictInsertPos = (): Card => {
  const { root, k } = bstWithKey();
  const path = bstPath(root, k);
  const parent = path[path.length - 1];
  const side = k < parent ? 'left' : 'right';
  const otherLeaves = leaves(root).filter((x) => x !== parent);
  return {
    concept: BST,
    type: 'predict',
    prompt: `Insert ${k} into this BST. Where does it go?`,
    scene: bstScene(root),
    body: {
      kind: 'choice',
      options: options({ text: `${side} child of ${parent}`, why: `Path: ${path.join(' → ')}, then ${side}.` }, [
        { text: `${side === 'left' ? 'right' : 'left'} child of ${parent}`, why: `${k} ${k < parent ? '<' : '>'} ${parent}, so it goes ${side}.` },
        ...otherLeaves.slice(0, 2).map((l) => ({ text: `${k < l ? 'left' : 'right'} child of ${l}`, why: 'Follow the comparisons from the root. That path doesn’t lead there.' })),
        { text: 'It becomes the new root', why: 'New keys always go at the bottom, where the search falls off.' },
      ]),
    },
    explain: `Compare at each node: smaller → left, bigger → right. The search for ${k} falls off at ${parent}'s ${side}, and that's exactly where it's inserted.`,
  };
};

const predictStick = (): Card => {
  const n = randInt(5, 12);
  const asc = pick([true, false]);
  return {
    concept: BST,
    type: 'predict',
    prompt: `Insert the keys ${asc ? `1, 2, 3, …, ${n}` : `${n}, ${n - 1}, …, 1`} into an empty BST, in that order. What's the tree's height?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        n - 1,
        [
          { value: Math.floor(Math.log2(n)), why: 'That’s the best possible height. Sorted input gives the worst.' },
          { value: n, why: 'Height counts edges: n nodes in a line have n − 1 edges.' },
          { value: Math.ceil(n / 2), why: 'Every new key goes to the same side of the previous one.' },
        ],
        'Each key goes to the same side of the previous one: a stick.',
      ),
    },
    explain: `Each key is bigger (or smaller) than all before it, so it hangs off the same side: a linked list of height ${n - 1}. Search becomes O(n). This is why balanced trees exist.`,
  };
};

const predictInorder = (): Card => {
  const { root } = bstWithKey();
  return {
    concept: BST,
    type: 'predict',
    prompt: 'What does an inorder traversal (left, node, right) of this BST produce?',
    scene: bstScene(root),
    body: {
      kind: 'choice',
      options: options({ text: inorder(root).join(', '), why: 'Everything left is smaller, everything right is bigger, so inorder is sorted.' }, [
        { text: preorder(root).join(', '), why: 'That’s preorder.' },
        { text: levelorder(root).join(', '), why: 'That’s level order.' },
        { text: [...inorder(root)].reverse().join(', '), why: 'Reversed: that’s right, node, left.' },
      ]),
    },
    explain: 'The BST rule guarantees inorder = sorted. A BST is a sorted list that can also be searched by halving.',
  };
};

const simulateBSTSearch = (): Card => {
  const keys = distinctInts(randInt(8, 10), 1, 99);
  const root = randomBST(keys);
  const deep = keys.filter((k) => depthOf(root, k) >= 2);
  const k = pick(deep.length ? deep : keys);
  const path = bstPath(root, k);
  const scene = bstScene(root);
  const frames = [scene];
  path.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: path.slice(0, i + 1).map(t) }));
  return {
    concept: BST,
    type: 'simulate',
    prompt: `Search for ${k}. Click each node you compare against, starting at the root.`,
    scene,
    body: {
      kind: 'click',
      expected: path.map(t),
      frames,
      wrongHint: (step) => (step === 0 ? 'Start at the root.' : `${k} ${k < path[step - 1] ? '<' : '>'} ${path[step - 1]}, so go ${k < path[step - 1] ? 'left' : 'right'}.`),
    },
    explain: `${path.join(' → ')}: ${path.length} comparisons. Each comparison throws away a whole subtree.`,
  };
};

const simulateBSTInsert = (): Card => {
  const { root, k } = bstWithKey();
  const path = bstPath(root, k);
  const scene = bstScene(root);
  const frames = [scene];
  path.forEach((_, i) => {
    const r = i === path.length - 1 ? bstInsert(buildBST(preorder(root))!, k) : root;
    frames.push({ ...bstScene(r), highlight: [...path.slice(0, i + 1).map(t), ...(i === path.length - 1 ? [t(k)] : [])] });
  });
  return {
    concept: BST,
    type: 'simulate',
    prompt: `Insert ${k}. Click each node you compare against on the way down. The new node appears where the path falls off.`,
    scene,
    body: {
      kind: 'click',
      expected: path.map(t),
      frames,
      wrongHint: (step) => (step === 0 ? 'Start at the root.' : `${k} ${k < path[step - 1] ? '<' : '>'} ${path[step - 1]}: go ${k < path[step - 1] ? 'left' : 'right'}.`),
    },
    explain: `Insert = search until you fall off, then attach there. Cost = the depth of the tree.`,
  };
};

const countBSTCompares = (): Card => {
  const keys = distinctInts(randInt(8, 10), 1, 99);
  const root = randomBST(keys);
  const k = pick(keys);
  return {
    concept: BST,
    type: 'count',
    prompt: `How many comparisons does searching for ${k} take in this BST?`,
    scene: bstScene(root),
    body: { kind: 'number', answer: depthOf(root, k) + 1, unit: 'comparisons' },
    explain: `${bstPath(root, k).join(' → ')}: depth ${depthOf(root, k)}, so ${depthOf(root, k) + 1} comparisons.`,
  };
};

const countBSTHeight = (): Card => {
  const keys = distinctInts(randInt(5, 7), 1, 99);
  const order = shuffle(keys);
  const root = buildBST(order);
  return {
    concept: BST,
    type: 'count',
    prompt: `Insert ${order.join(', ')} into an empty BST, in that order. What's the height (edges on the longest root-to-leaf path)?`,
    body: { kind: 'number', answer: height(root), unit: 'edges' },
    explain: `The first key is the root; each later key slides down to where it falls off. The resulting height is ${height(root)}. Insertion order decides the shape.`,
  };
};

const growthBST = (): Card =>
  pick([
    () => growthCard(BST, 'search in a well-balanced BST of n keys', (n) => Math.floor(Math.log2(n)) + 1, 1, 'Each comparison halves what’s left.'),
    () => growthCard(BST, 'search in a BST built from sorted input', (n) => n, 2, 'The tree is a stick; search walks it all.'),
  ])();

const bstExplain = explainGenerators({
  concept: BST,
  truths: [
    'Every key in a node’s left subtree is smaller; every key in its right subtree is bigger.',
    'Searching compares at each node and goes left or right, discarding a subtree each time.',
    'Search, insert and delete cost the tree’s height.',
    'Inorder traversal of a BST gives the keys in sorted order.',
    'Inserting keys in sorted order makes the tree a stick of height n − 1.',
  ],
  myths: [
    { text: 'BST operations are always O(log n).', why: 'Only if the tree stays balanced. A stick makes them O(n).' },
    { text: 'Only a node’s direct children need to be smaller/bigger.', why: 'The rule covers the entire subtree, not just children.' },
    { text: 'New keys can be inserted anywhere that keeps the tree compact.', why: 'They go exactly where the search falls off.' },
    { text: 'A BST is kept sorted by moving nodes around on each insert.', why: 'Plain BSTs never move nodes; the rule plus placement keeps order.' },
  ],
  chains: [
    {
      prompt: 'Why can a BST find a key without looking at every node?',
      steps: ['Everything left of a node is smaller, everything right is bigger.', 'One comparison tells you which side the key must be on.', 'The other side is skipped entirely.', 'So the search only walks one path: cost = height.'],
    },
    {
      prompt: 'Why does sorted input ruin a BST?',
      steps: ['Each new key is bigger than all previous keys.', 'So it always goes right, below the previous key.', 'The tree becomes one long chain.', 'Height n − 1 means O(n) searches.'],
    },
  ],
  summary: {
    best: 'A BST is a guessing game: at each node you learn “smaller” or “bigger” and throw away half the tree, as long as the tree stays bushy.',
    others: [
      { text: 'A BST is a binary tree that is sorted.', why: 'Sorted how? Misses the left/right rule and the height cost.' },
      { text: 'BSTs have O(log n) search.', why: 'Only when balanced.' },
      { text: 'It’s a tree for searching.', why: 'Vague.' },
    ],
  },
});

const rebuildBST = (): Card => {
  const order = distinctInts(randInt(5, 7), 1, 99);
  const root = buildBST(order);
  const lv = levelorder(root);
  return sequenceRebuild(BST, `Insert ${order.join(', ')} into an empty BST. Without drawing it here, write the finished tree in LEVEL ORDER (row by row, left to right).`, lv, distinctInts(2, 1, 99).filter((x) => !order.includes(x)), `Level order: ${lv.join(', ')}. The first key is the root; each later key slides down to where its search falls off.`, 'Your tree, level by level');
};

/** A valid BST with one LEAF given a key that breaks the ordering rule relative to an ancestor. */
const breakBST = (): Card => {
  for (;;) {
    const keys = distinctInts(randInt(7, 9), 5, 95);
    const root = randomBST(keys);
    const lf = leaves(root).filter((k) => depthOf(root, k) >= 2);
    if (!lf.length) continue;
    const x = pick(lf);
    const path = bstPath(root, x);
    // Allowed range for x from its ancestors.
    let lo = -Infinity;
    let hi = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      if (x < path[i]) hi = Math.min(hi, path[i]);
      else lo = Math.max(lo, path[i]);
    }
    // Pick a bad value just outside the range, but still on the correct side of its direct parent.
    const parent = path[path.length - 2];
    const cands: number[] = [];
    for (let v = 1; v < 100; v++) {
      if (keys.includes(v)) continue;
      const sideOk = x < parent ? v < parent : v > parent;
      if (sideOk && (v <= lo || v >= hi)) cands.push(v);
    }
    if (!cands.length) continue;
    const bad = pick(cands);
    const relabel = (b: BNode | null): BNode | null => (b ? { key: b.key === x ? bad : b.key, left: relabel(b.left), right: relabel(b.right) } : null);
    const broken = relabel(root);
    const scene: Scene = { views: [{ type: 'tree', root: toTree(broken), binary: true, title: 'A “BST” with one bad node' }] };
    const culprit = path.slice(0, -1).find((a) => (x < a ? bad > a : bad < a))!;
    return {
      concept: BST,
      type: 'break',
      prompt: 'Someone broke this BST: one node is on the wrong side of an ANCESTOR (its parent looks fine). Click the node that breaks the rule.',
      scene,
      body: {
        kind: 'click',
        expected: [t(bad)],
        frames: [scene, { ...cloneScene(scene), highlight: [t(bad), t(culprit)] }],
        wrongHint: () => 'Check each node against EVERY ancestor, not just its parent: left subtree keys must be smaller, right subtree keys bigger.',
      },
      explain: `${bad} sits in the ${x < culprit ? 'left' : 'right'} subtree of ${culprit}, but is ${x < culprit ? 'bigger' : 'smaller'}. A search for ${bad} would turn the other way at ${culprit} and never find it. The rule covers whole subtrees, not just parent and child.`,
    };
  }
};

function sceneToBST(s: Scene): BNode | null {
  const tv = s.views[0] as Extract<View, { type: 'tree' }>;
  const conv = (n: TreeNode | null): BNode | null => (n ? { key: Number(n.id), left: conv(n.children[0] ?? null), right: conv(n.children[1] ?? null) } : null);
  return conv(tv.root);
}

function bstDelete(root: BNode | null, k: number): BNode | null {
  if (!root) return null;
  if (k < root.key) return (root.left = bstDelete(root.left, k)), root;
  if (k > root.key) return (root.right = bstDelete(root.right, k)), root;
  if (!root.left) return root.right;
  if (!root.right) return root.left;
  let s = root.right;
  while (s.left) s = s.left;
  root.key = s.key;
  root.right = bstDelete(root.right, s.key);
  return root;
}

const bstOps: Concept['playground'] = {
  initial: () => bstScene(buildBST([50, 30, 70, 20, 40, 60, 80])),
  guide: [
    { do: 'Search 60.', see: 'At 50: 60 is bigger, go right. At 70: smaller, go left. Found. Each step throws away half of what’s left.' },
    { do: 'Insert 65.', see: 'It follows the same path a search would, and is attached where the path runs out.' },
    { do: 'Insert 90, 95, 99 (one at a time).', see: 'Each is bigger than everything, so they form a long chain down the right. Order of inserting decides the shape; a long chain makes searches slow.' },
  ],
  ops: [
    {
      label: 'Insert',
      inputs: ['key'],
      run: (s, [k]) => {
        const r = sceneToBST(s);
        const path = bstPath(r, k);
        if (path[path.length - 1] === k) return { error: `${k} is already in the tree.` };
        const nr = bstInsert(r, k);
        return { scene: { ...bstScene(nr), highlight: [...path.map(t), t(k)] }, touches: path.length, note: `${path.length} comparisons (${path.join(' → ')}), then attached. Height is now ${height(nr)}.` };
      },
    },
    {
      label: 'Search',
      inputs: ['key'],
      run: (s, [k]) => {
        const r = sceneToBST(s);
        const path = bstPath(r, k);
        const found = path[path.length - 1] === k;
        return { scene: { ...bstScene(r), highlight: path.map(t) }, touches: path.length, note: `${found ? 'Found' : 'Not found'} after ${path.length} comparisons.` };
      },
    },
    {
      label: 'Delete',
      inputs: ['key'],
      run: (s, [k]) => {
        const r = sceneToBST(s);
        const path = bstPath(r, k);
        if (path[path.length - 1] !== k) return { error: `${k} isn't in the tree.` };
        const nr = bstDelete(r, k);
        return { scene: bstScene(nr), touches: path.length + 1, note: `Removed ${k}. A node with two children is replaced by its successor (the smallest key in its right subtree).` };
      },
    },
  ],
};

export const bstConcept: Concept = {
  id: BST,
  title: 'Binary Search Tree',
  tier: 5,
  prereqs: [BT],
  tagline: 'Smaller left, bigger right. Every step halves the search.',
  hook: {
    problem: 'A sorted array can be binary-searched in O(log n), but inserting keeps shifting elements. A linked list inserts cheaply but can’t be binary-searched.',
    question: 'How do you get fast search AND cheap inserts?',
    options: [
      { text: 'A binary tree where everything left of a node is smaller and everything right is bigger.', good: true, feedback: 'Yes. Each comparison discards a subtree like binary search, and inserting is just attaching a leaf.' },
      { text: 'A sorted linked list with a pointer to the middle.', feedback: 'One middle pointer isn’t enough; you need a middle for every half, and that’s a tree.' },
      { text: 'A hash table.', feedback: 'Fast search, but no order: no "next biggest", no sorted listing.' },
    ],
  },
  lens: {
    layout: 'Binary tree nodes [key, left, right] scattered in memory.',
    invariant: 'For every node: all keys in the left subtree < key < all keys in the right subtree.',
    payoff: 'Search/insert/delete in O(height); sorted order for free (inorder); min/max/next-larger queries.',
    price: 'Height depends on insertion order: sorted input makes a stick with O(n) operations.',
  },
  playground: bstOps,
  generators: {
    predict: [predictInsertPos, predictStick, predictInorder],
    simulate: [simulateBSTSearch, simulateBSTInsert],
    count: [countBSTCompares, countBSTHeight, growthBST],
    explain: bstExplain,
    rebuild: [rebuildBST],
    break: [breakBST],
  },
};

// =====================================================================
// Binary heap
// =====================================================================

const HP = 'binary-heap';

const heapScene = (a: number[], d = 2, highlight?: string[]): Scene => ({
  views: [
    { type: 'tree', root: heapTree(a, d), binary: d === 2, title: 'The tree you picture' },
    { type: 'row', key: 'a', items: a, title: 'What’s actually stored: an array' },
  ],
  highlight,
});

const predictHeapIdx = (): Card => {
  const i = randInt(1, 30);
  const q = pick(['children', 'parent'] as const);
  if (q === 'children')
    return {
      concept: HP,
      type: 'predict',
      prompt: `A binary heap is stored in an array. What are the indexes of the children of index ${i}?`,
      body: {
        kind: 'choice',
        options: options({ text: `${2 * i + 1} and ${2 * i + 2}`, why: '2i + 1 and 2i + 2.' }, [
          { text: `${2 * i} and ${2 * i + 1}`, why: 'That’s the formula for arrays that start at index 1.' },
          { text: `${i + 1} and ${i + 2}`, why: 'Neighbours in the array aren’t children.' },
          { text: `${2 * i + 2} and ${2 * i + 3}`, why: 'Off by one.' },
        ]),
      },
      explain: `Level by level, each node has 2 children, so node ${i}'s children are at 2×${i}+1 = ${2 * i + 1} and ${2 * i + 2}. No pointers needed: the shape is arithmetic.`,
    };
  return {
    concept: HP,
    type: 'predict',
    prompt: `In an array-stored binary heap, what's the index of the parent of index ${i}?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        parentIdx(i),
        [
          { value: Math.floor(i / 2), why: 'That’s the 1-indexed formula. Here indexes start at 0: (i − 1) ÷ 2.' },
          { value: i - 1, why: 'That’s the previous array slot, not the parent.' },
          { value: parentIdx(i) + 1, why: 'Off by one.' },
        ],
        '(i − 1) ÷ 2, rounded down',
      ),
    },
    explain: `(${i} − 1) ÷ 2 = ${parentIdx(i)}. Parent and child are found by arithmetic, like array indexing.`,
  };
};

const predictHeapInsert = (): Card => {
  const a = buildHeap(distinctInts(randInt(6, 8), 10, 99));
  let x = randInt(1, 40);
  while (a.includes(x)) x++;
  const { arr } = heapPush(a, x);
  return {
    concept: HP,
    type: 'predict',
    prompt: `Min-heap array: ${fmtArray(a)}. Insert ${x} (append, then sift up). What's the array now?`,
    scene: heapScene(a),
    body: {
      kind: 'choice',
      options: options({ text: fmtArray(arr), why: 'Appended at the end, then swapped with its parent while smaller.' }, [
        { text: fmtArray([...a, x]), why: 'Appended but not sifted up: the parent is bigger than its child.' },
        { text: fmtArray([...a, x].sort((p, q) => p - q)), why: 'A heap is not fully sorted; it only keeps parent ≤ child.' },
        { text: fmtArray([x, ...a]), why: 'Inserting at the front would shift everything and break the shape.' },
      ]),
    },
    explain: `Append ${x} at index ${a.length}, then swap upward while it's smaller than its parent. At most one swap per level: O(log n).`,
  };
};

const simulateSiftUp = (): Card => {
  let a: number[];
  let x: number;
  let r: ReturnType<typeof heapPush>;
  do {
    a = buildHeap(distinctInts(randInt(6, 9), 10, 99));
    x = randInt(1, 30);
    r = heapPush(a, x);
  } while (r.swaps.length < 2 || a.includes(x));
  const start = [...a, x];
  const frames = [heapScene(start, 2, [t(start.length - 1)]), ...r.frames.map((f, i) => heapScene(f, 2, [t(r.swaps[i])]))];
  return {
    concept: HP,
    type: 'simulate',
    prompt: `${x} was appended at the end (index ${a.length}). Sift it up: click each parent it swaps with, in order.`,
    scene: frames[0],
    body: {
      kind: 'click',
      expected: r.swaps.map(t),
      frames,
      wrongHint: () => 'Compare with the PARENT (one level up). Swap while the new value is smaller.',
    },
    explain: `${x} climbed ${r.swaps.length} level${r.swaps.length > 1 ? 's' : ''}. Only one root-to-leaf path is touched, never the whole heap.`,
  };
};

const simulateSiftDown = (): Card => {
  let a: number[];
  let r: ReturnType<typeof heapPop>;
  do {
    a = buildHeap(distinctInts(randInt(7, 10), 10, 99));
    r = heapPop(a);
  } while (r.swaps.length < 2);
  const start = [a[a.length - 1], ...a.slice(1, -1)];
  const frames = [heapScene(start, 2, [t(0)]), ...r.frames.map((f, i) => heapScene(f, 2, [t(r.swaps[i])]))];
  return {
    concept: HP,
    type: 'simulate',
    prompt: `removeMin took ${a[0]} out and moved the last value (${a[a.length - 1]}) to the root. Sift it down: click each child it swaps with, in order (always the smaller child).`,
    scene: frames[0],
    body: {
      kind: 'click',
      expected: r.swaps.map(t),
      frames,
      wrongHint: () => 'Compare with both children and swap with the SMALLER one, if it’s smaller than the value you’re sifting.',
    },
    explain: `Swapping with the smaller child keeps parent ≤ both children. ${r.swaps.length} swaps: at most the height.`,
  };
};

const countHeapSwaps = (): Card => {
  const n = randInt(5, 2000);
  return {
    concept: HP,
    type: 'count',
    prompt: `A binary heap holds ${n} items. Worst case, how many swaps can inserting one more item cause?`,
    body: { kind: 'number', answer: Math.floor(Math.log2(n + 1)), unit: 'swaps' },
    explain: `The new item lands at depth ⌊log₂(${n + 1})⌋ = ${Math.floor(Math.log2(n + 1))} and can climb at most that many levels.`,
  };
};

const growthHeap = (): Card =>
  pick([
    () => growthCard(HP, 'insert into a binary heap (worst case)', (n) => Math.floor(Math.log2(n)) + 1, 1, 'One swap per level, and there are about log₂ n levels.'),
    () => growthCard(HP, 'peek at the minimum', () => 1, 0, 'It’s always at index 0.'),
  ])();

const hpExplain = explainGenerators({
  concept: HP,
  truths: [
    'A binary heap is a complete binary tree stored in an array, level by level.',
    'Children of index i are at 2i + 1 and 2i + 2; the parent is at (i − 1) ÷ 2.',
    'In a min-heap every parent is ≤ its children, so the minimum is at index 0.',
    'Insert appends then sifts up; removeMin moves the last item to the root then sifts down.',
    'Both insert and removeMin are O(log n) because the tree is always balanced.',
  ],
  myths: [
    { text: 'A heap keeps its array fully sorted.', why: 'Only parent ≤ child. Siblings and cousins can be in any order.' },
    { text: 'A heap needs left and right pointers.', why: 'Positions are computed from the index. No pointers at all.' },
    { text: 'Sift-down swaps with the left child.', why: 'It swaps with the *smaller* child, or order breaks.' },
    { text: 'You can find any value in a heap in O(log n).', why: 'Only the min is easy. Searching for others is O(n).' },
  ],
  chains: [
    {
      prompt: 'Why is a heap always O(log n) tall, unlike a BST?',
      steps: ['A heap fills the tree level by level, left to right.', 'So it’s always a complete tree, never a stick.', 'A complete tree with n nodes has about log₂ n levels.', 'Sifting touches one node per level.'],
    },
    {
      prompt: 'Why is the minimum always at index 0?',
      steps: ['Every parent is ≤ its children.', 'So every node is ≥ the root, by following parents upward.', 'The root is at index 0.'],
    },
  ],
  summary: {
    best: 'A heap is a family tree where every parent is smaller than its kids, packed into an array; the smallest is always on top, and fixing things up only touches one line of ancestors.',
    others: [
      { text: 'A heap is a sorted tree.', why: 'It’s only partially ordered.' },
      { text: 'A heap is the memory where objects live.', why: 'Same word, different thing.' },
      { text: 'It’s a priority queue.', why: 'It *implements* one; that’s not what it is.' },
    ],
  },
});

const rebuildHeap = (): Card => {
  const keys = distinctInts(randInt(5, 6), 1, 99);
  const a = buildHeap(keys);
  return sequenceRebuild(HP, `Insert ${keys.join(', ')} one at a time into an empty min-heap (append + sift up). Write the final ARRAY from index 0.`, a, [], `${a.join(', ')}. Each insert only swaps along one path, so the array is heap-ordered, not sorted.`, 'Your heap array');
};

const breakHeap = (): Card => {
  for (;;) {
    const a = buildHeap(distinctInts(randInt(7, 10), 20, 99));
    const leafIdx = Array.from({ length: a.length }, (_, i) => i).filter((i) => 2 * i + 1 >= a.length);
    const i = pick(leafIdx);
    const p = parentIdx(i);
    const bad = randInt(Math.max(1, a[p] - 15), a[p] - 1);
    if (a.includes(bad)) continue;
    const b = [...a];
    b[i] = bad;
    const scene = heapScene(b);
    return {
      concept: HP,
      type: 'break',
      prompt: 'One value in this min-heap breaks heap order. Click the node that is smaller than its parent.',
      scene,
      body: {
        kind: 'click',
        expected: [t(i)],
        frames: [scene, { ...cloneScene(scene), highlight: [t(i), t(p)] }],
        wrongHint: () => 'Compare every node with its parent: in a min-heap, parent ≤ child everywhere.',
      },
      explain: `${bad} at [${i}] is smaller than its parent ${b[p]} at [${p}]. The root is no longer guaranteed to be the minimum: peek could return the wrong item. A sift-up would fix it.`,
    };
  }
};

const heapOps: Concept['playground'] = {
  initial: () => heapScene(buildHeap([15, 30, 20, 45, 50, 25])),
  guide: [
    { do: 'Compare the tree with the array row under it.', see: 'They’re the same data. The tree is how you picture it; the array is what’s stored. Children of [i] are at [2i+1] and [2i+2].' },
    { do: 'Insert 5.', see: 'It’s added at the end, then swaps upward while it’s smaller than its parent. It ends on top: the smallest is always at the top.' },
    { do: 'Remove min.', see: 'The top is taken, the last item moves to the top and sinks down (swapping with its smaller child) until order is restored.' },
  ],
  ops: [
    {
      label: 'Insert',
      inputs: ['value'],
      run: (s, [x]) => {
        const a = (s.views[1] as Extract<View, { type: 'row' }>).items as number[];
        if (a.length >= 15) return { error: 'Demo heap is full (15).' };
        const r = heapPush(a, x);
        return { scene: heapScene(r.arr, 2, [t(r.swaps.length ? r.swaps[r.swaps.length - 1] : a.length)]), touches: 1 + r.swaps.length, note: `Appended at [${a.length}], ${r.swaps.length} swap(s) up.` };
      },
    },
    {
      label: 'Remove min',
      run: (s) => {
        const a = (s.views[1] as Extract<View, { type: 'row' }>).items as number[];
        if (!a.length) return { error: 'Empty.' };
        const r = heapPop(a);
        return { scene: heapScene(r.arr, 2, r.swaps.map(t)), touches: 1 + r.swaps.length, note: `Removed ${a[0]}. Moved ${a[a.length - 1]} to the root, ${r.swaps.length} swap(s) down.` };
      },
    },
  ],
};

export const binaryHeapConcept: Concept = {
  id: HP,
  title: 'Binary Heap',
  tier: 5,
  prereqs: ['priority-queue', BT],
  tagline: 'A tree packed into an array; smallest on top.',
  hook: {
    problem: 'Priority queues with plain arrays force a choice: O(n) insert or O(n) removeMin. A BST gives O(log n) for both… unless it degenerates into a stick.',
    question: 'You only ever need the minimum. What’s the least order you must keep?',
    options: [
      { text: 'Fully sorted, always.', feedback: 'More order than needed, and keeping it costs O(n) per insert.' },
      { text: 'Just "every parent ≤ its children", in a tree that is always filled level by level.', good: true, feedback: 'Yes. The min is at the top, the tree can never become a stick, and it fits in an array with no pointers.' },
      { text: 'Only remember the current minimum.', feedback: 'After removing it, you’d need to search for the next one: O(n).' },
    ],
  },
  lens: {
    layout: 'An array. Index i’s children are 2i + 1 and 2i + 2; the tree is complete (filled level by level).',
    invariant: 'Heap order: every parent ≤ its children (min-heap).',
    payoff: 'peek O(1), insert and removeMin O(log n) guaranteed, zero pointers, cache-friendly.',
    price: 'Only the min is easy. Searching for other values is O(n); no sorted iteration.',
  },
  playground: heapOps,
  generators: {
    predict: [predictHeapIdx, predictHeapInsert],
    simulate: [simulateSiftUp, simulateSiftDown],
    count: [countHeapSwaps, growthHeap],
    explain: hpExplain,
    rebuild: [rebuildHeap],
    break: [breakHeap],
  },
};

// =====================================================================
// d-ary heap
// =====================================================================

const DH = 'd-ary-heap';

function dHeight(n: number, d: number) {
  let h = 0;
  let total = 1;
  let level = 1;
  while (total < n) {
    level *= d;
    total += level;
    h++;
  }
  return h;
}

const predictDChildren = (): Card => {
  const d = randInt(3, 5);
  const i = randInt(1, 12);
  return {
    concept: DH,
    type: 'predict',
    prompt: `A ${d}-ary heap (each node has up to ${d} children) is stored in an array from index 0. Which indexes hold the children of index ${i}?`,
    body: {
      kind: 'choice',
      options: options({ text: `${d * i + 1} to ${d * i + d}`, why: `d·i + 1 through d·i + d.` }, [
        { text: `${2 * i + 1} to ${2 * i + 2}`, why: 'That’s the binary-heap formula (d = 2).' },
        { text: `${d * i} to ${d * i + d - 1}`, why: 'Off by one: index 0 is the root, its children start at 1.' },
        { text: `${i + 1} to ${i + d}`, why: 'Neighbours in the array aren’t children.' },
      ]),
    },
    explain: `Same idea as binary, with d instead of 2: children of ${i} are ${d}×${i}+1 … ${d}×${i}+${d}. Parent of j is (j − 1) ÷ ${d}.`,
  };
};

const predictDHeight = (): Card => {
  const n = pick([100, 1000, 10000, 100000]);
  const d = pick([4, 8]);
  return {
    concept: DH,
    type: 'predict',
    prompt: `${n.toLocaleString()} items. A binary heap has height ${dHeight(n, 2)}. What's the height of a ${d}-ary heap with the same items?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        dHeight(n, d),
        [
          { value: dHeight(n, 2), why: 'More children per node means fewer levels.' },
          { value: dHeight(n, 2) * 2, why: 'Wider trees get shorter, not taller.' },
          { value: Math.max(1, Math.round(dHeight(n, 2) / d)), why: 'Height scales with log base d, not 1/d.' },
        ],
        'About log base d of n.',
      ),
    },
    explain: `Height ≈ log_${d}(n) = log₂(n) / log₂(${d}). Sift-up gets cheaper (fewer levels); sift-down gets pricier (compare ${d} children per level).`,
  };
};

const simulateDSiftUp = (): Card => {
  const d = 3;
  let a: number[];
  let x: number;
  let r: ReturnType<typeof heapPush>;
  do {
    a = buildHeap(distinctInts(randInt(8, 11), 10, 99), d);
    x = randInt(1, 25);
    r = heapPush(a, x, d);
  } while (r.swaps.length < 2 || a.includes(x));
  const start = [...a, x];
  const frames = [heapScene(start, d, [t(start.length - 1)]), ...r.frames.map((f, i) => heapScene(f, d, [t(r.swaps[i])]))];
  return {
    concept: DH,
    type: 'simulate',
    prompt: `3-ary min-heap. ${x} was appended at index ${a.length}. Sift up: click each parent it swaps with.`,
    scene: frames[0],
    body: { kind: 'click', expected: r.swaps.map(t), frames, wrongHint: () => 'The parent of index j is (j − 1) ÷ 3. Swap while the new value is smaller.' },
    explain: `${r.swaps.length} swaps up a shorter tree. Wider nodes mean fewer levels to climb.`,
  };
};

const countDCompare = (): Card => {
  const d = randInt(3, 8);
  return {
    concept: DH,
    type: 'count',
    prompt: `In a ${d}-ary min-heap, sift-down must find the smallest of a node's ${d} children at each level. How many comparisons does finding that smallest child take?`,
    body: { kind: 'number', answer: d - 1, unit: 'comparisons' },
    explain: `Finding the min of ${d} items takes ${d - 1} comparisons. So removeMin costs about (d − 1) × log_d(n): bigger d = shorter tree but more work per level.`,
  };
};

const countDHeight = (): Card => {
  const d = randInt(3, 4);
  const n = randInt(10, 200);
  return {
    concept: DH,
    type: 'count',
    prompt: `A ${d}-ary heap holds ${n} items (a complete tree, filled level by level). What's its height?`,
    body: { kind: 'number', answer: dHeight(n, d), unit: 'levels below root' },
    explain: `Levels hold 1, ${d}, ${d * d}, ${d ** 3}, … Filling ${n} items needs height ${dHeight(n, d)}.`,
  };
};

const dhExplain = explainGenerators({
  concept: DH,
  truths: [
    'A d-ary heap is a heap where each node has up to d children.',
    'Children of index i are at d·i + 1 … d·i + d.',
    'Larger d makes the tree shorter: height ≈ log_d n.',
    'Sift-up gets cheaper with larger d; sift-down compares more children per level.',
  ],
  myths: [
    { text: 'A bigger d always makes every operation faster.', why: 'Sift-down must compare d children per level.' },
    { text: 'A d-ary heap needs child pointers.', why: 'Like the binary heap, positions are pure arithmetic.' },
    { text: 'd-ary heaps are sorted.', why: 'Same partial order as a binary heap.' },
  ],
  chains: [
    {
      prompt: 'Why can a 4-ary heap make inserts faster than a binary heap?',
      steps: ['Insert sifts up one level at a time.', 'Each sift-up step is one comparison with the parent.', 'A 4-ary tree is about half as tall as a binary one.', 'So sift-up does about half as many steps.'],
    },
  ],
  summary: {
    best: 'It’s a heap where each parent has more kids, so the family tree is shorter: climbing up is quicker, but choosing the smallest kid on the way down takes longer.',
    others: [
      { text: 'A d-ary heap is a generalization of a binary heap.', why: 'True but explains nothing.' },
      { text: 'It’s a faster heap.', why: 'Depends on the mix of operations.' },
      { text: 'It stores d values per node.', why: 'One value per node; d *children*.' },
    ],
  },
});

export const dAryHeapConcept: Concept = {
  id: DH,
  title: 'd-ary Heap',
  tier: 5,
  prereqs: [HP],
  tagline: 'Wider heap, shorter tree.',
  hook: {
    problem: 'Some algorithms (like Dijkstra’s) do many more inserts and decrease-keys (sift-up) than removeMins (sift-down). A binary heap’s height costs on every sift-up.',
    question: 'How could you make sift-up cheaper?',
    options: [
      { text: 'Give each node more children so the tree is shorter.', good: true, feedback: 'Yes. With d children per node, height ≈ log_d n. Sift-up gets cheaper; sift-down compares more kids per level.' },
      { text: 'Keep the heap fully sorted.', feedback: 'That makes inserts O(n).' },
      { text: 'Skip sift-up entirely.', feedback: 'Then the heap order breaks and the min could be anywhere.' },
    ],
  },
  lens: {
    layout: 'An array; children of i are d·i + 1 … d·i + d; parent of j is (j − 1) ÷ d.',
    invariant: 'Heap order (parent ≤ each child) and a complete tree.',
    payoff: 'Height log_d n: cheaper sift-up; fewer cache misses per level.',
    price: 'Sift-down compares d children per level: (d − 1) · log_d n comparisons.',
  },
  generators: {
    predict: [predictDChildren, predictDHeight],
    simulate: [simulateDSiftUp],
    count: [countDCompare, countDHeight],
    explain: dhExplain,
  },
};

// =====================================================================
// Trie
// =====================================================================

const TRIE = 'trie';

const WORDSETS = [
  ['car', 'cart', 'care', 'cat', 'dog', 'dot'],
  ['tea', 'ten', 'team', 'to', 'toy', 'in', 'inn'],
  ['sun', 'sung', 'sunny', 'sea', 'seat', 'set'],
  ['bat', 'bath', 'bad', 'ban', 'band', 'cab'],
  ['pin', 'pine', 'pink', 'pit', 'pat', 'pan'],
];

function trieTree(words: string[]): TreeNode {
  const root: TreeNode = { id: '^', label: '•', children: [] };
  for (const w of words) {
    let cur = root;
    for (let i = 0; i < w.length; i++) {
      const id = w.slice(0, i + 1);
      let next = cur.children.find((c) => c!.id === id) as TreeNode | undefined;
      if (!next) {
        next = { id, label: w[i], children: [] };
        cur.children.push(next);
      }
      cur = next;
    }
    cur.tone = 'accent';
    cur.note = '✓';
  }
  const sort = (n: TreeNode) => {
    n.children.sort((a, b) => a!.id.localeCompare(b!.id));
    n.children.forEach((c) => sort(c!));
  };
  sort(root);
  return root;
}

const trieNodes = (words: string[]) => new Set(words.flatMap((w) => Array.from({ length: w.length }, (_, i) => w.slice(0, i + 1)))).size;
const trieScene = (words: string[]): Scene => ({ views: [{ type: 'tree', root: trieTree(words), title: 'Trie (✓ = a word ends here)' }] });

const predictNewNodes = (): Card => {
  const set = pick(WORDSETS);
  const words = shuffle(set);
  const existing = words.slice(0, words.length - 1);
  const w = words[words.length - 1];
  const added = trieNodes([...existing, w]) - trieNodes(existing);
  return {
    concept: TRIE,
    type: 'predict',
    prompt: `The trie holds: ${existing.join(', ')}. How many NEW nodes does inserting "${w}" create?`,
    scene: trieScene(existing),
    body: {
      kind: 'choice',
      options: numberOptions(
        added,
        [
          { value: w.length, why: 'Shared prefixes are reused: only the letters past the shared part are new.' },
          { value: 1, why: 'Count the letters beyond the longest prefix already in the trie.' },
          { value: 0, why: added === 0 ? 'Right: only the end mark changes.' : 'Some letters aren’t in the trie yet.' },
        ],
        'Only letters beyond the existing prefix.',
      ),
    },
    explain: `"${w}" reuses its existing prefix; ${added} new node${added === 1 ? '' : 's'} for the rest${added === 0 ? ' (just mark the end with ✓)' : ''}. Shared prefixes are stored once.`,
  };
};

const predictAutocomplete = (): Card => {
  const words = pick(WORDSETS);
  const prefixes = [...new Set(words.flatMap((w) => [w.slice(0, 1), w.slice(0, 2)]))];
  let p = pick(prefixes);
  let hits = words.filter((w) => w.startsWith(p));
  let tries = 0;
  while (hits.length < 2 && tries++ < 20) {
    p = pick(prefixes);
    hits = words.filter((w) => w.startsWith(p));
  }
  const miss = words.filter((w) => !w.startsWith(p));
  return {
    concept: TRIE,
    type: 'predict',
    prompt: `Autocomplete "${p}" in this trie. Which words are suggested?`,
    scene: trieScene(words),
    body: {
      kind: 'choice',
      options: options({ text: hits.join(', '), why: `Walk "${p}", then collect every ✓ below that node.` }, [
        { text: hits.slice(0, 1).join(', '), why: 'Collect *every* word in the subtree, not just the first.' },
        { text: [...hits, ...miss.slice(0, 1)].join(', '), why: `${miss[0]} doesn't start with "${p}".` },
        { text: words.filter((w) => w.includes(p[p.length - 1])).join(', '), why: 'Matching letters anywhere isn’t a prefix match.' },
      ]),
    },
    explain: `After walking "${p}" (${p.length} steps), every word below that node shares the prefix: ${hits.join(', ')}.`,
  };
};

const simulateTrieSearch = (): Card => {
  const words = pick(WORDSETS);
  const w = pick(words.filter((x) => x.length >= 3));
  const scene = trieScene(words);
  const path = Array.from({ length: w.length }, (_, i) => w.slice(0, i + 1));
  const frames = [scene];
  path.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: path.slice(0, i + 1).map(t) }));
  return {
    concept: TRIE,
    type: 'simulate',
    prompt: `Look up "${w}". Starting below the root (•), click each letter node you step to.`,
    scene,
    body: { kind: 'click', expected: path.map(t), frames, wrongHint: (step) => `Next letter: '${w[step]}'. Pick that child of the node you're on.` },
    explain: `${w.length} steps, one per letter, and it ends on a ✓. The number of other words in the trie never mattered.`,
  };
};

const countTrieNodes = (): Card => {
  const words = shuffle(pick(WORDSETS)).slice(0, randInt(3, 5));
  return {
    concept: TRIE,
    type: 'count',
    prompt: `Build a trie from: ${words.join(', ')}. How many nodes does it have, not counting the root?`,
    body: { kind: 'number', answer: trieNodes(words), unit: 'nodes' },
    explain: `One node per distinct prefix: ${trieNodes(words)}. Total letters would be ${words.join('').length}; shared prefixes save the difference.`,
  };
};

const growthTrie = (): Card => growthCard(TRIE, 'look up a 5-letter word in a trie of n words', () => 5, 0, 'Cost depends on the word length, not on how many words are stored.');

const trieExplain = explainGenerators({
  concept: TRIE,
  truths: [
    'A trie stores strings letter by letter, one node per letter along each path.',
    'Words that share a prefix share the nodes for that prefix.',
    'Lookup takes one step per letter, regardless of how many words are stored.',
    'All words with a given prefix live in the subtree under that prefix’s node.',
    'Nodes must mark where a word ends, since one word can be a prefix of another.',
  ],
  myths: [
    { text: 'Lookup gets slower as you add more words.', why: 'It only depends on the length of the word you’re looking up.' },
    { text: 'Each word is stored as a separate chain of nodes.', why: 'Shared prefixes are stored once.' },
    { text: 'Reaching the last letter’s node means the word is present.', why: '"car" could be just a prefix of "cart". You need the end-of-word mark.' },
    { text: 'Tries always use less memory than a hash set.', why: 'Each node can carry many child pointers; tries can be memory-hungry.' },
  ],
  chains: [
    {
      prompt: 'Why is autocomplete fast in a trie?',
      steps: ['Walk the prefix letter by letter: one step each.', 'You arrive at the node for that prefix.', 'Every word with that prefix is in this node’s subtree.', 'So you only explore that subtree, never the whole dictionary.'],
    },
  ],
  summary: {
    best: 'A trie is a tree of letters where each path spells a word, so words sharing a start share a branch, and finding a word takes one step per letter.',
    others: [
      { text: 'A trie is a prefix tree.', why: 'The name, not the mechanism.' },
      { text: 'A trie stores strings efficiently.', why: 'Efficient how?' },
      { text: 'A trie is a tree of words.', why: 'Of letters, and that’s the point.' },
    ],
  },
});

export const trieConcept: Concept = {
  id: TRIE,
  title: 'Trie',
  tier: 5,
  prereqs: [TR, 'string'],
  tagline: 'A tree of letters. Paths spell words.',
  hook: {
    problem: 'Phone autocomplete: you type "ca" and want every word starting with "ca" instantly. A hash set can’t do prefixes, and a sorted list needs a search each time.',
    question: 'How could words be stored so a prefix leads straight to its completions?',
    options: [
      { text: 'Store each word’s letters as a path in a tree; words with the same start share the path.', good: true, feedback: 'Yes. Walk "c", "a", and the whole subtree below is your list of completions.' },
      { text: 'Hash every prefix of every word.', feedback: 'Works, but stores each word many times over.' },
      { text: 'Scan the dictionary each keystroke.', feedback: 'O(total letters) per keystroke. Much too slow.' },
    ],
  },
  lens: {
    layout: 'A tree whose edges are letters; each node has a child per possible next letter, plus an end-of-word mark.',
    invariant: 'The path from the root to a node spells exactly that node’s prefix; marked nodes end real words.',
    payoff: 'Lookup/insert in O(word length), independent of the number of words; prefix queries for free.',
    price: 'Many nodes and child pointers: can use a lot of memory for sparse alphabets.',
  },
  generators: {
    predict: [predictNewNodes, predictAutocomplete],
    simulate: [simulateTrieSearch],
    count: [countTrieNodes, growthTrie],
    explain: trieExplain,
  },
};


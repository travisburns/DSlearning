import type { Card, Concept, Scene, View } from '../engine/types';
import { cloneScene } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions, options } from './helpers';
import { height, inorder, levelorder, postorder, preorder, randomBST, toTree } from './treeUtil';

const clickFrames = (base: Scene, expected: string[]) => {
  const frames = [base];
  expected.forEach((_, i) => frames.push({ ...cloneScene(base), highlight: expected.slice(0, i + 1) }));
  return frames;
};

// ---------- Small graph toolkit (neighbours always visited in alphabetical order) ----------

interface WG {
  nodes: string[];
  edges: { a: string; b: string; w: number }[];
  directed: boolean;
}

function connectedGraph(n = randInt(5, 6), extra = randInt(2, 3), directed = false, weights?: number[]): WG {
  const nodes = 'ABCDEFG'.split('').slice(0, n);
  const edges: WG['edges'] = [];
  const seen = new Set<string>();
  const key = (a: string, b: string) => [a, b].sort().join('');
  const ws = weights ?? [];
  const add = (a: string, b: string) => {
    if (a === b || seen.has(key(a, b))) return false;
    seen.add(key(a, b));
    edges.push({ a, b, w: ws[edges.length] ?? randInt(1, 9) });
    return true;
  };
  // Spanning tree grown from A keeps everything reachable from A, then extra edges.
  const order = ['A', ...shuffle(nodes.slice(1))];
  for (let i = 1; i < order.length; i++) add(pick(order.slice(0, i)), order[i]);
  let tries = 0;
  while (extra > 0 && tries++ < 50) if (add(pick(nodes), pick(nodes))) extra--;
  return { nodes, edges, directed };
}

/** A directed acyclic graph: edges only go forward in a hidden random order. */
function randomDAG(n = randInt(5, 6)): WG {
  const nodes = 'ABCDEFG'.split('').slice(0, n);
  const hidden = shuffle(nodes);
  const edges: WG['edges'] = [];
  const seen = new Set<string>();
  for (let i = 1; i < n; i++) {
    const from = pick(hidden.slice(0, i));
    edges.push({ a: from, b: hidden[i], w: 1 });
    seen.add(from + hidden[i]);
  }
  let extra = randInt(1, 3);
  let tries = 0;
  while (extra > 0 && tries++ < 50) {
    const [i, j] = [randInt(0, n - 1), randInt(0, n - 1)].sort((x, y) => x - y);
    if (i === j || seen.has(hidden[i] + hidden[j])) continue;
    seen.add(hidden[i] + hidden[j]);
    edges.push({ a: hidden[i], b: hidden[j], w: 1 });
    extra--;
  }
  return { nodes, edges, directed: true };
}

const nbrs = (g: WG, x: string) => g.edges.flatMap((e) => (e.a === x ? [e.b] : !g.directed && e.b === x ? [e.a] : [])).sort();
const view = (g: WG, weighted = false, title?: string): View => ({
  type: 'graph',
  nodes: g.nodes.map((id) => ({ id, label: id })),
  edges: g.edges.map((e) => ({ from: e.a, to: e.b, w: weighted ? e.w : undefined })),
  directed: g.directed,
  title,
});

function bfs(g: WG, s = 'A') {
  const dist = new Map([[s, 0]]);
  const order = [s];
  for (let i = 0; i < order.length; i++)
    for (const y of nbrs(g, order[i]))
      if (!dist.has(y)) {
        dist.set(y, dist.get(order[i])! + 1);
        order.push(y);
      }
  return { order, dist };
}

function dfs(g: WG, s = 'A') {
  const order: string[] = [];
  let maxDepth = 0;
  const go = (x: string, d: number) => {
    order.push(x);
    maxDepth = Math.max(maxDepth, d);
    for (const y of nbrs(g, x)) if (!order.includes(y)) go(y, d + 1);
  };
  go(s, 1);
  return { order, maxDepth };
}

/** Kahn's algorithm, always taking the alphabetically smallest ready node. */
function kahn(g: WG) {
  const indeg = new Map(g.nodes.map((x) => [x, g.edges.filter((e) => e.b === x).length]));
  const out: string[] = [];
  while (out.length < g.nodes.length) {
    const ready = g.nodes.filter((x) => !out.includes(x) && indeg.get(x) === 0).sort();
    if (!ready.length) return null;
    const x = ready[0];
    out.push(x);
    for (const y of nbrs(g, x)) indeg.set(y, indeg.get(y)! - 1);
  }
  return out;
}

function dijkstra(g: WG, s = 'A') {
  const dist = new Map(g.nodes.map((x) => [x, Infinity]));
  dist.set(s, 0);
  const done: string[] = [];
  while (done.length < g.nodes.length) {
    const x = g.nodes.filter((v) => !done.includes(v)).sort((p, q) => dist.get(p)! - dist.get(q)! || p.localeCompare(q))[0];
    done.push(x);
    for (const e of g.edges) {
      const y = e.a === x ? e.b : e.b === x ? e.a : null;
      if (y && dist.get(x)! + e.w < dist.get(y)!) dist.set(y, dist.get(x)! + e.w);
    }
  }
  return { dist, done };
}

/** A weighted graph whose shortest distances from A are all different (no ties to argue about). */
function dijkstraGraph(): { g: WG; dist: Map<string, number>; done: string[] } {
  for (;;) {
    const g = connectedGraph(randInt(5, 6), randInt(2, 3));
    const r = dijkstra(g);
    if (new Set(r.dist.values()).size === g.nodes.length) return { g, ...r };
  }
}

function kruskal(g: WG) {
  const parent = new Map(g.nodes.map((x) => [x, x]));
  const find = (x: string): string => (parent.get(x) === x ? x : find(parent.get(x)!));
  const sorted = [...g.edges].sort((p, q) => p.w - q.w);
  const taken: number[] = [];
  sorted.forEach((e, i) => {
    const [ra, rb] = [find(e.a), find(e.b)];
    if (ra !== rb) {
      parent.set(ra, rb);
      taken.push(i);
    }
  });
  return { sorted, taken, total: taken.reduce((s, i) => s + sorted[i].w, 0) };
}

// =====================================================================
// Tree traversals (DFS on trees)
// =====================================================================

const TD = 'tree-dfs';
const ORDERS = [
  { name: 'preorder', rule: 'node, then left subtree, then right subtree', fn: preorder },
  { name: 'inorder', rule: 'left subtree, then node, then right subtree', fn: inorder },
  { name: 'postorder', rule: 'left subtree, then right subtree, then node', fn: postorder },
] as const;

const predictTraversal = (): Card => {
  const t = randomBST(distinctInts(randInt(5, 7), 1, 60));
  const o = pick(ORDERS);
  const scene: Scene = { views: [{ type: 'tree', root: toTree(t), binary: true, title: 'Binary tree' }] };
  return {
    concept: TD,
    type: 'predict',
    prompt: `Visit this tree in ${o.name.toUpperCase()} (${o.rule}). Which order comes out?`,
    scene,
    body: {
      kind: 'choice',
      options: options(
        { text: o.fn(t).join(', '), why: `${o.name}: ${o.rule}.` },
        [
          ...ORDERS.filter((x) => x.name !== o.name).map((x) => ({ text: x.fn(t).join(', '), why: `That’s ${x.name}.` })),
          { text: levelorder(t).join(', '), why: 'That’s level by level (breadth-first), not depth-first.' },
        ],
      ),
    },
    explain: `${o.name}: ${o.fn(t).join(', ')}.${o.name === 'inorder' ? ' On a BST, inorder is always sorted.' : ''}`,
  };
};

const predictWhich = (): Card => ({
  concept: TD,
  type: 'predict',
  prompt: 'You want to delete every node of a tree, and a node can only be deleted after both its children are gone. Which order works?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'Postorder: children first, then the node.', correct: true, why: 'Both subtrees are finished before the node itself.' },
      { text: 'Preorder: the node first.', correct: false, why: 'You’d delete a parent while its children still exist.' },
      { text: 'Inorder.', correct: false, why: 'The node comes before its right subtree.' },
      { text: 'Level order.', correct: false, why: 'The root comes first.' },
    ]),
  },
  explain: 'Postorder = “finish the children, then me”. Also used to compute sizes and heights, which need the children’s answers first.',
});

const simulateTraversal = (): Card => {
  const t = randomBST(distinctInts(randInt(5, 7), 1, 60));
  const o = pick(ORDERS);
  const scene: Scene = { views: [{ type: 'tree', root: toTree(t), binary: true, title: 'Binary tree' }] };
  const exp = o.fn(t).map((k) => `t:${k}`);
  return {
    concept: TD,
    type: 'simulate',
    prompt: `Do a ${o.name.toUpperCase()} traversal: click the nodes in the order they are visited (${o.rule}).`,
    scene,
    body: { kind: 'click', expected: exp, frames: clickFrames(scene, exp), wrongHint: () => `Rule: ${o.rule}. Finish a whole subtree before moving on.` },
    explain: `${o.name}: ${o.fn(t).join(', ')}.`,
  };
};

const countTD = (): Card => {
  const t = randomBST(distinctInts(randInt(6, 9), 1, 80));
  return {
    concept: TD,
    type: 'count',
    prompt: 'A recursive traversal of this tree: at the deepest point, how many calls are on the call stack at once (count the root’s call as 1)?',
    scene: { views: [{ type: 'tree', root: toTree(t), binary: true, title: 'Binary tree' }] },
    body: { kind: 'number', answer: height(t) + 1, unit: 'calls' },
    explain: `One call per node on the longest root-to-leaf path: ${height(t) + 1}. Traversal memory = the tree’s height, O(log n) if balanced, O(n) if a stick.`,
  };
};

const growthTD = (): Card => growthCard(TD, 'visit every node of a tree (recursive traversal)', (n) => n, 2, 'Each node is visited exactly once.');

const tdExplain = explainGenerators({
  concept: TD,
  truths: [
    'A depth-first traversal goes all the way down one subtree before starting the next.',
    'Preorder, inorder and postorder differ only in when the node itself is handled.',
    'Inorder on a binary search tree gives the keys in sorted order.',
    'Recursion keeps track of where to come back to, using the call stack.',
    'Every node is visited once: O(n) time, O(height) memory.',
  ],
  myths: [
    { text: 'Preorder visits nodes level by level.', why: 'That’s breadth-first (level order).' },
    { text: 'Inorder is sorted for any binary tree.', why: 'Only for a binary SEARCH tree.' },
    { text: 'A traversal needs O(n²) time.', why: 'Each node is visited once: O(n).' },
  ],
  chains: [
    {
      prompt: 'Why does inorder on a BST come out sorted?',
      steps: ['Everything in the left subtree is smaller than the node.', 'Inorder handles the whole left subtree first.', 'Then the node, then the bigger right subtree.', 'Applied at every node, that is exactly smallest-to-largest.'],
    },
  ],
  summary: {
    best: 'A tree traversal walks the whole tree by going deep into one branch, coming back, then going into the next; the three orders just choose whether you note the node before, between or after its children.',
    others: [
      { text: 'It visits the tree.', why: 'Too vague.' },
      { text: 'It’s recursion on trees.', why: 'Names the tool, not what it does.' },
      { text: 'It sorts the tree.', why: 'Only inorder on a BST comes out sorted.' },
    ],
  },
});

export const treeDfsConcept: Concept = {
  id: TD,
  kind: 'algorithm',
  title: 'Tree Traversals',
  tier: 4,
  prereqs: ['binary-tree', 'recursion'],
  tagline: 'Visit every node: before, between or after the children.',
  hook: {
    problem: 'You need to print every value in a tree. Unlike an array, there’s no index to loop over.',
    question: 'How do you make sure you visit every node exactly once?',
    options: [
      { text: 'Handle a node, then recursively handle its left subtree, then its right subtree.', good: true, feedback: 'Yes: a depth-first traversal. The recursion remembers where to come back to.' },
      { text: 'Follow left pointers until you reach a leaf.', feedback: 'That only visits one path.' },
      { text: 'Loop over the nodes by index.', feedback: 'Nodes are linked by pointers, not stored by index.' },
    ],
  },
  lens: {
    layout: 'A binary tree of linked nodes, walked with recursion (the call stack holds the path back up).',
    invariant: 'A subtree is finished completely before moving on; the node is handled before (pre), between (in) or after (post) its children.',
    payoff: 'Visits every node exactly once in O(n); inorder gives sorted order on a BST.',
    price: 'Memory for the recursion equal to the tree’s height, O(n) for a stick-shaped tree.',
  },
  learn: {
    what: 'A traversal visits every node of a tree once. Depth-first traversals go all the way down one branch before backing up. There are three versions, depending on when you handle the node itself compared with its children.',
    how: [
      'Preorder: handle the node, then traverse the left subtree, then the right. (Copying a tree.)',
      'Inorder: traverse left, handle the node, traverse right. (On a BST: sorted order.)',
      'Postorder: traverse left, traverse right, then handle the node. (Deleting, computing sizes.)',
      'An empty subtree is the base case: do nothing and return.',
    ],
  },
  extras: {
    family: 'tree-traversal',
    primitive: 'links',
    parts: ['recursion on the left and right child', 'a moment to handle the node (pre / in / post)', 'the empty-subtree base case'],
    uses: ['Print a binary search tree’s keys in sorted order.', 'Compute the size of every folder, which needs the sizes of its subfolders first.'],
    breaks: [
      {
        violation: 'The traversal forgets the base case and calls itself on an empty (null) child.',
        result: 'It tries to read the children of nothing and crashes.',
        wrong: ['It skips that child correctly.', 'It visits the node twice.', 'It returns sorted output.'],
      },
    ],
    transfer: [
      {
        problem: 'Check whether a binary tree is a valid binary search tree.',
        answer: 'Do an inorder traversal and check that each value is bigger than the previous one.',
        wrong: [
          { text: 'Check each node against its two children only.', why: 'A deeper node can still break the rule with an ancestor.' },
          { text: 'Do a preorder traversal and check it’s sorted.', why: 'Preorder of a BST isn’t sorted.' },
          { text: 'Check the tree is balanced.', why: 'Balance and ordering are different rules.' },
        ],
        explain: 'Inorder of a valid BST is strictly increasing, and only a valid BST gives that.',
      },
    ],
  },
  generators: {
    predict: [predictTraversal, predictWhich],
    simulate: [simulateTraversal],
    count: [countTD, growthTD],
    explain: tdExplain,
  },
};

// =====================================================================
// BFS
// =====================================================================

const BF = 'bfs';

const predictBfsOrder = (): Card => {
  const g = connectedGraph();
  const r = bfs(g);
  const d = dfs(g);
  return {
    concept: BF,
    type: 'predict',
    prompt: 'Breadth-first search from A (neighbours taken in alphabetical order). In what order are the nodes visited?',
    scene: { views: [view(g)] },
    body: {
      kind: 'choice',
      options: options({ text: r.order.join(', '), why: 'All nodes 1 step away, then all 2 steps away, and so on.' }, [
        { text: d.order.join(', '), why: 'That’s depth-first: it dives down before finishing each level.' },
        { text: [...g.nodes].sort().join(', '), why: 'Alphabetical order ignores the edges.' },
        { text: ['A', ...r.order.slice(1).reverse()].join(', '), why: 'Nearest nodes come first.' },
      ]),
    },
    explain: `Order: ${r.order.join(', ')}. Distances from A: ${r.order.map((x) => `${x}=${r.dist.get(x)}`).join(', ')}.`,
  };
};

const predictBfsDist = (): Card => {
  const g = connectedGraph(6, 3);
  const r = bfs(g);
  const far = g.nodes.filter((v) => r.dist.get(v)! >= 2);
  const x = far.length ? pick(far) : r.order[r.order.length - 1];
  const dd = r.dist.get(x)!;
  return {
    concept: BF,
    type: 'predict',
    prompt: `Using BFS from A, what is the fewest number of edges from A to ${x}?`,
    scene: { views: [view(g)] },
    body: {
      kind: 'choice',
      options: numberOptions(dd, [
        { value: dd + 1, why: 'Count the edges on the shortest path, not the nodes.' },
        { value: dd - 1, why: 'Look again: there’s no path that short.' },
        { value: dd + 2, why: 'Some path is that long, but BFS finds the shortest.' },
      ], `BFS reaches ${x} at level ${dd}.`),
    },
    explain: `BFS explores level by level, so the level where it first reaches ${x} is the shortest distance: ${dd}.`,
  };
};

const simulateBfs = (): Card => {
  const g = connectedGraph();
  const r = bfs(g);
  const scene: Scene = { views: [view(g)] };
  const exp = r.order.map((x) => `g:${x}`);
  const frames: Scene[] = [scene];
  r.order.forEach((_, i) => {
    const queue = r.order.slice(i + 1).filter((y) => r.order.slice(0, i + 1).some((v) => nbrs(g, v).includes(y)));
    frames.push({ views: [view(g), { type: 'row', key: 'q', items: queue, title: 'Queue (waiting to be visited)' }], highlight: exp.slice(0, i + 1) });
  });
  return {
    concept: BF,
    type: 'simulate',
    prompt: 'Run BFS from A. Click nodes in the order they come OUT of the queue. (New neighbours join the back of the queue in alphabetical order.)',
    scene,
    body: { kind: 'click', expected: exp, frames, wrongHint: () => 'Take the node at the FRONT of the queue: the one that has waited longest.' },
    explain: `Order: ${r.order.join(', ')}. The queue makes sure all nodes at distance 1 come before any at distance 2.`,
  };
};

const countBfs = (): Card => {
  const g = connectedGraph(6, 3);
  const r = bfs(g);
  const lv = Math.max(...r.dist.values());
  return {
    concept: BF,
    type: 'count',
    prompt: 'BFS from A: how many edges away is the FARTHEST node?',
    scene: { views: [view(g)] },
    body: { kind: 'number', answer: lv, unit: 'edges' },
    explain: `Levels: ${r.order.map((x) => `${x}=${r.dist.get(x)}`).join(', ')}. The last level is ${lv}.`,
  };
};

const growthBfs = (): Card =>
  growthCard(BF, 'BFS over a graph where each node has 3 edges (nodes + edges touched)', (n) => 4 * n, 2, 'Each node enters the queue once and each edge is checked from both ends: O(V + E).');

const bfsExplain = explainGenerators({
  concept: BF,
  truths: [
    'BFS visits nodes in order of distance: all 1 step away, then all 2 steps away, and so on.',
    'It uses a queue, so the node waiting longest is visited next.',
    'In an unweighted graph, BFS finds the shortest path (fewest edges).',
    'It marks nodes as seen so each is visited once: O(V + E).',
  ],
  myths: [
    { text: 'BFS uses a stack.', why: 'A stack gives depth-first order; BFS needs a queue.' },
    { text: 'BFS finds shortest paths in weighted graphs.', why: 'Only when every edge counts the same; weighted needs Dijkstra.' },
    { text: 'BFS can skip marking nodes as seen.', why: 'In a graph with cycles it would loop forever.' },
  ],
  chains: [
    {
      prompt: 'Why does BFS find shortest paths (in edges)?',
      steps: ['The queue holds nodes in order of discovery.', 'Nodes at distance d are all discovered before any at distance d+1.', 'So each node is first reached by the fewest possible edges.', 'That first discovery is its shortest distance.'],
    },
  ],
  summary: {
    best: 'BFS spreads out from the start like a ripple in a pond: first everything one step away, then two steps, so the first time it reaches something is by the shortest route.',
    others: [
      { text: 'BFS searches broadly.', why: 'Restates the name.' },
      { text: 'BFS visits every node.', why: 'So does DFS; misses the order.' },
      { text: 'BFS goes as deep as possible first.', why: 'That’s DFS.' },
    ],
  },
});

export const bfsConcept: Concept = {
  id: BF,
  kind: 'algorithm',
  title: 'Breadth-First Search',
  tier: 6,
  prereqs: ['graph', 'queue', 'adjacency-list'],
  tagline: 'Explore in rings: nearest first.',
  hook: {
    problem: 'On a social network, find the fewest introductions needed to reach someone.',
    question: 'How should you explore the network?',
    options: [
      { text: 'Check all direct friends first, then all friends-of-friends, and so on.', good: true, feedback: 'Yes: breadth-first search. The first time you reach them is the shortest chain.' },
      { text: 'Follow one chain of friends as far as it goes, then backtrack.', feedback: 'That’s depth-first; the first chain found may be very long.' },
      { text: 'Pick random people until you find them.', feedback: 'No guarantee of finding them or of the shortest chain.' },
    ],
  },
  lens: {
    layout: 'A graph (adjacency list), a queue of discovered nodes, and a “seen” set.',
    invariant: 'The queue holds nodes in order of distance: nobody at distance d+1 is visited before everyone at distance d.',
    payoff: 'Shortest paths (fewest edges) in an unweighted graph, in O(V + E).',
    price: 'The queue can hold a whole level at once (lots of memory); ignores edge weights.',
  },
  learn: {
    what: 'Breadth-first search (BFS) explores a graph from a starting node in rings: first every node one edge away, then every node two edges away, and so on. That makes it the tool for “fewest steps” questions.',
    how: [
      'Put the start node in a queue and mark it seen.',
      'Take the node at the front of the queue and visit it.',
      'Add each of its neighbours that hasn’t been seen to the back of the queue, and mark them seen.',
      'Repeat until the queue is empty. A node’s distance = its parent’s distance + 1.',
    ],
  },
  extras: {
    family: 'graph-search',
    primitive: 'both',
    parts: ['a queue of nodes to visit', 'a seen set', 'visiting neighbours'],
    uses: ['Find the fewest moves to solve a puzzle, where every move counts the same.', 'Find everyone within 2 connections of you on a social network.'],
    rivals: ['dfs', 'dijkstra'],
    breaks: [
      {
        violation: 'BFS uses a stack instead of a queue.',
        result: 'It dives deep first, so the first time it reaches a node may not be the shortest path.',
        wrong: ['Nothing changes.', 'It visits nodes twice.', 'It becomes faster and still finds shortest paths.'],
      },
    ],
    transfer: [
      {
        problem: 'A maze on a grid: find the fewest steps from the entrance to the exit.',
        answer: 'Treat each open cell as a node connected to its open neighbours, and run BFS from the entrance.',
        wrong: [
          { text: 'Always turn right.', why: 'Finds a way out, not the shortest.' },
          { text: 'DFS from the entrance.', why: 'The first path found may be long.' },
          { text: 'Try every path and count steps.', why: 'Exponentially many paths.' },
        ],
        explain: 'Every step costs 1, so BFS’s first arrival at the exit is the shortest route.',
      },
    ],
  },
  generators: {
    predict: [predictBfsOrder, predictBfsDist],
    simulate: [simulateBfs],
    count: [countBfs, growthBfs],
    explain: bfsExplain,
  },
};

// =====================================================================
// DFS
// =====================================================================

const DF = 'dfs';

const predictDfsOrder = (): Card => {
  const g = connectedGraph();
  const d = dfs(g);
  const r = bfs(g);
  return {
    concept: DF,
    type: 'predict',
    prompt: 'Depth-first search from A (neighbours tried in alphabetical order). In what order are nodes first visited?',
    scene: { views: [view(g)] },
    body: {
      kind: 'choice',
      options: options({ text: d.order.join(', '), why: 'Go to the first unvisited neighbour, keep going, back up only when stuck.' }, [
        { text: r.order.join(', '), why: 'That’s breadth-first: it finishes each level before going deeper.' },
        { text: [...g.nodes].sort().join(', '), why: 'Alphabetical order ignores the edges.' },
        { text: ['A', ...d.order.slice(1).reverse()].join(', '), why: 'Follow the edges from A.' },
      ]),
    },
    explain: `Order: ${d.order.join(', ')}. DFS goes as deep as it can, then backtracks to the most recent node with an unvisited neighbour.`,
  };
};

const predictCycleDfs = (): Card => ({
  concept: DF,
  type: 'predict',
  prompt: 'A DFS on a graph with a cycle A–B–C–A forgets to mark nodes as visited. What happens?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'It goes round the cycle forever (until the call stack overflows).', correct: true, why: 'A → B → C → A → B … nothing stops it.' },
      { text: 'It visits each node once anyway.', correct: false, why: 'Nothing tells it A was already visited.' },
      { text: 'It visits the nodes in BFS order.', correct: false, why: 'Marking doesn’t change the order, just whether it stops.' },
      { text: 'It stops at A because A is the start.', correct: false, why: 'It doesn’t know that without a visited mark.' },
    ]),
  },
  explain: 'Trees have no cycles, so tree traversals don’t need marks. Graphs do: always mark before (or as) you visit.',
});

const simulateDfs = (): Card => {
  const g = connectedGraph();
  const d = dfs(g);
  const scene: Scene = { views: [view(g)] };
  const exp = d.order.map((x) => `g:${x}`);
  return {
    concept: DF,
    type: 'simulate',
    prompt: 'Run DFS from A. Click nodes in the order they are first visited. At each node, go to its alphabetically first unvisited neighbour; if there is none, back up.',
    scene,
    body: { kind: 'click', expected: exp, frames: clickFrames(scene, exp), wrongHint: () => 'Go deeper from the most recently visited node if you can; only back up when it has no unvisited neighbours.' },
    explain: `Order: ${d.order.join(', ')}.`,
  };
};

const countDfs = (): Card => {
  const g = connectedGraph();
  const d = dfs(g);
  return {
    concept: DF,
    type: 'count',
    prompt: 'Recursive DFS from A (alphabetical neighbours). At the deepest point, how many calls are on the call stack at once (A’s call counts as 1)?',
    scene: { views: [view(g)] },
    body: { kind: 'number', answer: d.maxDepth, unit: 'calls' },
    explain: `Visit order ${d.order.join(', ')}; the longest chain of nested calls is ${d.maxDepth}. DFS memory = the depth of that chain.`,
  };
};

const growthDfs = (): Card => growthCard(DF, 'DFS over a graph with n nodes and about 2n edges', (n) => n + 2 * n, 2, 'Each node once, each edge a constant number of times: O(V + E).');

const dfsExplain = explainGenerators({
  concept: DF,
  truths: [
    'DFS follows one path as deep as it can, then backs up to try the next option.',
    'It is naturally written with recursion (or an explicit stack).',
    'It must mark visited nodes, or cycles make it loop forever.',
    'It visits each node and edge once: O(V + E).',
    'It answers reachability questions: what can I get to from here? Is there a cycle?',
  ],
  myths: [
    { text: 'DFS finds the shortest path.', why: 'The first path it finds can be long; use BFS for fewest edges.' },
    { text: 'DFS uses a queue.', why: 'That would be BFS; DFS uses a stack (the call stack).' },
    { text: 'DFS only works on trees.', why: 'It works on any graph if you mark visited nodes.' },
  ],
  chains: [
    {
      prompt: 'Why does DFS need a visited mark on graphs but not on trees?',
      steps: ['A tree has exactly one path between any two nodes.', 'So going down a tree never returns to a node.', 'A graph can have cycles leading back to a visited node.', 'Without a mark, DFS would follow the cycle forever.'],
    },
  ],
  summary: {
    best: 'DFS explores like walking a maze with one hand on the wall: go as far as you can down one path, and when you hit a dead end, back up to the last junction and try the next way.',
    others: [
      { text: 'DFS searches deeply.', why: 'Restates the name.' },
      { text: 'DFS is recursion.', why: 'Recursion is the tool, not the idea.' },
      { text: 'DFS finds the closest node first.', why: 'That’s BFS.' },
    ],
  },
});

export const dfsConcept: Concept = {
  id: DF,
  kind: 'algorithm',
  title: 'Depth-First Search',
  tier: 6,
  prereqs: ['graph', 'recursion', 'adjacency-list'],
  tagline: 'Go deep, back up, try the next way.',
  hook: {
    problem: 'You want to know whether you can get from one room to another in a big building, and which rooms you can reach at all.',
    question: 'What’s a simple way to explore everything reachable?',
    options: [
      { text: 'Walk down a corridor as far as you can, back up at dead ends, and chalk-mark rooms you’ve seen.', good: true, feedback: 'Yes: depth-first search. The chalk marks stop you going in circles.' },
      { text: 'Walk randomly.', feedback: 'You might never cover everything, or loop forever.' },
      { text: 'Only visit rooms next to the start.', feedback: 'Misses everything further away.' },
    ],
  },
  lens: {
    layout: 'A graph (adjacency list), a visited set, and a stack (usually the call stack via recursion).',
    invariant: 'Always continue from the most recently discovered node that still has unvisited neighbours; never visit a node twice.',
    payoff: 'Explores everything reachable in O(V + E) with simple code; finds cycles, components and paths.',
    price: 'Doesn’t find shortest paths; deep graphs mean deep recursion (stack overflow risk).',
  },
  learn: {
    what: 'Depth-first search (DFS) explores a graph by going as far as possible along one path before backing up. It’s the simplest way to find everything reachable from a node, detect cycles, or find any path.',
    how: [
      'Mark the current node as visited.',
      'For each neighbour (in some fixed order): if it isn’t visited, DFS into it.',
      'When a node has no unvisited neighbours left, return (back up) to the node you came from.',
      'Recursion does the backing up for you: the call stack remembers the path.',
    ],
  },
  extras: {
    family: 'graph-search',
    primitive: 'both',
    parts: ['recursion (or a stack)', 'a visited set', 'backtracking at dead ends'],
    uses: ['Find all the files reachable from a folder, including through shortcuts that may loop.', 'Check whether a network is all one connected piece.'],
    rivals: ['bfs'],
    breaks: [
      {
        violation: 'DFS never marks nodes as visited, on a graph with a cycle.',
        result: 'It goes round the cycle forever (or until the stack overflows).',
        wrong: ['It visits each node once anyway.', 'It becomes BFS.', 'It finds the shortest path.'],
      },
    ],
    transfer: [
      {
        problem: 'Count the islands on a map grid (groups of connected land cells).',
        answer: 'Scan the grid; each time you find unvisited land, count one island and DFS to mark all land connected to it.',
        wrong: [
          { text: 'Count the land cells.', why: 'One island has many cells.' },
          { text: 'Count rows that contain land.', why: 'Islands can span rows or share them.' },
          { text: 'Sort the cells.', why: 'Sorting doesn’t reveal connections.' },
        ],
        explain: 'Each DFS floods exactly one island, so the number of DFS starts is the number of islands.',
      },
    ],
  },
  generators: {
    predict: [predictDfsOrder, predictCycleDfs],
    simulate: [simulateDfs],
    count: [countDfs, growthDfs],
    explain: dfsExplain,
  },
};

// =====================================================================
// Topological sort
// =====================================================================

const TS = 'topological-sort';

const predictTopo = (): Card => {
  const g = randomDAG();
  const order = kahn(g)!;
  const wrongs = [[...g.nodes].sort(), [...order].reverse()];
  for (let i = 0; i < 40 && wrongs.filter((w) => !validTopo(g, w)).length < 5; i++) wrongs.push(shuffle(g.nodes));
  return {
    concept: TS,
    type: 'predict',
    prompt: 'Each arrow X → Y means “X must come before Y”. Which order breaks NO rule?',
    scene: { views: [view(g, false, 'Tasks and their dependencies')] },
    body: {
      kind: 'choice',
      options: options(
        { text: order.join(', '), why: 'Every arrow points forward in this order.' },
        wrongs.filter((w) => !validTopo(g, w)).map((w) => ({ text: w.join(', '), why: `Arrow ${brokenEdge(g, w)} points backwards in this order.` })),
      ),
    },
    explain: `${order.join(', ')}: every task comes after everything it depends on.`,
  };
};

function validTopo(g: WG, o: string[]) {
  return g.edges.every((e) => o.indexOf(e.a) < o.indexOf(e.b));
}
function brokenEdge(g: WG, o: string[]) {
  const e = g.edges.find((x) => o.indexOf(x.a) > o.indexOf(x.b))!;
  return `${e.a} → ${e.b}`;
}

const predictTopoCycle = (): Card => ({
  concept: TS,
  type: 'predict',
  prompt: 'Course A requires B, B requires C, and C requires A. What does topological sort report?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'No valid order exists: there’s a cycle, so no course can go first.', correct: true, why: 'Every course waits on another: nothing ever has 0 remaining prerequisites.' },
      { text: 'A, B, C.', correct: false, why: 'A needs B first.' },
      { text: 'C, B, A.', correct: false, why: 'C needs A first.' },
      { text: 'Any order works.', correct: false, why: 'Every order breaks at least one rule.' },
    ]),
  },
  explain: 'A topological order exists only if there are no cycles. Kahn’s algorithm detects this: it runs out of ready nodes before placing them all.',
});

const simulateTopo = (): Card => {
  const g = randomDAG();
  const order = kahn(g)!;
  const scene: Scene = { views: [view(g, false, 'Arrow X → Y: X must come before Y')] };
  const exp = order.map((x) => `g:${x}`);
  return {
    concept: TS,
    type: 'simulate',
    prompt: 'Kahn’s algorithm: repeatedly take a node with no remaining incoming arrows, and remove its arrows. When several are ready, take the alphabetically first. Click nodes in the order they’re taken.',
    scene,
    body: {
      kind: 'click',
      expected: exp,
      frames: clickFrames(scene, exp),
      wrongHint: (step) => {
        const done = order.slice(0, step);
        const ready = g.nodes.filter((x) => !done.includes(x) && g.edges.every((e) => e.b !== x || done.includes(e.a))).sort();
        return `Ready now (no arrows in from unfinished nodes): ${ready.join(', ')}. Take the alphabetically first.`;
      },
    },
    explain: `Order: ${order.join(', ')}. Every arrow points forward.`,
  };
};

const countTopo = (): Card => {
  const g = randomDAG();
  const x = pick(g.nodes.filter((v) => g.edges.some((e) => e.b === v)));
  const k = g.edges.filter((e) => e.b === x).length;
  return {
    concept: TS,
    type: 'count',
    prompt: `Kahn’s algorithm starts by counting incoming arrows (the in-degree). What is the in-degree of ${x}?`,
    scene: { views: [view(g)] },
    body: { kind: 'number', answer: k, unit: 'arrows in' },
    explain: `${x} waits on ${g.edges.filter((e) => e.b === x).map((e) => e.a).join(', ')}. It becomes ready when this count reaches 0.`,
  };
};

const growthTopo = (): Card => growthCard(TS, 'Kahn’s topological sort on n tasks with about 2n dependencies', (n) => 3 * n, 2, 'Each task once, each arrow once: O(V + E).');

const tsExplain = explainGenerators({
  concept: TS,
  truths: [
    'A topological order lists tasks so that every task comes after everything it depends on.',
    'It exists only when the dependencies have no cycle (a DAG).',
    'Kahn’s algorithm repeatedly takes a task with no unfinished prerequisites.',
    'It runs in O(V + E).',
  ],
  myths: [
    { text: 'There is always exactly one topological order.', why: 'Often several orders are valid.' },
    { text: 'Topological sort works on any graph.', why: 'A cycle makes it impossible.' },
    { text: 'It sorts tasks alphabetically.', why: 'It orders them by dependencies.' },
  ],
  chains: [
    {
      prompt: 'Why does Kahn’s algorithm detect cycles?',
      steps: ['A node is taken only when all its prerequisites are taken.', 'In a cycle, each node waits on another node of the cycle.', 'So no node of the cycle ever becomes ready.', 'The algorithm stops with nodes left over: a cycle exists.'],
    },
  ],
  summary: {
    best: 'Topological sort puts tasks in an order you can actually do them: keep picking something whose prerequisites are all done.',
    others: [
      { text: 'It sorts a graph.', why: 'Too vague.' },
      { text: 'It’s BFS.', why: 'Kahn’s uses a queue, but the point is dependency order.' },
      { text: 'It sorts nodes by how many edges they have.', why: 'Order comes from the arrows, not the counts.' },
    ],
  },
});

export const topologicalSortConcept: Concept = {
  id: TS,
  kind: 'algorithm',
  title: 'Topological Sort',
  tier: 6,
  prereqs: ['bfs'],
  tagline: 'Do things in an order that respects dependencies.',
  hook: {
    problem: 'Some courses require others first. You need an order to take all of them.',
    question: 'How do you find such an order?',
    options: [
      { text: 'Repeatedly take a course whose prerequisites are all done.', good: true, feedback: 'Yes: topological sort (Kahn’s algorithm).' },
      { text: 'Take them alphabetically.', feedback: 'Ignores the requirements.' },
      { text: 'Take the course with the most prerequisites first.', feedback: 'Its prerequisites aren’t done yet.' },
    ],
  },
  lens: {
    layout: 'A directed graph of dependencies, an in-degree count per node, and a queue of ready nodes.',
    invariant: 'A node is output only after every node pointing to it has been output.',
    payoff: 'A valid order for any set of dependencies in O(V + E), and detects impossible (cyclic) ones.',
    price: 'Only works on graphs with no cycles; the order is often not unique.',
  },
  learn: {
    what: 'Topological sort orders tasks so that every task comes after the tasks it depends on: build steps, course plans, spreadsheet formulas. The dependencies form a directed graph; an arrow X → Y means X must come first.',
    how: [
      'Count each node’s incoming arrows (its in-degree): how many things it waits on.',
      'Nodes with in-degree 0 are ready. Take one and add it to the order.',
      'Remove its outgoing arrows: every node it pointed to waits on one fewer thing.',
      'Repeat. If nodes remain but none are ready, there is a cycle and no order exists.',
    ],
  },
  extras: {
    family: 'dependency-ordering',
    primitive: 'both',
    parts: ['in-degree counts', 'a queue of ready nodes', 'removing a node’s outgoing arrows'],
    uses: ['Decide what order to compile modules in, given which ones import which.', 'Plan a university degree given course prerequisites.'],
    breaks: [
      {
        violation: 'You take a node while it still has an incoming arrow from an unfinished node.',
        result: 'That task comes before something it depends on: the order is invalid.',
        wrong: ['The order is still valid.', 'It detects a cycle.', 'It just takes longer.'],
      },
    ],
    transfer: [
      {
        problem: 'A spreadsheet: each cell’s formula may use other cells. In what order should cells be recalculated?',
        answer: 'Topologically sort the cells by “uses” arrows; a cycle means a circular reference error.',
        wrong: [
          { text: 'Top-left to bottom-right.', why: 'A cell can use one further down.' },
          { text: 'Recalculate everything repeatedly until nothing changes.', why: 'Slow, and never finishes with circular references.' },
          { text: 'Most-used cells last.', why: 'Usage count doesn’t give dependency order.' },
        ],
        explain: 'Each cell must be calculated after the cells it reads: exactly a topological order.',
      },
    ],
  },
  generators: {
    predict: [predictTopo, predictTopoCycle],
    simulate: [simulateTopo],
    count: [countTopo, growthTopo],
    explain: tsExplain,
  },
};

// =====================================================================
// Dijkstra
// =====================================================================

const DJ = 'dijkstra';

const predictDist = (): Card => {
  const { g, dist } = dijkstraGraph();
  const x = pick(g.nodes.filter((v) => v !== 'A'));
  const hops = bfs(g).dist.get(x)!;
  const direct = g.edges.find((e) => (e.a === 'A' && e.b === x) || (e.b === 'A' && e.a === x));
  const d = dist.get(x)!;
  return {
    concept: DJ,
    type: 'predict',
    prompt: `Edge numbers are distances. What is the shortest total distance from A to ${x}?`,
    scene: { views: [view(g, true)] },
    body: {
      kind: 'choice',
      options: numberOptions(d, [
        ...(direct && direct.w !== d ? [{ value: direct.w, why: 'The direct road isn’t the shortest route here.' }] : []),
        { value: hops, why: 'That counts edges, not distance.' },
        { value: d + 1, why: 'There’s a shorter route.' },
        { value: d + 2, why: 'There’s a shorter route.' },
      ], 'Add up the weights along the cheapest path.'),
    },
    explain: `Shortest distances from A: ${[...dist].map(([k, v]) => `${k}=${v}`).join(', ')}.`,
  };
};

const predictNegative = (): Card => ({
  concept: DJ,
  type: 'predict',
  prompt: 'Dijkstra finalises the closest unfinished node at each step. What if some edges have NEGATIVE weights?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'It can give wrong answers: a finalised node might later be reachable more cheaply through a negative edge.', correct: true, why: 'The “closest is final” rule assumes paths never get cheaper by going further.' },
      { text: 'It still works perfectly.', correct: false, why: 'Its key rule breaks.' },
      { text: 'It crashes.', correct: false, why: 'It runs; the answers are just wrong.' },
      { text: 'It becomes BFS.', correct: false, why: 'Weights still matter.' },
    ]),
  },
  explain: 'Dijkstra needs non-negative weights. With negative ones, use Bellman–Ford.',
});

const simulateDj = (): Card => {
  const { g, dist, done } = dijkstraGraph();
  const scene: Scene = { views: [view(g, true)] };
  const exp = done.map((x) => `g:${x}`);
  return {
    concept: DJ,
    type: 'simulate',
    prompt: 'Run Dijkstra from A. Click nodes in the order they are FINALISED: each time, the unfinished node with the smallest known distance.',
    scene,
    body: { kind: 'click', expected: exp, frames: clickFrames(scene, exp), wrongHint: (step) => `Next is the unfinished node with the smallest distance so far. (It turns out to be ${done[step]} at distance ${dist.get(done[step])}.)` },
    explain: `Final order: ${done.map((x) => `${x} (${dist.get(x)})`).join(', ')}. Nodes are finalised in increasing distance.`,
  };
};

const countDj = (): Card => {
  const { g, dist } = dijkstraGraph();
  const x = done2(dist);
  return {
    concept: DJ,
    type: 'count',
    prompt: `Edge numbers are distances. Shortest distance from A to ${x}?`,
    scene: { views: [view(g, true)] },
    body: { kind: 'number', answer: dist.get(x)!, unit: 'distance' },
    explain: `Distances: ${[...dist].map(([k, v]) => `${k}=${v}`).join(', ')}.`,
  };
};
const done2 = (dist: Map<string, number>) => [...dist].sort((a, b) => b[1] - a[1])[0][0];

const growthDj = (): Card =>
  growthCard(DJ, 'Dijkstra with a binary heap, n nodes and 2n edges (heap operations × log n)', (n) => Math.round(3 * n * Math.log2(n)), 4, 'O((V + E) log V): each edge may push into a heap of size up to V.');

const djExplain = explainGenerators({
  concept: DJ,
  truths: [
    'Dijkstra finds shortest paths when edges have (non-negative) weights.',
    'It always finalises the unfinished node with the smallest known distance next.',
    'When a node is finalised, it relaxes its edges: maybe a neighbour just got a shorter route.',
    'A min-heap (priority queue) finds the closest node quickly: O((V + E) log V).',
  ],
  myths: [
    { text: 'Dijkstra works with negative edge weights.', why: 'A negative edge can make a finalised distance wrong.' },
    { text: 'Dijkstra finds the path with the fewest edges.', why: 'It minimises total weight; fewest edges is BFS.' },
    { text: 'Dijkstra uses a plain queue.', why: 'It needs the smallest distance next: a priority queue.' },
  ],
  chains: [
    {
      prompt: 'Why is the closest unfinished node’s distance final?',
      steps: ['Every other route to it must pass through some other unfinished node.', 'Those nodes are already at least as far away.', 'Edges can’t be negative, so going through them only adds distance.', 'So no cheaper route can exist: its distance is final.'],
    },
  ],
  summary: {
    best: 'Dijkstra is like water spreading through pipes of different lengths: it always settles the closest place next, and uses that to update how far its neighbours are.',
    others: [
      { text: 'It finds shortest paths.', why: 'Doesn’t say how.' },
      { text: 'It’s BFS with a heap.', why: 'Close, but misses why the closest node is final.' },
      { text: 'It tries every path.', why: 'It never enumerates paths.' },
    ],
  },
});

export const dijkstraConcept: Concept = {
  id: DJ,
  kind: 'algorithm',
  title: 'Dijkstra’s Shortest Paths',
  tier: 6,
  prereqs: ['bfs', 'binary-heap'],
  tagline: 'Always settle the closest place next.',
  hook: {
    problem: 'A map app must find the quickest route. Roads have different lengths, so BFS’s “fewest roads” is wrong.',
    question: 'How do you adapt BFS to lengths?',
    options: [
      { text: 'Instead of a plain queue, always continue from the closest place not yet settled (a priority queue).', good: true, feedback: 'Yes: Dijkstra’s algorithm.' },
      { text: 'Take the shortest road out of each place.', feedback: 'Greedy per road can lead you far away.' },
      { text: 'Use BFS and hope.', feedback: 'Fewest roads ≠ shortest distance.' },
    ],
  },
  lens: {
    layout: 'A weighted graph, a distance table, and a min-heap of (distance, node).',
    invariant: 'The node taken from the heap has the smallest distance of all unfinished nodes, so its distance is final.',
    payoff: 'Shortest weighted paths from one source in O((V + E) log V).',
    price: 'Wrong with negative edges; more work than BFS when all weights are equal.',
  },
  learn: {
    what: 'Dijkstra’s algorithm finds the shortest distance from one place to every other when edges have lengths (weights). It is BFS with a priority queue: always continue from the closest place you haven’t settled yet.',
    how: [
      'Distance to the start is 0; everything else is ∞ (unknown).',
      'Take the unfinished node with the smallest distance (from a min-heap). Its distance is now final.',
      'For each neighbour: if distance(node) + edge weight beats the neighbour’s distance, update it (“relax” the edge).',
      'Repeat until every node is finished. All weights must be ≥ 0.',
    ],
  },
  extras: {
    family: 'shortest-path',
    primitive: 'both',
    parts: ['a min-heap of distances', 'a distance table', 'relaxing edges'],
    uses: ['Find the quickest driving route when roads have different travel times.', 'Route network packets along the lowest-delay path.'],
    rivals: ['bfs'],
    breaks: [
      {
        violation: 'The graph has an edge with a negative weight.',
        result: 'A node can be finalised too early, and its reported distance is wrong.',
        wrong: ['It still returns correct distances.', 'It crashes immediately.', 'It becomes BFS.'],
      },
    ],
    transfer: [
      {
        problem: 'A game map: moving through grass costs 1, through swamp costs 5. Find the cheapest path.',
        answer: 'Make each cell a node with edges weighted by the cost of entering it, and run Dijkstra.',
        wrong: [
          { text: 'BFS.', why: 'Treats grass and swamp as the same cost.' },
          { text: 'DFS.', why: 'Finds a path, not the cheapest.' },
          { text: 'Always step to the cheapest neighbour.', why: 'Can walk into a dead end or a longer route.' },
        ],
        explain: 'Different step costs are edge weights: exactly Dijkstra’s job.',
      },
    ],
  },
  generators: {
    predict: [predictDist, predictNegative],
    simulate: [simulateDj],
    count: [countDj, growthDj],
    explain: djExplain,
  },
};

// =====================================================================
// Kruskal (minimum spanning tree)
// =====================================================================

const KR = 'kruskal';

const kGraph = () => connectedGraph(randInt(5, 6), randInt(2, 3), false, shuffle(Array.from({ length: 12 }, (_, i) => i + 1)));
const edgeRow = (s: WG['edges']): View => ({ type: 'row', key: 'e', items: s.map((e) => `${e.a}–${e.b}: ${e.w}`), title: 'Edges, sorted by weight' });

const predictMst = (): Card => {
  const g = kGraph();
  const k = kruskal(g);
  const all = g.edges.reduce((s, e) => s + e.w, 0);
  const cheapest = k.sorted.slice(0, g.nodes.length - 1).reduce((s, e) => s + e.w, 0);
  return {
    concept: KR,
    type: 'predict',
    prompt: 'Connect all the towns with roads (edge numbers = cost), using the cheapest possible total. What’s the total cost?',
    scene: { views: [view(g, true)] },
    body: {
      kind: 'choice',
      options: numberOptions(k.total, [
        { value: all, why: 'You don’t need every road: that includes cycles.' },
        ...(cheapest !== k.total ? [{ value: cheapest, why: 'The cheapest n−1 roads can form a cycle and leave a town out.' }] : []),
        { value: k.total + 1, why: 'There’s a cheaper choice.' },
        { value: k.total + 2, why: 'There’s a cheaper choice.' },
      ], 'Take roads cheapest-first, skipping any that would close a loop.'),
    },
    explain: `Roads taken: ${k.taken.map((i) => `${k.sorted[i].a}–${k.sorted[i].b} (${k.sorted[i].w})`).join(', ')} = ${k.total}.`,
  };
};

const simulateKr = (): Card => {
  const g = kGraph();
  const k = kruskal(g);
  const scene: Scene = { views: [view(g, true), edgeRow(k.sorted)] };
  const exp = k.taken.map((i) => `e:${i}`);
  return {
    concept: KR,
    type: 'simulate',
    prompt: 'Kruskal: go through the edges cheapest first. Click each edge you KEEP; skip any edge whose two ends are already connected by kept edges.',
    scene,
    body: {
      kind: 'click',
      expected: exp,
      frames: clickFrames(scene, exp),
      wrongHint: () => 'Take the cheapest remaining edge unless its ends are already joined through edges you kept (it would close a loop).',
    },
    explain: `Kept ${k.taken.length} edges (always n − 1 for n towns), total ${k.total}.`,
  };
};

const countKr = (): Card => {
  const n = randInt(4, 30);
  return {
    concept: KR,
    type: 'count',
    prompt: `A minimum spanning tree connects ${n} towns. How many roads (edges) does it contain?`,
    body: { kind: 'number', answer: n - 1, unit: 'edges' },
    explain: `Any tree on ${n} nodes has ${n - 1} edges: each edge joins one more town to the rest.`,
  };
};

const countKrTotal = (): Card => {
  const g = kGraph();
  const k = kruskal(g);
  return {
    concept: KR,
    type: 'count',
    prompt: 'Minimum spanning tree: connect all nodes as cheaply as possible (edge numbers = cost). What’s the total cost?',
    scene: { views: [view(g, true), edgeRow(k.sorted)] },
    body: { kind: 'number', answer: k.total, unit: 'cost' },
    explain: `Kept: ${k.taken.map((i) => `${k.sorted[i].a}–${k.sorted[i].b} (${k.sorted[i].w})`).join(', ')} = ${k.total}.`,
  };
};

const krExplain = explainGenerators({
  concept: KR,
  truths: [
    'A minimum spanning tree connects every node with the smallest total edge weight and no cycles.',
    'Kruskal sorts all edges by weight and takes them cheapest first.',
    'It skips an edge if its ends are already connected (union-find answers this fast).',
    'It runs in O(E log E), dominated by sorting the edges.',
  ],
  myths: [
    { text: 'The MST gives the shortest path between any two nodes.', why: 'It minimises total wiring, not individual routes.' },
    { text: 'Kruskal takes the cheapest n − 1 edges.', why: 'Some cheap edges close cycles and must be skipped.' },
    { text: 'Kruskal needs to check for cycles with a full DFS each time.', why: 'Union-find does it in near O(1).' },
  ],
  chains: [
    {
      prompt: 'Why is it safe to take the cheapest edge that doesn’t form a cycle?',
      steps: ['The kept edges form separate groups.', 'The cheapest edge joining two groups must be crossed by some MST anyway.', 'Swapping in that cheapest edge can’t make the total bigger.', 'So taking it never loses the best answer.'],
    },
  ],
  summary: {
    best: 'Kruskal builds the cheapest network by buying links in order of price, skipping any link that connects two places already connected.',
    others: [
      { text: 'It finds a spanning tree.', why: 'Misses “cheapest” and how.' },
      { text: 'It’s a greedy algorithm.', why: 'Names the category, not the idea.' },
      { text: 'It finds shortest paths.', why: 'That’s Dijkstra.' },
    ],
  },
});

export const kruskalConcept: Concept = {
  id: KR,
  kind: 'algorithm',
  title: 'Kruskal’s MST',
  tier: 6,
  prereqs: ['union-find', 'edge-list', 'merge-sort'],
  tagline: 'Buy links cheapest first; skip ones that close a loop.',
  hook: {
    problem: 'Lay cable so every town is connected, with the least total cable. Each possible link has a cost.',
    question: 'How do you choose links?',
    options: [
      { text: 'Go through links cheapest first; take each one unless its two towns are already connected.', good: true, feedback: 'Yes: Kruskal’s algorithm. Union-find answers “already connected?” instantly.' },
      { text: 'Take all links.', feedback: 'Loops waste cable.' },
      { text: 'Connect every town to the first town.', feedback: 'Those links may be very expensive.' },
    ],
  },
  lens: {
    layout: 'An edge list sorted by weight, plus a union-find of which nodes are already connected.',
    invariant: 'The kept edges never form a cycle, and each kept edge is the cheapest one joining two separate groups.',
    payoff: 'The minimum total cost to connect everything, in O(E log E).',
    price: 'Must sort all edges first; only for undirected graphs; doesn’t give shortest routes.',
  },
  learn: {
    what: 'A minimum spanning tree (MST) connects every node of a weighted graph using the smallest total edge weight, with no loops. Kruskal’s algorithm builds it greedily: cheapest links first, never closing a loop.',
    how: [
      'Sort all edges from cheapest to most expensive.',
      'Start with every node in its own group (union-find).',
      'For each edge in order: if its ends are in different groups, keep it and merge the groups; otherwise skip it (it would make a loop).',
      'Stop when you’ve kept n − 1 edges: everything is connected.',
    ],
  },
  extras: {
    family: 'spanning-tree',
    primitive: 'both',
    parts: ['edges sorted by weight', 'union-find to detect loops', 'keeping n − 1 edges'],
    uses: ['Connect every building on a campus with the least total cable.', 'Group similar points into clusters by linking the closest pairs first.'],
    breaks: [
      {
        violation: 'You keep an edge whose two ends are already in the same group.',
        result: 'It closes a loop: extra cost for no new connection, so the result is no longer a minimum tree.',
        wrong: ['The total stays minimal.', 'A node gets disconnected.', 'Nothing changes.'],
      },
    ],
    transfer: [
      {
        problem: 'Split 1,000 customers into 5 groups of similar customers, given a distance between each pair.',
        answer: 'Run Kruskal but stop when 5 groups remain: each group is a cluster.',
        wrong: [
          { text: 'Sort customers by name and cut into 5.', why: 'Names say nothing about similarity.' },
          { text: 'Run BFS from 5 random customers.', why: 'Ignores distances.' },
          { text: 'Pick the 5 most distant customers.', why: 'Doesn’t group anyone.' },
        ],
        explain: 'Kruskal merges the closest groups first; stopping early leaves natural clusters.',
      },
    ],
  },
  generators: {
    predict: [predictMst],
    simulate: [simulateKr],
    count: [countKr, countKrTotal],
    explain: krExplain,
  },
};

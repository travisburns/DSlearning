import type { Card, Concept, Scene, TreeNode, Val, View } from '../engine/types';
import { cloneScene } from '../engine/memory';
import { pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions, options } from './helpers';

type Edge = [string, string];

interface G {
  nodes: string[];
  edges: Edge[];
  directed: boolean;
}

function randomGraph(directed = false, n = randInt(5, 6), extra = randInt(2, 4)): G {
  const nodes = 'ABCDEFG'.split('').slice(0, n);
  const edges: Edge[] = [];
  const key = (a: string, b: string) => (directed ? `${a}${b}` : [a, b].sort().join(''));
  const seen = new Set<string>();
  const add = (a: string, b: string) => {
    if (a === b || seen.has(key(a, b))) return false;
    seen.add(key(a, b));
    edges.push([a, b]);
    return true;
  };
  // A random spanning tree keeps it connected, then some extra edges.
  const order = shuffle(nodes);
  for (let i = 1; i < order.length; i++) {
    const other = pick(order.slice(0, i));
    Math.random() < 0.5 || !directed ? add(other, order[i]) : add(order[i], other);
  }
  let tries = 0;
  while (extra > 0 && tries++ < 50) if (add(pick(nodes), pick(nodes))) extra--;
  return { nodes, edges, directed };
}

const neighbours = (g: G, x: string) =>
  g.edges.flatMap(([a, b]) => (a === x ? [b] : !g.directed && b === x ? [a] : [])).sort();
const inDeg = (g: G, x: string) => g.edges.filter(([, b]) => b === x).length;

const graphView = (g: G, title?: string): View => ({ type: 'graph', nodes: g.nodes.map((id) => ({ id, label: id })), edges: g.edges.map(([from, to]) => ({ from, to })), directed: g.directed, title });
const matrix = (g: G): Val[][] => g.nodes.map((r) => g.nodes.map((c) => (g.edges.some(([a, b]) => (a === r && b === c) || (!g.directed && a === c && b === r)) ? 1 : 0)));
const matrixView = (g: G, title = 'Adjacency matrix (row = from, column = to)'): View => ({ type: 'grid', key: 'x', rows: matrix(g), rowLabels: g.nodes, colLabels: g.nodes, title });
const listView = (g: G, title = 'Adjacency list'): View => ({ type: 'buckets', key: 'l', buckets: g.nodes.map((x) => neighbours(g, x)), labels: g.nodes, title });
const edgeListView = (g: G, title = 'Edge list'): View => ({ type: 'row', key: 'e', items: g.edges.map(([a, b]) => `${a}${g.directed ? '→' : '–'}${b}`), title });

// =====================================================================
// Graph basics
// =====================================================================

const GB = 'graph';

const predictDegree = (): Card => {
  const directed = Math.random() < 0.4;
  const g = randomGraph(directed);
  const x = pick(g.nodes);
  const out = neighbours(g, x).length;
  if (!directed)
    return {
      concept: GB,
      type: 'predict',
      prompt: `What is the degree of ${x} (how many edges touch it)?`,
      scene: { views: [graphView(g)] },
      body: {
        kind: 'choice',
        options: numberOptions(out, [
          { value: out + 1, why: 'Count only the lines touching ' + x + '.' },
          { value: g.edges.length, why: 'That’s the total number of edges.' },
          { value: Math.max(0, out - 1), why: 'Count every line touching ' + x + '.' },
        ], 'Count the edges at ' + x + '.'),
      },
      explain: `${x} connects to ${neighbours(g, x).join(', ')}: degree ${out}.`,
    };
  const ind = inDeg(g, x);
  return {
    concept: GB,
    type: 'predict',
    prompt: `Directed graph. How many arrows leave ${x}, and how many arrive at it?`,
    scene: { views: [graphView(g)] },
    body: {
      kind: 'choice',
      options: options({ text: `out ${out}, in ${ind}`, why: 'Arrows pointing away = out; pointing at = in.' }, [
        { text: `out ${ind}, in ${out}`, why: 'Swapped: follow the arrowheads.' },
        { text: `out ${out + ind}, in ${out + ind}`, why: 'Direction matters: split them.' },
        { text: `out ${out}, in ${out}`, why: 'In-arrows and out-arrows are counted separately.' },
      ]),
    },
    explain: `${x} → ${neighbours(g, x).join(', ') || 'nobody'} (out ${out}); ${ind} arrow${ind === 1 ? '' : 's'} point at ${x}.`,
  };
};

function reachable(g: G, s: string): Set<string> {
  const seen = new Set([s]);
  const st = [s];
  while (st.length) for (const y of neighbours(g, st.pop()!)) if (!seen.has(y)) seen.add(y), st.push(y);
  return seen;
}

const predictPath = (): Card => {
  const g = randomGraph(true, 5, 1);
  const [a, b] = shuffle(g.nodes).slice(0, 2);
  const yes = reachable(g, a).has(b);
  return {
    concept: GB,
    type: 'predict',
    prompt: `Directed graph (follow the arrows). Can you get from ${a} to ${b}?`,
    scene: { views: [graphView(g)] },
    body: {
      kind: 'choice',
      options: [
        { text: 'Yes', correct: yes, why: yes ? 'There’s a chain of arrows from ' + a + ' to ' + b + '.' : 'Check the arrow directions carefully.' },
        { text: 'No', correct: !yes, why: !yes ? 'Every route needs at least one arrow the wrong way.' : 'Look for a chain of arrows.' },
      ],
    },
    explain: `From ${a} you can reach: ${[...reachable(g, a)].filter((x) => x !== a).join(', ') || 'nothing'}. In a directed graph, reaching B from A doesn't mean reaching A from B.`,
  };
};

const simulateNeighbours = (): Card => {
  const g = randomGraph(false);
  const x = pick(g.nodes.filter((n) => neighbours(g, n).length >= 2));
  const nb = neighbours(g, x);
  const scene: Scene = { views: [graphView(g)] };
  const frames = [scene];
  nb.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: [`g:${x}`, ...nb.slice(0, i + 1).map((y) => `g:${y}`)] }));
  return {
    concept: GB,
    type: 'simulate',
    prompt: `Click every neighbour of ${x}, in alphabetical order.`,
    scene,
    body: { kind: 'click', expected: nb.map((y) => `g:${y}`), frames, wrongHint: () => `Neighbours share an edge with ${x}. Go alphabetically.` },
    explain: `${x}'s neighbours: ${nb.join(', ')}.`,
  };
};

const countMaxEdges = (): Card => {
  const n = randInt(4, 40);
  const directed = pick([true, false]);
  return {
    concept: GB,
    type: 'count',
    prompt: `A ${directed ? 'directed' : 'undirected'} graph has ${n} nodes, no self-loops, and at most one edge per ${directed ? 'ordered pair' : 'pair'}. What's the maximum number of edges?`,
    body: { kind: 'number', answer: directed ? n * (n - 1) : (n * (n - 1)) / 2, unit: 'edges' },
    explain: directed ? `Each of ${n} nodes can point to ${n - 1} others: ${n * (n - 1)}.` : `Every pair once: ${n} × ${n - 1} / 2 = ${(n * (n - 1)) / 2}. Edges can grow like n², which matters for how you store them.`,
  };
};

const countDegreeSum = (): Card => {
  const e = randInt(3, 60);
  return {
    concept: GB,
    type: 'count',
    prompt: `An undirected graph has ${e} edges. What's the sum of all nodes' degrees?`,
    body: { kind: 'number', answer: 2 * e, unit: '' },
    explain: `Each edge adds 1 to the degree of both ends: 2 × ${e} = ${2 * e}.`,
  };
};

const gbExplain = explainGenerators({
  concept: GB,
  truths: [
    'A graph is a set of nodes and edges between them, with no root or hierarchy.',
    'In a directed graph, an edge goes one way; in an undirected graph, both ways.',
    'A tree is a special graph: connected, with no cycles.',
    'A graph with n nodes can have up to about n² edges.',
    'In an undirected graph, the degrees add up to twice the number of edges.',
  ],
  myths: [
    { text: 'Every graph has a root node.', why: 'That’s trees. Graphs have no special start.' },
    { text: 'If A can reach B, then B can reach A.', why: 'Not in directed graphs.' },
    { text: 'A graph with n nodes has at most n − 1 edges.', why: 'That’s a tree; graphs can have up to n(n−1)/2.' },
    { text: 'Graphs can’t contain cycles.', why: 'Cycles are common: roads, friendships, links.' },
  ],
  chains: [
    {
      prompt: 'Why do degrees add up to twice the edges (undirected)?',
      steps: ['Each edge has two ends.', 'Each end adds 1 to the degree of its node.', 'So each edge adds exactly 2 to the total.', 'Total degree = 2 × edges.'],
    },
  ],
  summary: {
    best: 'A graph is dots and the lines between them, with no top, no bottom and no rules about who connects to whom; it’s the shape of maps, friendships and the web.',
    others: [
      { text: 'A graph is a chart with axes.', why: 'Different meaning of “graph”.' },
      { text: 'A graph is a set V with E ⊆ V × V.', why: 'Correct but opaque.' },
      { text: 'A graph is a tree with more edges.', why: 'Trees are a special case, not the other way round.' },
    ],
  },
});

export const graphConcept: Concept = {
  id: GB,
  title: 'Graph Basics',
  tier: 6,
  prereqs: ['tree'],
  tagline: 'Dots and lines. No root, cycles allowed.',
  hook: {
    problem: 'Cities connected by roads: a city can have many roads, roads form loops, and there is no "top" city. A tree insists on one parent and no loops.',
    question: 'What structure models "anything connected to anything"?',
    options: [
      { text: 'Nodes plus a set of edges between pairs of nodes, with no other rules.', good: true, feedback: 'Yes. That’s a graph. Trees, lists and grids are all special cases.' },
      { text: 'A tree with the capital as root.', feedback: 'Then the loops and multiple routes disappear.' },
      { text: 'A 2D array of cities.', feedback: 'Grids only connect neighbours in fixed directions.' },
    ],
  },
  lens: {
    layout: 'Abstract: nodes and edges. Concrete layouts (matrix, adjacency list, edge list) come next.',
    invariant: 'An edge connects two nodes (with a direction, if directed). That’s the only rule.',
    payoff: 'Models networks of any shape: roads, social links, dependencies, web pages.',
    price: 'No natural order or root; up to n² edges; algorithms must handle cycles (track visited nodes).',
  },
  generators: {
    predict: [predictDegree, predictPath],
    simulate: [simulateNeighbours],
    count: [countMaxEdges, countDegreeSum],
    explain: gbExplain,
  },
};

// =====================================================================
// Adjacency matrix
// =====================================================================

const AM = 'adjacency-matrix';

const predictMatrixEdge = (): Card => {
  const g = randomGraph(true);
  const [a, b] = shuffle(g.nodes).slice(0, 2);
  const m = matrix(g);
  const ia = g.nodes.indexOf(a);
  const ib = g.nodes.indexOf(b);
  return {
    concept: AM,
    type: 'predict',
    prompt: `Using only the matrix (row = from, column = to): is there an edge ${a} → ${b}? And ${b} → ${a}?`,
    scene: { views: [matrixView(g)] },
    body: {
      kind: 'choice',
      options: options({ text: `${a}→${b}: ${m[ia][ib] ? 'yes' : 'no'}, ${b}→${a}: ${m[ib][ia] ? 'yes' : 'no'}`, why: `Read cell [${a}][${b}] and cell [${b}][${a}].` }, [
        { text: `${a}→${b}: ${m[ib][ia] ? 'yes' : 'no'}, ${b}→${a}: ${m[ia][ib] ? 'yes' : 'no'}`, why: 'Row is *from*, column is *to*. You swapped them.' },
        { text: `${a}→${b}: ${m[ia][ib] ? 'no' : 'yes'}, ${b}→${a}: ${m[ib][ia] ? 'no' : 'yes'}`, why: '1 means an edge exists.' },
        { text: `${a}→${b}: yes, ${b}→${a}: yes`, why: 'Directed: each direction is its own cell.' },
      ]),
    },
    explain: `One cell read per question: O(1) edge checks. That's the matrix's superpower.`,
  };
};

const predictSymmetric = (): Card => ({
  concept: AM,
  type: 'predict',
  prompt: 'For an UNDIRECTED graph, what’s always true of its adjacency matrix?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'It’s symmetric: cell [i][j] equals cell [j][i].', correct: true, why: 'An undirected edge goes both ways, so both cells are set.' },
      { text: 'Every row has the same number of 1s.', correct: false, why: 'Rows count degrees, which can differ.' },
      { text: 'The diagonal is all 1s.', correct: false, why: 'The diagonal is self-loops, usually all 0.' },
      { text: 'It has exactly n 1s.', correct: false, why: 'It has 2 × (number of edges) 1s.' },
    ]),
  },
  explain: 'Symmetric means you could store only half of it. Directed graphs lose that symmetry.',
});

const simulateMatrixRow = (): Card => {
  const g = randomGraph(false);
  const x = pick(g.nodes);
  const ix = g.nodes.indexOf(x);
  const scene: Scene = { views: [matrixView(g, 'Adjacency matrix')] };
  const expected = g.nodes.map((_, j) => `x:${ix},${j}`);
  const frames = [scene];
  expected.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: expected.slice(0, i + 1) }));
  return {
    concept: AM,
    type: 'simulate',
    prompt: `To list ALL neighbours of ${x} from the matrix, which cells must you read? Click them in order.`,
    scene,
    body: { kind: 'click', expected, frames, wrongHint: () => `${x}'s neighbours are in row ${x}. You can't know which cells are 1 without reading every one, left to right.` },
    explain: `The whole row: ${g.nodes.length} reads, even though ${x} has only ${neighbours(g, x).length} neighbour(s). Listing neighbours is O(n) with a matrix.`,
  };
};

const countMatrixCells = (): Card => {
  const n = pick([10, 100, 1000, 5000]);
  return {
    concept: AM,
    type: 'count',
    prompt: `An adjacency matrix for a graph with ${n.toLocaleString()} nodes has how many cells?`,
    body: { kind: 'number', answer: n * n, unit: 'cells' },
    explain: `${n} × ${n} = ${(n * n).toLocaleString()}, whether the graph has 5 edges or a million. Matrices suit dense graphs.`,
  };
};

const growthMatrix = (): Card =>
  pick([
    () => growthCard(AM, 'memory for an n-node adjacency matrix', (n) => n * n, 3, 'n rows × n columns.'),
    () => growthCard(AM, 'check whether edge (u, v) exists', () => 1, 0, 'One cell read.'),
    () => growthCard(AM, 'list the neighbours of one node', (n) => n, 2, 'Read the whole row.'),
  ])();

const amExplain = explainGenerators({
  concept: AM,
  truths: [
    'An adjacency matrix is an n × n grid; cell [i][j] = 1 if there’s an edge from i to j.',
    'Checking whether an edge exists is O(1): read one cell.',
    'Listing a node’s neighbours means reading its whole row: O(n).',
    'It always uses n² cells, however few edges there are.',
    'For undirected graphs the matrix is symmetric.',
  ],
  myths: [
    { text: 'A sparse graph’s matrix is small.', why: 'It’s always n², mostly zeros.' },
    { text: 'Finding a node’s neighbours is O(degree).', why: 'You must scan all n cells of its row.' },
    { text: 'Rows and columns are interchangeable for directed graphs.', why: 'Row = from, column = to.' },
  ],
  chains: [
    {
      prompt: 'Why is an edge check O(1) in a matrix?',
      steps: ['Each node has a fixed index.', 'Cell [i][j] is at base + i × n + j: a 2D array.', 'So any cell is one address calculation away.', 'One read answers “is there an edge?”'],
    },
  ],
  summary: {
    best: 'It’s a mileage chart: a table with every place along the top and the side, and a mark where two places connect. Instant to check any pair, but it always has n × n boxes.',
    others: [
      { text: 'It represents a graph as a matrix.', why: 'Restates the name.' },
      { text: 'It’s the best way to store graphs.', why: 'Only for dense graphs.' },
      { text: 'It lists each node’s neighbours.', why: 'That’s the adjacency list.' },
    ],
  },
});

export const adjacencyMatrixConcept: Concept = {
  id: AM,
  title: 'Adjacency Matrix',
  tier: 6,
  prereqs: [GB, 'matrix'],
  tagline: 'An n × n grid of "is there an edge?"',
  hook: {
    problem: 'A flight app is asked "is there a direct flight from X to Y?" millions of times a day.',
    question: 'How could that question be answered in one step?',
    options: [
      { text: 'Keep a grid with a row and column per airport; mark the cell when a route exists.', good: true, feedback: 'Yes: an adjacency matrix. Any pair is one cell read.' },
      { text: 'Keep a list of routes and scan it.', feedback: 'O(E) per question: too slow at this volume.' },
      { text: 'Store routes in a tree.', feedback: 'That would take a search per question.' },
    ],
  },
  lens: {
    layout: 'A 2D array: n × n cells, one per ordered pair of nodes.',
    invariant: 'Cell [i][j] is 1 (or the weight) exactly when edge i → j exists.',
    payoff: 'O(1) edge existence checks; simple; great for dense graphs.',
    price: 'O(n²) memory always; listing neighbours is O(n) even for low-degree nodes.',
  },
  generators: {
    predict: [predictMatrixEdge, predictSymmetric],
    simulate: [simulateMatrixRow],
    count: [countMatrixCells, growthMatrix],
    explain: amExplain,
  },
};

// =====================================================================
// Adjacency list
// =====================================================================

const AL = 'adjacency-list';

const predictListNeighbours = (): Card => {
  const g = randomGraph(true);
  const x = pick(g.nodes.filter((n) => neighbours(g, n).length >= 1));
  const into = g.edges.filter(([, b]) => b === x).map(([a]) => a);
  return {
    concept: AL,
    type: 'predict',
    prompt: `Directed graph, stored as an adjacency list (each node lists where its arrows go). Which nodes can you reach in ONE step from ${x}?`,
    scene: { views: [graphView(g), listView(g)] },
    body: {
      kind: 'choice',
      options: options({ text: neighbours(g, x).join(', '), why: `Just read ${x}'s list.` }, [
        { text: into.join(', ') || '(none)', why: 'Those point *at* ' + x + '. Out-edges are in ' + x + '’s own list.' },
        { text: [...new Set([...neighbours(g, x), ...into])].sort().join(', '), why: 'Directed: only out-edges count.' },
        { text: g.nodes.filter((n) => n !== x).join(', '), why: 'Only the listed neighbours.' },
      ]),
    },
    explain: `${x}'s list: ${neighbours(g, x).join(', ')}. Reading it costs O(degree), not O(n).`,
  };
};

const predictListMemory = (): Card => {
  const n = randInt(5, 1000);
  const e = randInt(n, 3 * n);
  return {
    concept: AL,
    type: 'predict',
    prompt: `An UNDIRECTED graph with ${n} nodes and ${e} edges, stored as adjacency lists. How many neighbour entries are stored across all the lists?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        2 * e,
        [
          { value: e, why: 'Each undirected edge appears in both endpoints’ lists.' },
          { value: n * n, why: 'That’s the matrix size. Lists store only real edges.' },
          { value: n + e, why: 'n is the number of lists; entries are per edge-end.' },
        ],
        'Each edge is listed twice.',
      ),
    },
    explain: `2 × ${e} = ${2 * e} entries (plus ${n} list heads). Memory O(n + e), far less than n² = ${(n * n).toLocaleString()} for sparse graphs.`,
  };
};

const simulateListRead = (): Card => {
  const g = randomGraph(false);
  const x = pick(g.nodes.filter((n) => neighbours(g, n).length >= 2));
  const ix = g.nodes.indexOf(x);
  const nb = neighbours(g, x);
  const scene: Scene = { views: [listView(g)] };
  const expected = [`l:${ix}`, ...nb.map((_, j) => `l:${ix}.${j}`)];
  const frames = [scene];
  expected.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: expected.slice(0, i + 1) }));
  return {
    concept: AL,
    type: 'simulate',
    prompt: `List every neighbour of ${x}. Click ${x}'s list head, then each entry you read.`,
    scene,
    body: { kind: 'click', expected, frames, wrongHint: (step) => (step === 0 ? `Find ${x}'s row first.` : 'Walk along the list in order.') },
    explain: `1 + ${nb.length} reads: proportional to ${x}'s degree. Compare the matrix, which would read all ${g.nodes.length} cells.`,
  };
};

const simulateAddEdge = (): Card => {
  const g = randomGraph(false);
  const missing: Edge[] = [];
  for (const a of g.nodes) for (const b of g.nodes) if (a < b && !neighbours(g, a).includes(b)) missing.push([a, b]);
  const [a, b] = pick(missing);
  const scene: Scene = { views: [listView(g)] };
  const g2: G = { ...g, edges: [...g.edges, [a, b]] };
  const expected = [`l:${g.nodes.indexOf(a)}`, `l:${g.nodes.indexOf(b)}`];
  const mid: Scene = { views: [listView({ ...g, directed: true, edges: [...g.edges.flatMap(([p, q]) => [[p, q], [q, p]] as Edge[]), [a, b]] })], highlight: [expected[0]] };
  return {
    concept: AL,
    type: 'simulate',
    prompt: `Add the undirected edge ${a}–${b}. Click each list you have to append to.`,
    scene,
    body: {
      kind: 'click',
      expected,
      frames: [scene, mid, { views: [listView(g2)], highlight: expected }],
      wrongHint: (step) => (step === 0 ? `Start with ${a}'s list.` : `Undirected: ${b} must also list ${a}.`),
    },
    explain: `Two appends: ${a} gets ${b}, and ${b} gets ${a}. Forgetting one makes the graph accidentally directed.`,
  };
};

const countListEntries = (): Card => {
  const g = randomGraph(pick([true, false]));
  return {
    concept: AL,
    type: 'count',
    prompt: `How many neighbour entries does the adjacency list of this ${g.directed ? 'directed' : 'undirected'} graph contain in total?`,
    scene: { views: [graphView(g)] },
    body: { kind: 'number', answer: g.directed ? g.edges.length : 2 * g.edges.length, unit: 'entries' },
    explain: g.directed ? `One entry per arrow: ${g.edges.length}.` : `Each of the ${g.edges.length} edges appears in both lists: ${2 * g.edges.length}.`,
  };
};

const growthList = (): Card =>
  pick([
    () => growthCard(AL, 'list the neighbours of a node with 3 neighbours, as n grows', () => 4, 0, 'Only that node’s list is read. n doesn’t matter.'),
    () => growthCard(AL, 'memory for a graph where every node has ~3 edges', (n) => n + 3 * n, 2, 'O(n + e), and here e ≈ 3n.'),
  ])();

const alExplain = explainGenerators({
  concept: AL,
  truths: [
    'Each node keeps a list of its neighbours.',
    'Memory is O(n + e): only real edges are stored.',
    'Listing a node’s neighbours costs O(its degree).',
    'Checking a specific edge (u, v) means scanning u’s list.',
    'It’s the usual choice for sparse graphs like roads and social networks.',
  ],
  myths: [
    { text: 'Adjacency lists always use n² memory.', why: 'Only n lists plus one entry per edge-end.' },
    { text: 'Checking if u–v exists is O(1).', why: 'You scan u’s list: O(degree(u)).' },
    { text: 'An undirected edge is stored once.', why: 'It appears in both endpoints’ lists.' },
  ],
  chains: [
    {
      prompt: 'Why is an adjacency list better than a matrix for a road map?',
      steps: ['Each intersection connects to only a few roads.', 'A matrix would store n² cells, almost all zero.', 'Lists store only the real connections: O(n + e).', 'And walking a node’s neighbours costs only its few roads.'],
    },
  ],
  summary: {
    best: 'Each place keeps its own short list of where you can go next, so storage matches the real connections and exploring from a place is quick.',
    others: [
      { text: 'It’s a list of all edges.', why: 'That’s the edge list.' },
      { text: 'It’s an array of linked lists.', why: 'How it might be built, not why it matters.' },
      { text: 'It’s always better than a matrix.', why: 'Matrices win for dense graphs and O(1) edge checks.' },
    ],
  },
});

export const adjacencyListConcept: Concept = {
  id: AL,
  title: 'Adjacency List',
  tier: 6,
  prereqs: [GB, 'dynamic-array'],
  tagline: 'Each node keeps its own list of neighbours.',
  hook: {
    problem: 'A social network has a billion users, each with ~200 friends. A matrix would need 10^18 cells, almost all zero.',
    question: 'How do you store only the friendships that exist?',
    options: [
      { text: 'Give each user a list of their friends.', good: true, feedback: 'Yes: adjacency lists. Memory ≈ users + friendships, and a user’s friends are one list away.' },
      { text: 'Compress the matrix.', feedback: 'Possible, but you’ve essentially reinvented lists.' },
      { text: 'Only store the popular users.', feedback: 'Everyone’s friendships matter.' },
    ],
  },
  lens: {
    layout: 'An array indexed by node; each slot holds a (dynamic) array or linked list of neighbours.',
    invariant: 'v is in u’s list exactly when edge u → v exists (both directions for undirected).',
    payoff: 'O(n + e) memory; iterate neighbours in O(degree): ideal for traversals.',
    price: 'Edge check (u, v) costs O(degree(u)); dense graphs lose the memory advantage.',
  },
  generators: {
    predict: [predictListNeighbours, predictListMemory],
    simulate: [simulateListRead, simulateAddEdge],
    count: [countListEntries, growthList],
    explain: alExplain,
  },
};

// =====================================================================
// Edge list
// =====================================================================

const EL = 'edge-list';

const predictEdgeListCost = (): Card => {
  const e = randInt(20, 5000);
  return {
    concept: EL,
    type: 'predict',
    prompt: `A graph with ${e.toLocaleString()} edges is stored only as an edge list (an array of (u, v) pairs). To find all neighbours of node X, how many pairs must you check?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        e,
        [
          { value: 1, why: 'Pairs aren’t grouped by node. X could appear anywhere.' },
          { value: Math.round(Math.sqrt(e)), why: 'No shortcut: X’s edges could be anywhere in the list.' },
          { value: 2 * e, why: 'Each pair is read once, checking both ends.' },
        ],
        'Every pair, since there’s no grouping.',
      ),
    },
    explain: `All ${e.toLocaleString()}. Edge lists are great for "process every edge" (like sorting by weight) and terrible for "neighbours of X".`,
  };
};

const predictKruskalSort = (): Card => {
  const g = randomGraph(false, 5, 2);
  const weighted = g.edges.map(([a, b]) => ({ a, b, w: randInt(1, 20) }));
  const sorted = [...weighted].sort((x, y) => x.w - y.w);
  const fmt = (xs: typeof weighted) => xs.map((x) => `${x.a}${x.b}:${x.w}`).join(' ');
  return {
    concept: EL,
    type: 'predict',
    prompt: `Some algorithms (like Kruskal's) process edges from lightest to heaviest. The edge list is: ${fmt(weighted)}. What's the order after sorting by weight?`,
    body: {
      kind: 'choice',
      options: options({ text: fmt(sorted), why: 'Sorted ascending by weight.' }, [
        { text: fmt([...sorted].reverse()), why: 'That’s heaviest first.' },
        { text: fmt([...weighted].sort((x, y) => (x.a + x.b).localeCompare(y.a + y.b))), why: 'That sorts by node names.' },
      ]),
    },
    explain: 'An edge list is just an array of pairs, so sorting it is a plain sort. That’s why "process all edges in order" algorithms love it.',
  };
};

const simulateEdgeScan = (): Card => {
  const g = randomGraph(false);
  const x = pick(g.nodes.filter((n) => neighbours(g, n).length >= 2));
  const idxs = g.edges.map((e, i) => (e.includes(x) ? i : -1)).filter((i) => i >= 0);
  const scene: Scene = { views: [edgeListView(g)] };
  const expected = idxs.map((i) => `e:${i}`);
  const frames = [scene];
  expected.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: expected.slice(0, i + 1) }));
  return {
    concept: EL,
    type: 'simulate',
    prompt: `Scan the edge list left to right. Click every edge that touches ${x}.`,
    scene,
    body: { kind: 'click', expected, frames, wrongHint: () => `Only edges with ${x} at either end, left to right.` },
    explain: `You had to look at all ${g.edges.length} edges to be sure you found ${x}'s ${idxs.length}. Nothing groups them together.`,
  };
};

const countEdgeMem = (): Card => {
  const e = randInt(5, 500);
  return {
    concept: EL,
    type: 'count',
    prompt: `An edge list stores each edge as two node numbers, one cell each. How many cells for ${e} edges?`,
    body: { kind: 'number', answer: 2 * e, unit: 'cells' },
    explain: `2 × ${e}. Minimal memory: no per-node overhead at all.`,
  };
};

const elExplain = explainGenerators({
  concept: EL,
  truths: [
    'An edge list is just an array of (u, v) pairs, optionally with weights.',
    'It uses O(e) memory: the smallest representation.',
    'Finding a node’s neighbours means scanning all edges: O(e).',
    'It’s ideal for algorithms that process every edge, e.g. sorted by weight.',
  ],
  myths: [
    { text: 'Edge lists make neighbour lookup fast.', why: 'Edges aren’t grouped by node; you scan them all.' },
    { text: 'An edge list needs n² space.', why: 'Only one entry per edge.' },
    { text: 'You can’t store weights in an edge list.', why: 'Just add a third field: (u, v, w).' },
  ],
  chains: [
    {
      prompt: 'Why is an edge list a good fit for Kruskal’s algorithm?',
      steps: ['Kruskal considers edges from lightest to heaviest.', 'An edge list is a plain array of edges.', 'So sort it once by weight.', 'Then walk it in order: no neighbour lookups needed.'],
    },
  ],
  summary: {
    best: 'An edge list is just a list of “this connects to that” lines: tiny and easy to sort, but finding one place’s connections means reading the whole list.',
    others: [
      { text: 'It lists every node’s edges.', why: 'That’s the adjacency list.' },
      { text: 'It’s the simplest graph format.', why: 'True, but no cost reasoning.' },
      { text: 'It’s a matrix of edges.', why: 'It’s a flat list.' },
    ],
  },
});

export const edgeListConcept: Concept = {
  id: EL,
  title: 'Edge List',
  tier: 6,
  prereqs: [GB],
  tagline: 'Just a list of pairs.',
  hook: {
    problem: 'You need to process every road in a country from cheapest to most expensive. You never ask "who are X’s neighbours?".',
    question: 'What’s the simplest storage for that?',
    options: [
      { text: 'A plain array of (from, to, cost) triples, sorted by cost.', good: true, feedback: 'Yes. An edge list: minimal memory, trivially sortable.' },
      { text: 'An adjacency matrix.', feedback: 'n² cells, and you’d still have to extract and sort the edges.' },
      { text: 'Adjacency lists.', feedback: 'Fine, but grouping by node buys nothing here.' },
    ],
  },
  lens: {
    layout: 'An array of edges, each (u, v) or (u, v, weight).',
    invariant: 'Each edge appears exactly once (per direction, if directed).',
    payoff: 'O(e) memory; trivial to build, sort and iterate.',
    price: 'Neighbour lookups and edge checks are O(e).',
  },
  generators: {
    predict: [predictEdgeListCost, predictKruskalSort],
    simulate: [simulateEdgeScan],
    count: [countEdgeMem],
    explain: elExplain,
  },
};

// =====================================================================
// Union-Find (disjoint set union)
// =====================================================================

const UF = 'union-find';

function forestScene(parent: number[], title = 'parent[] array'): Scene {
  const n = parent.length;
  const build = (r: number): TreeNode => ({ id: String(r), label: String(r), children: Array.from({ length: n }, (_, i) => i).filter((i) => i !== r && parent[i] === r).map(build) });
  const roots = parent.map((p, i) => (p === i ? i : -1)).filter((i) => i >= 0);
  return {
    views: [
      ...roots.map((r) => ({ type: 'tree' as const, root: build(r), title: `set rooted at ${r}` })),
      { type: 'row', key: 'p', items: parent, labels: parent.map((_, i) => String(i)), title },
    ],
  };
}

const findPath = (parent: number[], x: number) => {
  const p = [x];
  while (parent[p[p.length - 1]] !== p[p.length - 1]) p.push(parent[p[p.length - 1]]);
  return p;
};

/** A random forest of 8 elements with some depth. */
function randomForest(): number[] {
  for (;;) {
    const n = 8;
    const parent = Array.from({ length: n }, (_, i) => i);
    const order = shuffle(parent.slice());
    for (let i = 1; i < order.length; i++) if (Math.random() < 0.8) parent[order[i]] = pick(order.slice(0, i));
    const depth = Math.max(...parent.map((_, i) => findPath(parent, i).length));
    const roots = parent.filter((p, i) => p === i).length;
    if (depth >= 3 && roots >= 2) return parent;
  }
}

const predictFind = (): Card => {
  const parent = randomForest();
  const x = pick(parent.map((_, i) => i).filter((i) => findPath(parent, i).length >= 3));
  const path = findPath(parent, x);
  return {
    concept: UF,
    type: 'predict',
    prompt: `parent = [${parent.join(', ')}] (element i's parent is parent[i]; a root is its own parent). What does find(${x}) return?`,
    scene: forestScene(parent),
    body: {
      kind: 'choice',
      options: numberOptions(
        path[path.length - 1],
        [
          { value: parent[x], why: 'That’s only the first step. Keep following parents until an element is its own parent.' },
          { value: x, why: `${x} isn't a root: parent[${x}] = ${parent[x]}.` },
          { value: path[path.length - 2], why: 'One step short of the root.' },
        ],
        'Follow parents until you reach a root.',
      ),
    },
    explain: `${path.join(' → ')}. The root is the set's name: two elements are in the same set exactly when find gives the same root.`,
  };
};

const predictConnected = (): Card => {
  const parent = randomForest();
  const [a, b] = shuffle(parent.map((_, i) => i)).slice(0, 2);
  const ra = findPath(parent, a).pop()!;
  const rb = findPath(parent, b).pop()!;
  const same = ra === rb;
  return {
    concept: UF,
    type: 'predict',
    prompt: `parent = [${parent.join(', ')}]. Are ${a} and ${b} in the same set?`,
    scene: forestScene(parent),
    body: {
      kind: 'choice',
      options: [
        { text: 'Same set', correct: same, why: `find(${a}) = ${ra}, find(${b}) = ${rb}.` },
        { text: 'Different sets', correct: !same, why: `find(${a}) = ${ra}, find(${b}) = ${rb}.` },
      ],
    },
    explain: `find(${a}) = ${ra}, find(${b}) = ${rb}: ${same ? 'same root, same set' : 'different roots, different sets'}. Only roots matter, not direct parent links.`,
  };
};

const simulateFind = (): Card => {
  const parent = randomForest();
  const x = pick(parent.map((_, i) => i).filter((i) => findPath(parent, i).length >= 3));
  const path = findPath(parent, x);
  const scene = forestScene(parent);
  const expected = path.map((p) => `p:${p}`);
  const frames = [scene];
  expected.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: expected.slice(0, i + 1) }));
  return {
    concept: UF,
    type: 'simulate',
    prompt: `Run find(${x}) using only the parent[] ARRAY: click the array slot for each element you visit, starting at ${x}, until you reach a root.`,
    scene,
    body: {
      kind: 'click',
      expected,
      frames,
      wrongHint: (step, id) => (id.startsWith('t:') ? 'Use the array row (the trees are just the picture).' : step === 0 ? `Start at slot ${x}.` : `parent[${path[step - 1]}] = ${path[step]}. Go to slot ${path[step]}.`),
    },
    explain: `${path.join(' → ')}. The trees are only a picture: the whole structure is one array of parent indexes.`,
  };
};

const orderUnion = (): Card => ({
  concept: UF,
  type: 'simulate',
  prompt: 'union(a, b) with union by size. Put the steps in order.',
  body: {
    kind: 'order',
    steps: ['ra = find(a), rb = find(b).', 'If ra == rb, stop: already in the same set.', 'Make the root of the SMALLER set point to the root of the larger one.', 'Add the smaller set’s size to the larger root’s size.'],
  },
  explain: 'Always hang the smaller tree under the bigger one. A node’s depth then only grows when its set at least doubles, so depth ≤ log₂ n.',
});

const countCompress = (): Card => {
  const parent = randomForest();
  const x = pick(parent.map((_, i) => i).filter((i) => findPath(parent, i).length >= 3));
  const path = findPath(parent, x);
  const changed = path.slice(0, -1).filter((v) => parent[v] !== path[path.length - 1]).length;
  return {
    concept: UF,
    type: 'count',
    prompt: `parent = [${parent.join(', ')}]. find(${x}) with path compression points every element on the path directly at the root. How many parent[] entries actually change?`,
    scene: forestScene(parent),
    body: { kind: 'number', answer: changed, unit: 'entries' },
    explain: `Path ${path.join(' → ')}. Elements not already pointing at the root get re-pointed: ${changed}. Next time, they're one hop away.`,
  };
};

const countUnionBySize = (): Card => {
  const n = pick([8, 16, 64, 1000, 1_000_000]);
  return {
    concept: UF,
    type: 'count',
    prompt: `With union by size (no compression), what's the maximum possible depth of any element among ${n.toLocaleString()} elements? (Round down.)`,
    body: { kind: 'number', answer: Math.floor(Math.log2(n)), unit: 'levels' },
    explain: `An element gets 1 deeper only when its set joins one at least as big, so its set size at least doubles each time: at most log₂ ${n.toLocaleString()} ≈ ${Math.floor(Math.log2(n))} times.`,
  };
};

const growthUF = (): Card => growthCard(UF, 'find() with union by size + path compression (average)', () => 2, 0, 'Effectively constant: the true bound is the inverse Ackermann function, which is ≤ 4 for any realistic n.');

const ufExplain = explainGenerators({
  concept: UF,
  truths: [
    'Union-find stores each set as a tree using only a parent array.',
    'find(x) follows parents to the root; the root names the set.',
    'union(a, b) links one root under the other.',
    'Union by size keeps trees shallow: depth ≤ log₂ n.',
    'Path compression re-points visited nodes straight at the root, making later finds nearly O(1).',
  ],
  myths: [
    { text: 'Two elements are in the same set if one is the other’s parent.', why: 'Same set means same *root*; they may be far apart in the tree.' },
    { text: 'union(a, b) makes a’s parent b.', why: 'It links their *roots*, not the elements themselves.' },
    { text: 'Union-find can split a set back apart.', why: 'It only supports merging.' },
    { text: 'Union-find needs pointers to children.', why: 'Only parent links: one array.' },
  ],
  chains: [
    {
      prompt: 'Why does union by size keep trees shallow?',
      steps: ['An element only gets deeper when its tree is hung under another.', 'That only happens when its tree is the smaller one.', 'So its set at least doubles in size each time.', 'A set can double at most log₂ n times, so depth ≤ log₂ n.'],
    },
  ],
  summary: {
    best: 'Every group elects a leader, and everyone just remembers who they report to; two people are in the same group if following “who do you report to?” ends at the same leader.',
    others: [
      { text: 'It’s a disjoint-set data structure.', why: 'The name, not the idea.' },
      { text: 'It stores sets as lists.', why: 'It stores them as parent-pointer trees.' },
      { text: 'It’s used in Kruskal’s algorithm.', why: 'A use, not a mechanism.' },
    ],
  },
});

const ufOps: Concept['playground'] = {
  initial: () => forestScene(Array.from({ length: 8 }, (_, i) => i)),
  guide: [
    { do: 'union(1, 2), then union(3, 4).', see: 'Each group is a little tree. The row underneath is all that’s stored: each element’s “parent”. A root is its own parent.' },
    { do: 'union(2, 4).', see: 'The two groups merge by hanging one root under the other. Now 1, 2, 3, 4 share one root.' },
    { do: 'find(1).', see: 'Follow parents up to the root. Every element on that path is then pointed straight at the root, so the next find is faster.' },
  ],
  ops: [
    {
      label: 'union(a, b)',
      inputs: ['a', 'b'],
      run: (s, [a, b]) => {
        const parent = [...((s.views[s.views.length - 1] as Extract<View, { type: 'row' }>).items as number[])];
        const n = parent.length;
        if ([a, b].some((x) => x < 0 || x >= n)) return { error: `Elements are 0–${n - 1}.` };
        const pa = findPath(parent, a);
        const pb = findPath(parent, b);
        const [ra, rb] = [pa[pa.length - 1], pb[pb.length - 1]];
        if (ra === rb) return { error: `${a} and ${b} are already in the same set (root ${ra}).` };
        const size = (r: number) => parent.filter((_, i) => findPath(parent, i).pop() === r).length;
        const [small, big] = size(ra) <= size(rb) ? [ra, rb] : [rb, ra];
        parent[small] = big;
        return { scene: { ...forestScene(parent), highlight: [`p:${small}`] }, touches: pa.length + pb.length + 1, note: `Roots ${ra} and ${rb}; hung the smaller set (root ${small}) under ${big}.` };
      },
    },
    {
      label: 'find(x) + compress',
      inputs: ['x'],
      run: (s, [x]) => {
        const parent = [...((s.views[s.views.length - 1] as Extract<View, { type: 'row' }>).items as number[])];
        if (x < 0 || x >= parent.length) return { error: `Elements are 0–${parent.length - 1}.` };
        const path = findPath(parent, x);
        const root = path[path.length - 1];
        path.forEach((v) => (parent[v] = root));
        return { scene: { ...forestScene(parent), highlight: path.map((p) => `p:${p}`) }, touches: path.length, note: `find(${x}) = ${root} via ${path.join(' → ')}; all now point straight at ${root}.` };
      },
    },
  ],
};

export const unionFindConcept: Concept = {
  id: UF,
  title: 'Union-Find (Disjoint Set)',
  tier: 6,
  prereqs: [GB, 'tree'],
  tagline: 'Groups that only merge. One parent array.',
  hook: {
    problem: 'Friend requests keep arriving: "A and B are now friends". At any moment you must answer "are X and Y in the same friend group?" instantly.',
    question: 'How do you track merging groups cheaply?',
    options: [
      { text: 'Give each group a leader; every person points towards their leader; merging points one leader at the other.', good: true, feedback: 'Yes: union-find. Same group ⇔ same leader. Merging is one pointer change.' },
      { text: 'Keep a list of members per group and copy lists on merge.', feedback: 'Merging big groups copies huge lists.' },
      { text: 'Search the friendship graph each time.', feedback: 'O(n + e) per question: too slow.' },
    ],
  },
  lens: {
    layout: 'One array: parent[i]. Roots are their own parent. (Plus a size per root.)',
    invariant: 'Following parent pointers from any element reaches its set’s root; same root ⇔ same set.',
    payoff: 'union and find in nearly O(1) amortized with union by size + path compression.',
    price: 'Only merges: no splitting, no listing a set’s members cheaply.',
  },
  playground: ufOps,
  generators: {
    predict: [predictFind, predictConnected],
    simulate: [simulateFind, orderUnion],
    count: [countCompress, countUnionBySize, growthUF],
    explain: ufExplain,
  },
};

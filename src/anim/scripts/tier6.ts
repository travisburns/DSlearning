import type { AnimScript, Tone } from '../engine';
import { Stage } from '../engine';
import { pick, randInt, shuffle } from '../../engine/random';
import type { TNode } from '../kit';
import { H, STEP, W, onSlot, ring, slotRow, treePos } from '../kit';

// ---------- graph toolkit ----------

type E = [string, string, number];

/** Connected graph on n nodes: a random spanning tree from A, plus extra edges. Weights distinct when asked. */
function makeGraph(n = 6, extra = 3, weighted = false): { nodes: string[]; edges: E[] } {
  const nodes = 'ABCDEFGH'.split('').slice(0, n);
  const ws = shuffle(Array.from({ length: 15 }, (_, i) => i + 1));
  const edges: E[] = [];
  const seen = new Set<string>();
  const add = (a: string, b: string) => {
    const k = [a, b].sort().join('');
    if (a === b || seen.has(k)) return false;
    seen.add(k);
    edges.push([a, b, weighted ? ws[edges.length] : 1]);
    return true;
  };
  const order = ['A', ...shuffle(nodes.slice(1))];
  for (let i = 1; i < n; i++) add(pick(order.slice(Math.max(0, i - 2), i)), order[i]);
  let t = 0;
  while (extra > 0 && t++ < 60) if (add(pick(nodes), pick(nodes))) extra--;
  return { nodes, edges };
}
const nbrs = (edges: E[], x: string, directed = false) =>
  edges.flatMap(([a, b]) => (a === x ? [b] : !directed && b === x ? [a] : [])).sort();
const eid = (a: string, b: string) => `e${[a, b].sort().join('')}`;

function drawG(s: Stage, nodes: string[], edges: E[], o: { cx?: number; cy?: number; directed?: boolean; weighted?: boolean } = {}) {
  const pos = ring(nodes, { cx: o.cx ?? 150, cy: o.cy ?? 120, rx: 125, ry: 100 });
  for (const id of nodes) s.box(`g${id}`, { ...pos.get(id)!, w: 40, h: 40, shape: 'circle', label: id, tone: 'plain' });
  for (const [a, b, w] of edges) s.arrow(o.directed ? `e${a}${b}` : eid(a, b), `g${a}`, `g${b}`, { tone: 'dim', line: !o.directed, label: o.weighted ? String(w) : undefined });
}
/** A small badge next to a node (distance, label), clearly separate from edge weights. */
function badge(s: Stage, node: string, text: string, tone: Tone = 'warn') {
  const b = s.boxes[`g${node}`];
  s.box(`bd${node}`, { x: b.x + 30, y: b.y - 14, w: Math.max(26, text.length * 9 + 10), h: 20, label: text, tone, shape: 'rect' });
}

const edgeTone = (s: Stage, a: string, b: string, tone: Tone) => {
  const id = s.arrows[eid(a, b)] ? eid(a, b) : `e${a}${b}`;
  if (s.arrows[id]) s.arrows[id] = { ...s.arrows[id], tone };
};

// =====================================================================
// Graph basics
// =====================================================================

const graph: AnimScript = () => {
  const s = new Stage();
  const { nodes, edges } = makeGraph(6, 2);
  const pos = ring(nodes, { cx: 150, cy: 120, rx: 125, ry: 100 });
  for (const id of nodes) s.box(`g${id}`, { ...pos.get(id)!, w: 40, h: 40, shape: 'circle', label: id });
  s.say('A graph is a set of things (nodes, also called vertices) and connections between them (edges). Cities and roads, people and friendships, web pages and links.');
  for (const [a, b] of edges) s.arrow(eid(a, b), `g${a}`, `g${b}`, { tone: 'dim', line: true });
  s.say(`${edges.length} edges. Unlike a tree there's no root, no top or bottom, and loops (cycles) are allowed.`);
  const x = nodes.reduce((best, n) => (nbrs(edges, n).length > nbrs(edges, best).length ? n : best));
  s.tone(`g${x}`, 'hl');
  s.tone(nbrs(edges, x).map((y) => `g${y}`), 'accent');
  for (const y of nbrs(edges, x)) edgeTone(s, x, y, 'accent');
  s.say(`${x}'s neighbours are ${nbrs(edges, x).join(', ')}: its degree is ${nbrs(edges, x).length}.`);
  for (const id of nodes) s.tone(`g${id}`, 'plain');
  for (const [a, b] of edges) edgeTone(s, a, b, 'dim');
  // A path from A to the farthest node by BFS.
  const prev = new Map<string, string>([['A', '']]);
  const q = ['A'];
  for (let i = 0; i < q.length; i++) for (const y of nbrs(edges, q[i])) if (!prev.has(y)) prev.set(y, q[i]), q.push(y);
  const far = q[q.length - 1];
  const path = [far];
  while (prev.get(path[0])) path.unshift(prev.get(path[0])!);
  s.tone(path.map((p) => `g${p}`), 'ok');
  for (let i = 0; i + 1 < path.length; i++) edgeTone(s, path[i], path[i + 1], 'ok');
  s.say(`A path is a route along edges: ${path.join(' → ')}. Many graph questions are “is there a path?” or “what's the shortest path?”.`);
  for (const id of nodes) s.tone(`g${id}`, 'plain');
  for (const [a, b, w] of edges) s.arrows[eid(a, b)] = { from: `g${a}`, to: `g${b}`, tone: 'accent', label: String(w * randInt(1, 9)) };
  s.say('Edges can be one-way (directed, like follows on social media or one-way streets) and can carry weights (distance, cost, time).');
  return s.build('Graph basics: nodes and edges');
};

// =====================================================================
// Adjacency matrix
// =====================================================================

const adjacencyMatrix: AnimScript = () => {
  const s = new Stage();
  const { nodes, edges } = makeGraph(5, 2);
  drawG(s, nodes, edges);
  const X = 340;
  const C = 36;
  nodes.forEach((n, i) => {
    s.text(`r${n}`, X - 10, 60 + i * C + 22, n, { anchor: 'end', bold: true });
    s.text(`c${n}`, X + i * C + 16, 50, n, { anchor: 'middle', bold: true });
    nodes.forEach((m, j) => s.box(`m${n}${m}`, { x: X + j * C, y: 60 + i * C, w: C - 4, h: C - 4, label: '0', tone: 'dim' }));
  });
  s.say(`An adjacency matrix stores a graph of ${nodes.length} nodes as a ${nodes.length} × ${nodes.length} grid. Cell [row, col] is 1 if there's an edge from row to col, else 0.`);
  edges.forEach(([a, b], k) => {
    s.set(`m${a}${b}`, { label: '1', tone: 'accent' });
    s.set(`m${b}${a}`, { label: '1', tone: 'accent' });
    edgeTone(s, a, b, 'accent');
    if (k < 2) s.say(`Edge ${a}–${b}: set [${a},${b}] and [${b},${a}] to 1 (undirected edges go both ways, so the grid is symmetric).`);
  });
  s.say('All edges filled in.');
  for (const [a, b] of edges) edgeTone(s, a, b, 'dim');
  const [a, b] = shuffle(nodes).slice(0, 2);
  const has = edges.some(([p, q]) => (p === a && q === b) || (p === b && q === a));
  s.tone(`m${a}${b}`, has ? 'ok' : 'bad');
  s.say(`“Is there an edge ${a}–${b}?” Look at one cell: ${has ? 'yes' : 'no'}. O(1), the matrix's big strength.`);
  s.tone(`m${a}${b}`, has ? 'accent' : 'dim');
  const x = pick(nodes);
  nodes.forEach((m) => s.tone(`m${x}${m}`, 'hl'));
  s.say(`“Who are ${x}'s neighbours?” Scan the whole row of ${nodes.length} cells, even the 0s: O(V). And the grid always takes V² cells, mostly zeros for a sparse graph. Great for dense graphs, wasteful for big sparse ones.`);
  return s.build('Adjacency matrix');
};

// =====================================================================
// Adjacency list
// =====================================================================

const adjacencyList: AnimScript = () => {
  const s = new Stage();
  const { nodes, edges } = makeGraph(5, 2);
  drawG(s, nodes, edges);
  const X = 340;
  nodes.forEach((n, i) => s.box(`h${n}`, { x: X, y: i * 52, w: 40, h: H, label: n, tone: 'accent' }));
  s.say('An adjacency list gives every node its own list of neighbours (in C#: a List<int>[] or Dictionary<string, List<string>>).');
  for (const n of nodes) {
    const ns = nbrs(edges, n);
    s.tone(`g${n}`, 'hl');
    ns.forEach((m, k) => {
      s.box(`l${n}${m}`, { x: X + 60 + k * 50, y: nodes.indexOf(n) * 52, w: 40, h: H, label: m });
      s.arrow(`la${n}${m}`, k ? `l${n}${ns[k - 1]}` : `h${n}`, `l${n}${m}`, { tone: 'accent' });
      edgeTone(s, n, m, 'accent');
    });
    s.say(`${n}'s list: ${ns.join(', ')}. One entry for each edge that touches ${n}.`);
    s.tone(`g${n}`, 'plain');
    for (const m of ns) edgeTone(s, n, m, 'dim');
  }
  const x = pick(nodes);
  s.tone(`h${x}`, 'hl');
  s.tone(nbrs(edges, x).map((m) => `l${x}${m}`), 'ok');
  s.say(`“Who are ${x}'s neighbours?” Read its list: exactly ${nbrs(edges, x).length} entries, no wasted zeros. Memory is O(V + E): each edge is stored twice (once per end).`);
  s.say('The cost: “is there an edge X–Y?” means scanning X\'s list. Most real graphs (roads, social networks) are sparse, so this is the default choice, and what BFS and DFS use.');
  return s.build('Adjacency list');
};

// =====================================================================
// Edge list
// =====================================================================

const edgeList: AnimScript = () => {
  const s = new Stage();
  const { nodes, edges } = makeGraph(5, 2, true);
  drawG(s, nodes, edges, { weighted: true });
  const X = 340;
  edges.forEach(([a, b, w], i) => s.box(`r${i}`, { x: X, y: i * 34 - 10, w: 110, h: 28, label: `${a}–${b}  w ${w}`, mono: true }));
  s.say('An edge list is the simplest storage of all: one row per edge, (from, to, weight). Easy to read from a file, easy to sort.');
  const x = pick(nodes);
  s.tone(`g${x}`, 'hl');
  s.say(`“Who are ${x}'s neighbours?” There's no index by node, so check every row.`);
  edges.forEach(([a, b], i) => {
    const hit = a === x || b === x;
    s.tone(`r${i}`, hit ? 'ok' : 'dim');
    if (hit) edgeTone(s, a, b, 'ok');
  });
  s.say(`All ${edges.length} rows scanned to find ${nbrs(edges, x).length}: O(E) per question. Bad for walking a graph.`);
  const sorted = edges.map((e, i) => ({ e, i })).sort((p, q) => p.e[2] - q.e[2]);
  sorted.forEach(({ i }, k) => s.set(`r${i}`, { y: k * 34 - 10, tone: 'plain' }));
  for (const [a, b] of edges) edgeTone(s, a, b, 'dim');
  s.tone(`g${x}`, 'plain');
  s.say('But sorting by weight is trivial: just sort the rows. Kruskal\'s minimum spanning tree wants exactly this, cheapest edge first.');
  return s.build('Edge list');
};

// =====================================================================
// Union-find
// =====================================================================

const unionFind: AnimScript = () => {
  const s = new Stage();
  const n = 7;
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = Array(n).fill(1);
  const draw = (hot: number[] = [], tone: Tone = 'hl') => {
    const kids = (r: number): TNode => ({ id: String(r), label: String(r), kids: parent.map((p, i) => (p === r && i !== r ? i : -1)).filter((i) => i >= 0).map(kids) });
    const roots = parent.map((p, i) => (p === i ? i : -1)).filter((i) => i >= 0);
    const pos = treePos({ id: 'top', label: '', kids: roots.map(kids) }, { dx: 56, dy: 70, y: -70 });
    for (let i = 0; i < n; i++) {
      s.box(`u${i}`, { ...pos.get(String(i))!, w: 40, h: 40, shape: 'circle', label: String(i), tone: hot.includes(i) ? tone : parent[i] === i ? 'accent' : 'plain' });
      if (parent[i] !== i) s.arrow(`p${i}`, `u${i}`, `u${parent[i]}`, { tone: 'ptr' });
      else delete s.arrows[`p${i}`];
    }
  };
  const find = (x: number) => {
    while (parent[x] !== x) x = parent[x];
    return x;
  };
  draw();
  s.say(`Union-find tracks which items are in the same group. Each item points to a parent; the item at the top of a group (blue) is its leader. At first, everyone is alone.`);
  const union = (a: number, b: number, say = true) => {
    let ra = find(a);
    let rb = find(b);
    if (ra === rb) return;
    if (size[ra] > size[rb]) [ra, rb] = [rb, ra];
    parent[ra] = rb;
    size[rb] += size[ra];
    draw([ra, rb]);
    if (say) s.say(`union(${a}, ${b}): find both leaders (${ra} and ${rb}) and point one at the other. The smaller group joins the bigger one, so trees stay shallow.`);
  };
  union(0, 1);
  union(2, 3);
  union(4, 5);
  union(1, 3);
  const a = 0;
  const b = pick([3, 5]);
  const pa: number[] = [a];
  while (parent[pa[pa.length - 1]] !== pa[pa.length - 1]) pa.push(parent[pa[pa.length - 1]]);
  const pb: number[] = [b];
  while (parent[pb[pb.length - 1]] !== pb[pb.length - 1]) pb.push(parent[pb[pb.length - 1]]);
  draw([...pa, ...pb]);
  const same = pa[pa.length - 1] === pb[pb.length - 1];
  s.say(`Are ${a} and ${b} connected? Follow parent arrows up to each leader: ${pa.join(' → ')} and ${pb.join(' → ')}. ${same ? 'Same leader: yes.' : 'Different leaders: no.'}`);
  union(5, 3);
  const deep = [0, 1, 2, 4, 5].reduce((best, x) => {
    let d = 0;
    let y = x;
    while (parent[y] !== y) (y = parent[y]), d++;
    let db = 0;
    y = best;
    while (parent[y] !== y) (y = parent[y]), db++;
    return d > db ? x : best;
  }, 0);
  const path: number[] = [deep];
  while (parent[path[path.length - 1]] !== path[path.length - 1]) path.push(parent[path[path.length - 1]]);
  draw(path);
  s.say(`find(${deep}) walks ${path.join(' → ')}.`);
  const root = path[path.length - 1];
  for (const x of path) parent[x] = root;
  draw(path, 'ok');
  s.say(`Path compression: on the way back, point every node on that path straight at the leader. Next time, finding them takes one step. With both tricks, each operation is practically O(1).`);
  return s.build('Union-find: groups with leaders');
};

// =====================================================================
// BFS
// =====================================================================

const bfs: AnimScript = () => {
  const s = new Stage();
  const { nodes, edges } = makeGraph(7, 3);
  drawG(s, nodes, edges, { cx: 160, cy: 130 });
  const qy = 300;
  s.text('ql', 0, qy - 8, 'Queue (front on the left)', { size: 'sm', bold: true, tone: 'dim' });
  slotRow(s, 'q', nodes.length, { y: qy, top: () => '' });
  const dist = new Map<string, number>([['A', 0]]);
  const queue = ['A'];
  const drawQ = () => queue.forEach((x, i) => onSlot(s, `qq${x}`, x, i, { y: qy, tone: 'accent' }));
  s.set('gA', { tone: 'accent' });
  badge(s, 'A', '0');
  drawQ();
  s.say('Breadth-first search from A: explore in rings, nearest first. A queue holds discovered nodes waiting to be explored. Each badge shows how many edges a node is from A.');
  const done: string[] = [];
  while (queue.length) {
    const x = queue.shift()!;
    s.del(`qq${x}`);
    drawQ();
    s.set(`g${x}`, { tone: 'hl' });
    const fresh = nbrs(edges, x).filter((y) => !dist.has(y));
    s.say(`Take ${x} from the front of the queue. Its neighbours: ${nbrs(edges, x).join(', ')}.${fresh.length ? '' : ' All already discovered.'}`);
    for (const y of fresh) {
      dist.set(y, dist.get(x)! + 1);
      queue.push(y);
      s.set(`g${y}`, { tone: 'accent' });
      badge(s, y, String(dist.get(y)));
      edgeTone(s, x, y, 'ok');
    }
    drawQ();
    if (fresh.length) s.say(`New: ${fresh.join(', ')}. They are one step further than ${x}: distance ${dist.get(x)! + 1}. Mark them seen and add them to the BACK of the queue.`);
    s.set(`g${x}`, { tone: 'ok' });
    done.push(x);
  }
  s.say(`Every node reached, in order of distance: ${done.join(', ')}. The green edges form a shortest-path tree: each node's d is the fewest edges from A. O(V + E).`);
  return s.build('Breadth-first search');
};

// =====================================================================
// DFS
// =====================================================================

const dfs: AnimScript = () => {
  const s = new Stage();
  const { nodes, edges } = makeGraph(7, 3);
  drawG(s, nodes, edges, { cx: 160, cy: 130 });
  const sx = 360;
  s.text('sl', sx, -10, 'Call stack', { size: 'sm', bold: true, tone: 'dim' });
  const seen = new Set<string>();
  const stack: string[] = [];
  const order: string[] = [];
  const drawS = () => {
    for (const k of Object.keys(s.boxes)) if (k.startsWith('cs')) delete s.boxes[k];
    stack.forEach((x, i) => s.box(`cs${x}`, { x: sx, y: 210 - i * 44, w: 90, h: 36, label: `dfs(${x})`, tone: i === stack.length - 1 ? 'hl' : 'accent' }));
  };
  s.say('Depth-first search from A: go as deep as you can along one path, and back up only at a dead end. Recursion (the call stack) remembers the way back.');
  const go = (x: string, from?: string) => {
    seen.add(x);
    order.push(x);
    stack.push(x);
    drawS();
    s.set(`g${x}`, { tone: 'hl', sub: `#${order.length}` });
    if (from) edgeTone(s, from, x, 'ok');
    const un = nbrs(edges, x).filter((y) => !seen.has(y));
    s.say(`Visit ${x} (mark it seen).${un.length ? ` Unvisited neighbours: ${un.join(', ')}. Go into ${un[0]} first.` : ' No unvisited neighbours.'}`);
    s.set(`g${x}`, { tone: 'accent' });
    for (const y of nbrs(edges, x)) if (!seen.has(y)) go(y, x);
    stack.pop();
    drawS();
    s.set(`g${x}`, { tone: 'ok' });
    s.say(stack.length ? `${x} is finished: dead end. Back up to ${stack[stack.length - 1]} and try its next neighbour.` : `Back at the start, and A has nothing left to try. Done.`);
  };
  go('A');
  s.say(`Visit order: ${order.join(', ')}. Every node and edge handled once: O(V + E). DFS finds what's reachable, cycles and connected pieces, but not shortest paths (that's BFS).`);
  return s.build('Depth-first search');
};

// =====================================================================
// Topological sort (Kahn)
// =====================================================================

const topologicalSort: AnimScript = () => {
  const s = new Stage();
  const n = 6;
  const nodes = 'ABCDEF'.split('').slice(0, n);
  const hidden = shuffle(nodes);
  const edges: E[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < n; i++) {
    const a = pick(hidden.slice(0, i));
    edges.push([a, hidden[i], 1]);
    seen.add(a + hidden[i]);
  }
  for (let t = 0, extra = 2; extra > 0 && t < 40; t++) {
    const [i, j] = [randInt(0, n - 1), randInt(0, n - 1)].sort((p, q) => p - q);
    if (i !== j && !seen.has(hidden[i] + hidden[j])) {
      seen.add(hidden[i] + hidden[j]);
      edges.push([hidden[i], hidden[j], 1]);
      extra--;
    }
  }
  drawG(s, nodes, edges, { directed: true, cx: 160, cy: 120 });
  const indeg = new Map(nodes.map((x) => [x, edges.filter((e) => e[1] === x).length]));
  for (const x of nodes) s.set(`g${x}`, { sub: `in ${indeg.get(x)}` });
  s.say('Tasks with dependencies: an arrow X → Y means X must happen before Y. Find an order that respects every arrow. Each node shows its in-degree: how many things it is still waiting for.');
  const out: string[] = [];
  const oy = 290;
  s.text('ol', 0, oy - 10, 'Order', { size: 'sm', bold: true, tone: 'dim' });
  while (out.length < n) {
    const ready = nodes.filter((x) => !out.includes(x) && indeg.get(x) === 0).sort();
    s.tone(ready.map((x) => `g${x}`), 'ok');
    const x = ready[0];
    s.say(`Ready (waiting for nothing): ${ready.join(', ')}. Take ${x}${ready.length > 1 ? ' (any would do; we take the alphabetically first)' : ''}.`);
    out.push(x);
    s.box(`o${x}`, { x: (out.length - 1) * STEP, y: oy, w: W, h: H, label: x, tone: 'accent' });
    s.set(`g${x}`, { tone: 'dim', sub: 'done' });
    for (const [a, b] of edges)
      if (a === x) {
        indeg.set(b, indeg.get(b)! - 1);
        s.set(`g${b}`, { sub: `in ${indeg.get(b)}` });
        s.arrows[`e${a}${b}`] = { ...s.arrows[`e${a}${b}`], tone: 'dim', dashed: true };
      }
    for (const y of ready) if (y !== x) s.tone(`g${y}`, 'plain');
    s.say(`${x} is done, so cross out its outgoing arrows: everything it pointed to waits for one thing less.`);
  }
  s.say(`Order: ${out.join(' → ')}. Every arrow points forward. If the graph had a cycle, at some point nothing would be ready: that's how Kahn's algorithm detects impossible dependencies. O(V + E).`);
  return s.build('Topological sort (Kahn’s algorithm)');
};

// =====================================================================
// Dijkstra
// =====================================================================

const dijkstra: AnimScript = () => {
  const s = new Stage();
  let g = makeGraph(6, 3, true);
  // Use small weights so the numbers stay easy to add.
  g = { nodes: g.nodes, edges: g.edges.map(([a, b]) => [a, b, randInt(1, 9)] as E) };
  const { nodes, edges } = g;
  drawG(s, nodes, edges, { weighted: true, cx: 160, cy: 130 });
  const dist = new Map(nodes.map((x) => [x, Infinity]));
  dist.set('A', 0);
  const fmtD = (x: string) => (dist.get(x) === Infinity ? '∞' : String(dist.get(x)));
  for (const x of nodes) badge(s, x, fmtD(x), x === 'A' ? 'warn' : 'dim');
  s.say('Dijkstra: shortest distances from A when edges have lengths (the numbers on the lines). The yellow badge by each node is its best known distance: A is 0, the rest start at ∞.');
  const done = new Set<string>();
  while (done.size < nodes.length) {
    const x = nodes.filter((v) => !done.has(v)).sort((p, q) => dist.get(p)! - dist.get(q)! || p.localeCompare(q))[0];
    if (dist.get(x) === Infinity) break;
    done.add(x);
    s.set(`g${x}`, { tone: 'ok' });
    badge(s, x, fmtD(x), 'ok');
    s.say(`Of all unfinished nodes, ${x} has the smallest distance (${fmtD(x)}). No other route can beat it, because every other route is already at least that long. ${x} is final.`);
    const changed: string[] = [];
    for (const [a, b, w] of edges) {
      const y = a === x ? b : b === x ? a : null;
      if (!y || done.has(y)) continue;
      edgeTone(s, x, y, 'accent');
      if (dist.get(x)! + w < dist.get(y)!) {
        dist.set(y, dist.get(x)! + w);
        changed.push(`${y}: ${fmtD(x)} + ${w} = ${dist.get(y)}`);
        s.set(`g${y}`, { tone: 'hl' });
        badge(s, y, fmtD(y));
      }
    }
    if (changed.length || nodes.some((v) => !done.has(v))) s.say(changed.length ? `Relax ${x}'s edges: going through ${x} is shorter for ${changed.join('; ')}.` : `Going through ${x} doesn't improve any neighbour.`);
    for (const v of nodes) if (!done.has(v)) s.tone(`g${v}`, 'plain');
    for (const [a, b] of edges) edgeTone(s, a, b, 'dim');
  }
  s.say(`All distances final: ${nodes.map((v) => `${v}=${fmtD(v)}`).join(', ')}. A min-heap picks the closest node each round: O((V + E) log V). It only works when no edge is negative.`);
  return s.build('Dijkstra’s shortest paths');
};

// =====================================================================
// Kruskal
// =====================================================================

const kruskal: AnimScript = () => {
  const s = new Stage();
  const { nodes, edges } = makeGraph(6, 3, true);
  drawG(s, nodes, edges, { weighted: true, cx: 160, cy: 130 });
  const X = 360;
  const sorted = [...edges].sort((p, q) => p[2] - q[2]);
  sorted.forEach(([a, b, w], i) => s.box(`r${i}`, { x: X, y: i * 30 - 10, w: 90, h: 26, label: `${a}–${b}: ${w}` }));
  s.say('Connect every node as cheaply as possible (a minimum spanning tree). Kruskal: sort the edges by weight, then go cheapest first.');
  const parent = new Map(nodes.map((x) => [x, x]));
  const find = (x: string): string => (parent.get(x) === x ? x : find(parent.get(x)!));
  let total = 0;
  let kept = 0;
  for (const [i, [a, b, w]] of sorted.entries()) {
    if (kept === nodes.length - 1) {
      s.tone(`r${i}`, 'dim');
      continue;
    }
    s.tone(`r${i}`, 'hl');
    edgeTone(s, a, b, 'warn');
    if (find(a) !== find(b)) {
      parent.set(find(a), find(b));
      total += w;
      kept++;
      s.tone(`r${i}`, 'ok');
      edgeTone(s, a, b, 'ok');
      s.tone([`g${a}`, `g${b}`], 'ok');
      s.say(`${a}–${b} (${w}): ${a} and ${b} aren't connected yet (union-find says different groups). Keep it and merge their groups. Total ${total}.`);
    } else {
      s.tone(`r${i}`, 'bad');
      edgeTone(s, a, b, 'bad');
      s.say(`${a}–${b} (${w}): ${a} and ${b} are already connected through kept edges. Adding it would make a loop: skip.`);
      edgeTone(s, a, b, 'dim');
      s.tone(`r${i}`, 'dim');
    }
  }
  s.say(`${kept} edges (always V − 1) connect all ${nodes.length} nodes for a total of ${total}, the cheapest possible. Sorting dominates: O(E log E).`);
  return s.build('Kruskal’s minimum spanning tree');
};

export const TIER6_ANIMS: Record<string, AnimScript> = {
  graph,
  'adjacency-matrix': adjacencyMatrix,
  'adjacency-list': adjacencyList,
  'edge-list': edgeList,
  'union-find': unionFind,
  bfs,
  dfs,
  'topological-sort': topologicalSort,
  dijkstra,
  kruskal,
};

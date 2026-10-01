import type { AnimScript, Tone } from '../engine';
import { Stage } from '../engine';
import { distinctInts } from '../../engine/random';
import type { TNode } from '../kit';
import { drawTree } from '../kit';

// ---------- mutable BST helpers ----------

interface BN {
  k: number;
  l: BN | null;
  r: BN | null;
  pri?: number;
}
const ht = (n: BN | null): number => (n ? 1 + Math.max(ht(n.l), ht(n.r)) : 0);
const bf = (n: BN) => ht(n.l) - ht(n.r);
function ins(n: BN | null, k: number, pri?: number): BN {
  if (!n) return { k, l: null, r: null, pri };
  if (k < n.k) n.l = ins(n.l, k, pri);
  else n.r = ins(n.r, k, pri);
  return n;
}
function rotR(n: BN): BN {
  const l = n.l!;
  n.l = l.r;
  l.r = n;
  return l;
}
function rotL(n: BN): BN {
  const r = n.r!;
  n.r = r.l;
  r.l = n;
  return r;
}
/** Rotate node k above its parent. Returns the new root. */
function rotateUp(root: BN, k: number): BN {
  if (root.l?.k === k) return rotR(root);
  if (root.r?.k === k) return rotL(root);
  if (k < root.k) root.l = rotateUp(root.l!, k);
  else root.r = rotateUp(root.r!, k);
  return root;
}
function parentOf(root: BN, k: number): BN | null {
  let cur: BN | null = root;
  let par: BN | null = null;
  while (cur && cur.k !== k) {
    par = cur;
    cur = k < cur.k ? cur.l : cur.r;
  }
  return par;
}
function pathTo(root: BN, k: number): BN[] {
  const out: BN[] = [];
  let cur: BN | null = root;
  while (cur) {
    out.push(cur);
    if (cur.k === k) break;
    cur = k < cur.k ? cur.l : cur.r;
  }
  return out;
}
const toT = (n: BN | null, f?: (n: BN) => Partial<TNode>): TNode | null =>
  n ? { id: String(n.k), label: String(n.k), left: toT(n.l, f), right: toT(n.r, f), ...(f ? f(n) : {}) } : null;

// =====================================================================
// AVL
// =====================================================================

const avl: AnimScript = () => {
  const s = new Stage();
  const v = distinctInts(5, 10, 99).sort((a, b) => a - b);
  const order = [v[2], v[3], v[4], v[0], v[1]];
  let root: BN | null = null;
  const opts = { dx: 56, dy: 70 };
  const draw = (bad?: number, hot?: number) =>
    drawTree(s, toT(root, (n) => ({ sub: `bf ${bf(n) > 0 ? '+' : ''}${bf(n)}`, tone: (n.k === bad ? 'bad' : n.k === hot ? 'ok' : 'plain') as Tone })), opts);
  s.text('rule', 0, -34, 'AVL rule: at every node, left and right heights differ by at most 1 (bf = −1, 0 or +1)', { bold: true, size: 'sm', tone: 'accent' });
  for (const k of order) {
    root = ins(root, k);
    draw(undefined, k);
    s.say(`Insert ${k} like in any BST. Each node shows its balance factor bf = height(left) − height(right).`);
    const path = pathTo(root, k).reverse();
    const z = path.find((n) => Math.abs(bf(n)) > 1);
    if (!z) {
      s.say(`Every bf is −1, 0 or +1: still balanced, nothing to do.`);
      continue;
    }
    draw(z.k);
    const heavyLeft = bf(z) > 0;
    const child = heavyLeft ? z.l! : z.r!;
    const zig = heavyLeft ? bf(child) < 0 : bf(child) > 0;
    s.say(`Node ${z.k} has bf ${bf(z) > 0 ? '+' : ''}${bf(z)}: its ${heavyLeft ? 'left' : 'right'} side is 2 taller. The rule is broken, so rotate.`);
    if (zig) {
      const g = heavyLeft ? child.r! : child.l!;
      root = rotateUp(root, g.k);
      draw(z.k, g.k);
      s.say(`Zig-zag shape (${heavyLeft ? 'left then right' : 'right then left'}). First rotate ${g.k} above ${child.k} to straighten it into a line.`);
      root = rotateUp(root, g.k);
      draw(undefined, g.k);
      s.say(`Then rotate ${g.k} above ${z.k}. ${g.k} becomes the middle, with ${Math.min(child.k, z.k)} and ${Math.max(child.k, z.k)} as its children. Balanced again.`);
    } else {
      root = rotateUp(root, child.k);
      draw(undefined, child.k);
      s.say(`Straight-line shape: one rotation. ${child.k} moves up, ${z.k} moves down to its ${heavyLeft ? 'right' : 'left'}. The in-order (sorted) order is unchanged; only the shape changed.`);
    }
  }
  s.say(`A rotation is just a few pointer changes (O(1)), and the height stays about log₂ n, so search, insert and delete are all O(log n), guaranteed.`);
  return s.build('AVL tree: rotations keep it balanced');
};

// =====================================================================
// Red-black
// =====================================================================

const redBlack: AnimScript = () => {
  const s = new Stage();
  const [d, a, b, c] = distinctInts(4, 10, 99).sort((x, y) => x - y);
  const opts = { dx: 56, dy: 70 };
  const color = new Map<number, 'red' | 'black'>();
  let root: BN | null = null;
  const draw = (hot?: number[]) => drawTree(s, toT(root, (n) => ({ tone: color.get(n.k)!, sub: hot?.includes(n.k) ? '!' : undefined })), opts);
  s.text('r1', 0, -54, 'Rules: every node red or black · root is black', { size: 'sm', bold: true, tone: 'accent' });
  s.text('r2', 0, -36, 'no red node has a red child · every path down has the same number of black nodes', { size: 'sm', bold: true, tone: 'accent' });
  root = ins(root, a);
  color.set(a, 'red');
  draw();
  s.say(`Red-black trees stay balanced with colours instead of heights. New nodes always start red. Insert ${a}…`);
  color.set(a, 'black');
  draw();
  s.say(`…but the root must be black, so recolour it. Free.`);
  root = ins(root, b);
  color.set(b, 'red');
  draw();
  s.say(`Insert ${b}: red, under a black parent. No rule broken.`);
  root = ins(root, c);
  color.set(c, 'red');
  draw([b, c]);
  s.say(`Insert ${c}: red, under ${b}, which is also red. Two reds in a row breaks the rules. ${c}'s uncle (the parent's sibling) is empty, which counts as black.`);
  root = rotateUp(root, b);
  draw([b, c]);
  s.say(`Black uncle → rotate: ${b} moves up to the top.`);
  color.set(b, 'black');
  color.set(a, 'red');
  draw();
  s.say(`…and swap colours: ${b} black, ${a} red. No red-red pair, and both paths have 1 black node. Fixed.`);
  root = ins(root, d);
  color.set(d, 'red');
  draw([a, d]);
  s.say(`Insert ${d}: red under red ${a} again. This time the uncle, ${c}, is RED.`);
  color.set(a, 'black');
  color.set(c, 'black');
  color.set(b, 'red');
  draw();
  s.say(`Red uncle → just recolour, no rotation: parent and uncle become black, grandparent ${b} becomes red.`);
  color.set(b, 'black');
  draw();
  s.say(`${b} is the root, so it goes back to black. Fixes are a few recolours and at most 2 rotations per insert. The rules keep the longest path at most twice the shortest: height ≤ 2 log n. C#’s SortedSet is a red-black tree.`);
  return s.build('Red-black tree: recolour and rotate');
};

// =====================================================================
// Splay
// =====================================================================

const splay: AnimScript = () => {
  const s = new Stage();
  const v = distinctInts(6, 10, 99).sort((x, y) => x - y);
  let root: BN | null = null;
  for (const k of [...v].reverse()) root = ins(root, k);
  const x = v[0];
  const opts = { dx: 50, dy: 56 };
  const draw = (hot?: number) => drawTree(s, toT(root, (n) => ({ tone: (n.k === hot ? 'hl' : 'plain') as Tone })), opts);
  draw();
  s.say(`A splay tree has no balance rule at all. Right now it's a bad shape: ${x} is ${v.length - 1} levels deep.`);
  draw(x);
  s.say(`Access ${x}. After every access, the node is “splayed”: rotated all the way to the root, so things used recently are cheap to reach again.`);
  while (root!.k !== x) {
    const p = parentOf(root!, x)!;
    const g = parentOf(root!, p.k);
    if (!g) {
      root = rotateUp(root!, x);
      draw(x);
      s.say(`Zig: ${x}'s parent is the root. One rotation puts ${x} on top.`);
    } else {
      const sameSide = (p.l?.k === x) === (g.l?.k === p.k);
      if (sameSide) {
        root = rotateUp(root!, p.k);
        draw(x);
        s.say(`Zig-zig: ${x}, its parent ${p.k} and grandparent ${g.k} are in a line. Rotate the parent ${p.k} up first…`);
        root = rotateUp(root!, x);
        draw(x);
        s.say(`…then rotate ${x} up. ${x} has climbed two levels.`);
      } else {
        root = rotateUp(root!, x);
        root = rotateUp(root!, x);
        draw(x);
        s.say(`Zig-zag: rotate ${x} up twice. It climbs two levels.`);
      }
    }
  }
  s.say(`${x} is the root. The tree also got shorter: height ${ht(root) - 1} instead of ${v.length - 1}. One access can be slow, but any long run of operations averages O(log n) each (amortised).`);
  return s.build('Splay tree: move the accessed node to the root');
};

// =====================================================================
// Treap
// =====================================================================

const treap: AnimScript = () => {
  const s = new Stage();
  let keys: number[] = [];
  let pri: number[] = [];
  // Make sure some rotations happen.
  for (let t = 0; t < 100; t++) {
    keys = distinctInts(5, 10, 99);
    pri = distinctInts(5, 1, 99);
    let root: BN | null = null;
    let rot = 0;
    keys.forEach((k, i) => {
      root = ins(root, k, pri[i]);
      let p = parentOf(root, k);
      while (p && pri[i] < p.pri!) {
        root = rotateUp(root, k);
        rot++;
        p = parentOf(root, k);
      }
    });
    if (rot >= 2) break;
  }
  const opts = { dx: 58, dy: 72 };
  let root: BN | null = null;
  const draw = (hot?: number) => drawTree(s, toT(root, (n) => ({ sub: `p ${n.pri}`, tone: (n.k === hot ? 'hl' : 'plain') as Tone })), opts);
  s.text('rule', 0, -34, 'keys: BST order (left < node < right) · priorities: smaller above (like a heap)', { size: 'sm', bold: true, tone: 'accent' });
  s.say('A treap gives every key a random priority and keeps two rules at once: BST order on keys, and heap order on priorities (a parent\'s priority is smaller).');
  keys.forEach((k, i) => {
    root = ins(root, k, pri[i]);
    draw(k);
    s.say(`Insert ${k} with random priority ${pri[i]}, as a leaf in the BST position.`);
    let p = parentOf(root, k);
    while (p && pri[i] < p.pri!) {
      const pk = p.k;
      const ppri = p.pri;
      root = rotateUp(root, k);
      draw(k);
      s.say(`${pri[i]} < ${ppri} (its parent ${pk}): heap order is broken, so rotate ${k} above ${pk}. Rotations never break BST order.`);
      p = parentOf(root, k);
    }
    if (root.k !== k || i === 0) s.say(p ? `${p.pri} < ${pri[i]}: heap order holds. Done.` : `${k} has the smallest priority, so it's the root.`);
  });
  s.say('Because priorities are random, the tree has the same shape as a BST built from a random insertion order: expected height O(log n), with very simple code.');
  return s.build('Treap: random priorities keep it balanced');
};

// =====================================================================
// B-tree (max 3 keys per node)
// =====================================================================

interface BTN {
  id: string;
  keys: number[];
  kids: BTN[];
}

const bTree: AnimScript = () => {
  const s = new Stage();
  let next = 0;
  const node = (keys: number[], kids: BTN[] = []): BTN => ({ id: `b${next++}`, keys, kids });
  let root = node([]);
  const opts = { nodeW: 104, dx: 116, dy: 72 };
  const toTN = (n: BTN, hot?: string, bad?: string): TNode => ({ id: n.id, label: n.keys.join('  ') || ' ', kids: n.kids.map((k) => toTN(k, hot, bad)), tone: n.id === bad ? 'bad' : n.id === hot ? 'ok' : 'plain' });
  const draw = (hot?: string, bad?: string) => drawTree(s, toTN(root, hot, bad), opts);
  const keys = distinctInts(9, 10, 99);
  s.text('rule', 0, -34, 'Each node holds up to 3 sorted keys; all leaves are on the same level', { size: 'sm', bold: true, tone: 'accent' });
  draw();
  s.say('A B-tree packs several keys into each node, so the tree is wide and very short. Databases use it because each node is one disk read.');
  for (const k of keys) {
    const path: BTN[] = [root];
    while (path[path.length - 1].kids.length) {
      const n = path[path.length - 1];
      const i = n.keys.filter((x) => x < k).length;
      path.push(n.kids[i]);
    }
    let leaf = path[path.length - 1];
    leaf.keys = [...leaf.keys, k].sort((x, y) => x - y);
    draw(leaf.id, leaf.keys.length > 3 ? leaf.id : undefined);
    s.say(`Insert ${k}: follow the keys down to the right leaf and put it in sorted position.${leaf.keys.length > 3 ? ' Now the node has 4 keys: too many.' : ''}`);
    let depth = path.length - 1;
    while (leaf.keys.length > 3) {
      const up = leaf.keys[2];
      const right = node(leaf.keys.slice(3), leaf.kids.slice(3));
      leaf.keys = leaf.keys.slice(0, 2);
      leaf.kids = leaf.kids.slice(0, 3);
      const parent = depth > 0 ? path[depth - 1] : null;
      if (parent) {
        const at = parent.kids.indexOf(leaf);
        parent.keys = [...parent.keys, up].sort((x, y) => x - y);
        parent.kids.splice(at + 1, 0, right);
        draw(parent.id, parent.keys.length > 3 ? parent.id : undefined);
        s.say(`Split it: the two smaller keys stay, the biggest moves into a new node, and the middle-right key ${up} moves UP into the parent.${parent.keys.length > 3 ? ' Now the parent overflows too, so it splits the same way.' : ''}`);
        leaf = parent;
        depth--;
      } else {
        root = node([up], [leaf, right]);
        draw(root.id);
        s.say(`Split the root: ${up} moves up into a brand-new root. This is the only way a B-tree gets taller, so every leaf stays at the same depth.`);
        break;
      }
    }
  }
  s.say('Real B-trees hold hundreds of keys per node: a billion keys fit in about 4 levels, so any key is found in about 4 disk reads.');
  return s.build('B-tree: wide nodes that split');
};

// =====================================================================
// B+ tree (leaves hold all keys and are linked)
// =====================================================================

const bPlusTree: AnimScript = () => {
  const s = new Stage();
  let next = 0;
  const node = (keys: number[], kids: BTN[] = []): BTN => ({ id: `p${next++}`, keys, kids });
  let root = node([]);
  const opts = { nodeW: 96, dx: 124, dy: 76 };
  const leaves = (n: BTN): BTN[] => (n.kids.length ? n.kids.flatMap(leaves) : [n]);
  const toTN = (n: BTN, tone: (n: BTN) => Tone): TNode => ({ id: n.id, label: n.keys.join('  ') || ' ', kids: n.kids.map((k) => toTN(k, tone)), tone: tone(n) });
  const draw = (tone: (n: BTN) => Tone = () => 'plain') => {
    drawTree(s, toTN(root, (n) => (n.kids.length ? (tone(n) === 'plain' ? 'dim' : tone(n)) : tone(n))), opts);
    for (const k of Object.keys(s.arrows)) if (k.startsWith('lk')) delete s.arrows[k];
    const ls = leaves(root);
    for (let i = 0; i + 1 < ls.length; i++) s.arrow(`lk${ls[i].id}`, `n${ls[i].id}`, `n${ls[i + 1].id}`, { tone: 'accent', bend: 0 });
  };
  const keys = distinctInts(8, 10, 99);
  draw();
  s.say('A B+ tree is the B-tree databases actually use. ALL keys live in the leaves; upper nodes only hold signposts. And the leaves are linked in a chain, left to right.');
  for (const k of keys) {
    const path: BTN[] = [root];
    while (path[path.length - 1].kids.length) {
      const n = path[path.length - 1];
      path.push(n.kids[n.keys.filter((x) => x <= k).length]);
    }
    let cur = path[path.length - 1];
    cur.keys = [...cur.keys, k].sort((x, y) => x - y);
    draw((n) => (n === cur ? (n.keys.length > 3 ? 'bad' : 'ok') : 'plain'));
    s.say(`Insert ${k} into its leaf.${cur.keys.length > 3 ? ' 4 keys: too many, split.' : ''}`);
    let depth = path.length - 1;
    while (cur.keys.length > 3) {
      const isLeaf = !cur.kids.length;
      let sep: number;
      let right: BTN;
      if (isLeaf) {
        right = node(cur.keys.slice(2));
        cur.keys = cur.keys.slice(0, 2);
        sep = right.keys[0];
      } else {
        sep = cur.keys[2];
        right = node(cur.keys.slice(3), cur.kids.slice(3));
        cur.keys = cur.keys.slice(0, 2);
        cur.kids = cur.kids.slice(0, 3);
      }
      const parent = depth > 0 ? path[depth - 1] : null;
      if (parent) {
        parent.keys = [...parent.keys, sep].sort((x, y) => x - y);
        parent.kids.splice(parent.kids.indexOf(cur) + 1, 0, right);
      } else root = node([sep], [cur, right]);
      const p = parent ?? root;
      draw((n) => (n === p ? 'ok' : n === right || n === cur ? 'hl' : 'plain'));
      s.say(isLeaf ? `Leaf split: two keys stay, two move to a new leaf, and a COPY of ${sep} goes up as a signpost (the key itself stays in the leaf). The new leaf joins the chain.` : `The signpost node overflowed too: it splits like a B-tree, moving ${sep} up.`);
      if (!parent) break;
      cur = parent;
      depth--;
    }
  }
  const all = leaves(root).flatMap((l) => l.keys);
  const lo = all[1];
  const hi = all[Math.min(all.length - 2, 5)];
  draw();
  s.say(`Range query: every key from ${lo} to ${hi}. Go down once to the leaf where ${lo} would be…`);
  const ls = leaves(root);
  const start = ls.findIndex((l) => l.keys.some((x) => x >= lo));
  const used = new Set<BTN>();
  for (let i = start; i < ls.length && ls[i].keys[0] <= hi; i++) {
    used.add(ls[i]);
    draw((n) => (used.has(n) ? 'ok' : 'plain'));
    s.say(i === start ? `…then read along the leaf chain: ${ls[i].keys.filter((x) => x >= lo && x <= hi).join(', ')}.` : `Follow the link to the next leaf: ${ls[i].keys.filter((x) => x >= lo && x <= hi).join(', ') || 'nothing in range'}.`);
  }
  s.say('One trip down, then a straight walk along the leaves. That\'s why database range queries (WHERE price BETWEEN 10 AND 20) and ORDER BY are fast.');
  return s.build('B+ tree: signposts above, linked leaves below');
};

export const TIER5_ANIMS: Record<string, AnimScript> = {
  'avl-tree': avl,
  'red-black-tree': redBlack,
  'splay-tree': splay,
  treap,
  'b-tree': bTree,
  'b-plus-tree': bPlusTree,
};


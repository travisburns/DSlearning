import type { AnimScript, Tone } from '../engine';
import { Stage } from '../engine';
import { distinctInts, pick, randInt, shuffle } from '../../engine/random';
import type { TNode } from '../kit';
import { W, bst, drawTree, onSlot, slotRow, tag, treePos } from '../kit';

// =====================================================================
// Tree basics (folders)
// =====================================================================

const tree: AnimScript = () => {
  const s = new Stage();
  const pick2 = <T,>(xs: T[], k: number) => shuffle(xs).slice(0, k);
  const kids: TNode[] = pick2(['docs', 'pics', 'music', 'games'], 3).map((d) => ({
    id: d,
    label: d,
    kids: pick2(['a.txt', 'b.png', 'c.mp3', 'd.exe', 'e.pdf'], randInt(1, 2)).map((f) => ({ id: `${d}/${f}`, label: f })),
  }));
  const full: TNode = { id: 'root', label: 'C:', kids };
  const opts = { nodeW: 64, dx: 76, dy: 70 };
  drawTree(s, { ...full, kids: [] }, opts);
  s.say('A tree stores things that branch, like folders on a disk. The top node is the root. Every node except the root has exactly one parent.');
  drawTree(s, { ...full, kids: kids.map((k) => ({ ...k, kids: [] })) }, opts);
  s.say(`The root's children: ${kids.map((k) => k.label).join(', ')}. Each is a node with an arrow down from its parent.`);
  drawTree(s, full, opts);
  for (const k of kids) for (const f of k.kids!) s.tone(`n${f.id}`, 'ok');
  s.say('Nodes with no children are leaves (the files). A folder with children is an internal node; its whole branch is a subtree.');
  const leaf = pick(kids.flatMap((k) => k.kids!));
  const parent = kids.find((k) => k.kids!.includes(leaf))!;
  for (const k of kids) for (const f of k.kids!) s.tone(`n${f.id}`, 'plain');
  s.tone([`n${leaf.id}`, `n${parent.id}`, 'nroot'], 'hl');
  s.say(`From any node there is exactly one path up to the root: ${leaf.label} → ${parent.label} → C:. Its depth is the number of edges on that path: 2.`);
  s.tone([`n${leaf.id}`, `n${parent.id}`, 'nroot'], 'plain');
  s.text('h', 0, -30, 'height = 2 (longest root-to-leaf path)', { bold: true, tone: 'accent' });
  s.say('The height of the tree is the longest root-to-leaf path. Many tree operations cost O(height), so keeping trees short is a big theme in later lessons.');
  return s.build('Tree basics: root, children, leaves');
};

// =====================================================================
// Binary tree: same nodes, different shapes
// =====================================================================

const binaryTree: AnimScript = () => {
  const s = new Stage();
  const keys = distinctInts(7, 1, 99).sort((a, b) => a - b);
  const balancedOrder = [keys[3], keys[1], keys[5], keys[0], keys[2], keys[4], keys[6]];
  const t1 = bst(balancedOrder);
  drawTree(s, t1, { dx: 54, dy: 64 });
  s.say('A binary tree: every node has at most two children, called left and right. This one holds 7 values.');
  s.tone(`n${keys[3]}`, 'hl');
  s.tone([`n${keys[1]}`, `n${keys[5]}`], 'accent');
  s.say(`The root ${keys[3]} has a left child ${keys[1]} and a right child ${keys[5]}. Each child is the root of its own smaller binary tree, which is why tree code is usually recursive.`);
  s.tone([`n${keys[3]}`, `n${keys[1]}`, `n${keys[5]}`], 'plain');
  s.text('h', 0, -30, 'height 2: any node is at most 2 steps from the root', { bold: true, tone: 'ok' });
  s.say('This shape is perfectly balanced: 7 nodes in 3 levels. Each level doubles, so n nodes need only about log₂ n levels.');
  const stick = bst(keys);
  drawTree(s, stick, { dx: 40, dy: 44 });
  s.text('h', 0, -30, 'height 6: the bottom node is 6 steps away', { bold: true, tone: 'bad' });
  s.say('Same 7 values, different shape: every node has only a right child. It\'s really a linked list. Reaching the bottom now takes 6 steps instead of 2.');
  drawTree(s, t1, { dx: 54, dy: 64 });
  s.text('h', 0, -30, 'shape decides the cost: O(log n) vs O(n)', { bold: true, tone: 'accent' });
  s.say('With a million nodes that\'s 20 levels versus a million. The shape of a tree decides its speed; balanced trees (later) fight to keep this shape.');
  return s.build('Binary tree: shape is everything');
};

// =====================================================================
// BST: insert and search
// =====================================================================

const bstAnim: AnimScript = () => {
  const s = new Stage();
  const keys = distinctInts(7, 10, 99);
  const order = [keys[0], ...keys.slice(1)];
  let inserted: number[] = [];
  const opts = { dx: 52, dy: 64 };
  const descend = (k: number, verb: string) => {
    const root = bst(inserted);
    const pos = treePos(root, opts);
    let cur = root;
    s.box('key', { x: pos.get(String(root!.id))!.x - 50, y: -46, w: W, h: 34, label: String(k), tone: 'hl' });
    while (cur) {
      const p = pos.get(cur.id)!;
      s.move('key', p.x + 4, p.y - 40);
      s.tone(`n${cur.id}`, 'hl');
      const c = Number(cur.label);
      const goLeft = k < c;
      if (k === c) {
        s.tone(`n${cur.id}`, 'ok');
        s.say(`${k} = ${c}: found.`);
        return true;
      }
      const next = goLeft ? cur.left : cur.right;
      s.say(`${verb} ${k}: compare with ${c}. ${k} is ${goLeft ? 'smaller, go left' : 'bigger, go right'}${next ? '.' : `, and there's no ${goLeft ? 'left' : 'right'} child.`}`);
      s.tone(`n${cur.id}`, 'plain');
      cur = next ?? null;
    }
    return false;
  };
  inserted = [order[0]];
  drawTree(s, bst(inserted), opts);
  s.say(`A binary search tree keeps one rule at every node: smaller values in the left subtree, bigger ones in the right. Start with ${order[0]}.`);
  for (const k of order.slice(1)) {
    descend(k, 'Insert');
    inserted = [...inserted, k];
    s.del('key');
    drawTree(s, bst(inserted), opts);
    s.tone(`n${k}`, 'ok');
    s.say(`${k} goes in that empty spot. The rule still holds everywhere.`);
    s.tone(`n${k}`, 'plain');
  }
  const q = pick(inserted.slice(2));
  descend(q, 'Search for');
  s.del('key');
  s.say(`Each comparison throws away a whole subtree, so a search costs one step per level: O(height). Balanced, that's O(log n).`);
  return s.build('Binary search tree: insert and search');
};

// =====================================================================
// Heaps (array + tree side by side)
// =====================================================================

class HeapView {
  vals: number[] = [];
  constructor(
    public s: Stage,
    public d: number,
    public max = false,
    public ty = 90,
  ) {}
  pos(i: number) {
    // Tree positions by index: level by level, spread evenly.
    const lvl = (j: number) => {
      let l = 0;
      let first = 0;
      let width = 1;
      while (j >= first + width) {
        first += width;
        width *= this.d;
        l++;
      }
      return { l, k: j - first, width };
    };
    const { l, k, width } = lvl(i);
    const span = this.d === 2 ? 440 : 520;
    return { x: (span / width) * (k + 0.5) - 20, y: this.ty + l * 64 };
  }
  anchors(n: number) {
    for (let i = 0; i < n; i++) {
      this.s.box(`p${i}`, { ...this.pos(i), w: 40, h: 40, shape: 'circle', tone: 'ghost' });
      if (i > 0) this.s.arrow(`pe${i}`, `p${Math.floor((i - 1) / this.d)}`, `p${i}`, { tone: 'dim', line: true });
    }
    slotRow(this.s, 'a', n, { y: 0 });
  }
  draw(tone?: (i: number) => Tone) {
    this.vals.forEach((v, i) => {
      this.s.box(`t${v}`, { ...this.pos(i), w: 40, h: 40, shape: 'circle', label: String(v), tone: tone?.(i) ?? 'plain' });
      onSlot(this.s, `av${v}`, v, i, { tone: tone?.(i) ?? 'plain' });
    });
  }
  better(a: number, b: number) {
    return this.max ? a > b : a < b;
  }
  swap(i: number, j: number) {
    [this.vals[i], this.vals[j]] = [this.vals[j], this.vals[i]];
  }
}

function heapAnim(d: number): AnimScript {
  return () => {
    const s = new Stage();
    const cap = d === 2 ? 9 : 10;
    const h = new HeapView(s, d);
    const init = distinctInts(cap - 2, 10, 99).sort((a, b) => a - b);
    // A valid min-heap: a sorted array always is one.
    h.vals = init;
    h.anchors(cap);
    h.draw();
    s.say(
      d === 2
        ? `A binary min-heap: a tree where every parent is smaller than its children, stored in an array with no pointers. Children of index i live at 2i+1 and 2i+2.`
        : `A ${d}-ary min-heap: same rule (parent ≤ children) but each node has ${d} children, at ${d}i+1 … ${d}i+${d}. The tree is wider and shorter.`,
    );
    const nv = pick(Array.from({ length: init[2] - 1 }, (_, k) => k + 1).filter((v) => !init.includes(v)));
    h.vals.push(nv);
    let i = h.vals.length - 1;
    h.draw((k) => (k === i ? 'ok' : 'plain'));
    s.say(`Insert ${nv}: put it in the next free array slot (index ${i}), which is the next spot on the bottom level. The shape stays complete.`);
    while (i > 0) {
      const p = Math.floor((i - 1) / d);
      if (!h.better(h.vals[i], h.vals[p])) {
        h.draw((k) => (k === i ? 'ok' : k === p ? 'accent' : 'plain'));
        s.say(`Parent ${h.vals[p]} ≤ ${h.vals[i]}: the rule holds. Stop.`);
        break;
      }
      h.draw((k) => (k === i ? 'bad' : k === p ? 'bad' : 'plain'));
      s.say(`Its parent (index ${p}) is ${h.vals[p]}, bigger than ${h.vals[i]}. The rule is broken here.`);
      h.swap(i, p);
      i = p;
      h.draw((k) => (k === i ? 'ok' : 'plain'));
      s.say(`Swap them (“sift up”). ${nv} moves up a level, in the tree and in the array at the same time.`);
    }
    h.draw();
    s.say(`Done: at most one swap per level, O(log n). The smallest value is always at index 0, the root: peeking at the minimum is O(1).`);
    // Remove min.
    const top = h.vals[0];
    s.tone([`t${top}`, `av${top}`], 'accent');
    s.say(`Remove the minimum, ${top}, from the root.`);
    s.del(`t${top}`, `av${top}`);
    const last = h.vals.pop()!;
    h.vals[0] = last;
    i = 0;
    h.draw((k) => (k === 0 ? 'hl' : 'plain'));
    s.say(`Fill the hole with the LAST element (${last}), so the tree keeps its shape. Now the root is probably too big.`);
    for (;;) {
      const kids = Array.from({ length: d }, (_, k) => d * i + 1 + k).filter((c) => c < h.vals.length);
      if (!kids.length) break;
      const c = kids.reduce((b, k) => (h.better(h.vals[k], h.vals[b]) ? k : b));
      if (!h.better(h.vals[c], h.vals[i])) {
        h.draw((k) => (k === i ? 'ok' : 'plain'));
        s.say(`${h.vals[i]} is ≤ all its children. The rule holds again.`);
        break;
      }
      h.draw((k) => (k === i ? 'bad' : k === c ? 'accent' : 'plain'));
      s.say(`${h.vals[i]} vs its children ${kids.map((k) => h.vals[k]).join(', ')}: the smallest child, ${h.vals[c]}, must come up.`);
      h.swap(i, c);
      i = c;
      h.draw((k) => (k === i ? 'hl' : 'plain'));
      s.say(`Swap (“sift down”). ${last} sinks one level.`);
    }
    h.draw();
    s.say(
      d === 2
        ? 'Remove-min is O(log n) too. That\'s the whole trick behind C#\'s PriorityQueue: cheap insert, cheap remove-min, one plain array.'
        : `Fewer levels means sift-up is faster, but sift-down compares ${d} children per level. ${d}-ary heaps suit work with many inserts (like Dijkstra on big graphs).`,
    );
    return s.build(d === 2 ? 'Binary heap: insert and remove-min' : `${d}-ary heap: wider, shorter`);
  };
}

// =====================================================================
// Trie
// =====================================================================

const trie: AnimScript = () => {
  const s = new Stage();
  const sets = [
    ['car', 'cat', 'cart', 'dog', 'do'],
    ['to', 'tea', 'ten', 'in', 'inn'],
    ['see', 'sea', 'set', 'up', 'us'],
  ];
  const words = pick(sets);
  const ends = new Set<string>();
  const nodes = new Set<string>(['']);
  const build = (): TNode => {
    const mk = (pre: string): TNode => {
      const kids = [...nodes].filter((p) => p.length === pre.length + 1 && p.startsWith(pre)).sort();
      return { id: pre || 'root', label: pre ? pre[pre.length - 1] : '•', kids: kids.map(mk), tone: ends.has(pre) ? 'ok' : 'plain' };
    };
    return mk('');
  };
  const opts = { dx: 50, dy: 58, size: 36 };
  drawTree(s, build(), opts);
  s.say('A trie stores words letter by letter. Each node is one letter; the path from the root spells a prefix. Green nodes mark the end of a whole word.');
  for (const w of words) {
    let created = 0;
    for (let k = 1; k <= w.length; k++) if (!nodes.has(w.slice(0, k))) {
      nodes.add(w.slice(0, k));
      created++;
    }
    ends.add(w);
    drawTree(s, build(), opts);
    for (let k = 1; k <= w.length; k++) s.tone(`n${w.slice(0, k)}`, k === w.length ? 'ok' : 'hl');
    s.say(created === w.length ? `Insert “${w}”: no shared prefix yet, so a new branch of ${w.length} nodes.` : created ? `Insert “${w}”: the first ${w.length - created} letter${w.length - created > 1 ? 's' : ''} already exist, so reuse them and add ${created} new node${created > 1 ? 's' : ''}.` : `Insert “${w}”: every letter is already there (it's a prefix of another word). Just mark the last node as a word end.`);
    drawTree(s, build(), opts);
  }
  const pre = words[0].slice(0, 2);
  for (let k = 1; k <= pre.length; k++) s.tone(`n${pre.slice(0, k)}`, 'accent');
  const found = words.filter((w) => w.startsWith(pre));
  s.say(`Which words start with “${pre}”? Walk ${pre.length} steps down (one per letter), then everything below is an answer: ${found.join(', ')}. The cost depends on the word length, not on how many words are stored.`);
  return s.build('Trie: words sharing prefixes');
};

// =====================================================================
// Tree traversals
// =====================================================================

const treeDfs: AnimScript = () => {
  const s = new Stage();
  const keys = distinctInts(7, 10, 99).sort((a, b) => a - b);
  const root = bst([keys[3], keys[1], keys[5], keys[0], keys[2], keys[4], keys[6]])!;
  const kind = pick(['preorder', 'inorder', 'postorder'] as const);
  const rule = { preorder: 'node, then left, then right', inorder: 'left, then node, then right', postorder: 'left, then right, then node' }[kind];
  drawTree(s, root, { dx: 54, dy: 64 });
  s.say(`Visit every node once, ${kind.toUpperCase()}: ${rule}. Recursion does the bookkeeping: each call handles one node and its two subtrees.`);
  const out: string[] = [];
  const visit = (n: TNode) => {
    out.push(n.label);
    s.tone(`n${n.id}`, 'ok');
    s.text('out', 0, 280, `visited: ${out.join(', ')}`, { bold: true });
    const why = { preorder: `Arrive at ${n.label}: preorder handles the node first, so output ${n.label}, then go left.`, inorder: `${n.label}'s left subtree is finished: output ${n.label}, then do its right subtree.`, postorder: `Both of ${n.label}'s subtrees are finished: now output ${n.label}.` }[kind];
    s.say(`${why}${kind === 'inorder' && out.length === 7 ? ' Inorder on a BST comes out sorted!' : ''}`);
  };
  const go = (n: TNode | null | undefined, depth: number) => {
    if (!n) return;
    s.tone(`n${n.id}`, s.boxes[`n${n.id}`].tone === 'ok' ? 'ok' : 'hl');
    tag(s, 'cur', `depth ${depth}`, s.boxes[`n${n.id}`].x - 70, s.boxes[`n${n.id}`].y + 8);
    s.arrow('cur>', 'cur', `n${n.id}`, { tone: 'ptr' });
    if (kind === 'preorder') visit(n);
    else s.say(`At ${n.label}: ${kind === 'inorder' ? 'first go down the left subtree' : 'first do both subtrees'}.`);
    go(n.left, depth + 1);
    if (kind === 'inorder') visit(n);
    go(n.right, depth + 1);
    if (kind === 'postorder') visit(n);
  };
  go(root, 0);
  s.del('cur', 'cur>');
  s.say(`${kind}: ${out.join(', ')}. Each node visited once: O(n). The recursion is only as deep as the tree is tall, so memory is O(height).`);
  return s.build(`Tree traversal: ${kind}`);
};

// =====================================================================
// Heapsort
// =====================================================================

const heapsort: AnimScript = () => {
  const s = new Stage();
  const n = 7;
  const h = new HeapView(s, 2, true);
  h.vals = distinctInts(n, 10, 99);
  h.anchors(n);
  h.draw();
  s.say('Heapsort in place: first rearrange the array into a MAX-heap (biggest at the root), then repeatedly move the root to the end.');
  const siftDown = (i: number, size: number, narrate: boolean) => {
    for (;;) {
      const kids = [2 * i + 1, 2 * i + 2].filter((c) => c < size);
      if (!kids.length) return;
      const c = kids.reduce((b, k) => (h.vals[k] > h.vals[b] ? k : b));
      if (h.vals[c] <= h.vals[i]) return;
      h.swap(i, c);
      if (narrate) {
        h.draw((k) => (k >= size ? 'ok' : k === c ? 'hl' : 'plain'));
        s.say(`${h.vals[c]} sinks below its bigger child ${h.vals[i]}.`);
      }
      i = c;
    }
  };
  for (let i = (n >> 1) - 1; i >= 0; i--) siftDown(i, n, false);
  h.draw();
  s.say(`Build the heap (sift each parent down, bottom-up): now every parent ≥ its children, and the biggest value, ${h.vals[0]}, is at the root.`);
  for (let size = n; size > 1; size--) {
    h.swap(0, size - 1);
    h.draw((k) => (k >= size - 1 ? 'ok' : k === 0 ? 'hl' : 'plain'));
    s.say(`Swap the root (${h.vals[size - 1]}, the biggest left) with the last heap element. ${h.vals[size - 1]} is now in its final place at the end; the heap shrinks by one.`);
    siftDown(0, size - 1, size > n - 2);
    h.draw((k) => (k >= size - 1 ? 'ok' : 'plain'));
    if (size <= n - 2) s.say(`Sift the new root down to restore the heap. The next biggest, ${h.vals[0]}, rises to the top.`);
  }
  h.draw(() => 'ok');
  s.say('Sorted, inside the same array: O(n log n) always, O(1) extra memory. Not stable, and usually a bit slower than quicksort in practice.');
  return s.build('Heapsort');
};

export const TIER4_ANIMS: Record<string, AnimScript> = {
  tree,
  'binary-tree': binaryTree,
  bst: bstAnim,
  'binary-heap': heapAnim(2),
  'd-ary-heap': heapAnim(3),
  trie,
  'tree-dfs': treeDfs,
  heapsort,
};


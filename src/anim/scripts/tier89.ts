import type { AnimScript, Tone } from '../engine';
import { Stage } from '../engine';
import { pick, randInt, shuffle } from '../../engine/random';
import type { TNode } from '../kit';
import { H, drawTree, onSlot, slotRow } from '../kit';

// ---------- radix trie (used by radix trie and suffix tree) ----------

interface RN {
  id: string;
  edge: string;
  kids: RN[];
  end: boolean;
  leafAt?: number;
}

class Radix {
  next = 0;
  root: RN = { id: 'r', edge: '', kids: [], end: false };
  /** Insert and say what happened: 'new' branch, 'split' an edge, or 'mark' an existing node. */
  insert(w: string, leafAt?: number): { kind: 'new' | 'split' | 'mark'; at: string; shared: string } {
    let n = this.root;
    let rest = w;
    let shared = '';
    for (;;) {
      const kid = n.kids.find((k) => k.edge[0] === rest[0]);
      if (!rest.length) {
        n.end = true;
        return { kind: 'mark', at: n.id, shared };
      }
      if (!kid) {
        const leaf: RN = { id: `x${this.next++}`, edge: rest, kids: [], end: true, leafAt };
        n.kids.push(leaf);
        n.kids.sort((a, b) => a.edge.localeCompare(b.edge));
        return { kind: 'new', at: leaf.id, shared };
      }
      let p = 0;
      while (p < kid.edge.length && p < rest.length && kid.edge[p] === rest[p]) p++;
      if (p === kid.edge.length) {
        shared += kid.edge;
        n = kid;
        rest = rest.slice(p);
        continue;
      }
      // Split the edge at p.
      const mid: RN = { id: `x${this.next++}`, edge: kid.edge.slice(0, p), kids: [kid], end: false };
      kid.edge = kid.edge.slice(p);
      n.kids[n.kids.indexOf(kid)] = mid;
      const r = rest.slice(p);
      if (r.length) {
        mid.kids.push({ id: `x${this.next++}`, edge: r, kids: [], end: true, leafAt });
        mid.kids.sort((a, b) => a.edge.localeCompare(b.edge));
      } else mid.end = true;
      return { kind: 'split', at: mid.id, shared: shared + mid.edge };
    }
  }
  toT(tone: (n: RN) => Tone = (n) => (n.end ? 'ok' : 'plain'), sub?: (n: RN) => string | undefined): TNode {
    const mk = (n: RN): TNode => ({ id: n.id, label: n.edge || '•', kids: n.kids.map(mk), tone: tone(n), sub: sub?.(n) });
    return mk(this.root);
  }
}

// =====================================================================
// Radix trie
// =====================================================================

const radixTrie: AnimScript = () => {
  const s = new Stage();
  const words = pick([
    ['romane', 'romanus', 'romulus', 'rubens', 'ruber'],
    ['team', 'tea', 'ten', 'toast', 'to'],
    ['slow', 'slowly', 'slower', 'sly', 'show'],
  ]);
  const t = new Radix();
  const opts = { nodeW: 70, dx: 80, dy: 64 };
  drawTree(s, t.toT(), opts);
  s.say('A radix trie (compressed trie) is a trie where chains of single-child nodes are squashed into one edge holding several letters. Fewer nodes, same lookups.');
  for (const w of words) {
    const r = t.insert(w);
    drawTree(s, t.toT((n) => (n.id === r.at ? 'hl' : n.end ? 'ok' : 'plain')), opts);
    s.say(
      r.kind === 'new'
        ? `Insert “${w}”: ${r.shared ? `follow “${r.shared}”, then ` : ''}no edge starts with the next letter, so add one edge holding the whole rest of the word.`
        : r.kind === 'split'
          ? `Insert “${w}”: an existing edge only partly matches. Split it after “${r.shared}”: the shared part becomes its own node, and the two different endings hang below it.`
          : `Insert “${w}”: it's already spelled out along existing edges. Just mark that node as a word end.`,
    );
  }
  drawTree(s, t.toT(), opts);
  s.say('Green nodes end a word. A plain trie would need one node per letter; here long runs share one node. Routers use radix tries to match IP address prefixes.');
  return s.build('Radix trie: compressed letters');
};

// =====================================================================
// Suffix array
// =====================================================================

const suffixArray: AnimScript = () => {
  const s = new Stage();
  const word = pick(['banana', 'abracad', 'mississ', 'cocoa', 'papaya']);
  const n = word.length;
  const suf = Array.from({ length: n }, (_, i) => ({ i, t: word.slice(i) }));
  const RH = 32;
  [...word].forEach((c, i) => s.box(`c${i}`, { x: i * 36, y: -70, w: 32, h: 32, label: c, top: String(i) }));
  suf.forEach(({ i, t }) => s.box(`s${i}`, { x: 0, y: i * RH, w: 130, h: 26, label: t, sub: undefined, tone: 'plain' }));
  suf.forEach(({ i }) => s.text(`ix${i}`, -10, i * RH + 18, String(i), { anchor: 'end', size: 'sm', tone: 'dim' }));
  s.say(`Every suffix of “${word}”: the word from position 0, from 1, from 2… There are ${n}.`);
  const sorted = [...suf].sort((a, b) => (a.t < b.t ? -1 : 1));
  sorted.forEach(({ i }, k) => {
    s.move(`s${i}`, 0, k * RH);
    s.text(`ix${i}`, -10, k * RH + 18, String(i), { anchor: 'end', size: 'sm', tone: 'accent', bold: true });
  });
  s.say('Sort them alphabetically. The suffix array is just the list of start positions in this sorted order.');
  s.text('sa', 160, -20, `SA = [${sorted.map((x) => x.i).join(', ')}]`, { bold: true, tone: 'accent', size: 'lg' });
  s.say(`SA = [${sorted.map((x) => x.i).join(', ')}]: one int per character. Every substring of the word is the start of some suffix, and in sorted order equal starts sit next to each other.`);
  const pat = word.slice(randInt(1, n - 3), undefined).slice(0, 2);
  s.text('q', 160, 20, `Find “${pat}”`, { bold: true, size: 'lg' });
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    s.tone(`s${sorted[m].i}`, 'hl');
    const less = sorted[m].t.slice(0, pat.length) < pat;
    s.say(`Binary search: middle row “${sorted[m].t}”. Its first ${pat.length} letters “${sorted[m].t.slice(0, pat.length)}” are ${less ? `before “${pat}”: look lower` : `not before “${pat}”: look here or higher`}.`);
    s.tone(`s${sorted[m].i}`, 'plain');
    if (less) lo = m + 1;
    else hi = m;
  }
  const hits = sorted.filter((x) => x.t.startsWith(pat));
  for (const h of hits) s.tone(`s${h.i}`, 'ok');
  for (const h of hits) for (let k = 0; k < pat.length; k++) s.tone(`c${h.i + k}`, 'ok');
  s.say(`All suffixes starting with “${pat}” are together: ${hits.length} match${hits.length === 1 ? '' : 'es'}, at positions ${hits.map((h) => h.i).join(', ')}. Search is O(m log n) with no extra index per position.`);
  return s.build('Suffix array: sorted suffixes');
};

// =====================================================================
// Suffix tree
// =====================================================================

const suffixTree: AnimScript = () => {
  const s = new Stage();
  const word = pick(['banana', 'abab', 'cocoa', 'aabab']);
  const text = `${word}$`;
  const t = new Radix();
  const opts = { nodeW: 62, dx: 68, dy: 66 };
  const sub = (n: RN) => (n.leafAt !== undefined ? `@${n.leafAt}` : undefined);
  drawTree(s, t.toT(() => 'plain', sub), opts);
  s.say(`A suffix tree is a compressed trie of every suffix of “${word}” (with $ marking the end). Any substring of the word is a path from the root.`);
  for (let i = 0; i < text.length; i++) {
    const r = t.insert(text.slice(i), i);
    drawTree(s, t.toT((n) => (n.id === r.at ? 'hl' : 'plain'), sub), opts);
    s.say(`Add suffix ${i}, “${text.slice(i)}”.${r.kind === 'split' ? ` It shares “${r.shared}” with an earlier suffix, so that edge splits there.` : r.shared ? ` It continues below “${r.shared}”.` : ''} The leaf remembers where it starts (@${i}).`);
  }
  const counts = new Map<string, number>();
  for (let i = 0; i < word.length; i++) for (let j = i + 1; j <= word.length; j++) counts.set(word.slice(i, j), (counts.get(word.slice(i, j)) ?? 0) + 1);
  const pat = [...counts.entries()].filter(([k, c]) => c > 1 && k.length >= 1).sort((a, b) => b[0].length - a[0].length)[0]?.[0] ?? word[0];
  // Highlight the path for pat and everything below it.
  const below = new Set<string>();
  const on = new Set<string>();
  const walk = (n: RN, rest: string): RN | null => {
    if (!rest.length) return n;
    const k = n.kids.find((x) => x.edge[0] === rest[0]);
    if (!k) return null;
    on.add(k.id);
    if (k.edge.length >= rest.length) return k;
    return walk(k, rest.slice(k.edge.length));
  };
  const end = walk(t.root, pat);
  const mark = (n: RN) => {
    below.add(n.id);
    n.kids.forEach(mark);
  };
  if (end) mark(end);
  const leaves: number[] = [];
  const collect = (n: RN) => (n.leafAt !== undefined ? leaves.push(n.leafAt) : n.kids.forEach(collect));
  if (end) collect(end);
  drawTree(s, t.toT((n) => (on.has(n.id) ? 'accent' : below.has(n.id) ? 'ok' : 'plain'), sub), opts);
  s.say(`Search “${pat}”: follow its letters down from the root (blue). Every leaf below (green) is an occurrence: positions ${leaves.sort((a, b) => a - b).join(', ')}. That's O(length of the pattern), however long the text.`);
  s.say('Suffix trees answer “longest repeated substring”, “how many times does X occur” and more in linear time. They use a lot of memory, so suffix arrays are the common practical choice.');
  return s.build('Suffix tree: every suffix in one tree');
};

// =====================================================================
// Rope
// =====================================================================

const rope: AnimScript = () => {
  const s = new Stage();
  const parts = pick([
    ['The_', 'quick_', 'brown_', 'fox'],
    ['Hello', '_big_', 'wide_', 'world'],
    ['Data_', 'struct', 'ures_', 'rock'],
  ]);
  const full = parts.join('');
  interface R {
    id: string;
    leaf?: string;
    l?: R;
    r?: R;
  }
  const len = (r: R): number => (r.leaf !== undefined ? r.leaf.length : len(r.l!) + len(r.r!));
  const leaves = parts.map((p, i) => ({ id: `L${i}`, leaf: p }));
  const left: R = { id: 'A', l: leaves[0], r: leaves[1] };
  const right: R = { id: 'B', l: leaves[2], r: leaves[3] };
  let root: R = { id: 'root', l: left, r: right };
  const toT = (r: R, tone: (r: R) => Tone): TNode =>
    r.leaf !== undefined ? { id: r.id, label: `“${r.leaf}”`, tone: tone(r) } : { id: r.id, label: String(len(r.l!)), sub: 'weight', tone: tone(r), left: toT(r.l!, tone), right: toT(r.r!, tone) };
  const opts = { nodeW: 78, dx: 86, dy: 70 };
  drawTree(s, toT(root, (r) => (r.leaf !== undefined ? 'accent' : 'plain')), opts);
  s.say(`A rope stores one long string (“${full}”) as a tree of small pieces. Each inner node's weight = the number of characters in its LEFT subtree.`);
  const i = randInt(4, full.length - 2);
  let cur = root;
  let k = i;
  const path: string[] = [];
  while (cur.leaf === undefined) {
    path.push(cur.id);
    const w = len(cur.l!);
    drawTree(s, toT(root, (r) => (r.id === cur.id ? 'hl' : path.includes(r.id) ? 'accent' : r.leaf !== undefined ? 'plain' : 'dim')), opts);
    if (k < w) {
      s.say(`Find character ${i === k ? i : `${k} (of what's left)`}: ${k} < weight ${w}, so it's in the left part. Go left.`);
      cur = cur.l!;
    } else {
      s.say(`Find character ${i === k ? i : `${k} (of what's left)`}: ${k} ≥ weight ${w}, so skip the ${w} characters on the left: go right looking for ${k} − ${w} = ${k - w}.`);
      k -= w;
      cur = cur.r!;
    }
  }
  drawTree(s, toT(root, (r) => (r.id === cur.id ? 'ok' : 'plain')), opts);
  s.say(`Leaf “${cur.leaf}”, position ${k}: '${cur.leaf![k]}'. (Check: “${full}”[${i}] = '${full[i]}'.) Like an array index, but O(log n).`);
  const extra: R = { id: 'L9', leaf: pick(['!!!', '_jumps', '_today', '_2025']) };
  root = { id: 'top', l: root, r: extra };
  drawTree(s, toT(root, (r) => (r.id === 'top' || r.id === 'L9' ? 'ok' : 'plain')), opts);
  s.say(`Append “${extra.leaf}”: make one new root with the old rope on the left and the new piece on the right. No characters are copied: O(1)-ish, instead of copying the whole string. Text editors use ropes so typing in a huge file stays fast.`);
  return s.build('Rope: a string as a tree');
};

// =====================================================================
// Skip list
// =====================================================================

const skipList: AnimScript = () => {
  const s = new Stage();
  const keys = shuffle(Array.from({ length: 30 }, (_, i) => (i + 1) * 3)).slice(0, 6).sort((a, b) => a - b);
  const height = new Map<number, number>();
  keys.forEach((k, i) => height.set(k, i === 2 ? 3 : i === 4 ? 2 : pick([1, 1, 2])));
  const LV = 3;
  const CX = 64;
  const ry = (l: number) => (LV - 1 - l) * 52;
  const draw = (hot: Set<string> = new Set()) => {
    const all = [...height.keys()].sort((a, b) => a - b);
    for (let l = 0; l < LV; l++) s.box(`hd${l}`, { x: 0, y: ry(l), w: 46, h: 36, label: l === 0 ? 'head' : '', tone: 'dim' });
    for (const k of Object.keys(s.boxes)) if (k.startsWith('n')) delete s.boxes[k];
    for (const k of Object.keys(s.arrows)) if (k.startsWith('a')) delete s.arrows[k];
    all.forEach((k, c) => {
      for (let l = 0; l < height.get(k)!; l++) s.box(`n${k}_${l}`, { x: (c + 1) * CX, y: ry(l), w: 46, h: 36, label: String(k), tone: hot.has(`n${k}_${l}`) ? 'hl' : 'plain' });
    });
    for (let l = 0; l < LV; l++) {
      s.box(`nil${l}`, { x: (all.length + 1) * CX, y: ry(l), w: 40, h: 36, label: '∞', shape: 'slot' });
      let prev = `hd${l}`;
      for (const k of all)
        if (height.get(k)! > l) {
          s.arrow(`a${prev}`, prev, `n${k}_${l}`, { tone: 'accent' });
          prev = `n${k}_${l}`;
        }
      s.arrow(`a${prev}`, prev, `nil${l}`, { tone: 'dim' });
    }
  };
  draw();
  s.say('A skip list is a sorted linked list with express lanes. The bottom level has every key; each level up skips over more of them.');
  const low = keys.filter((k) => height.get(k) === 1 && k > keys[1]);
  const target = low.length ? pick(low) : keys[keys.length - 1];
  const hot = new Set<string>();
  let col: number | null = null;
  let l = LV - 1;
  const at = () => (col === null ? `hd${l}` : `n${col}_${l}`);
  const sorted = [...keys];
  for (;;) {
    hot.add(at());
    const nxt = sorted.find((k) => (col === null || k > col) && height.get(k)! > l);
    draw(hot);
    if (nxt !== undefined && nxt < target) {
      s.say(`Level ${l + 1}: the next key is ${nxt} < ${target}. Move right along this lane.`);
      col = nxt;
    } else if (nxt === target) {
      hot.add(`n${target}_${l}`);
      draw(hot);
      s.say(`Next is ${target} itself: found, after only ${hot.size - 1} moves instead of walking the whole bottom list.`);
      break;
    } else {
      s.say(`Level ${l + 1}: the next key is ${nxt ?? '∞'}, past ${target}. Drop down a level.`);
      l--;
      if (l < 0) break;
    }
  }
  const nk = keys[3] + 1;
  let h = 1;
  const flips: string[] = [];
  while (h < LV && Math.random() < 0.5) {
    h++;
    flips.push('heads');
  }
  if (h < LV) flips.push('tails');
  height.set(nk, h);
  draw(new Set(Array.from({ length: h }, (_, i) => `n${nk}_${i}`)));
  s.say(`Insert ${nk}: link it into the bottom level, then flip a coin: ${flips.join(', ')}. Each heads promotes it one level up. So it gets ${h} level${h > 1 ? 's' : ''}.`);
  draw();
  s.say('Coin flips make about half the keys reach level 2, a quarter level 3, and so on, like a balanced tree on average. Search, insert and delete are O(log n) expected, with much simpler code than a balanced tree.');
  return s.build('Skip list: express lanes');
};

// =====================================================================
// Bloom filter
// =====================================================================

const hashK = (w: string, j: number, m: number) => {
  let h = 7 + j * 31;
  for (const c of w) h = (h * (33 + j * 6) + c.charCodeAt(0)) % 100003;
  return h % m;
};

const bloomFilter: AnimScript = () => {
  const s = new Stage();
  const M = 14;
  const K = 3;
  const pool = shuffle(['cat', 'dog', 'owl', 'cow', 'bee', 'ant', 'fox', 'pig', 'emu', 'yak', 'rat', 'bat', 'elk', 'gnu', 'ape', 'koi']);
  const added = pool.slice(0, 3);
  const bits = Array(M).fill(0);
  slotRow(s, 'b', M, { y: 120, step: 40, w: 36 });
  for (let i = 0; i < M; i++) onSlot(s, `v${i}`, 0, i, { y: 120, step: 40, w: 36, tone: 'dim' });
  s.say(`A Bloom filter answers “have I seen this before?” using only ${M} bits and ${K} hash functions. It can say “definitely not” or “probably yes”.`);
  for (const [n, w] of added.entries()) {
    s.box('w', { x: 200, y: 0, w: 60, h: H, label: w, tone: 'hl', mono: false });
    const hs = [0, 1, 2].map((j) => hashK(w, j, M));
    hs.forEach((h, j) => {
      bits[h] = 1;
      s.arrow(`h${j}`, 'w', `v${h}`, { tone: 'accent' });
      onSlot(s, `v${h}`, 1, h, { y: 120, step: 40, w: 36, tone: 'accent' });
    });
    s.say(`Add “${w}”: its ${K} hashes give positions ${hs.join(', ')}. Set those bits to 1.${n === 0 ? ' The word itself is NOT stored anywhere.' : ''}`);
    for (let j = 0; j < 3; j++) s.del(`h${j}`);
    for (let i = 0; i < M; i++) if (bits[i]) s.tone(`v${i}`, 'ok');
  }
  const check = (w: string) => {
    const hs = [0, 1, 2].map((j) => hashK(w, j, M));
    s.box('w', { x: 200, y: 0, w: 60, h: H, label: w, tone: 'hl', mono: false });
    hs.forEach((h, j) => s.arrow(`h${j}`, 'w', `v${h}`, { tone: bits[h] ? 'ok' : 'bad' }));
    return hs;
  };
  const absent = pool.slice(3).find((w) => [0, 1, 2].some((j) => !bits[hashK(w, j, M)]))!;
  const hs = check(absent);
  s.say(`Is “${absent}” in the set? Check bits ${hs.join(', ')}. Bit ${hs.find((h) => !bits[h])} is 0, so “${absent}” was definitely never added. A 0 can't lie.`);
  for (let j = 0; j < 3; j++) s.del(`h${j}`);
  const present = pick(added);
  check(present);
  s.say(`Is “${present}” in the set? All its bits are 1: probably yes.`);
  for (let j = 0; j < 3; j++) s.del(`h${j}`);
  const fp = pool.slice(3).find((w) => [0, 1, 2].every((j) => bits[hashK(w, j, M)]));
  if (fp) {
    check(fp);
    s.say(`Is “${fp}” in the set? All its bits are 1 too, set by OTHER words, but “${fp}” was never added. A false positive. Bigger filters and more hashes make these rare.`);
  } else s.say('Different words can light the same bits, so “probably yes” can be wrong (a false positive). With enough bits, that\'s rare, and the filter is tiny compared with storing the words.');
  s.say('Used to skip expensive lookups: a database checks the Bloom filter first and only reads the disk on “probably yes”. Items can\'t be removed (clearing a bit could erase other words).');
  return s.build('Bloom filter: maybe yes, definitely no');
};

// =====================================================================
// Count-min sketch
// =====================================================================

const countMin: AnimScript = () => {
  const s = new Stage();
  const D = 3;
  const Wd = 6;
  const words = ['cat', 'dog', 'owl', 'emu', 'bee'];
  let stream: string[];
  let q: string;
  // Prefer a stream where some query is over-counted, to show the error.
  for (let t = 0; ; t++) {
    stream = shuffle(['cat', 'cat', 'cat', 'dog', 'dog', 'owl', 'emu', 'bee', 'cat']);
    const C = Array.from({ length: D }, () => Array(Wd).fill(0));
    for (const w of stream) for (let r = 0; r < D; r++) C[r][hashK(w, r, Wd)]++;
    const over = words.find((w) => Math.min(...[0, 1, 2].map((r) => C[r][hashK(w, r, Wd)])) > stream.filter((x) => x === w).length);
    const anyCollide = words.some((w) => [0, 1, 2].some((r) => words.some((o) => o !== w && hashK(o, r, Wd) === hashK(w, r, Wd))));
    q = over ?? 'dog';
    if (over || t > 30 || !anyCollide) break;
  }
  const C = Array.from({ length: D }, () => Array(Wd).fill(0));
  for (let r = 0; r < D; r++) {
    s.text(`rl${r}`, -10, 100 + r * 50 + 25, `hash ${r + 1}`, { anchor: 'end', size: 'sm', bold: true, tone: 'dim' });
    for (let c = 0; c < Wd; c++) onSlot(s, `c${r}_${c}`, 0, c, { y: 100 + r * 50, tone: 'dim' });
  }
  s.say(`A count-min sketch estimates how often each item appears in a huge stream, using a small fixed grid of counters: ${D} rows, each with its own hash function.`);
  stream.forEach((w, k) => {
    s.box('w', { x: 80, y: 0, w: 60, h: H, label: w, tone: 'hl', mono: false });
    for (let r = 0; r < D; r++) {
      const c = hashK(w, r, Wd);
      C[r][c]++;
      onSlot(s, `c${r}_${c}`, C[r][c], c, { y: 100 + r * 50, tone: 'accent' });
      s.arrow(`h${r}`, 'w', `c${r}_${c}`, { tone: 'accent' });
    }
    if (k < 3 || k === stream.length - 1) s.say(`“${w}” arrives: in each row, add 1 to the counter its hash picks.${k === stream.length - 1 ? ` (${stream.length} items processed.)` : ''}`);
    for (let r = 0; r < D; r++) s.del(`h${r}`);
    for (let r = 0; r < D; r++) for (let c = 0; c < Wd; c++) s.tone(`c${r}_${c}`, C[r][c] ? 'plain' : 'dim');
  });
  const vals = [0, 1, 2].map((r) => C[r][hashK(q, r, Wd)]);
  const truth = stream.filter((x) => x === q).length;
  s.box('w', { x: 80, y: 0, w: 60, h: H, label: q, tone: 'ok', mono: false });
  for (let r = 0; r < D; r++) {
    s.arrow(`h${r}`, 'w', `c${r}_${hashK(q, r, Wd)}`, { tone: 'ok' });
    s.tone(`c${r}_${hashK(q, r, Wd)}`, 'ok');
  }
  s.say(`How many “${q}”? Its counters read ${vals.join(', ')}. Other items share some counters (collisions), which can only ADD to a count, never subtract.`);
  s.say(`So take the smallest: ${Math.min(...vals)}. The true count is ${truth}${Math.min(...vals) > truth ? ': a slight overestimate, never an underestimate' : ': exact this time'}. Fixed memory no matter how big the stream: used for “trending” topics and network traffic.`);
  return s.build('Count-min sketch: approximate counts');
};

// =====================================================================
// HyperLogLog
// =====================================================================

const hyperLogLog: AnimScript = () => {
  const s = new Stage();
  const M = 4;
  const items = shuffle(['cat', 'dog', 'owl', 'cow', 'bee', 'ant', 'fox', 'pig', 'emu', 'yak', 'rat', 'bat']).slice(0, 8);
  const stream = shuffle([...items, items[0], items[1], items[2]]);
  const bitsOf = (w: string) => {
    let h = 2166136261;
    for (const c of w) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
    return (h >>> 0).toString(2).padStart(32, '0').slice(0, 8);
  };
  const reg = Array(M).fill(0);
  for (let i = 0; i < M; i++) {
    s.box(`r${i}`, { x: 300 + i * 56, y: 90, w: 48, h: H, label: '0', top: `reg ${i}` });
  }
  s.say('HyperLogLog estimates how many DIFFERENT items a stream contains (unique visitors, say) using a few small registers instead of remembering every item.');
  s.say('The idea: hash each item to random-looking bits. A hash starting with a long run of zeros is rare (1 in 2ᵏ for k zeros), so seeing one suggests many different items have gone by.');
  stream.forEach((w, k) => {
    const b = bitsOf(w);
    const bucket = parseInt(b.slice(0, 2), 2);
    const rest = b.slice(2);
    const rank = (rest.indexOf('1') + 1) || rest.length + 1;
    s.box('w', { x: 0, y: 0, w: 56, h: H, label: w, tone: 'hl', mono: false });
    [...b].forEach((c, i) => s.box(`b${i}`, { x: 80 + i * 26, y: 0, w: 22, h: 30, label: c, tone: i < 2 ? 'accent' : i - 2 < rank - 1 ? 'warn' : i - 2 === rank - 1 ? 'ok' : 'plain' }));
    const old = reg[bucket];
    reg[bucket] = Math.max(old, rank);
    s.set(`r${bucket}`, { label: String(reg[bucket]), tone: reg[bucket] > old ? 'ok' : 'hl' });
    if (k < 4 || k === stream.length - 1)
      s.say(`“${w}” → ${b}. The first 2 bits (${b.slice(0, 2)}) pick register ${bucket}. Then ${rank - 1} zero${rank - 1 === 1 ? '' : 's'} before the first 1: rank ${rank}. Register ${bucket} keeps the max: ${reg[bucket]}.${stream.indexOf(w) < k ? ' (A repeat: same hash, so it changes nothing. Duplicates are ignored for free.)' : ''}`);
    for (let r = 0; r < M; r++) s.tone(`r${r}`, 'plain');
  });
  const est = Math.round((0.673 * M * M) / reg.reduce((a, r) => a + 2 ** -r, 0));
  s.text('est', 300, 170, `estimate ≈ ${est}   (true: ${items.length} different)`, { bold: true, size: 'lg', tone: 'accent' });
  s.say(`Combine the registers with a harmonic mean: about ${est} different items (truly ${items.length}). With 4 registers that's rough; real HyperLogLog uses thousands of registers in ~12 KB and counts billions of distinct items within about 1%.`);
  return s.build('HyperLogLog: counting distinct items');
};

export const TIER89_ANIMS: Record<string, AnimScript> = {
  'radix-trie': radixTrie,
  'suffix-array': suffixArray,
  'suffix-tree': suffixTree,
  rope,
  'skip-list': skipList,
  'bloom-filter': bloomFilter,
  'count-min-sketch': countMin,
  hyperloglog: hyperLogLog,
};


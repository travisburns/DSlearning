import type { AnimScript } from '../engine';
import { Stage } from '../engine';
import { distinctInts, pick, randInt } from '../../engine/random';
import { H, STEP, W, onSlot, point, slotRow, tag } from '../kit';

/** Vertical stack geometry: slot k (0 = bottom) at x, baseY - k * 46. */
const SY = 46;
function stackSlots(s: Stage, key: string, n: number, x: number, baseY: number, label = 'Stack') {
  s.box(`${key}F`, { x: x - 10, y: baseY - (n - 1) * SY - 12, w: W + 20, h: (n - 1) * SY + H + 22, shape: 'frame', label });
  for (let k = 0; k < n; k++) s.box(`${key}${k}`, { x, y: baseY - k * SY, w: W, h: H, shape: 'slot', top: undefined });
}

// =====================================================================
// Stack
// =====================================================================

const stack: AnimScript = () => {
  const s = new Stage();
  const str = pick(['([]{})', '{[()]}', '(()[])', '[({})]', '([)]', '(()']);
  const ch = str.split('');
  ch.forEach((c, i) => s.box(`c${i}`, { x: i * STEP, y: 0, w: W, h: H, label: c }));
  s.text('t', 0, -16, `Are the brackets in "${str}" balanced?`, { bold: true });
  const sx = ch.length * STEP + 70;
  const base = 230;
  stackSlots(s, 's', 4, sx, base);
  s.say('A stack is a pile: you can only add to the top (push) or take from the top (pop). Last in, first out. Here it checks brackets.');
  const st: number[] = [];
  const pair: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  let ok = true;
  for (let i = 0; i < ch.length; i++) {
    const c = ch[i];
    s.tone(`c${i}`, 'hl');
    if ('([{'.includes(c)) {
      s.move(`c${i}`, sx, base - st.length * SY);
      s.tone(`c${i}`, 'accent');
      st.push(i);
      s.say(`'${c}' opens something: push it on top. It must be closed before anything below it.`);
      continue;
    }
    const top = st[st.length - 1];
    if (top === undefined) {
      s.tone(`c${i}`, 'bad');
      s.say(`'${c}' closes something, but the stack is empty: nothing is open. Not balanced.`);
      ok = false;
      break;
    }
    s.move(`c${i}`, sx + STEP + 6, base - (st.length - 1) * SY);
    if (ch[top] !== pair[c]) {
      s.tone([`c${i}`, `c${top}`], 'bad');
      s.say(`'${c}' must close the most recent opener, the top of the stack. The top is '${ch[top]}': wrong kind. Not balanced.`);
      ok = false;
      break;
    }
    s.tone([`c${i}`, `c${top}`], 'ok');
    s.say(`'${c}' closes. Peek at the top: '${ch[top]}' matches.`);
    s.del(`c${i}`, `c${top}`);
    st.pop();
    s.say(`Pop the top. ${st.length ? `Now '${ch[st[st.length - 1]]}' is on top, the next one waiting to be closed.` : 'The stack is empty again.'}`);
  }
  if (ok && st.length) {
    for (const k of st) s.tone(`c${k}`, 'bad');
    s.say(`The string ended but the stack still holds ${st.map((k) => `'${ch[k]}'`).join(', ')}: opened, never closed. Not balanced.`);
  } else if (ok) s.say('Every closer matched the top, and the stack ended empty: balanced. Push and pop are O(1); the whole check is one pass.');
  return s.build('Stack: checking brackets');
};

// =====================================================================
// Queue
// =====================================================================

const queue: AnimScript = () => {
  const s = new Stage();
  const jobs = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, 6);
  const line: string[] = [];
  const x0 = 80;
  const place = () => line.forEach((id, i) => s.move(id, x0 + i * STEP, 40));
  s.box('ex', { x: 0, y: 40, w: 52, h: H, label: 'out', shape: 'slot' });
  s.say('A queue is a line: join at the back (enqueue), leave from the front (dequeue). First in, first out, like print jobs.');
  const tags = () => {
    s.del('tf', 'tf>', 'tb', 'tb>');
    if (line.length) {
      point(s, 'tf', 'front', line[0], 'above', 16);
      point(s, 'tb', 'back', line[line.length - 1], 'below', 16);
    }
  };
  const enq = (j: string) => {
    s.box(j, { x: x0 + 6 * STEP, y: 40, w: W, h: H, label: j, tone: 'ok' });
    line.push(j);
    place();
    tags();
    s.say(`Enqueue job ${j}: it joins at the back.`);
    s.tone(j, 'plain');
  };
  const deq = () => {
    const j = line.shift()!;
    s.move(j, 4, 40);
    s.tone(j, 'accent');
    tags();
    s.say(`Dequeue: job ${j} was waiting longest, so it leaves first.`);
    s.del(j);
    place();
    tags();
    s.say(line.length ? `Everyone moves up. ${line[0]} is at the front now.` : 'The queue is empty.');
  };
  enq(jobs[0]);
  enq(jobs[1]);
  enq(jobs[2]);
  deq();
  enq(jobs[3]);
  deq();
  s.say('Both ends are O(1). (In real code nothing actually shuffles forward: a linked list or a circular buffer just moves the front marker.)');
  return s.build('Queue: first in, first out');
};

// =====================================================================
// Circular buffer
// =====================================================================

const circularBuffer: AnimScript = () => {
  const s = new Stage();
  const N = 8;
  const cx = 160;
  const cy = 140;
  const R = 105;
  const at = (i: number, r = R) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / N;
    return { x: cx + r * Math.cos(a) - W / 2, y: cy + r * Math.sin(a) - H / 2 };
  };
  for (let i = 0; i < N; i++) s.box(`s${i}`, { ...at(i), w: W, h: H, shape: 'slot', top: `[${i}]` });
  const tagAt = (id: string, name: string, i: number, r: number) => {
    const p = at(i, r);
    tag(s, id, name, p.x + W / 2 - 25, p.y + H / 2 - 11);
    s.arrow(`${id}>`, id, `s${i}`, { tone: 'ptr' });
  };
  let head = randInt(3, 5);
  let tail = head;
  let count = 0;
  tagAt('th', 'head', head, R + 62);
  tagAt('tt', 'tail', tail, R - 62);
  s.say(`A circular buffer is an array of ${N} slots used as a ring. head = where the oldest item is; tail = where the next item goes. Nothing ever shifts.`);
  const vals = distinctInts(10, 10, 99);
  let v = 0;
  const put = () => {
    s.box(`v${v}`, { ...at(tail), w: W, h: H, label: String(vals[v]), tone: 'ok' });
    v++;
    count++;
    const wrap = tail === N - 1;
    tail = (tail + 1) % N;
    tagAt('tt', 'tail', tail, R - 62);
    s.say(`Add ${vals[v - 1]} at tail, then tail = (tail + 1) % ${N} = ${tail}.${wrap ? ' It went past the last slot and wrapped round to 0: that\'s the % doing its job.' : ''}`);
    s.tone(`v${v - 1}`, 'plain');
  };
  const take = () => {
    const id = Object.keys(s.boxes).find((k) => k.startsWith('v') && s.boxes[k].x === at(head).x && s.boxes[k].y === at(head).y)!;
    s.tone(id, 'accent');
    s.say(`Remove from head: ${s.boxes[id].label} (the oldest).`);
    s.del(id);
    head = (head + 1) % N;
    count--;
    tagAt('th', 'head', head, R + 62);
    s.say(`head = (head + 1) % ${N} = ${head}. The old slot is free to be reused. ${count} item${count === 1 ? '' : 's'} left.`);
  };
  for (let i = 0; i < 5; i++) put();
  take();
  take();
  put();
  s.say(`O(1) add and remove forever, in fixed memory. When count reaches ${N} it's full: either refuse new items or overwrite the oldest (logs, audio).`);
  return s.build('Circular buffer: a ring with head and tail');
};

// =====================================================================
// Deque
// =====================================================================

const deque: AnimScript = () => {
  const s = new Stage();
  const items: string[] = [];
  const vals = distinctInts(8, 10, 99);
  let v = 0;
  const x0 = 140;
  const place = () => {
    const start = x0 + ((6 - items.length) * STEP) / 2;
    items.forEach((id, i) => s.move(id, start + i * STEP, 40));
  };
  s.box('fr', { x: 0, y: 40, w: 90, h: H, label: '← front', shape: 'slot' });
  s.box('bk', { x: x0 + 6 * STEP + 30, y: 40, w: 90, h: H, label: 'back →', shape: 'slot' });
  s.say('A deque (double-ended queue) lets you add and remove at BOTH ends in O(1). It can act as a stack or a queue.');
  const ops: ['front' | 'back', 'push' | 'pop'][] = [
    ['back', 'push'],
    ['back', 'push'],
    ['front', 'push'],
    ['back', 'push'],
    ['front', 'pop'],
    ['back', 'pop'],
    ['front', 'push'],
  ];
  for (const [end, op] of ops) {
    if (op === 'push') {
      const id = `v${v}`;
      s.box(id, { x: end === 'front' ? 30 : x0 + 6 * STEP + 50, y: -30, w: W, h: H, label: String(vals[v]), tone: 'ok' });
      v++;
      if (end === 'front') items.unshift(id);
      else items.push(id);
      place();
      s.say(`Add ${vals[v - 1]} at the ${end}.`);
      s.tone(id, 'plain');
    } else {
      const id = end === 'front' ? items.shift()! : items.pop()!;
      s.move(id, end === 'front' ? 30 : x0 + 6 * STEP + 50, -30);
      s.tone(id, 'accent');
      s.say(`Remove from the ${end}: ${s.boxes[id].label}.`);
      s.del(id);
      place();
    }
  }
  s.say('C# has no Deque class; LinkedList<T> (AddFirst/AddLast/RemoveFirst/RemoveLast) or a circular buffer gives you one. Used for sliding-window maximums and undo/redo with a limit.');
  return s.build('Deque: both ends open');
};

// =====================================================================
// Monotonic stack: next greater element
// =====================================================================

const monotonicStack: AnimScript = () => {
  const s = new Stage();
  const n = 7;
  const a = Array.from({ length: n }, () => randInt(1, 9));
  slotRow(s, 'i', n);
  a.forEach((v, i) => onSlot(s, `a${i}`, v, i));
  const ay = H + 40;
  s.text('al', -8, ay + 26, 'answer', { anchor: 'end', size: 'sm', tone: 'dim' });
  slotRow(s, 'r', n, { y: ay, top: () => '' });
  s.text('t', 0, -30, 'For each value: what is the next bigger value to its right?', { bold: true });
  const sx = n * STEP + 60;
  const base = 200;
  stackSlots(s, 'k', n, sx, base + (n - 5) * SY, 'Stack (waiting)');
  s.say('Checking every value against everything to its right is O(n²). A stack of values still waiting for their answer does it in one pass.');
  const st: number[] = [];
  for (let i = 0; i < n; i++) {
    s.tone(`a${i}`, 'hl');
    s.say(`Next: ${a[i]}.${st.length ? ` Is it bigger than the value on top of the stack (${a[st[st.length - 1]]})?` : ' The stack is empty.'}`);
    while (st.length && a[st[st.length - 1]] < a[i]) {
      const j = st.pop()!;
      s.box(`ans${j}`, { x: j * STEP, y: ay, w: W, h: H, label: String(a[i]), tone: 'ok' });
      s.del(`w${j}`);
      s.say(`${a[i]} > ${a[j]}: ${a[i]} is the answer for ${a[j]}. Pop it.${st.length ? ` Check the new top, ${a[st[st.length - 1]]}.` : ''}`);
    }
    s.box(`w${i}`, { x: sx, y: base + (n - 5) * SY - st.length * SY, w: W, h: H, label: String(a[i]), tone: 'accent', sub: undefined });
    st.push(i);
    s.tone(`a${i}`, 'plain');
    s.say(`Push ${a[i]}: it waits for something bigger. The stack always reads ${'big → small'} from bottom to top (monotonic).`);
  }
  for (const j of st) s.box(`ans${j}`, { x: j * STEP, y: ay, w: W, h: H, label: '-1', tone: 'dim' });
  s.say(`Values still on the stack never met anything bigger: their answer is -1. Each value was pushed once and popped at most once: O(n).`);
  return s.build('Monotonic stack: next greater element');
};

// =====================================================================
// Priority queue
// =====================================================================

const priorityQueue: AnimScript = () => {
  const s = new Stage();
  const tasks = ['email', 'fire', 'lunch', 'bug', 'call', 'demo'];
  const pr = distinctInts(6, 1, 9);
  const inside: number[] = [];
  const x0 = 0;
  s.box('pq', { x: -10, y: 50, w: 6 * 74 + 14, h: 74, shape: 'frame', label: 'Priority queue (1 = most urgent)' });
  const place = () => {
    const order = [...inside].sort((a, b) => pr[a] - pr[b]);
    order.forEach((k, i) => s.move(`t${k}`, x0 + i * 74, 66));
  };
  s.say('A priority queue hands out the most urgent item first, whatever order things arrived in. Here, lower number = more urgent.');
  const add = (k: number) => {
    s.box(`t${k}`, { x: 6 * 74 + 40, y: -10, w: 66, h: H, label: tasks[k], sub: `priority ${pr[k]}`, tone: 'ok', mono: false });
    s.say(`“${tasks[k]}” arrives with priority ${pr[k]}.`);
    inside.push(k);
    place();
    s.tone(`t${k}`, 'plain');
    s.say(`It takes its place by urgency, not by arrival time.`);
  };
  const take = () => {
    const k = [...inside].sort((a, b) => pr[a] - pr[b])[0];
    s.move(`t${k}`, -110, -10);
    s.tone(`t${k}`, 'accent');
    inside.splice(inside.indexOf(k), 1);
    s.say(`Take the next item: always the most urgent, “${tasks[k]}” (${pr[k]}), even though ${inside.length ? 'others came earlier' : 'it was the last'}.`);
    s.del(`t${k}`);
    place();
  };
  add(0);
  add(1);
  add(2);
  take();
  add(3);
  add(4);
  take();
  s.say('This picture keeps things in full sorted order, which would cost O(n) per add. A real priority queue (C#\'s PriorityQueue) uses a heap: add and take are O(log n). You\'ll see how in Binary Heap.');
  return s.build('Priority queue: most urgent first');
};

// =====================================================================
// Recursion
// =====================================================================

const recursion: AnimScript = () => {
  const s = new Stage();
  const n = randInt(3, 5);
  const base = 40 + n * 50;
  s.box('cs', { x: -10, y: base - n * 50 - 14, w: 320, h: n * 50 + H + 26, shape: 'frame', label: 'Call stack' });
  s.text('code', 340, 20, 'fact(n) = n == 1 ? 1 : n × fact(n − 1)', { bold: true, size: 'md' });
  s.say(`fact(${n}) = ${n} × ${n - 1} × … × 1. A recursive function solves it by calling itself on a smaller problem.`);
  for (let k = n; k >= 1; k--) {
    const d = n - k;
    s.box(`f${k}`, { x: 0, y: base - d * 50, w: 160, h: H, label: `fact(${k})`, tone: k === 1 ? 'warn' : 'accent', mono: true });
    if (k > 1) {
      s.box(`w${k}`, { x: 170, y: base - d * 50, w: 130, h: H, label: `${k} × waiting…`, tone: 'dim', mono: false });
      s.say(`fact(${k}) needs fact(${k - 1}) first. It pauses (its frame stays on the stack, remembering “${k} × ?”) and calls fact(${k - 1}).`);
    } else {
      s.box(`w${k}`, { x: 170, y: base - d * 50, w: 130, h: H, label: 'returns 1', tone: 'ok', mono: false });
      s.say('fact(1) is the base case: it answers 1 straight away, with no further call. Without a base case, calls would pile up until the stack overflows.');
    }
  }
  let acc = 1;
  for (let k = 2; k <= n; k++) {
    s.del(`f${k - 1}`, `w${k - 1}`);
    acc *= k;
    s.set(`w${k}`, { label: `${k} × ${acc / k} = ${acc}`, tone: 'ok' });
    s.tone(`f${k}`, 'ok');
    s.say(`fact(${k - 1}) returned ${acc / k} and its frame is popped. fact(${k}) resumes: ${k} × ${acc / k} = ${acc}.`);
  }
  s.say(`fact(${n}) = ${acc}. The stack grew to ${n} frames deep and unwound in reverse order: last call made, first to finish. That's why recursion is built on a stack.`);
  return s.build(`Recursion: fact(${n}) on the call stack`);
};

// =====================================================================
// Merge sort
// =====================================================================

const mergeSort: AnimScript = () => {
  const s = new Stage();
  const n = 8;
  const a = distinctInts(n, 1, 60);
  const LY = 62;
  const xOf = (i: number, level: number) => i * STEP + (Math.floor(i / (n >> level)) * 18);
  a.forEach((v, i) => s.box(`v${v}`, { x: xOf(i, 0), y: 0, w: W, h: H, label: String(v) }));
  s.say('Merge sort: split the list in half, sort each half, then merge the two sorted halves.');
  for (let level = 1; level <= 3; level++) {
    a.forEach((v, i) => s.move(`v${v}`, xOf(i, level), level * LY));
    s.say(level < 3 ? `Split again: pieces of ${n >> level}.` : 'Pieces of 1. A single value is already sorted: this is the base case.');
  }
  // Merge back up.
  let pieces = a.map((v) => [v]);
  for (let level = 2; level >= 0; level--) {
    const merged: number[][] = [];
    for (let p = 0; p < pieces.length; p += 2) merged.push([...pieces[p], ...pieces[p + 1]].sort((x, y) => x - y));
    if (level === 0) {
      const [L, R] = pieces;
      let i = 0;
      let j = 0;
      const out: number[] = [];
      while (i < L.length || j < R.length) {
        const takeL = j >= R.length || (i < L.length && L[i] <= R[j]);
        const v = takeL ? L[i++] : R[j++];
        out.push(v);
        s.move(`v${v}`, (out.length - 1) * STEP, 0);
        s.tone(`v${v}`, 'ok');
        s.say(i + j === 1 ? `Final merge. Compare the fronts of the two sorted halves, ${L[0]} and ${R[0]}: take the smaller, ${v}.` : out.length === n ? `${v} is the last one left. Done.` : `Fronts now: ${i < L.length ? L[i] : '—'} and ${j < R.length ? R[j] : '—'}. Take ${v}.`);
      }
    } else {
      merged.forEach((piece, p) => piece.forEach((v, k) => s.move(`v${v}`, xOf(p * piece.length + k, level), level * LY)));
      s.say(`Merge pairs of sorted pieces into sorted pieces of ${n >> level}: repeatedly take the smaller front value.`);
    }
    pieces = merged;
  }
  s.say('3 levels of halving (log₂ 8), and each level moves all 8 values once: n log n work, on any input.');
  return s.build('Merge sort');
};

// =====================================================================
// Quicksort (one partition in detail)
// =====================================================================

const quicksort: AnimScript = () => {
  const s = new Stage();
  const n = 7;
  const a = distinctInts(n, 1, 60);
  const id = a.map((v) => `v${v}`);
  const pos = [...id];
  slotRow(s, 's', n);
  id.forEach((x, i) => onSlot(s, x, a[i], i));
  const pv = a[n - 1];
  s.tone(id[n - 1], 'warn');
  s.say(`Quicksort picks a pivot (here the last value, ${pv}) and rearranges so smaller values are on its left and bigger on its right.`);
  const val = (x: string) => Number(s.boxes[x].label);
  const t = (tid: string, name: string, i: number, above = false) => tag(s, tid, name, i * STEP + 4, above ? -34 : H + 22);
  let i = 0;
  t('ti', 'i', i, true);
  s.say(`i marks where the next small value should go. Scan j across, comparing each value with ${pv}.`);
  for (let j = 0; j < n - 1; j++) {
    t('tj', 'j', j);
    const v = val(pos[j]);
    if (v < pv) {
      if (i !== j) {
        const [p, q] = [pos[i], pos[j]];
        s.move(p, j * STEP, 0);
        s.move(q, i * STEP, 0);
        pos[i] = q;
        pos[j] = p;
      }
      s.tone(pos[i], 'ok');
      s.say(`${v} < ${pv}: it belongs on the left. ${i !== j ? `Swap it into position i = ${i}` : `It's already at i = ${i}`}, then move i right.`);
      i++;
      t('ti', 'i', i, true);
    } else {
      s.tone(pos[j], 'bad');
      s.say(`${v} > ${pv}: leave it where it is (right side).`);
    }
  }
  s.del('tj');
  const [p, q] = [pos[i], pos[n - 1]];
  s.move(p, (n - 1) * STEP, 0);
  s.move(q, i * STEP, 0);
  pos[n - 1] = p;
  pos[i] = q;
  s.say(`Finally swap the pivot into position i = ${i}. Everything left is smaller, everything right is bigger: ${pv} is in its final sorted place.`);
  const sorted = [...a].sort((x, y) => x - y);
  sorted.forEach((v, k) => s.move(`v${v}`, k * STEP, 0));
  for (const x of id) s.tone(x, 'ok');
  s.del('ti');
  s.say('Now quicksort the left part and the right part the same way. Each partition is one pass; with decent pivots there are about log n levels: O(n log n) on average, in place.');
  return s.build('Quicksort: one partition');
};

// =====================================================================
// Backtracking: subsets
// =====================================================================

const backtracking: AnimScript = () => {
  const s = new Stage();
  const items = ['a', 'b', 'c'];
  // Decision tree: depth = items decided; left = take, right = skip.
  interface N {
    id: string;
    chosen: string[];
    depth: number;
    kids: N[];
  }
  let k = 0;
  const mk = (d: number, chosen: string[]): N => ({ id: `n${k++}`, chosen, depth: d, kids: d === items.length ? [] : [mk(d + 1, [...chosen, items[d]]), mk(d + 1, chosen)] });
  const root = mk(0, []);
  // Leaves spread out, parents above the middle of their children.
  const xs = new Map<string, number>();
  let leaf = 0;
  const lay = (nd: N): number => {
    const x = nd.kids.length ? (lay(nd.kids[0]) + lay(nd.kids[1])) / 2 : leaf++ * 58;
    xs.set(nd.id, x);
    return x;
  };
  lay(root);
  const show = (nd: N, tone: 'accent' | 'ok' | 'plain') => s.box(nd.id, { x: xs.get(nd.id)!, y: nd.depth * 70, w: 48, h: 34, label: nd.chosen.join('') || '∅', tone, shape: 'rect' });
  const out: string[] = [];
  s.text('res', 0, 4 * 70 + 30, 'Found: ', { bold: true });
  s.text('q', 0, -20, `List every subset of {${items.join(', ')}}: for each item, take it (+) or skip it (−).`, { bold: true });
  show(root, 'accent');
  s.say('Backtracking builds an answer one choice at a time. Start with nothing chosen.');
  const walk = (nd: N, parent?: N) => {
    if (parent) {
      show(nd, 'accent');
      s.arrow(`e${nd.id}`, parent.id, nd.id, { tone: 'accent', label: nd.chosen.length > parent.chosen.length ? `+${items[parent.depth]}` : `−${items[parent.depth]}` });
      s.tone(parent.id, 'plain');
      s.say(nd.chosen.length > parent.chosen.length ? `Choose: take ${items[parent.depth]}. Current: {${nd.chosen.join(', ')}}.` : `Undo that choice and try the other option: skip ${items[parent.depth]}. Current: {${nd.chosen.join(', ')}}.`);
    }
    if (!nd.kids.length) {
      out.push(`{${nd.chosen.join(',')}}`);
      s.tone(nd.id, 'ok');
      s.text('res', 0, 4 * 70 + 30, `Found: ${out.join('  ')}`, { bold: true });
      s.say(`Every item decided: record {${nd.chosen.join(', ')}}. Then back up to the last choice that still has an untried option.`);
      s.tone(nd.id, 'plain');
      if (parent) s.arrow(`e${nd.id}`, parent.id, nd.id, { tone: 'dim', label: s.arrows[`e${nd.id}`].label });
      return;
    }
    for (const kid of nd.kids) walk(kid, nd);
    if (parent) s.arrow(`e${nd.id}`, parent.id, nd.id, { tone: 'dim', label: s.arrows[`e${nd.id}`].label });
  };
  walk(root);
  s.say(`All ${out.length} subsets (2³). Choose → explore → un-choose is the whole pattern. Each extra item doubles the tree: exponential, so real uses prune branches that can't work.`);
  return s.build('Backtracking: all subsets');
};

// =====================================================================
// Greedy: interval scheduling
// =====================================================================

const greedy: AnimScript = () => {
  const s = new Stage();
  const names = ['A', 'B', 'C', 'D', 'E', 'F'];
  const iv = names.map((nm) => {
    const st = randInt(0, 9);
    return { nm, st, en: st + randInt(1, 4) };
  });
  const X = 34;
  const RY = 30;
  for (let t = 0; t <= 14; t += 2) s.text(`ax${t}`, 60 + t * X, -8, String(t), { anchor: 'middle', size: 'sm', tone: 'dim' });
  const bar = (k: number, row: number, tone: 'plain' | 'ok' | 'bad' | 'hl' | 'dim' = 'plain') =>
    s.box(`b${iv[k].nm}`, { x: 60 + iv[k].st * X, y: row * RY, w: (iv[k].en - iv[k].st) * X, h: 24, label: iv[k].en - iv[k].st >= 2 ? `${iv[k].nm} ${iv[k].st}–${iv[k].en}` : iv[k].nm, tone, mono: false });
  iv.forEach((_, k) => bar(k, k));
  s.say('One meeting room, six requested meetings (start–end). Fit in as many as possible without overlaps.');
  const order = iv.map((_, k) => k).sort((p, q) => iv[p].en - iv[q].en || p - q);
  order.forEach((k, r) => bar(k, r));
  s.say('Greedy rule: sort by END time. The meeting that ends earliest leaves the most room for everything after it.');
  let end = -1;
  let kept = 0;
  for (const [r, k] of order.entries()) {
    bar(k, r, 'hl');
    s.say(`${iv[k].nm} (${iv[k].st}–${iv[k].en}): does it start at or after ${end < 0 ? 'the start of the day' : `${end}, when the last kept meeting ends`}?`);
    if (iv[k].st >= end) {
      bar(k, r, 'ok');
      end = iv[k].en;
      kept++;
      s.box('line', { x: 60 + end * X - 1, y: -4, w: 2, h: names.length * RY, shape: 'rect', tone: 'ok' });
      s.say(`Yes: keep ${iv[k].nm}. The room is now busy until ${end}.`);
    } else {
      bar(k, r, 'dim');
      s.say(`No, it overlaps: skip ${iv[k].nm}. Never reconsidered; greedy commits.`);
    }
  }
  s.say(`${kept} meetings fit. Picking “earliest end” is provably optimal here, but greedy isn't always right (coins 1, 3, 4 for 6: greedy gives 4+1+1, best is 3+3). It needs a proof.`);
  return s.build('Greedy: earliest end first');
};

export const TIER2_ANIMS: Record<string, AnimScript> = {
  stack,
  queue,
  'circular-buffer': circularBuffer,
  deque,
  'monotonic-stack': monotonicStack,
  'priority-queue': priorityQueue,
  recursion,
  'merge-sort': mergeSort,
  quicksort,
  backtracking,
  greedy,
};

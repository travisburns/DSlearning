import type { AnimScript } from '../engine';
import { Stage } from '../engine';
import { distinctInts, pick, randInt, shuffle } from '../../engine/random';
import { H, STEP, W, onSlot, point, slotRow, tag } from '../kit';

// =====================================================================
// Tier 0
// =====================================================================

const memory: AnimScript = () => {
  const s = new Stage();
  const base = pick([100, 200, 400]);
  const n = 10;
  s.box('mem', { x: -10, y: -26, w: n * STEP + 14, h: H + 36, shape: 'frame', label: 'Memory (RAM)' });
  slotRow(s, 'm', n, { top: (i) => String(base + i) });
  s.say(`Memory is one long row of numbered boxes. Each box holds one small number, and each box's number (${base}, ${base + 1}, …) is its address.`);
  const xi = randInt(1, 3);
  const x = randInt(10, 99);
  onSlot(s, 'x', x, xi, { tone: 'accent' });
  s.say(`Run “x = ${x}”. The computer picks a free box, address ${base + xi}, and writes ${x} into it.`);
  point(s, 'tx', 'x', 'x', 'below', 26);
  s.say(`The program doesn't remember the value, it remembers where it is: the name x now means “the box at ${base + xi}”.`);
  s.tone('x', 'hl');
  s.text('rd', 0, 118, `read x → go to box ${base + xi} → ${x}`, { tone: 'accent', bold: true });
  s.say(`Reading x: jump straight to address ${base + xi}. One step, however big memory is. No searching, because the address is known.`);
  const yi = randInt(xi + 2, 6);
  const y = randInt(10, 99);
  s.del('rd');
  s.tone('x', 'accent');
  onSlot(s, 'y', y, yi, { tone: 'ok' });
  point(s, 'ty', 'y', 'y', 'below', 26);
  s.say(`“y = ${y}” goes into another free box, ${base + yi}. Every variable is just a box with an address.`);
  const x2 = randInt(10, 99);
  s.set('x', { label: String(x2), tone: 'hl' });
  s.say(`“x = ${x2}” writes into the same box again. The old ${x} is simply overwritten; a box holds one thing at a time.`);
  s.tone('x', 'accent');
  const run = distinctInts(3, 1, 9);
  run.forEach((v, k) => onSlot(s, `r${k}`, v, 7 + k, { tone: 'warn' }));
  s.say(`Three values stored side by side, at ${base + 7}, ${base + 8}, ${base + 9}. Knowing the first address, the next is always +1. Arrays are built on exactly this.`);
  return s.build('Writing and reading memory');
};

const pointers: AnimScript = () => {
  const s = new Stage();
  const base = 100;
  const n = 10;
  s.box('mem', { x: -10, y: -26, w: n * STEP + 14, h: H + 36, shape: 'frame', label: 'Memory' });
  slotRow(s, 'm', n, { top: (i) => String(base + i) });
  const vi = randInt(5, 8);
  const v = randInt(10, 99);
  onSlot(s, 'v', v, vi, { tone: 'ok' });
  s.say(`A value ${v} sits in memory at address ${base + vi}.`);
  const pi = randInt(0, 2);
  onSlot(s, 'p', base + vi, pi, { tone: 'ptr' });
  tag(s, 'tp', 'p', pi * STEP + 2, H + 26);
  s.arrow('tp>', 'tp', 'p', { tone: 'ptr' });
  s.say(`Another box, p at address ${base + pi}, holds the number ${base + vi}. That number is not data: it's the address of ${v}. A box that holds an address is a pointer.`);
  s.arrow('pv', 'p', 'v', { tone: 'ptr', bend: -40 });
  s.say(`We draw that as an arrow: p “points to” the box at ${base + vi}. The arrow is only a picture of the number ${base + vi}.`);
  s.tone('v', 'hl');
  s.say(`Following the pointer (dereferencing): read p → ${base + vi}, then go to box ${base + vi} → ${v}. Two reads.`);
  const v2 = randInt(10, 99);
  s.set('v', { label: String(v2) });
  s.say(`Writing through p changes the box it points at: now ${base + vi} holds ${v2}. Anything else pointing there sees ${v2} too.`);
  const wi = vi === 8 ? 6 : vi + 1;
  const w = randInt(10, 99);
  s.tone('v', 'ok');
  onSlot(s, 'w', w, wi, { tone: 'ok' });
  s.set('p', { label: String(base + wi), tone: 'hl' });
  s.arrow('pv', 'p', 'w', { tone: 'ptr', bend: -40 });
  s.say(`Change p to ${base + wi} and it points at a different box. No data moved; only one small number changed. That's why pointers make rearranging cheap.`);
  s.set('p', { label: 'null', tone: 'ptr' });
  s.del('pv');
  s.say('p = null: an address that means “points at nothing”. Following it would crash, so code checks for null first.');
  return s.build('Following a pointer');
};

const bits: AnimScript = () => {
  const s = new Stage();
  const n = randInt(5, 60);
  const places = [128, 64, 32, 16, 8, 4, 2, 1];
  slotRow(s, 's', 8, { top: (i) => String(places[i]) });
  let id = 0;
  const cell: string[] = [];
  places.forEach((_, i) => {
    cell[i] = `b${id++}`;
    onSlot(s, cell[i], 0, i, { tone: 'dim' });
  });
  s.say('A byte is 8 bits, each 0 or 1. Each position is worth double the one to its right: 1, 2, 4, 8 … 128.');
  const parts: number[] = [];
  places.forEach((pv, i) => {
    if (n & pv) {
      parts.push(pv);
      s.set(cell[i], { label: '1', tone: 'accent' });
    }
  });
  s.text('sum', 0, 92, `${parts.join(' + ')} = ${n}`, { tone: 'accent', size: 'lg', bold: true });
  s.say(`${n} in binary: switch on the positions that add up to it. ${parts.join(' + ')} = ${n}.`);
  // Shift left by one: every bit slides one place left, a 0 comes in on the right.
  s.del(cell[0]);
  for (let i = 1; i < 8; i++) s.move(cell[i], (i - 1) * STEP, 0);
  cell.shift();
  cell.push(`b${id++}`);
  onSlot(s, cell[7], 0, 7, { tone: 'dim' });
  s.text('sum', 0, 92, `${n} << 1 = ${(n << 1) & 255}`, { tone: 'accent', size: 'lg', bold: true });
  s.say(`Shift left by one: every bit slides one place left, a 0 comes in on the right. Each bit is now worth double, so the number doubled: ${(n << 1) & 255}.`);
  const m = (n << 1) & 255;
  const k = pick(places.filter((pv) => pv <= 64));
  const ki = places.indexOf(k);
  s.text('sum', 0, 92, `test the ${k}s bit: ${m} & ${k} = ${m & k}`, { tone: 'accent', size: 'lg', bold: true });
  s.set(`s${ki}`, { shape: 'rect', tone: 'warn' });
  s.say(`To test one bit, AND with a mask that has only that bit on (${k}). The result is ${m & k ? 'not 0, so the bit is on' : '0, so the bit is off'}. One instruction checks one bit.`);
  return s.build('Bits in a byte');
};

// =====================================================================
// Tier 1 data structures
// =====================================================================

const staticArray: AnimScript = () => {
  const s = new Stage();
  const n = randInt(5, 6);
  const cap = n + 2;
  const base = pick([200, 400, 600]);
  const vals = distinctInts(n, 10, 99);
  slotRow(s, 's', cap, { top: (i) => `${base + 4 * i}` });
  for (let i = 0; i < cap; i++) s.box(`s${i}`, { sub: `[${i}]` });
  const ids = vals.map((_, i) => `v${i}`);
  vals.forEach((v, i) => onSlot(s, ids[i], v, i));
  s.say(`An array: ${n} numbers in one unbroken block, starting at address ${base}. Each int takes 4 bytes, so they're 4 addresses apart. There's room for ${cap}.`);
  const k = randInt(1, n - 1);
  tag(s, 'ta', 'a', -50, 9);
  s.text('f', 0, 100, `address of a[${k}] = ${base} + 4 × ${k} = ${base + 4 * k}`, { tone: 'accent', bold: true });
  s.say(`To read a[${k}], no searching: compute the address. Start + 4 × index = ${base + 4 * k}.`);
  s.tone(ids[k], 'hl');
  s.arrow('jump', 'ta', ids[k], { tone: 'ptr', bend: -50 });
  s.say(`Jump straight there. Reading a[${k}] takes the same single step whether the array has 5 items or 5 million. That's O(1) access.`);
  s.del('jump', 'f');
  s.tone(ids[k], 'plain');
  const j = randInt(1, n - 2);
  const nv = randInt(10, 99);
  s.say(`Now insert ${nv} at index ${j}. The block has no gaps, so everything from [${j}] onward must move right to make room.`);
  for (let i = n - 1; i >= j; i--) {
    s.move(ids[i], (i + 1) * STEP, 0);
    s.tone(ids[i], 'warn');
    s.say(`Move a[${i}] (${vals[i]}) one place right, into [${i + 1}]. Start from the end so nothing gets overwritten.`);
    s.tone(ids[i], 'plain');
  }
  s.box('nv', { x: j * STEP, y: 0, w: W, h: H, label: String(nv), tone: 'ok' });
  s.text('cost', 0, 100, `${n - j} moves + 1 write`, { tone: 'warn', bold: true });
  s.say(`Write ${nv} into the gap. That took ${n - j} moves. Inserting near the front of a big array moves almost everything: O(n).`);
  return s.build('Array: jump to any index, shift to insert');
};

const matrix: AnimScript = () => {
  const s = new Stage();
  const R = 3;
  const C = randInt(3, 4);
  const vals = distinctInts(R * C, 1, 99);
  const gx = 40;
  for (let r = 0; r < R; r++) {
    s.text(`rl${r}`, gx - 14, r * (H + 6) + 26, `row ${r}`, { anchor: 'end', size: 'sm', tone: 'dim' });
    for (let c = 0; c < C; c++) s.box(`g${r}_${c}`, { x: gx + c * STEP, y: r * (H + 6), w: W, h: H, shape: 'slot' });
    for (let c = 0; c < C; c++) s.box(`c${r}_${c}`, { x: gx + c * STEP, y: r * (H + 6), w: W, h: H, label: String(vals[r * C + c]), tone: (['accent', 'ok', 'warn'] as const)[r] });
  }
  for (let c = 0; c < C; c++) s.text(`cl${c}`, gx + c * STEP + W / 2, -8, `col ${c}`, { anchor: 'middle', size: 'sm', tone: 'dim' });
  s.say(`A 2D array looks like a grid: ${R} rows × ${C} columns. But memory is one long row, so the grid has to be laid out in a line.`);
  const my = R * (H + 6) + 60;
  s.box('mem', { x: -10, y: my - 26, w: R * C * STEP + 20, h: H + 40, shape: 'frame', label: 'Memory (one long row)' });
  slotRow(s, 'm', R * C, { y: my });
  s.say('Row-major order (what C# uses): row 0 first, then row 1, then row 2, all back to back.');
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) s.move(`c${r}_${c}`, (r * C + c) * STEP, my);
    s.say(`Row ${r} slides into memory at positions ${r * C} to ${r * C + C - 1}.`);
  }
  const r = randInt(1, R - 1);
  const c = randInt(0, C - 1);
  s.tone(`c${r}_${c}`, 'bad');
  s.set(`g${r}_${c}`, { shape: 'rect', tone: 'bad', label: '?' });
  s.text('f', 0, my + 80, `grid[${r}, ${c}] → index ${r} × ${C} + ${c} = ${r * C + c}`, { tone: 'accent', bold: true, size: 'lg' });
  s.say(`To find grid[${r}, ${c}]: skip ${r} full rows of ${C}, then ${c} more. Index = row × columns + col = ${r * C + c}. Still one calculation, O(1).`);
  return s.build('2D array: a grid stored as one row');
};

const dynamicArray: AnimScript = () => {
  const s = new Stage();
  let cap = 2;
  const vals = distinctInts(7, 10, 99);
  let y = 0;
  let block = 0;
  const frame = (b: number, c: number, yy: number) => {
    s.box(`blk${b}`, { x: -10, y: yy - 26, w: c * STEP + 14, h: H + 36, shape: 'frame', label: `Block ${b + 1}: capacity ${c}` });
    slotRow(s, `s${b}_`, c, { y: yy });
  };
  frame(0, cap, y);
  s.text('cnt', 0, -40, `Count 0 / Capacity ${cap}`, { bold: true });
  s.say(`A dynamic array (C#'s List<T>) is a normal array with spare room. It starts with space for ${cap}.`);
  let copies = 0;
  for (let i = 0; i < vals.length; i++) {
    if (i === cap) {
      const ny = y + H + 60;
      const ncap = cap * 2;
      block++;
      frame(block, ncap, ny);
      s.say(`Full! Adding item ${i + 1} needs room. A new block twice the size (${ncap}) is reserved elsewhere in memory.`);
      for (let k = 0; k < i; k++) s.move(`v${k}`, k * STEP, ny);
      copies += i;
      s.say(`Every existing item is copied across: ${i} copies. This is the slow, O(n) moment.`);
      for (let k = 0; k < cap; k++) s.del(`s${block - 1}_${k}`);
      s.del(`blk${block - 1}`);
      for (let k = 0; k < i; k++) s.move(`v${k}`, k * STEP, 0);
      for (let k = 0; k < ncap; k++) s.move(`s${block}_${k}`, k * STEP, 0);
      s.set(`blk${block}`, { y: -26 });
      s.say('The old block is thrown away. The list now lives in the big block.');
      cap = ncap;
      y = 0;
    }
    onSlot(s, `v${i}`, vals[i], i, { tone: 'ok', y });
    s.text('cnt', 0, -40, `Count ${i + 1} / Capacity ${cap}   (copies so far: ${copies})`, { bold: true });
    s.say(i === cap - 1 && i < vals.length - 1 ? `Add ${vals[i]}: it fits, but now the block is full.` : `Add ${vals[i]}: there's room, so it just goes in the next slot. O(1).`);
    s.tone(`v${i}`, 'plain');
  }
  s.say(`${vals.length} adds cost ${copies} copies in total, less than one extra copy per add. Because the size doubles, growing is rare: Add is O(1) on average.`);
  return s.build('Dynamic array: grow by doubling');
};

const string: AnimScript = () => {
  const s = new Stage();
  const word = pick(['HELLO', 'CODE', 'ARRAY', 'STACK', 'QUEUE']);
  const chars = word.split('');
  slotRow(s, 'a', chars.length);
  chars.forEach((ch, i) => onSlot(s, `c${i}`, ch, i));
  tag(s, 'ts', 's', -50, 9);
  s.say(`A string is an array of characters: "${word}" is ${chars.length} chars side by side. s[2] is '${chars[2]}', found in one step like any array.`);
  s.tone('c0', 'bad');
  s.say(`In C#, strings are immutable: you can never change a character in place. s[0] = 'X' isn't allowed.`);
  s.tone('c0', 'plain');
  const y = H + 50;
  slotRow(s, 'b', chars.length + 1, { y });
  tag(s, 'tt', 's + "!"', -88, y + 9);
  s.say(`So s + "!" can't just add a char at the end. It makes a brand-new array one longer…`);
  chars.forEach((ch, i) => onSlot(s, `d${i}`, ch, i, { y, tone: 'warn' }));
  s.say(`…and copies every character across: ${chars.length} copies.`);
  onSlot(s, 'bang', '!', chars.length, { y, tone: 'ok' });
  s.say(`Then writes '!'. Joining is O(length), because of the copy.`);
  s.text('loop', 0, y + H + 40, `adding 1 char n times: 1 + 2 + … + n copies ≈ n²/2`, { tone: 'bad', bold: true });
  s.say('Do that in a loop, adding one char at a time, and each step copies everything so far: O(n²) in total. That\'s why C# has StringBuilder: a growable char array that only copies when it runs out of room.');
  return s.build('Strings: arrays of characters you can’t change');
};

/** Lay linked-list nodes in a row; node ids are given. */
function listRow(s: Stage, ids: string[], labels: (number | string)[], o: { y?: number; gap?: number; x?: number; tone?: 'plain' } = {}) {
  const { y = 0, gap = 86, x = 0 } = o;
  ids.forEach((id, i) => s.box(id, { x: x + i * gap, y, w: 52, h: H, label: String(labels[i]), tone: 'plain' }));
}

const linkedList: AnimScript = () => {
  const s = new Stage();
  const n = 4;
  const vals = distinctInts(n, 10, 99);
  const ids = vals.map((_, i) => `n${i}`);
  listRow(s, ids, vals, { y: 40 });
  for (let i = 0; i + 1 < n; i++) s.arrow(`a${i}`, ids[i], ids[i + 1], { tone: 'accent', label: 'next' });
  s.box('null', { x: n * 86, y: 40, w: 46, h: H, label: 'null', shape: 'slot' });
  s.arrow(`a${n - 1}`, ids[n - 1], 'null', { tone: 'dim' });
  point(s, 'th', 'head', ids[0], 'above', 18);
  s.say('A linked list: each node holds a value and the address of the next node (an arrow). The nodes can be anywhere in memory; only the arrows give the order.');
  const k = randInt(1, n - 1);
  tag(s, 'tc', 'cur', 0, 120);
  s.arrow('tc>', 'tc', ids[0], { tone: 'ptr' });
  s.say(`There's no index math. To reach node ${k}, start at head and follow arrows.`);
  for (let i = 1; i <= k; i++) {
    s.move('tc', i * 86, 120);
    s.arrow('tc>', 'tc', ids[i], { tone: 'ptr' });
    s.say(`Follow next → node ${i} (${vals[i]}).${i === k ? ` Reaching position ${k} took ${k} hops: access is O(n).` : ''}`);
  }
  const at = randInt(0, n - 2);
  const nv = randInt(10, 99);
  s.del('tc', 'tc>');
  s.box('new', { x: at * 86 + 43, y: 130, w: 52, h: H, label: String(nv), tone: 'ok' });
  s.say(`Insert ${nv} after ${vals[at]}. Make a new node anywhere in memory.`);
  s.arrow('anew', 'new', ids[at + 1], { tone: 'ok', label: 'next' });
  s.say(`Step 1: point the new node's next at ${vals[at + 1]}, the node after ${vals[at]}.`);
  s.arrow(`a${at}`, ids[at], 'new', { tone: 'ok', label: 'next' });
  s.say(`Step 2: re-aim ${vals[at]}'s next at the new node. Two pointer writes, nothing shifted: O(1) once you're at the spot.`);
  const order = [...ids.slice(0, at + 1), 'new', ...ids.slice(at + 1)];
  order.forEach((id, i) => s.move(id, i * 86, 40));
  s.move('null', order.length * 86, 40);
  s.tone('new', 'plain');
  s.say('Redrawn in order. In memory nothing moved; this is just the arrows, followed from head.');
  const d = pick(order.slice(1, -1));
  const di = order.indexOf(d);
  s.tone(d, 'bad');
  s.arrow(`del`, order[di - 1], order[di + 1], { tone: 'ok', bend: -38, label: 'next' });
  for (const [aid, a] of Object.entries(s.arrows)) if (a.from === order[di - 1] && aid !== 'del') delete s.arrows[aid];
  s.say(`Delete ${s.boxes[d].label}: point the previous node past it. One pointer write.`);
  s.del(d);
  s.say('Nothing points at it any more, so it\'s gone from the list (C# frees the memory later).');
  return s.build('Linked list: follow, insert, delete');
};

const doublyLinkedList: AnimScript = () => {
  const s = new Stage();
  const vals = distinctInts(4, 10, 99);
  const ids = vals.map((_, i) => `n${i}`);
  listRow(s, ids, vals, { y: 40, gap: 100 });
  const link = (a: string, b: string, suf = '') => {
    s.arrow(`nx${a}${suf}`, a, b, { tone: 'accent', bend: -14, label: 'next' });
    s.arrow(`pv${b}${suf}`, b, a, { tone: 'ptr', bend: -14, label: 'prev' });
  };
  for (let i = 0; i + 1 < ids.length; i++) link(ids[i], ids[i + 1]);
  point(s, 'th', 'head', ids[0], 'above', 18);
  point(s, 'tt', 'tail', ids[3], 'above', 18);
  s.say('A doubly linked list: every node points both ways, next (forward) and prev (back). You can walk it in either direction.');
  const k = randInt(1, 2);
  s.tone(ids[k], 'bad');
  point(s, 'tx', 'x', ids[k], 'below', 30);
  s.say(`Delete node x (${vals[k]}), given a pointer straight to it. Its neighbours are right there: x.prev and x.next.`);
  s.del(`nx${ids[k - 1]}`, `pv${ids[k]}`);
  s.arrow(`nx${ids[k - 1]}`, ids[k - 1], ids[k + 1], { tone: 'ok', bend: -45, label: 'next' });
  s.say(`Step 1: x.prev.next = x.next. ${vals[k - 1]} now skips forward to ${vals[k + 1]}.`);
  s.del(`pv${ids[k + 1]}`, `nx${ids[k]}`);
  s.arrow(`pv${ids[k + 1]}`, ids[k + 1], ids[k - 1], { tone: 'ok', bend: -45, label: 'prev' });
  s.say(`Step 2: x.next.prev = x.prev. ${vals[k + 1]} now points back to ${vals[k - 1]}. Two writes, no walking: O(1).`);
  s.del(ids[k], 'tx', 'tx>');
  const rest = ids.filter((_, i) => i !== k);
  rest.forEach((id, i) => s.move(id, i * 100, 40));
  s.say('x is unlinked. A singly linked list couldn\'t do this without walking from head to find the node before x.');
  const nv = randInt(10, 99);
  s.box('nn', { x: rest.length * 100, y: 40, w: 52, h: H, label: String(nv), tone: 'ok' });
  s.arrow(`nx${rest[rest.length - 1]}`, rest[rest.length - 1], 'nn', { tone: 'accent', bend: -14, label: 'next' });
  s.arrow('pvnn', 'nn', rest[rest.length - 1], { tone: 'ptr', bend: -14, label: 'prev' });
  s.del('tt', 'tt>');
  point(s, 'tt', 'tail', 'nn', 'above', 18);
  s.say(`Add ${nv} at the end: tail tells us where the end is, so link it in both ways and move tail. O(1) at either end.`);
  return s.build('Doubly linked list: unlink in O(1)');
};

const circularLinkedList: AnimScript = () => {
  const s = new Stage();
  const n = 5;
  const vals = distinctInts(n, 10, 99);
  const pos = (i: number, m: number) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / m;
    return { x: 130 + 120 * Math.cos(a), y: 100 + 85 * Math.sin(a) };
  };
  let ids = vals.map((_, i) => `n${i}`);
  const place = () => ids.forEach((id, i) => s.box(id, { ...pos(i, ids.length), w: 48, h: H, label: s.boxes[id]?.label ?? '', tone: 'plain' }));
  ids.forEach((id, i) => s.box(id, { ...pos(i, n), w: 48, h: H, label: String(vals[i]), tone: 'plain' }));
  const arrows = () => {
    for (const k of Object.keys(s.arrows)) if (k.startsWith('r')) delete s.arrows[k];
    ids.forEach((id, i) => s.arrow(`r${id}`, id, ids[(i + 1) % ids.length], { tone: i === ids.length - 1 ? 'warn' : 'accent', bend: 10 }));
  };
  arrows();
  s.say('A circular linked list: like a normal one, but the last node points back to the first instead of null. There is no end.');
  tag(s, 'tc', 'cur', 300, 0);
  s.arrow('tc>', 'tc', ids[0], { tone: 'ptr' });
  s.say('Keep following next and you go round and round. Good for taking turns: players in a game, processes sharing a CPU.');
  for (let i = 1; i <= n + 1; i++) {
    s.arrow('tc>', 'tc', ids[i % n], { tone: 'ptr' });
    s.say(i === n ? `Back at ${vals[0]}: the turn wraps around with no special case.` : `Next turn: ${vals[i % n]}.`);
  }
  const k = 2;
  s.tone(ids[k], 'bad');
  s.say(`${vals[k]} is knocked out of the game. Point the node before it past it.`);
  ids = ids.filter((_, i) => i !== k);
  s.del(`n${k}`);
  place();
  arrows();
  s.arrow('tc>', 'tc', ids[1], { tone: 'ptr' });
  s.say(`The circle closes up. The remaining ${ids.length} keep taking turns. (Josephus problem: who's left last?)`);
  return s.build('Circular list: round and round');
};

const bitset: AnimScript = () => {
  const s = new Stage();
  const n = 12;
  slotRow(s, 's', n);
  const bit = (i: number, on: boolean, tone: 'accent' | 'dim' | 'ok' | 'warn' = on ? 'accent' : 'dim') => onSlot(s, `b${i}`, on ? 1 : 0, i, { tone });
  for (let i = 0; i < n; i++) bit(i, false);
  s.say(`A bitset stores a set of small numbers (0–${n - 1}) as one bit each: bit i is 1 when i is in the set. ${n} numbers fit in ${n} bits, under 2 bytes.`);
  const set = shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, 4).sort((a, b) => a - b);
  for (const v of set) {
    bit(v, true);
    s.say(`Add ${v}: switch on bit ${v}. One OR instruction: set |= 1 << ${v}.`);
  }
  const q = pick([...set.slice(0, 1), ...Array.from({ length: n }, (_, i) => i).filter((i) => !set.includes(i)).slice(0, 2)]);
  s.set(`s${q}`, { shape: 'rect', tone: 'warn' });
  s.say(`Is ${q} in the set? Look at bit ${q}: it's ${set.includes(q) ? '1, yes' : '0, no'}. One AND instruction, O(1).`);
  s.set(`s${q}`, { shape: 'slot', tone: 'plain' });
  const other = shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, 4);
  const y = H + 40;
  s.text('l1', -8, 26, 'A', { anchor: 'end', bold: true });
  s.text('l2', -8, y + 26, 'B', { anchor: 'end', bold: true });
  for (let i = 0; i < n; i++) onSlot(s, `o${i}`, other.includes(i) ? 1 : 0, i, { y, tone: other.includes(i) ? 'ok' : 'dim' });
  s.say(`A second set B = {${[...other].sort((a, b) => a - b).join(', ')}}.`);
  const y2 = 2 * y;
  s.text('l3', -8, y2 + 26, 'A ∪ B', { anchor: 'end', bold: true });
  for (let i = 0; i < n; i++) {
    const on = set.includes(i) || other.includes(i);
    onSlot(s, `u${i}`, on ? 1 : 0, i, { y: y2, tone: on ? 'warn' : 'dim' });
  }
  s.say('Union (A ∪ B) = A OR B, bit by bit. The CPU ORs 64 bits in one instruction, so 64 members are combined at once.');
  return s.build('Bitset: one bit per member');
};

export const LINEAR_ANIMS: Record<string, AnimScript> = {
  memory,
  pointers,
  bits,
  'static-array': staticArray,
  matrix,
  'dynamic-array': dynamicArray,
  string,
  'linked-list': linkedList,
  'doubly-linked-list': doublyLinkedList,
  'circular-linked-list': circularLinkedList,
  bitset,
};

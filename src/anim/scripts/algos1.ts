import type { AnimScript } from '../engine';
import { Stage } from '../engine';
import { distinctInts, pick, randInt, shuffle } from '../../engine/random';
import { H, STEP, W, onSlot, slotRow, tag } from '../kit';

/** A tag sitting under slot i (or above it). */
function under(s: Stage, id: string, name: string, i: number, o: { y?: number; above?: boolean } = {}) {
  const w = Math.max(34, name.length * 8 + 18);
  const y = o.y ?? 0;
  tag(s, id, name, i * STEP + W / 2 - w / 2, o.above ? y - 34 : y + H + 22);
}

const binarySearch: AnimScript = () => {
  const s = new Stage();
  const n = randInt(11, 13);
  const a = distinctInts(n, 1, 99).sort((x, y) => x - y);
  const found = Math.random() < 0.75;
  let target = found ? pick(a.filter((_, i) => i !== (n - 1) >> 1)) : randInt(1, 99);
  while (!found && a.includes(target)) target = randInt(1, 99);
  slotRow(s, 's', n);
  a.forEach((v, i) => onSlot(s, `v${i}`, v, i));
  s.text('goal', 0, -36, `Looking for ${target}`, { bold: true, size: 'lg' });
  s.say(`A sorted array of ${n}. We want ${target}. Checking one by one could take ${n} looks. Because it's sorted, we can do much better.`);
  let lo = 0;
  let hi = n - 1;
  let looks = 0;
  under(s, 'tlo', 'lo', lo);
  under(s, 'thi', 'hi', hi);
  s.say('lo and hi mark the part of the array where the target could still be. At first, that\'s everything.');
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    looks++;
    s.tone(`v${mid}`, 'hl');
    under(s, 'tmid', 'mid', mid, { above: true });
    if (a[mid] === target) {
      s.tone(`v${mid}`, 'ok');
      s.say(`mid = ${mid}: a[${mid}] = ${a[mid]}. Found it after ${looks} look${looks > 1 ? 's' : ''}, not ${n}.`);
      return s.build(`Binary search for ${target}`);
    }
    const right = a[mid] < target;
    s.say(`mid = (${lo} + ${hi}) / 2 = ${mid}. a[${mid}] = ${a[mid]}, which is ${right ? 'smaller' : 'bigger'} than ${target}. So ${target} can't be ${right ? 'at or left of' : 'at or right of'} mid.`);
    if (right) {
      for (let i = lo; i <= mid; i++) s.tone(`v${i}`, 'dim');
      lo = mid + 1;
    } else {
      for (let i = mid; i <= hi; i++) s.tone(`v${i}`, 'dim');
      hi = mid - 1;
    }
    s.del('tmid');
    if (lo <= hi) {
      under(s, 'tlo', 'lo', lo);
      under(s, 'thi', 'hi', hi);
    }
    s.say(`Throw that half away in one go: ${right ? `lo = mid + 1 = ${lo}` : `hi = mid − 1 = ${hi}`}. ${lo <= hi ? `${hi - lo + 1} candidate${hi - lo + 1 === 1 ? '' : 's'} left.` : 'Nothing left.'}`);
  }
  s.del('tlo', 'thi');
  s.say(`lo passed hi: the range is empty, so ${target} isn't in the array. Only ${looks} looks to be sure. Each look halves the range: O(log n).`);
  return s.build(`Binary search for ${target}`);
};

const twoPointers: AnimScript = () => {
  const s = new Stage();
  const n = 8;
  let a: number[];
  let target: number;
  do {
    a = distinctInts(n, 1, 30).sort((x, y) => x - y);
    const i = randInt(1, 3);
    const j = randInt(4, n - 2);
    target = a[i] + a[j];
  } while (a.filter((x, i) => a.slice(i + 1).includes(target - x)).length !== 1);
  slotRow(s, 's', n);
  a.forEach((v, i) => onSlot(s, `v${i}`, v, i));
  s.text('goal', 0, -20, `Find two values that add up to ${target}`, { bold: true, size: 'lg' });
  s.say(`A sorted array. Find a pair adding to ${target}. Trying every pair is ${(n * (n - 1)) / 2} checks; two pointers need at most ${n - 1}.`);
  let l = 0;
  let r = n - 1;
  under(s, 'tl', 'L', l);
  under(s, 'tr', 'R', r);
  s.say('Start L at the smallest value and R at the largest.');
  while (l < r) {
    const sum = a[l] + a[r];
    s.tone([`v${l}`, `v${r}`], sum === target ? 'ok' : 'hl');
    s.text('sum', 0, H + 76, `${a[l]} + ${a[r]} = ${sum}`, { bold: true, tone: sum === target ? 'ok' : 'accent' });
    if (sum === target) {
      s.say(`${a[l]} + ${a[r]} = ${target}. Found the pair.`);
      break;
    }
    if (sum < target) {
      s.say(`${sum} is too small. R is already the biggest partner L could have, so L is useless: move L right to a bigger value.`);
      s.tone(`v${l}`, 'dim');
      s.tone(`v${r}`, 'plain');
      l++;
      under(s, 'tl', 'L', l);
    } else {
      s.say(`${sum} is too big. L is already the smallest partner R could have, so R is useless: move R left to a smaller value.`);
      s.tone(`v${r}`, 'dim');
      s.tone(`v${l}`, 'plain');
      r--;
      under(s, 'tr', 'R', r);
    }
    s.say(`Each move rules out one value for good. ${r - l + 1} values still in play.`);
  }
  return s.build(`Two pointers: pair summing to ${target}`);
};

const slidingWindow: AnimScript = () => {
  const s = new Stage();
  const n = 9;
  const k = 3;
  const a = Array.from({ length: n }, () => randInt(1, 9));
  slotRow(s, 's', n);
  a.forEach((v, i) => onSlot(s, `v${i}`, v, i));
  s.say(`Find the biggest sum of ${k} values in a row. Adding up every group from scratch costs ${k} additions per group.`);
  const win = (i: number) => s.box('win', { x: i * STEP - 5, y: -22, w: k * STEP + 4, h: H + 30, shape: 'frame', label: `window [${i}..${i + k - 1}]`, tone: 'accent' });
  let sum = a.slice(0, k).reduce((x, y) => x + y, 0);
  let best = sum;
  let bestAt = 0;
  win(0);
  s.text('sum', 0, H + 44, `sum = ${a.slice(0, k).join(' + ')} = ${sum}`, { bold: true });
  s.text('best', 0, H + 66, `best = ${best}`, { tone: 'ok', bold: true });
  s.say(`Add up the first window once: ${sum}.`);
  for (let i = 1; i + k <= n; i++) {
    const out = a[i - 1];
    const inn = a[i + k - 1];
    s.tone(`v${i - 1}`, 'bad');
    s.tone(`v${i + k - 1}`, 'ok');
    win(i);
    const nsum = sum - out + inn;
    s.text('sum', 0, H + 44, `sum = ${sum} − ${out} + ${inn} = ${nsum}`, { bold: true });
    if (nsum > best) {
      best = nsum;
      bestAt = i;
    }
    s.text('best', 0, H + 66, `best = ${best}`, { tone: 'ok', bold: true });
    s.say(`Slide one step: ${out} leaves on the left, ${inn} joins on the right. Update the sum with one subtraction and one addition, not ${k} additions.${nsum === best && bestAt === i ? ' New best!' : ''}`);
    s.tone(`v${i - 1}`, 'dim');
    s.tone(`v${i + k - 1}`, 'plain');
    sum = nsum;
  }
  win(bestAt);
  for (let i = 0; i < n; i++) s.tone(`v${i}`, i >= bestAt && i < bestAt + k ? 'ok' : 'plain');
  s.say(`Best window: [${bestAt}..${bestAt + k - 1}] with sum ${best}. Every slide was 2 operations, so the whole scan is O(n), whatever the window size.`);
  return s.build(`Sliding window of ${k}`);
};

const insertionSort: AnimScript = () => {
  const s = new Stage();
  const n = 6;
  const a = distinctInts(n, 1, 60);
  slotRow(s, 's', n);
  const id = a.map((_, i) => `v${i}`);
  a.forEach((v, i) => onSlot(s, id[i], v, i));
  // pos[k] = which id is at slot k
  const at = [...id];
  const val = new Map(id.map((x, i) => [x, a[i]]));
  s.box('sorted', { x: -5, y: -22, w: STEP - 2, h: H + 30, shape: 'frame', label: 'sorted', tone: 'ok' });
  s.say('Insertion sort keeps a sorted part on the left. One value on its own is already sorted.');
  for (let i = 1; i < n; i++) {
    const key = at[i];
    const kv = val.get(key)!;
    s.move(key, i * STEP, -70);
    s.tone(key, 'hl');
    s.say(`Pick up the next value, ${kv}. Find where it belongs in the sorted part.`);
    let j = i - 1;
    while (j >= 0 && val.get(at[j])! > kv) {
      s.move(at[j], (j + 1) * STEP, 0);
      s.tone(at[j], 'warn');
      s.move(key, j * STEP, -70);
      s.say(`${val.get(at[j])} is bigger than ${kv}, so it shifts one place right.`);
      s.tone(at[j], 'plain');
      at[j + 1] = at[j];
      j--;
    }
    at[j + 1] = key;
    s.move(key, (j + 1) * STEP, 0);
    s.tone(key, 'plain');
    s.box('sorted', { x: -5, y: -22, w: (i + 1) * STEP - 2, h: H + 30, shape: 'frame', label: 'sorted', tone: 'ok' });
    s.say(j >= 0 ? `${val.get(at[j])} is smaller than ${kv}: stop. Drop ${kv} into the gap. The sorted part grows by one.` : `${kv} is the smallest so far: it drops in at the front.`);
  }
  s.say('Sorted. Values only moved past bigger values that came before them, so nearly-sorted input finishes almost instantly; reversed input is the worst case, O(n²).');
  return s.build('Insertion sort');
};

const countingSort: AnimScript = () => {
  const s = new Stage();
  const n = 7;
  const K = 5;
  const a = Array.from({ length: n }, () => randInt(0, K));
  s.text('l1', -10, 26, 'input', { anchor: 'end', size: 'sm', tone: 'dim' });
  slotRow(s, 'i', n);
  a.forEach((v, i) => onSlot(s, `in${i}`, v, i));
  const cy = H + 50;
  s.text('l2', -10, cy + 26, 'count', { anchor: 'end', size: 'sm', tone: 'dim' });
  slotRow(s, 'c', K + 1, { y: cy, top: (v) => `value ${v}` });
  const cnt = Array(K + 1).fill(0);
  for (let v = 0; v <= K; v++) onSlot(s, `cnt${v}`, 0, v, { y: cy, tone: 'dim' });
  s.say(`Sort ${n} numbers that are all between 0 and ${K}. Make one counter per possible value, all 0. No comparisons will ever happen.`);
  a.forEach((v, i) => {
    cnt[v]++;
    s.tone(`in${i}`, 'hl');
    onSlot(s, `cnt${v}`, cnt[v], v, { y: cy, tone: 'accent' });
    s.say(`${v}: add 1 to counter ${v} (now ${cnt[v]}).`);
    s.tone(`in${i}`, 'dim');
    s.tone(`cnt${v}`, 'plain');
  });
  const oy = 2 * (H + 50);
  s.text('l3', -10, oy + 26, 'output', { anchor: 'end', size: 'sm', tone: 'dim' });
  slotRow(s, 'o', n, { y: oy });
  s.say('Now read the counters from smallest value to largest, writing each value as many times as its count.');
  let w = 0;
  for (let v = 0; v <= K; v++) {
    if (!cnt[v]) continue;
    s.tone(`cnt${v}`, 'hl');
    for (let c = 0; c < cnt[v]; c++) onSlot(s, `out${w++}`, v, w - 1, { y: oy, tone: 'ok' });
    s.say(`Counter ${v} says ${cnt[v]}: write ${cnt[v] > 1 ? `${cnt[v]} copies of ${v}` : `one ${v}`}.`);
    s.tone(`cnt${v}`, 'plain');
  }
  s.say(`Sorted in ${n} + ${K + 1} steps (n + k). It beats comparison sorts, but only because the values are small whole numbers: k counters are needed.`);
  return s.build('Counting sort');
};

const fastSlow: AnimScript = () => {
  const s = new Stage();
  const tail = 2;
  const loop = randInt(4, 6);
  const total = tail + loop;
  const vals = distinctInts(total, 10, 99);
  const ids = vals.map((_, i) => `n${i}`);
  const cx = tail * 80 + 110;
  const cy = 90;
  ids.forEach((id, i) => {
    if (i < tail) s.box(id, { x: i * 80, y: cy - 20, w: 46, h: 40, label: String(vals[i]), tone: 'plain' });
    else {
      const ang = Math.PI - (2 * Math.PI * (i - tail)) / loop;
      s.box(id, { x: cx + 95 * Math.cos(ang) - 23, y: cy - 70 * Math.sin(ang) - 20, w: 46, h: 40, label: String(vals[i]), tone: 'plain' });
    }
  });
  for (let i = 0; i + 1 < total; i++) s.arrow(`a${i}`, ids[i], ids[i + 1], { tone: 'accent' });
  s.arrow('back', ids[total - 1], ids[tail], { tone: 'warn' });
  s.say('Does this linked list end, or loop forever? You can\'t tell by looking at one node. The last node secretly points back into the middle.');
  const T = (id: string, name: string, node: number, dy: number) => {
    const b = s.boxes[ids[node]];
    tag(s, id, name, b.x + 23 - 25, b.y + dy);
    s.arrow(`${id}>`, id, ids[node], { tone: 'ptr' });
  };
  let slow = 0;
  let fast = 0;
  T('ts', 'slow', slow, -36);
  T('tf', 'fast', fast, 50);
  s.say('Two pointers start at the head. Each turn, slow moves 1 node and fast moves 2.');
  const next = (i: number) => (i + 1 < total ? i + 1 : tail);
  for (let step = 1; step < 20; step++) {
    slow = next(slow);
    fast = next(next(fast));
    T('ts', 'slow', slow, -36);
    T('tf', 'fast', fast, 50);
    if (slow === fast) {
      s.tone(ids[slow], 'ok');
      s.say(`They land on the same node (${vals[slow]}). Fast could only catch slow by going round a loop, so there IS a cycle. If the list had an end, fast would have hit null first.`);
      break;
    }
    s.say(`Turn ${step}: slow → ${vals[slow]}, fast → ${vals[fast]}.${step === 2 ? ' Inside the loop, fast gains one node on slow every turn, so it must catch up.' : ''}`);
  }
  s.say('Cycle found using only two pointers and no extra memory: O(n) time, O(1) space. The same trick (fast moves 2, slow moves 1) finds the middle of a list: when fast reaches the end, slow is halfway.');
  return s.build('Fast and slow pointers: finding a cycle');
};

const bitManipulation: AnimScript = () => {
  const s = new Stage();
  const pairs = distinctInts(3, 1, 15);
  const single = pairs.pop()!;
  const nums = shuffle([...pairs, ...pairs, single]);
  const bitsOf = (v: number) => [8, 4, 2, 1].map((p) => (v & p ? 1 : 0));
  const row = (key: string, v: number, y: number, tone: 'accent' | 'ok' | 'plain') => bitsOf(v).forEach((b, i) => onSlot(s, `${key}${i}`, b, i, { y, x: 80, tone: b ? tone : 'dim' }));
  s.text('list', 0, -30, `numbers: ${nums.join(', ')}`, { bold: true });
  s.say(`Every number appears twice except one. Find the loner without a dictionary. Trick: XOR (^) all of them.`);
  let acc = 0;
  s.text('accl', 70, 26, 'result', { anchor: 'end', size: 'sm', tone: 'dim' });
  row('r', acc, 0, 'ok');
  s.text('accv', 80 + 4 * STEP + 10, 26, `= ${acc}`, { bold: true });
  s.say('XOR compares bits: 1 if they differ, 0 if they\'re the same. So x ^ x = 0 and x ^ 0 = x. Start with result 0.');
  nums.forEach((v, k) => {
    s.text('nl', 70, H + 40, `^ ${v}`, { anchor: 'end', size: 'md', bold: true });
    row('x', v, H + 14, 'accent');
    s.text('list', 0, -30, `numbers: ${nums.map((x, i) => (i === k ? `[${x}]` : String(x))).join(', ')}`, { bold: true });
    s.say(`XOR in ${v} (${bitsOf(v).join('')}).`);
    acc ^= v;
    row('r', acc, 0, 'ok');
    s.text('accv', 80 + 4 * STEP + 10, 26, `= ${acc}`, { bold: true });
    s.say(`Bits that differ become 1, bits that match become 0. Result: ${bitsOf(acc).join('')} = ${acc}.${nums.indexOf(v) !== k ? ` ${v} has now been XORed twice, so its bits have cancelled out.` : ''}`);
  });
  s.del('nl');
  for (let i = 0; i < 4; i++) s.del(`x${i}`);
  s.say(`Pairs cancelled themselves out (x ^ x = 0), leaving only the loner: ${acc}. One pass, no extra memory, just bit operations.`);
  return s.build('XOR: find the number without a pair');
};

export const ALGO1_ANIMS: Record<string, AnimScript> = {
  'binary-search': binarySearch,
  'two-pointers': twoPointers,
  'sliding-window': slidingWindow,
  'insertion-sort': insertionSort,
  'counting-sort': countingSort,
  'fast-slow-pointers': fastSlow,
  'bit-manipulation': bitManipulation,
};

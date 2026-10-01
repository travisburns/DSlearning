import type { AnimScript } from '../engine';
import { Stage } from '../engine';
import { distinctInts, pick, randInt, shuffle } from '../../engine/random';
import { H, STEP, W, onSlot, slotRow } from '../kit';

// =====================================================================
// Hash function
// =====================================================================

const hashFunction: AnimScript = () => {
  const s = new Stage();
  const M = 8;
  const words = shuffle(['cat', 'dog', 'owl', 'cow', 'bee', 'ant', 'fox', 'pig', 'emu', 'yak']);
  const h = (w: string) => [...w].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 100000, 0);
  const key = words[0];
  const ty = 210;
  slotRow(s, 't', M, { y: ty, x: 0 });
  s.text('tl', 0, ty - 26, `Table with ${M} slots`, { size: 'sm', tone: 'dim', bold: true });
  [...key].forEach((c, i) => s.box(`k${i}`, { x: i * STEP, y: 0, w: W, h: H, label: c, sub: String(c.charCodeAt(0)) }));
  s.say(`A hash function turns a key into a slot number. Every character is already a number (its code): '${key[0]}' is ${key.charCodeAt(0)}.`);
  let acc = 0;
  [...key].forEach((c, i) => {
    const prev = acc;
    acc = (acc * 31 + c.charCodeAt(0)) % 100000;
    s.tone(`k${i}`, 'hl');
    s.text('calc', 0, 90, `h = ${prev} × 31 + ${c.charCodeAt(0)} = ${acc}`, { bold: true, size: 'lg' });
    s.say(i === 0 ? 'Mix the characters together one by one: multiply what you have by 31, add the next code.' : `Next character '${c}'. Multiplying first means order matters: “${[...key].reverse().join('')}” would give a different number.`);
    s.tone(`k${i}`, 'plain');
  });
  const idx = acc % M;
  s.text('calc2', 0, 120, `slot = ${acc} % ${M} = ${idx}`, { bold: true, size: 'lg', tone: 'accent' });
  s.say(`The number is huge, but the table has ${M} slots. Take the remainder: ${acc} % ${M} = ${idx}.`);
  s.box('kk', { x: idx * STEP - 3, y: ty, w: W + 6, h: H, label: key, tone: 'ok' });
  s.say(`So “${key}” always lives in slot ${idx}. Same key → same steps → same slot, every time. That's what lets a hash table find it again instantly.`);
  const other = words.slice(1).find((w) => h(w) % M !== idx)!;
  s.del('calc', 'calc2');
  s.text('calc', 0, 90, `“${other}” → ${h(other)} → slot ${h(other) % M}`, { bold: true, size: 'lg' });
  s.box('k2', { x: (h(other) % M) * STEP - 3, y: ty, w: W + 6, h: H, label: other, tone: 'accent' });
  s.say(`A different key lands somewhere else: “${other}” → slot ${h(other) % M}. A good hash spreads keys evenly over the slots.`);
  const clash = words.slice(1).find((w) => h(w) % M === idx);
  if (clash) {
    s.text('calc', 0, 90, `“${clash}” → ${h(clash)} → slot ${h(clash) % M}`, { bold: true, size: 'lg', tone: 'bad' });
    s.box('k3', { x: idx * STEP - 3, y: ty - 50, w: W + 6, h: H, label: clash, tone: 'bad' });
    s.say(`But “${clash}” also gives slot ${idx}: a collision. With more keys than slots it can't be avoided, so every hash table needs a plan for it (chaining or probing, next lessons).`);
  } else s.say('With more keys than slots, two keys must eventually share a slot (a collision). Every hash table needs a plan for that: the next lessons.');
  return s.build('Hash function: key → slot number');
};

// =====================================================================
// Chaining
// =====================================================================

const BUCKET_Y = 52;
function buckets(s: Stage, m: number, label = 'bucket') {
  for (let i = 0; i < m; i++) s.box(`b${i}`, { x: 0, y: i * BUCKET_Y, w: 56, h: H, label: `${i}`, shape: 'slot', top: i === 0 ? label : undefined });
}

const hashChaining: AnimScript = () => {
  const s = new Stage();
  const M = 5;
  buckets(s, M);
  const keys = distinctInts(7, 10, 99);
  const chain: string[][] = Array.from({ length: M }, () => []);
  s.text('rule', 90, -24, `bucket = key % ${M}`, { bold: true, tone: 'accent' });
  s.say(`Chaining: the table is an array of ${M} buckets, and each bucket holds a little linked list of every key that hashed there.`);
  for (const k of keys.slice(0, 6)) {
    const b = k % M;
    const id = `k${k}`;
    s.box(id, { x: 420, y: -10, w: W, h: H, label: String(k), tone: 'hl' });
    s.text('calc', 420, 50, `${k} % ${M} = ${b}`, { bold: true });
    s.say(`Insert ${k}: ${k} % ${M} = ${b}.`);
    const prev = chain[b].length ? `k${chain[b][chain[b].length - 1]}` : `b${b}`;
    chain[b].push(String(k));
    s.move(id, 80 + (chain[b].length - 1) * 70, b * BUCKET_Y);
    s.arrow(`c${k}`, prev, id, { tone: 'accent' });
    s.tone(id, 'plain');
    s.say(chain[b].length > 1 ? `Bucket ${b} already has ${chain[b].length - 1}. Collision: no problem, add ${k} to the end of that bucket's chain.` : `Bucket ${b} is empty: ${k} starts its chain.`);
  }
  s.del('calc');
  const longest = chain.reduce((best, c, i) => (c.length > chain[best].length ? i : best), 0);
  const target = Number(pick(chain[longest]));
  s.text('calc', 420, 50, `find ${target}: ${target} % ${M} = ${longest}`, { bold: true, tone: 'accent' });
  s.say(`Look up ${target}: hash straight to bucket ${longest}, skipping the other buckets entirely.`);
  for (const k of chain[longest]) {
    s.tone(`k${k}`, Number(k) === target ? 'ok' : 'hl');
    s.say(Number(k) === target ? `Found ${target}. Only the keys in this one bucket were checked.` : `${k}? Not it, follow the chain.`);
    if (Number(k) === target) break;
    s.tone(`k${k}`, 'plain');
  }
  s.say(`If keys spread evenly, each chain stays short (keys ÷ buckets), so lookups are O(1) on average. When chains get long, the table grows and every key is re-hashed into more buckets.`);
  return s.build('Hash table with chaining');
};

// =====================================================================
// Open addressing (linear probing)
// =====================================================================

const openAddressing: AnimScript = () => {
  const s = new Stage();
  const M = 8;
  slotRow(s, 's', M);
  s.text('rule', 0, -40, `home slot = key % ${M}; if taken, try the next slot`, { bold: true, tone: 'accent' });
  const table: (number | null | 'del')[] = Array(M).fill(null);
  // Choose keys with at least one collision.
  let keys: number[];
  do keys = distinctInts(5, 10, 99);
  while (new Set(keys.map((k) => k % M)).size > 4);
  s.say(`Open addressing keeps every key in the array itself, no chains. A key goes to its home slot; if that's taken, it probes the next one along.`);
  for (const k of keys) {
    let i = k % M;
    const id = `k${k}`;
    s.box(id, { x: i * STEP, y: -100, w: W, h: H, label: String(k), tone: 'hl' });
    s.say(`Insert ${k}: home slot ${k} % ${M} = ${i}.`);
    let probes = 0;
    while (table[i] !== null) {
      s.move(id, i * STEP, -56);
      s.tone(id, 'bad');
      s.say(`Slot ${i} is taken (${table[i]}). Probe the next slot.`);
      i = (i + 1) % M;
      probes++;
    }
    table[i] = k;
    s.move(id, i * STEP, 0);
    s.tone(id, 'plain');
    s.say(probes ? `Slot ${i} is free: ${k} goes here, ${probes} away from home.` : `Slot ${i} is free: ${k} goes straight in.`);
  }
  const moved = keys.find((k) => table.indexOf(k) !== k % M) ?? keys[0];
  s.say(`Look up ${moved}: start at its home slot ${moved % M} and probe forward until you find it, or hit an EMPTY slot (then it's not there).`);
  let i = moved % M;
  while (table[i] !== moved) {
    s.tone(`k${table[i]}`, 'hl');
    s.say(`Slot ${i}: ${table[i]}, not it. Keep going.`);
    s.tone(`k${table[i]}`, 'plain');
    i = (i + 1) % M;
  }
  s.tone(`k${moved}`, 'ok');
  s.say(`Found ${moved} in slot ${i}.`);
  // A key sitting on the probe path between moved's home slot and where moved actually is.
  const victim = moved % M === table.indexOf(moved) ? undefined : (table[moved % M] as number);
  if (victim !== undefined) {
    const vi = table.indexOf(victim);
    s.del(`k${victim}`);
    s.box(`tomb`, { x: vi * STEP, y: 0, w: W, h: H, label: 'del', tone: 'dim' });
    table[vi] = 'del';
    s.say(`Delete ${victim}: you can't just empty slot ${vi}, or the search for ${moved} would stop there and wrongly report “not found”. Leave a tombstone that says “keep probing”.`);
  }
  s.say('Everything sits in one array, which is cache-friendly and fast. But clusters build up as the table fills, so it is resized well before it gets full (around 70%).');
  return s.build('Open addressing: linear probing');
};

// =====================================================================
// Hash map (key → value)
// =====================================================================

const hashMap: AnimScript = () => {
  const s = new Stage();
  const M = 5;
  buckets(s, M);
  const fruit = shuffle(['apple', 'pear', 'kiwi', 'plum', 'fig', 'lime', 'date']).slice(0, 5);
  const h = (w: string) => [...w].reduce((a, c) => a + c.charCodeAt(0), 0) % M;
  const chain: string[][] = Array.from({ length: M }, () => []);
  const count = new Map<string, number>();
  s.text('code', 90, -24, 'Dictionary<string, int> stock', { bold: true, tone: 'accent' });
  s.say('A hash map (C#’s Dictionary) stores key → value pairs. The key decides where the pair lives; the value just rides along.');
  const put = (k: string, v: number) => {
    const b = h(k);
    const id = `p${k}`;
    if (count.has(k)) {
      s.set(id, { label: `${k}: ${v}`, tone: 'hl' });
      s.say(`stock["${k}"] = ${v}: hash → bucket ${b}, find “${k}” there, and replace its value. Keys are unique.`);
      s.tone(id, 'plain');
      count.set(k, v);
      return;
    }
    s.box(id, { x: 460, y: -10, w: 84, h: H, label: `${k}: ${v}`, tone: 'hl', mono: false });
    s.text('calc', 460, 52, `hash("${k}") % ${M} = ${b}`, { bold: true });
    s.say(`stock["${k}"] = ${v}. Hash the key: bucket ${b}.`);
    const prev = chain[b].length ? `p${chain[b][chain[b].length - 1]}` : `b${b}`;
    chain[b].push(k);
    count.set(k, v);
    s.move(id, 80 + (chain[b].length - 1) * 100, b * BUCKET_Y);
    s.arrow(`c${k}`, prev, id, { tone: 'accent' });
    s.tone(id, 'plain');
    s.del('calc');
    s.say(`The pair (“${k}”, ${v}) is stored in bucket ${b}.`);
  };
  fruit.forEach((f) => put(f, randInt(1, 9)));
  const again = pick(fruit);
  put(again, randInt(10, 20));
  const q = pick(fruit);
  s.text('calc', 460, 52, `stock["${q}"] → bucket ${h(q)}`, { bold: true, tone: 'accent' });
  s.tone(`p${q}`, 'ok');
  s.say(`Read stock["${q}"]: hash “${q}” → bucket ${h(q)} → ${count.get(q)}. No scanning through all the fruit: O(1) on average.`);
  s.say('The price: keys come out in no useful order, and the map uses extra memory for empty buckets. If you need keys in sorted order, use SortedDictionary (a balanced tree) instead.');
  return s.build('Hash map: key → value');
};

// =====================================================================
// Cuckoo hashing
// =====================================================================

const cuckoo: AnimScript = () => {
  const s = new Stage();
  const M = 5;
  const h1 = (k: number) => k % M;
  const h2 = (k: number) => Math.floor(k / M) % M;
  const X2 = 230;
  for (let i = 0; i < M; i++) {
    s.box(`a${i}`, { x: 0, y: i * BUCKET_Y, w: W + 10, h: H, shape: 'slot', top: i === 0 ? 'T1: k % 5' : undefined, sub: undefined });
    s.box(`b${i}`, { x: X2, y: i * BUCKET_Y, w: W + 10, h: H, shape: 'slot', top: i === 0 ? 'T2: (k / 5) % 5' : undefined });
    s.text(`ai${i}`, -8, i * BUCKET_Y + 25, String(i), { anchor: 'end', size: 'sm', tone: 'dim' });
  }
  const T: (number | null)[][] = [Array(M).fill(null), Array(M).fill(null)];
  const place = (k: number, t: number, i: number) => s.box(`k${k}`, { x: t ? X2 : 0, y: i * BUCKET_Y, w: W + 10, h: H, label: String(k), tone: 'plain' });
  // Keys chosen so at least one kick happens.
  let keys: number[] = [];
  for (let tries = 0; tries < 200; tries++) {
    keys = distinctInts(5, 10, 99);
    const t: (number | null)[][] = [Array(M).fill(null), Array(M).fill(null)];
    let kicks = 0;
    let ok = true;
    for (const k0 of keys) {
      let k = k0;
      let side = 0;
      let n = 0;
      while (k !== null && n++ < 8) {
        const i = side ? h2(k) : h1(k);
        const out = t[side][i];
        t[side][i] = k;
        if (out === null) break;
        kicks++;
        k = out;
        side = 1 - side;
      }
      if (n >= 8) ok = false;
    }
    if (ok && kicks >= 1 && kicks <= 4) break;
  }
  s.say(`Cuckoo hashing: two tables, two hash functions. Every key has exactly two possible homes: T1[k % 5] or T2[(k / 5) % 5]. A lookup checks those two places and nothing else.`);
  for (const k0 of keys) {
    let k = k0;
    let side = 0;
    s.box(`k${k}`, { x: 110, y: -70, w: W + 10, h: H, label: String(k), tone: 'hl' });
    s.say(`Insert ${k}: its homes are T1[${h1(k)}] and T2[${h2(k)}]. Try T1 first.`);
    for (let n = 0; n < 8; n++) {
      const i = side ? h2(k) : h1(k);
      const out = T[side][i];
      T[side][i] = k;
      place(k, side, i);
      if (out === null) {
        s.say(`T${side + 1}[${i}] was empty: ${k} moves in.`);
        break;
      }
      s.box(`k${out}`, { x: 110, y: -70, w: W + 10, h: H, label: String(out), tone: 'bad' });
      s.say(`T${side + 1}[${i}] was taken by ${out}. Like a cuckoo chick, ${k} pushes it out. ${out} must go to its OTHER home, T${2 - side}[${side ? h1(out) : h2(out)}].`);
      k = out;
      side = 1 - side;
    }
  }
  const q = pick(keys);
  const qs = T[0][h1(q)] === q ? 0 : 1;
  s.tone(`k${q}`, 'ok');
  s.say(`Find ${q}: check T1[${h1(q)}]${qs ? ` (not there), then T2[${h2(q)}]: found` : ': found'}. At most 2 checks, ever: guaranteed O(1) lookup. Inserts can trigger chains of kicks, and if they loop, the tables are rebuilt with new hash functions.`);
  return s.build('Cuckoo hashing: two homes per key');
};

// =====================================================================
// Consistent hashing
// =====================================================================

const consistentHashing: AnimScript = () => {
  const s = new Stage();
  const cx = 170;
  const cy = 150;
  const R = 120;
  const at = (deg: number, r = R, w = 40, h = 40) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a) - w / 2, y: cy + r * Math.sin(a) - h / 2 };
  };
  s.box('ring', { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R, shape: 'circle', tone: 'ghost' });
  const servers = [
    { n: 'S1', d: randInt(10, 60) },
    { n: 'S2', d: randInt(130, 180) },
    { n: 'S3', d: randInt(240, 300) },
  ];
  // One key per 60° sector so they don't pile up; the 180–240 one sits between S2 and S3.
  const keys = [0, 1, 2, 3, 4, 5].map((k) => k * 60 + randInt(8, 50));
  const owner = (d: number, list: typeof servers) => {
    const sorted = [...list].sort((a, b) => a.d - b.d);
    return (sorted.find((sv) => sv.d >= d) ?? sorted[0]).n;
  };
  for (const sv of servers) s.box(sv.n, { ...at(sv.d, R, 48, 34), w: 48, h: 34, label: sv.n, tone: 'accent', mono: false });
  s.say('Spreading data over 3 servers. Plain “hash % 3” would move almost every key when a 4th server is added. Consistent hashing puts servers on a ring (by hashing their names) instead.');
  for (const k of keys) s.box(`k${k}`, { ...at(k, R - 48, 30, 26), w: 30, h: 26, label: '•', tone: 'plain', sub: undefined });
  s.say('Keys are hashed onto the same ring (the dots).');
  const link = (list: typeof servers) => {
    for (const k of keys) s.arrow(`o${k}`, `k${k}`, owner(k, list), { tone: 'dim', bend: 0 });
  };
  link(servers);
  s.say('Each key belongs to the first server clockwise from it. Lookups are a quick search around the ring.');
  const k3 = keys[3];
  const ns = { n: 'S4', d: Math.min(k3 + randInt(6, 20), servers[2].d - 8) };
  s.box(ns.n, { ...at(ns.d, R, 48, 34), w: 48, h: 34, label: ns.n, tone: 'ok', mono: false });
  const before = new Map(keys.map((k) => [k, owner(k, servers)]));
  const all = [...servers, ns];
  const movedKeys = keys.filter((k) => owner(k, all) !== before.get(k));
  s.say(`Add server S4. Where does it land? At the hash of its name, between ${owner(ns.d - 1, servers) === 'S3' ? 'S2 and S3' : 'two servers'}.`);
  link(all);
  for (const k of movedKeys) s.tone(`k${k}`, 'ok');
  s.say(movedKeys.length ? `Only the ${movedKeys.length} key${movedKeys.length > 1 ? 's' : ''} just before S4 on the ring move to it. Every other key stays where it was.` : 'No keys happened to fall in S4\'s stretch of the ring, so nothing moved at all.');
  s.say('Adding or removing a server moves only about 1/n of the keys, not nearly all of them. That\'s why caches and databases spread across many machines use it.');
  return s.build('Consistent hashing: servers on a ring');
};

// =====================================================================
// Counting / lookup with hash maps: Two Sum
// =====================================================================

const hashingPatterns: AnimScript = () => {
  const s = new Stage();
  const n = 6;
  let a: number[];
  let target: number;
  do {
    a = distinctInts(n, 1, 20);
    const i = randInt(1, 3);
    const j = randInt(i + 1, n - 1);
    target = a[i] + a[j];
  } while (a.filter((x, i) => a.slice(i + 1).includes(target - x)).length !== 1 || a.slice(0, 2).some((x, i) => a.slice(i + 1).includes(target - x) && a.indexOf(target - x) < 2));
  slotRow(s, 's', n);
  a.forEach((v, i) => onSlot(s, `v${i}`, v, i));
  s.text('goal', 0, -36, `Two Sum: which two values add up to ${target}?`, { bold: true, size: 'lg' });
  const dx = n * STEP + 50;
  s.box('dict', { x: dx - 10, y: -10, w: 170, h: 6 * 34 + 20, shape: 'frame', label: 'seen: value → index' });
  s.say('Trying every pair is O(n²). Instead, remember every value seen so far in a Dictionary, and for each new value ask: “have I already seen the partner I need?”');
  for (let i = 0; i < n; i++) {
    const need = target - a[i];
    s.tone(`v${i}`, 'hl');
    s.text('calc', 0, H + 44, `${a[i]} needs ${target} − ${a[i]} = ${need}`, { bold: true });
    s.say(`${a[i]}: its partner would be ${need}. Is ${need} in the dictionary? One O(1) lookup.`);
    const j = a.slice(0, i).indexOf(need);
    if (j >= 0) {
      s.tone([`v${i}`, `v${j}`], 'ok');
      s.tone(`d${need}`, 'ok');
      s.say(`Yes! ${need} was seen at index ${j}. Answer: indexes ${j} and ${i} (${need} + ${a[i]} = ${target}). One pass, O(n).`);
      break;
    }
    s.box(`d${a[i]}`, { x: dx, y: i * 34, w: 150, h: 28, label: `${a[i]} → ${i}`, tone: 'accent' });
    s.say(`No. Remember ${a[i]} (at index ${i}) in case a later value needs it.`);
    s.tone(`v${i}`, 'dim');
    s.tone(`d${a[i]}`, 'plain');
  }
  return s.build('Hash map pattern: Two Sum');
};

// =====================================================================
// String search: Rabin–Karp
// =====================================================================

const stringMatching: AnimScript = () => {
  const s = new Stage();
  const alpha = 'abc';
  const m = 3;
  let text: string;
  let pat: string;
  do {
    text = Array.from({ length: 10 }, () => pick(alpha.split(''))).join('');
    const at = randInt(4, 7);
    pat = text.slice(at, at + m);
  } while (text.indexOf(pat) < 3);
  const val = (c: string) => c.charCodeAt(0) - 96;
  const hs = (w: string) => [...w].reduce((a, c) => a + val(c), 0);
  [...text].forEach((c, i) => s.box(`t${i}`, { x: i * STEP, y: 0, w: W, h: H, label: c, sub: String(val(c)) }));
  [...pat].forEach((c, i) => s.box(`p${i}`, { x: i * STEP, y: -90, w: W, h: H, label: c, tone: 'accent', sub: String(val(c)) }));
  const ph = hs(pat);
  s.text('ph', 0, -116, `pattern "${pat}": hash = ${ph}`, { bold: true, tone: 'accent' });
  s.say(`Find "${pat}" in the text. Comparing letter by letter at every position costs up to ${m} checks each. Rabin–Karp compares one number (a hash) instead. Here the hash is simply the sum of letter values (a=1, b=2, c=3).`);
  let h = hs(text.slice(0, m));
  for (let i = 0; i + m <= text.length; i++) {
    if (i > 0) h = h - val(text[i - 1]) + val(text[i + m - 1]);
    s.box('win', { x: i * STEP - 5, y: -8, w: m * STEP + 4, h: H + 30, shape: 'frame', tone: 'accent', label: `window hash = ${h}` });
    [...pat].forEach((_, k) => s.move(`p${k}`, (i + k) * STEP, -90));
    if (h !== ph) {
      s.say(i === 0 ? `First window "${text.slice(0, m)}": hash ${h} ≠ ${ph}. Skip it without comparing letters.` : `Slide: subtract '${text[i - 1]}' (${val(text[i - 1])}), add '${text[i + m - 1]}' (${val(text[i + m - 1])}): ${h}. ≠ ${ph}, skip.`);
      continue;
    }
    const match = text.slice(i, i + m) === pat;
    for (let k = 0; k < m; k++) s.tone(`t${i + k}`, match ? 'ok' : 'bad');
    s.say(`Hash ${h} = ${ph}: maybe a match, so now check the letters. ${match ? `"${text.slice(i, i + m)}" = "${pat}": found at index ${i}!` : `"${text.slice(i, i + m)}" ≠ "${pat}": a false alarm (different letters, same sum). That's why a hash hit is always double-checked.`}`);
    if (match) break;
    for (let k = 0; k < m; k++) s.tone(`t${i + k}`, 'plain');
  }
  s.say('Each slide updates the hash in O(1), so the scan is about O(n). Real Rabin–Karp uses a polynomial hash (like the hash-function lesson), which makes false alarms very rare.');
  return s.build('String search with a rolling hash');
};

// =====================================================================
// DP 1D: climbing stairs
// =====================================================================

const dp1d: AnimScript = () => {
  const s = new Stage();
  const n = randInt(6, 8);
  const w = [1, 1];
  for (let i = 2; i <= n; i++) w[i] = w[i - 1] + w[i - 2];
  slotRow(s, 'd', n + 1, { top: (i) => `ways(${i})`, step: 60, w: 50 });
  s.text('q', 0, -40, `How many ways to climb ${n} stairs, taking 1 or 2 steps at a time?`, { bold: true });
  s.say(`Plain recursion recomputes the same answers again and again (exponential). Dynamic programming fills a table, each answer once, smallest first.`);
  onSlot(s, 'v0', 1, 0, { step: 60, w: 50, tone: 'ok' });
  onSlot(s, 'v1', 1, 1, { step: 60, w: 50, tone: 'ok' });
  s.say('Base cases: 1 way to be at stair 0 (do nothing) and 1 way to reach stair 1 (one step).');
  for (let i = 2; i <= n; i++) {
    s.box(`v${i}`, { x: i * 60, y: 0, w: 50, h: H, label: '?', tone: 'hl' });
    s.arrow('f1', `v${i - 1}`, `v${i}`, { tone: 'accent', bend: 28, label: '+1' });
    s.arrow('f2', `v${i - 2}`, `v${i}`, { tone: 'warn', bend: -40, label: '+2' });
    s.say(`To stand on stair ${i}, your last move came from stair ${i - 1} (a 1-step) or stair ${i - 2} (a 2-step). Both answers are already in the table.`);
    s.box(`v${i}`, { x: i * 60, y: 0, w: 50, h: H, label: String(w[i]), tone: 'ok' });
    s.say(`ways(${i}) = ways(${i - 1}) + ways(${i - 2}) = ${w[i - 1]} + ${w[i - 2]} = ${w[i]}. Looked up, not recomputed.`);
    s.tone(`v${i}`, 'plain');
  }
  s.del('f1', 'f2');
  s.tone(`v${n}`, 'ok');
  s.say(`${w[n]} ways. ${n + 1} cells, each filled once from two earlier cells: O(n), instead of exponential. That's dynamic programming: define the subproblem, find the recurrence, fill the table.`);
  return s.build('1D DP: climbing stairs');
};

// =====================================================================
// DP 2D: grid paths
// =====================================================================

const dp2d: AnimScript = () => {
  const s = new Stage();
  const R = 3;
  const C = randInt(4, 5);
  const t: number[][] = Array.from({ length: R }, () => Array(C).fill(1));
  for (let i = 1; i < R; i++) for (let j = 1; j < C; j++) t[i][j] = t[i - 1][j] + t[i][j - 1];
  const S = 58;
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) s.box(`g${i}_${j}`, { x: j * S, y: i * S, w: 50, h: 50, shape: 'slot' });
  s.text('q', 0, -24, 'Paths from top-left to each cell, moving only right or down', { bold: true });
  s.box('robot', { x: 12, y: 12, w: 26, h: 26, label: '🤖', shape: 'tag' });
  s.say(`A robot moves only right or down on a ${R} × ${C} grid. How many different paths reach the bottom-right? Each cell's answer is built from its neighbours.`);
  s.del('robot');
  for (let j = 0; j < C; j++) s.box(`v0_${j}`, { x: j * S, y: 0, w: 50, h: 50, label: '1', tone: 'ok' });
  for (let i = 1; i < R; i++) s.box(`v${i}_0`, { x: 0, y: i * S, w: 50, h: 50, label: '1', tone: 'ok' });
  s.say('Base cases: along the top row and left column there is only one path (straight right, or straight down).');
  for (let i = 1; i < R; i++)
    for (let j = 1; j < C; j++) {
      s.box(`v${i}_${j}`, { x: j * S, y: i * S, w: 50, h: 50, label: '?', tone: 'hl' });
      s.arrow('fa', `v${i - 1}_${j}`, `v${i}_${j}`, { tone: 'accent' });
      s.arrow('fl', `v${i}_${j - 1}`, `v${i}_${j}`, { tone: 'warn' });
      const first = i === 1 && j === 1;
      s.box(`v${i}_${j}`, { x: j * S, y: i * S, w: 50, h: 50, label: String(t[i][j]), tone: 'ok' });
      s.say(`${first ? 'The last move into a cell came from above or from the left, so ' : ''}paths(${i},${j}) = above + left = ${t[i - 1][j]} + ${t[i][j - 1]} = ${t[i][j]}.`);
      s.tone(`v${i}_${j}`, 'plain');
    }
  s.del('fa', 'fl');
  s.tone(`v${R - 1}_${C - 1}`, 'ok');
  s.say(`${t[R - 1][C - 1]} paths. Filling row by row guarantees the cell above and the cell to the left are ready. Rows × columns cells, O(1) each. Edit distance and longest common subsequence work the same way.`);
  return s.build('2D DP: paths through a grid');
};

export const TIER3_ANIMS: Record<string, AnimScript> = {
  'hash-function': hashFunction,
  'hash-chaining': hashChaining,
  'hash-open-addressing': openAddressing,
  'hash-map': hashMap,
  'cuckoo-hashing': cuckoo,
  'consistent-hashing': consistentHashing,
  'hashing-patterns': hashingPatterns,
  'string-matching': stringMatching,
  'dp-1d': dp1d,
  'dp-2d': dp2d,
};


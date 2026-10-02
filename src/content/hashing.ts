import type { Card, Concept, Scene, Val, View } from '../engine/types';
import { cloneScene } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions, options } from './helpers';

const labels = (m: number) => Array.from({ length: m }, (_, i) => String(i));

// =====================================================================
// Hash function
// =====================================================================

const HF = 'hash-function';

const predictMod = (): Card => {
  const m = pick([7, 8, 10, 11, 13]);
  const k = randInt(20, 999);
  return {
    concept: HF,
    type: 'predict',
    prompt: `A table has ${m} buckets and uses h(k) = k mod ${m}. Which bucket does key ${k} go to?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        k % m,
        [
          { value: Math.floor(k / m), why: 'That’s the quotient. The bucket is the *remainder*.' },
          { value: (k % m) + 1, why: 'Buckets count from 0.' },
          { value: k % 10, why: `That’s the last digit (mod 10). The table has ${m} buckets.` },
        ],
        `${k} mod ${m}`,
      ),
    },
    explain: `${k} = ${Math.floor(k / m)} × ${m} + ${k % m}, so bucket ${k % m}. Any key maps to 0..${m - 1}, a valid array index.`,
  };
};

const ANAGRAMS = [
  ['stop', 'pots', 'tops'],
  ['listen', 'silent', 'enlist'],
  ['evil', 'vile', 'live'],
  ['night', 'thing'],
  ['dusty', 'study'],
];

const predictSumHash = (): Card => {
  const group = pick(ANAGRAMS);
  const [a, b] = shuffle(group).slice(0, 2);
  const others = shuffle(['cat', 'dog', 'bird', 'fish', 'lamp', 'desk']).slice(0, 2);
  return {
    concept: HF,
    type: 'predict',
    prompt: `A lazy string hash: add up the character codes. Which two keys are guaranteed to collide?`,
    body: {
      kind: 'choice',
      options: options({ text: `"${a}" and "${b}"`, why: 'Same letters, different order: same sum.' }, [
        { text: `"${a}" and "${others[0]}"`, why: 'Different letters: the sums will almost certainly differ.' },
        { text: `"${others[0]}" and "${others[1]}"`, why: 'Different letters: different sums.' },
        { text: 'None: every string gets its own number', why: 'Sums ignore order, so rearranged letters collide.' },
      ]),
    },
    explain: 'Adding codes throws away position. Good string hashes mix in position: h = h × 31 + code for each character.',
  };
};

const simulateBuckets = (): Card => {
  const m = pick([5, 7, 8]);
  const keys = distinctInts(4, 10, 99);
  const scene: Scene = { views: [{ type: 'row', key: 'h', items: Array(m).fill(null), labels: labels(m), title: `${m} buckets, h(k) = k mod ${m}` }] };
  const frames = [scene];
  const items: Val[] = Array(m).fill(null);
  keys.forEach((k) => {
    const f = cloneScene(frames[frames.length - 1]);
    items[k % m] = items[k % m] === null ? k : `${items[k % m]},${k}`;
    (f.views[0] as Extract<View, { type: 'row' }>).items = [...items];
    f.highlight = [`h:${k % m}`];
    frames.push(f);
  });
  return {
    concept: HF,
    type: 'simulate',
    prompt: `Hash these keys in order: ${keys.join(', ')}. Click the bucket each one lands in.`,
    scene,
    body: { kind: 'click', expected: keys.map((k) => `h:${k % m}`), frames, wrongHint: (step) => `${keys[step]} mod ${m} = ?` },
    explain: keys.map((k) => `${k} mod ${m} = ${k % m}`).join('\n'),
  };
};

const countCollisions = (): Card => {
  const m = pick([5, 7, 10]);
  const keys = distinctInts(randInt(5, 7), 10, 99);
  const seen = new Set<number>();
  let collisions = 0;
  for (const k of keys) {
    if (seen.has(k % m)) collisions++;
    seen.add(k % m);
  }
  return {
    concept: HF,
    type: 'count',
    prompt: `Insert ${keys.join(', ')} into ${m} buckets with h(k) = k mod ${m}. How many keys land in a bucket that already had something?`,
    body: { kind: 'number', answer: collisions, unit: 'collisions' },
    explain: `Buckets: ${keys.map((k) => `${k}→${k % m}`).join(', ')}. ${collisions} collision${collisions === 1 ? '' : 's'}. Collisions are normal, so tables must handle them.`,
  };
};

const countPigeon = (): Card => {
  const m = randInt(5, 20);
  const n = randInt(m + 1, 3 * m);
  return {
    concept: HF,
    type: 'count',
    prompt: `${n} keys go into ${m} buckets. Whatever the hash function, at least one bucket must hold at least how many keys?`,
    body: { kind: 'number', answer: Math.ceil(n / m), unit: 'keys' },
    explain: `If every bucket held ${Math.ceil(n / m) - 1} or fewer, they'd fit at most ${(Math.ceil(n / m) - 1) * m} < ${n} keys. So some bucket has ≥ ${Math.ceil(n / m)}. Collisions can't be avoided, only spread out.`,
  };
};

const growthHash = (): Card =>
  pick([
    () => growthCard(HF, 'hash an integer key with k mod m, as the table grows', () => 1, 0, 'One division. The table size doesn’t matter.'),
    () => growthCard(HF, 'hash a string of length n', (n) => n, 2, 'A good string hash reads every character.'),
  ])();

const hfExplain = explainGenerators({
  concept: HF,
  truths: [
    'A hash function turns a key into a number used as an array index.',
    'The same key must always produce the same hash.',
    'Different keys can produce the same hash; that’s a collision.',
    'A good hash spreads keys evenly over the buckets.',
    'With more keys than buckets, collisions are guaranteed.',
  ],
  myths: [
    { text: 'A good hash function never produces collisions.', why: 'More possible keys than buckets means collisions must happen.' },
    { text: 'The hash of a key can change between calls.', why: 'Then you’d never find the key again. Hashes must be deterministic.' },
    { text: 'Adding up character codes is a fine string hash.', why: 'Anagrams collide. Position must affect the result.' },
    { text: 'Hashing sorts the keys.', why: 'It scatters them. Order is lost.' },
  ],
  chains: [
    {
      prompt: 'Why does hashing give array-speed lookup for any kind of key?',
      steps: ['Arrays are fast only with integer indexes.', 'A hash function turns any key into an integer.', 'mod m squeezes it into 0..m−1.', 'So the key’s bucket is one calculation and one jump away.'],
    },
  ],
  summary: {
    best: 'A hash function is a recipe that turns any key into a locker number, the same number every time, so you know where to look without searching.',
    others: [
      { text: 'A hash function encrypts data.', why: 'Different purpose. Table hashes are about spreading keys, not secrecy.' },
      { text: 'A hash maps keys to values.', why: 'That’s the hash *table*. The function maps keys to numbers.' },
      { text: 'It’s a one-way function with avalanche properties.', why: 'Jargon.' },
    ],
  },
});

export const hashFunctionConcept: Concept = {
  id: HF,
  title: 'Hash Function',
  tier: 4,
  prereqs: ['static-array', 'string'],
  tagline: 'Turn any key into an array index.',
  hook: {
    problem: 'Arrays find arr[i] instantly, but only for integer i. You want to look up a phone number by *name* just as fast.',
    question: 'How could a name become an array index?',
    options: [
      { text: 'Search the array for the name.', feedback: 'That’s O(n) searching, exactly what we want to avoid.' },
      { text: 'Compute a number from the name’s letters, then take it mod the array size.', good: true, feedback: 'Yes. A hash function: same name → same number → same slot, every time.' },
      { text: 'Give each name the next free slot.', feedback: 'Then how would you know which slot a name got? You’d have to search.' },
    ],
  },
  lens: {
    layout: 'Not a structure itself: a function h(key) → integer, reduced to 0..m−1.',
    invariant: 'Deterministic: equal keys always give equal hashes.',
    payoff: 'Any key becomes an array index in O(1) (O(length) for strings).',
    price: 'Collisions are unavoidable: different keys can share a bucket, so tables need a plan for that.',
  },
  generators: {
    predict: [predictMod, predictSumHash],
    simulate: [simulateBuckets],
    count: [countCollisions, countPigeon, growthHash],
    explain: hfExplain,
  },
};

// =====================================================================
// Hash table: separate chaining
// =====================================================================

const CH = 'hash-chaining';

function chainTable(m: number, keys: number[]): number[][] {
  const b: number[][] = Array.from({ length: m }, () => []);
  keys.forEach((k) => b[k % m].push(k));
  return b;
}

const bucketScene = (b: Val[][], m: number, title?: string): Scene => ({ views: [{ type: 'buckets', key: 'h', buckets: b, labels: labels(m), title: title ?? `${m} buckets, h(k) = k mod ${m}` }] });

const predictChainBucket = (): Card => {
  const m = pick([5, 6, 7]);
  const keys = distinctInts(randInt(6, 8), 10, 99);
  const t = chainTable(m, keys);
  const b = randInt(0, m - 1);
  return {
    concept: CH,
    type: 'predict',
    prompt: `Insert ${keys.join(', ')} into a chained table with ${m} buckets (h = k mod ${m}), appending to each bucket's chain. What's in bucket ${b}, in order?`,
    body: {
      kind: 'choice',
      options: options({ text: t[b].length ? t[b].join(' → ') : '(empty)', why: 'Every key with k mod ' + m + ' = ' + b + ', in insertion order.' }, [
        { text: t[(b + 1) % m].length ? t[(b + 1) % m].join(' → ') : '(empty)', why: `That's bucket ${(b + 1) % m}.` },
        { text: t[b].length > 1 ? [...t[b]].reverse().join(' → ') : keys.slice(0, 2).join(' → '), why: 'Check the order and which keys belong.' },
        { text: keys.filter((k) => k % 10 === b).join(' → ') || '(nothing)', why: 'That uses the last digit, not mod ' + m + '.' },
      ]),
    },
    explain: t.map((c, i) => `bucket ${i}: ${c.join(' → ') || '∅'}`).join('\n'),
  };
};

const predictLoad = (): Card => {
  const m = pick([8, 10, 16, 20]);
  const n = randInt(m, 4 * m);
  return {
    concept: CH,
    type: 'predict',
    prompt: `A chained table has ${m} buckets and ${n} keys, spread evenly by a good hash. About how long is the average chain (the load factor)?`,
    body: {
      kind: 'choice',
      options: options({ text: (n / m).toFixed(2), why: 'Load factor α = n / m.' }, [
        { text: (m / n).toFixed(2), why: 'Upside down: keys per bucket is n / m.' },
        { text: String(n), why: 'Only if everything landed in one bucket, which a good hash avoids.' },
        { text: '1.00', why: 'Only when n = m.' },
      ]),
    },
    explain: `α = ${n} / ${m} = ${(n / m).toFixed(2)}. Lookups cost about 1 + α. Keep α bounded (by growing the table) and lookups stay O(1).`,
  };
};

const simulateChainLookup = (): Card => {
  const m = pick([4, 5]);
  let keys: number[];
  let t: number[][];
  let target: number;
  do {
    keys = distinctInts(randInt(8, 10), 10, 99);
    t = chainTable(m, keys);
    target = pick(keys);
  } while (t[target % m].indexOf(target) < 1);
  const b = target % m;
  const pos = t[b].indexOf(target);
  const scene = bucketScene(t, m);
  const expected = [`h:${b}`, ...Array.from({ length: pos + 1 }, (_, j) => `h:${b}.${j}`)];
  const frames = [scene];
  expected.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: expected.slice(0, i + 1) }));
  return {
    concept: CH,
    type: 'simulate',
    prompt: `Look up ${target}. Click its bucket, then each chain node you compare, until you find it.`,
    scene,
    body: {
      kind: 'click',
      expected,
      frames,
      wrongHint: (step) => (step === 0 ? `Which bucket? ${target} mod ${m}.` : 'Walk the chain in order from its start.'),
    },
    explain: `Bucket ${b}, then ${pos + 1} comparison${pos ? 's' : ''}. Other buckets are never touched. That's the whole speed-up.`,
  };
};

const countChainCompares = (): Card => {
  const m = pick([4, 5, 6]);
  const keys = distinctInts(randInt(7, 10), 10, 99);
  const t = chainTable(m, keys);
  const target = pick(keys);
  return {
    concept: CH,
    type: 'count',
    prompt: `Keys ${keys.join(', ')} were inserted in that order into ${m} chained buckets (h = k mod ${m}, append to chain). How many key comparisons does looking up ${target} take?`,
    body: { kind: 'number', answer: t[target % m].indexOf(target) + 1, unit: 'comparisons' },
    explain: `Bucket ${target % m}: ${t[target % m].join(' → ')}. ${target} is at position ${t[target % m].indexOf(target) + 1}.`,
  };
};

const countWorstChain = (): Card => {
  const n = randInt(10, 200);
  return {
    concept: CH,
    type: 'count',
    prompt: `A terrible hash sends all ${n} keys to the same bucket. Worst case, how many comparisons does a lookup take?`,
    body: { kind: 'number', answer: n, unit: 'comparisons' },
    explain: `One chain of ${n}: you're back to searching a linked list. Hash tables are only as good as their hash function.`,
  };
};

const growthChain = (): Card =>
  pick([
    () => growthCard(CH, 'lookup when the table grows to keep n/m ≤ 1', () => 2, 0, 'Chains stay short on average, whatever n is.'),
    () => growthCard(CH, 'lookup when every key hashes to the same bucket', (n) => n, 2, 'One long chain: linear search.'),
  ])();

const chExplain = explainGenerators({
  concept: CH,
  truths: [
    'Each bucket holds a chain (linked list) of all keys that hash there.',
    'Lookup hashes to one bucket and only walks that bucket’s chain.',
    'Average chain length is the load factor n / m.',
    'Keeping n / m bounded by growing the table keeps operations O(1) on average.',
    'A bad hash that piles keys into one bucket makes lookup O(n).',
  ],
  myths: [
    { text: 'A lookup compares against every key in the table.', why: 'Only the keys in one bucket.' },
    { text: 'Chaining means the table can never get slow.', why: 'Long chains (high load or a bad hash) make it slow.' },
    { text: 'Collisions overwrite the earlier key.', why: 'Chaining keeps both keys in the bucket’s list.' },
  ],
  chains: [
    {
      prompt: 'Why is a chained lookup O(1) on average?',
      steps: ['The hash picks one bucket in O(1).', 'A good hash spreads n keys over m buckets.', 'So each chain holds about n/m keys.', 'If n/m is kept small, walking the chain is a constant amount of work.'],
    },
  ],
  summary: {
    best: 'It’s a row of lockers where each locker can hold a little list; the key’s number picks the locker, and you only search that one list.',
    others: [
      { text: 'A hash table stores key-value pairs.', why: 'What, not how.' },
      { text: 'Chaining resolves collisions using linked lists.', why: 'Correct but misses why it’s fast.' },
      { text: 'A hash table is O(1).', why: 'Only on average, and only with a good hash and bounded load.' },
    ],
  },
});

const chainOps: Concept['playground'] = {
  initial: () => bucketScene(chainTable(5, [12, 27, 33, 40]), 5),
  guide: [
    { do: 'Insert 17.', see: '17 ÷ 5 leaves 2, so it goes in bucket 2. The key itself tells you where it lives: no searching the whole table.' },
    { do: 'Find 27.', see: 'Compute its bucket (27 ÷ 5 leaves 2), then check only that bucket’s short list.' },
    { do: 'Insert 22, then 32.', see: 'They also land in bucket 2 (a “collision”), so that list grows. If one list gets long, lookups there slow down.' },
  ],
  ops: [
    {
      label: 'Insert key',
      inputs: ['key'],
      run: (s, [k]) => {
        const v = s.views[0] as Extract<View, { type: 'buckets' }>;
        const m = v.buckets.length;
        const b = ((k % m) + m) % m;
        if (v.buckets[b].includes(k)) return { error: `${k} is already in bucket ${b}.` };
        const n = cloneScene(s);
        const nv = n.views[0] as typeof v;
        nv.buckets[b] = [...nv.buckets[b], k];
        n.highlight = [`h:${b}`, `h:${b}.${nv.buckets[b].length - 1}`];
        return { scene: n, touches: 1 + v.buckets[b].length + 1, note: `h(${k}) = ${b}. Checked ${v.buckets[b].length} existing key(s) for a duplicate, then appended.` };
      },
    },
    {
      label: 'Find key',
      inputs: ['key'],
      run: (s, [k]) => {
        const v = s.views[0] as Extract<View, { type: 'buckets' }>;
        const m = v.buckets.length;
        const b = ((k % m) + m) % m;
        const i = v.buckets[b].indexOf(k);
        const n = cloneScene(s);
        const steps = i < 0 ? v.buckets[b].length : i + 1;
        n.highlight = [`h:${b}`, ...Array.from({ length: steps }, (_, j) => `h:${b}.${j}`)];
        return { scene: n, touches: 1 + steps, note: i < 0 ? `Bucket ${b}: checked ${steps}, not found.` : `Bucket ${b}: found after ${steps} comparison(s).` };
      },
    },
    {
      label: 'Delete key',
      inputs: ['key'],
      run: (s, [k]) => {
        const v = s.views[0] as Extract<View, { type: 'buckets' }>;
        const m = v.buckets.length;
        const b = ((k % m) + m) % m;
        const i = v.buckets[b].indexOf(k);
        if (i < 0) return { error: `${k} isn't in bucket ${b}.` };
        const n = cloneScene(s);
        (n.views[0] as typeof v).buckets[b].splice(i, 1);
        n.highlight = [`h:${b}`];
        return { scene: n, touches: 1 + i + 1, note: `Found in bucket ${b} after ${i + 1} comparison(s), unlinked it.` };
      },
    },
  ],
};

export const hashChainingConcept: Concept = {
  id: CH,
  title: 'Hash Table: Chaining',
  tier: 4,
  prereqs: [HF, 'linked-list'],
  tagline: 'Each bucket keeps a little list.',
  hook: {
    problem: 'Two keys hash to the same bucket. The array slot can only hold one of them.',
    question: 'Where does the second key go?',
    options: [
      { text: 'Overwrite the first key.', feedback: 'Then the first key is silently lost.' },
      { text: 'Let each bucket hold a small linked list of every key that hashes there.', good: true, feedback: 'Yes: separate chaining. A lookup hashes to one bucket and walks only that short list.' },
      { text: 'Refuse to insert it.', feedback: 'Collisions are guaranteed eventually; refusing isn’t an option.' },
    ],
  },
  lens: {
    layout: 'An array of m buckets; each bucket points to a linked list (chain) of keys.',
    invariant: 'Key k is always in chain h(k) mod m, and nowhere else.',
    payoff: 'Insert, find, delete in O(1) on average when n/m stays bounded.',
    price: 'Pointer-chasing in chains; worst case O(n) with a bad hash; must grow and rehash as n increases.',
  },
  playground: chainOps,
  generators: {
    predict: [predictChainBucket, predictLoad],
    simulate: [simulateChainLookup],
    count: [countChainCompares, countWorstChain, growthChain],
    explain: chExplain,
  },
};

// =====================================================================
// Hash table: open addressing (linear probing)
// =====================================================================

const OA = 'hash-open-addressing';

function probeInsert(table: (number | null)[], k: number): number[] {
  const m = table.length;
  const path: number[] = [];
  for (let i = 0; i < m; i++) {
    const s = (k + i) % m;
    path.push(s);
    if (table[s] === null) {
      table[s] = k;
      return path;
    }
  }
  return path;
}

function probeTable(m: number, keys: number[]) {
  const t: (number | null)[] = Array(m).fill(null);
  keys.forEach((k) => probeInsert(t, k));
  return t;
}

const slotScene = (t: Val[], title: string): Scene => ({ views: [{ type: 'row', key: 's', items: t, labels: labels(t.length), title }] });

/** A table with a guaranteed cluster so probing is interesting. */
function clusteredTable(m: number) {
  for (;;) {
    const keys = distinctInts(randInt(4, 6), 10, 99);
    const t = probeTable(m, keys);
    const k = pick(distinctInts(20, 10, 99).filter((x) => !keys.includes(x)));
    const path = probeInsert([...t], k);
    if (path.length >= 3) return { keys, t, k, path };
  }
}

const predictProbe = (): Card => {
  const m = pick([7, 8, 10]);
  const { t, k, path } = clusteredTable(m);
  const landing = path[path.length - 1];
  return {
    concept: OA,
    type: 'predict',
    prompt: `Linear probing, ${m} slots, h(k) = k mod ${m}. Table: ${t.map((x, i) => `[${i}]=${x ?? '_'}`).join(' ')}.\n\nInsert ${k}. Which slot does it end up in?`,
    scene: slotScene(t, 'Slots'),
    body: {
      kind: 'choice',
      options: numberOptions(
        landing,
        [
          { value: k % m, why: 'That’s its home slot, but it’s taken. Keep stepping right.' },
          { value: (k % m + 1) % m, why: 'Only if that slot were free. Keep going until an empty one.' },
          { value: t.indexOf(null), why: 'The first empty slot *in the whole table* isn’t it. Probing starts at the home slot and wraps.' },
        ],
        'Start at the home slot; step right (wrapping) until empty.',
      ),
    },
    explain: `Home ${k % m}, probed ${path.join(' → ')}. Keys that collide pile up into runs ("clusters"), and clusters make later probes longer.`,
  };
};

const predictTombstone = (): Card => {
  const m = 7;
  const home = randInt(0, 6);
  const [a, b] = distinctInts(2, 1, 13).map((x) => home + m * x);
  return {
    concept: OA,
    type: 'predict',
    prompt: `Linear probing, ${m} slots. ${a} and ${b} both hash to slot ${home}. ${a} was inserted first (slot ${home}), so ${b} probed to slot ${(home + 1) % m}. Now ${a} is deleted by simply emptying slot ${home}. Then we search for ${b}. What happens?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: `The search reports "${b} not found".`, correct: true, why: `Searching stops at an empty slot, and slot ${home} is now empty. The search never reaches slot ${(home + 1) % m}.` },
        { text: `It finds ${b} in slot ${(home + 1) % m}.`, correct: false, why: 'The search stops at the first empty slot, before reaching it.' },
        { text: `It finds ${b} in slot ${home}.`, correct: false, why: `${b} never moved.` },
        { text: 'The table crashes.', correct: false, why: 'It silently gives the wrong answer, which is worse.' },
      ]),
    },
    explain: 'Deleting must leave a "tombstone" marker: searches step over it, and inserts can reuse it. Plain emptying breaks the probe chain.',
  };
};

const simulateProbe = (): Card => {
  const m = pick([7, 8]);
  const { t, k, path } = clusteredTable(m);
  const scene = slotScene(t, `${m} slots, h(k) = k mod ${m}, linear probing`);
  const frames = [scene];
  path.forEach((_, i) => {
    const f = cloneScene(scene);
    if (i === path.length - 1) (f.views[0] as Extract<View, { type: 'row' }>).items[path[i]] = k;
    f.highlight = path.slice(0, i + 1).map((p) => `s:${p}`);
    frames.push(f);
  });
  return {
    concept: OA,
    type: 'simulate',
    prompt: `Insert ${k}. Click every slot you probe, in order, until you place it.`,
    scene,
    body: {
      kind: 'click',
      expected: path.map((p) => `s:${p}`),
      frames,
      wrongHint: (step) => (step === 0 ? `Start at the home slot: ${k} mod ${m}.` : 'Taken. Step one slot right (after the last slot, wrap to 0).'),
    },
    explain: `${path.length} probes: ${path.join(' → ')}. Everything lives in the one array, with no pointers, but clusters make probe runs long.`,
  };
};

const countProbes = (): Card => {
  const m = pick([8, 10]);
  const { t, k, path } = clusteredTable(m);
  return {
    concept: OA,
    type: 'count',
    prompt: `Linear probing, h(k) = k mod ${m}. Table: ${t.map((x, i) => `[${i}]=${x ?? '_'}`).join(' ')}. How many slots are probed (including the final empty one) to insert ${k}?`,
    body: { kind: 'number', answer: path.length, unit: 'probes' },
    explain: `${path.join(' → ')}: ${path.length} probes.`,
  };
};

const growthOA = (): Card =>
  pick([
    () => growthCard(OA, 'insert with the table kept at most half full', () => 2, 0, 'Clusters stay short when there’s plenty of empty space.'),
    () => growthCard(OA, 'search for a missing key in a nearly FULL table of n slots (worst case)', (n) => n, 2, 'A full-ish table makes probe runs as long as the table.'),
  ])();

const oaExplain = explainGenerators({
  concept: OA,
  truths: [
    'Open addressing stores every key directly in the array, with no chains.',
    'On a collision, it probes other slots (e.g. the next one) until it finds an empty slot.',
    'A search stops when it finds the key or hits an empty slot.',
    'Deletion must leave a tombstone so searches don’t stop too early.',
    'Performance drops sharply as the table fills, so it’s kept well below full.',
  ],
  myths: [
    { text: 'You can delete by just emptying the slot.', why: 'That breaks the probe chain for keys that probed past it.' },
    { text: 'Open addressing can store more keys than slots.', why: 'Every key needs its own slot: load factor ≤ 1.' },
    { text: 'Linear probing spreads keys evenly.', why: 'Collisions form clusters that grow and attract more collisions.' },
    { text: 'A search stops at the key’s home slot.', why: 'It continues probing until it finds the key or an empty slot.' },
  ],
  chains: [
    {
      prompt: 'Why does a search stop at an empty slot?',
      steps: ['When the key was inserted, it took the first empty slot on its probe path.', 'So every slot before it on that path was full at the time.', 'An empty slot on the path means the key was never placed beyond it.', 'So the key isn’t in the table.'],
    },
  ],
  summary: {
    best: 'Everyone gets a locker number, and if yours is taken you take the next free one along; searching walks along from your number until it finds you or an empty locker.',
    others: [
      { text: 'Open addressing is collision resolution without chaining.', why: 'Says what it isn’t.' },
      { text: 'It uses probing sequences.', why: 'Jargon without mechanism.' },
      { text: 'It puts collided keys in a separate overflow area.', why: 'Everything stays in the same array.' },
    ],
  },
});

export const hashOpenAddressingConcept: Concept = {
  id: OA,
  title: 'Hash Table: Open Addressing',
  tier: 4,
  prereqs: [HF],
  tagline: 'Taken? Try the next slot.',
  hook: {
    problem: 'Chaining allocates a list node for every key: extra memory and pointer-chasing.',
    question: 'Can colliding keys live in the array itself?',
    options: [
      { text: 'Yes: if the home slot is taken, step to the next slot until one is free.', good: true, feedback: 'That’s linear probing. One flat array, no pointers, and searches walk the same path.' },
      { text: 'Make the array big enough that collisions never happen.', feedback: 'You can’t: collisions are guaranteed eventually.' },
      { text: 'Store two keys per slot.', feedback: 'Then a third collision breaks it. You need a general rule.' },
    ],
  },
  lens: {
    layout: 'One flat array of m slots holding keys directly; empty slots and tombstones are marked.',
    invariant: 'A key sits on its own probe path, with no empty slot between its home and where it is.',
    payoff: 'No pointers, great cache behaviour, O(1) average while the table is kept sparse.',
    price: 'Clustering, tombstones on delete, and speed collapses as the load factor nears 1.',
  },
  generators: {
    predict: [predictProbe, predictTombstone],
    simulate: [simulateProbe],
    count: [countProbes, growthOA],
    explain: oaExplain,
  },
};

// =====================================================================
// Hash set / hash map (+ resizing)
// =====================================================================

const HM = 'hash-map';

const predictRehash = (): Card => {
  const m = pick([4, 5, 6, 8]);
  const k = randInt(20, 99);
  return {
    concept: HM,
    type: 'predict',
    prompt: `A hash map grows from ${m} to ${2 * m} buckets (h = k mod size). Key ${k} was in bucket ${k % m}. Where is it after the resize?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        k % (2 * m),
        [
          { value: k % m === k % (2 * m) ? k % m + m : k % m, why: 'Keys must be re-hashed with the new size. Positions aren’t kept.' },
          { value: 2 * (k % m), why: 'The bucket isn’t doubled: the key is re-hashed.' },
          { value: (k % m) + 1, why: 'Re-hash with the new size.' },
        ],
        `${k} mod ${2 * m}`,
      ),
    },
    explain: `${k} mod ${2 * m} = ${k % (2 * m)}. Every key must be re-hashed on resize, because h depends on the table size.`,
  };
};

const predictMutableKey = (): Card => ({
  concept: HM,
  type: 'predict',
  prompt: 'You put a key object into a hash set. Then you change a field of that object that is used in its hash. Later you ask "does the set contain it?" What happens?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'Probably "no": the new hash points to a different bucket than where it’s stored.', correct: true, why: 'The key sits in the bucket of its OLD hash. The lookup searches the bucket of its NEW hash.' },
      { text: '"Yes": the set tracks changes to its keys.', correct: false, why: 'The set has no idea the object changed.' },
      { text: 'The set automatically moves it to the right bucket.', correct: false, why: 'Nothing notifies the set.' },
      { text: 'It throws an error when you change the field.', correct: false, why: 'Usually nothing warns you. It just silently breaks.' },
    ]),
  },
  explain: 'Keys must not change while they’re in a hash map/set. That’s why strings (immutable) make great keys.',
});

const predictMapUse = (): Card => {
  const words = shuffle(['red', 'blue', 'red', 'green', 'blue', 'red', 'green', 'red']).slice(0, randInt(6, 8));
  const counts = new Map<string, number>();
  words.forEach((w) => counts.set(w, (counts.get(w) ?? 0) + 1));
  const w = pick([...counts.keys()]);
  return {
    concept: HM,
    type: 'predict',
    prompt: `Counting words with a hash map: for each word, map[word] = map[word] + 1 (starting at 0). Words: ${words.join(', ')}. What's map["${w}"] at the end?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        counts.get(w)!,
        [
          { value: counts.get(w)! + 1, why: 'Off by one: count each occurrence once.' },
          { value: counts.size, why: 'That’s how many distinct words there are.' },
          { value: 1, why: 'A map keeps one entry per key, but its value accumulates.' },
        ],
        'One entry per word; the value counts occurrences.',
      ),
    },
    explain: `Each "${w}" hashes to the same entry and bumps it: ${counts.get(w)}. The whole count is O(n): one O(1) map update per word.`,
  };
};

const simulateRehash = (): Card => {
  const m = 4;
  const keys = distinctInts(4, 10, 99);
  const old = chainTable(m, keys);
  const scene: Scene = {
    views: [
      { type: 'buckets', key: 'o', buckets: old, labels: labels(m), title: `Old table (${m} buckets)` },
      { type: 'row', key: 'n', items: Array(2 * m).fill(null), labels: labels(2 * m), title: `New table (${2 * m} buckets): click where each key goes` },
    ],
  };
  const order = old.flat();
  const frames = [scene];
  const items: Val[] = Array(2 * m).fill(null);
  order.forEach((k) => {
    const f = cloneScene(frames[frames.length - 1]);
    const b = k % (2 * m);
    items[b] = items[b] === null ? k : `${items[b]},${k}`;
    (f.views[1] as Extract<View, { type: 'row' }>).items = [...items];
    f.highlight = [`n:${b}`];
    frames.push(f);
  });
  return {
    concept: HM,
    type: 'simulate',
    prompt: `Resize: move every key into the new ${2 * m}-bucket table. Take them bucket by bucket from the old table (${order.join(', ')}) and click each one's new bucket.`,
    scene,
    body: { kind: 'click', expected: order.map((k) => `n:${k % (2 * m)}`), frames, wrongHint: (step) => `${order[step]} mod ${2 * m} = ?` },
    explain: `Every key is re-hashed with the new size. ${order.length} moves: O(n) once, but doubling makes it rare (just like a dynamic array).`,
  };
};

const countRehash = (): Card => {
  const n = randInt(10, 500);
  return {
    concept: HM,
    type: 'count',
    prompt: `A hash map with ${n} keys doubles its bucket count. How many keys must be re-inserted?`,
    body: { kind: 'number', answer: n, unit: 'keys' },
    explain: `All ${n}. Every key's bucket depends on the table size. Doubling makes these O(n) resizes rare, so inserts are still O(1) amortized.`,
  };
};

const growthHM = (): Card => growthCard(HM, 'average cost per insert over n inserts (doubling resize)', (n) => Math.round((1 + (2 * n - 1) / n) * 100) / 100, 0, 'Resizes are rare and paid off by the cheap inserts between them: amortized O(1).');

const hmExplain = explainGenerators({
  concept: HM,
  truths: [
    'A hash map stores key → value pairs; a hash set stores just keys.',
    'Insert, lookup and delete are O(1) on average.',
    'When the load factor gets too high, the table doubles and every key is re-hashed.',
    'Keys must not change while stored, or they end up in the wrong bucket.',
    'Hash maps don’t keep keys sorted.',
  ],
  myths: [
    { text: 'On resize, keys keep their old bucket numbers.', why: 'Bucket = hash mod size, and the size changed.' },
    { text: 'A hash map keeps keys in sorted order.', why: 'Hashing scatters keys; order is arbitrary.' },
    { text: 'You can safely change a key after inserting it.', why: 'Its hash changes, so lookups search the wrong bucket.' },
    { text: 'Every insert may trigger an O(n) resize, so inserts are O(n).', why: 'Doubling makes resizes rare: amortized O(1).' },
  ],
  chains: [
    {
      prompt: 'Why must every key be re-hashed when the table grows?',
      steps: ['A key’s bucket is hash(key) mod table size.', 'The table size changes.', 'So the mod result changes for most keys.', 'Each key must be placed in its new bucket.'],
    },
  ],
  summary: {
    best: 'A hash map is a super-fast dictionary: the key’s hash says exactly which drawer its value is in, and the cabinet doubles in size when drawers get crowded.',
    others: [
      { text: 'A hash map is a dictionary data type.', why: 'Names it, doesn’t explain it.' },
      { text: 'It’s an O(1) lookup table.', why: 'Only on average, and no mechanism.' },
      { text: 'It stores items in sorted buckets.', why: 'No sorting happens.' },
    ],
  },
});

export const hashMapConcept: Concept = {
  id: HM,
  title: 'Hash Set / Hash Map',
  tier: 4,
  prereqs: [CH],
  tagline: 'Key → value in O(1), growing as needed.',
  hook: {
    problem: 'A chained table with a fixed 16 buckets works great for 16 keys. With a million keys, chains average 62,500 long.',
    question: 'How do you keep lookups fast as the data grows?',
    options: [
      { text: 'When keys per bucket gets too high, double the buckets and re-hash everything.', good: true, feedback: 'Yes. Exactly the dynamic-array trick: rare O(n) resizes, O(1) amortized.' },
      { text: 'Make the chains sorted.', feedback: 'Helps a little, but chains still grow with n.' },
      { text: 'Start with a billion buckets.', feedback: 'Huge waste for small maps.' },
    ],
  },
  lens: {
    layout: 'A hash table (chaining or open addressing) plus a load-factor threshold. A map stores a value alongside each key.',
    invariant: 'Each key appears at most once, in the place its hash says; load factor stays below the threshold.',
    payoff: 'O(1) average insert/lookup/delete by key, for any hashable key.',
    price: 'No ordering, occasional O(n) resizes, extra memory, and keys must stay unchanged.',
  },
  generators: {
    predict: [predictRehash, predictMutableKey, predictMapUse],
    simulate: [simulateRehash],
    count: [countRehash, growthHM],
    explain: hmExplain,
  },
};

// =====================================================================
// Cuckoo hashing
// =====================================================================

const CK = 'cuckoo-hashing';
const CM = 7;
const h1 = (k: number) => k % CM;
const h2 = (k: number) => Math.floor(k / CM) % CM;

/** Insert with kicks. Returns placements [(table, slot)] in order, or null if it loops too long. */
function cuckooInsert(t: (number | null)[][], k: number, maxKicks = 8): { table: number; slot: number; key: number }[] | null {
  const steps: { table: number; slot: number; key: number }[] = [];
  let key = k;
  let side = 0;
  for (let i = 0; i < maxKicks; i++) {
    const slot = side === 0 ? h1(key) : h2(key);
    const evicted = t[side][slot];
    t[side][slot] = key;
    steps.push({ table: side, slot, key });
    if (evicted === null) return steps;
    key = evicted;
    side = 1 - side;
  }
  return null;
}

function cuckooSetup(minKicks: number) {
  for (;;) {
    const t: (number | null)[][] = [Array(CM).fill(null), Array(CM).fill(null)];
    const keys = distinctInts(randInt(4, 6), 10, 99);
    if (keys.some((k) => !cuckooInsert(t, k))) continue;
    const k = pick(distinctInts(20, 10, 99).filter((x) => !keys.includes(x)));
    const copy = t.map((r) => [...r]);
    const steps = cuckooInsert(copy, k, 6);
    if (steps && steps.length >= minKicks + 1) return { t, k, steps, after: copy };
  }
}

const cuckooScene = (t: (number | null)[][]): Scene => ({
  views: [
    { type: 'row', key: 'a', items: t[0], labels: labels(CM), title: `Table 1: h1(k) = k mod ${CM}` },
    { type: 'row', key: 'b', items: t[1], labels: labels(CM), title: `Table 2: h2(k) = (k ÷ ${CM}) mod ${CM}` },
  ],
});

const predictCuckooLookup = (): Card => ({
  concept: CK,
  type: 'predict',
  prompt: 'In cuckoo hashing with two tables, what’s the MOST number of slots a lookup ever needs to check, however full the table is?',
  body: {
    kind: 'choice',
    options: options({ text: '2', why: 'A key can only ever be at T1[h1(k)] or T2[h2(k)].' }, [
      { text: '1', why: 'The key might be in its second table.' },
      { text: 'It depends on the load factor', why: 'That’s true for chaining and probing, not for cuckoo lookups.' },
      { text: 'log n', why: 'No tree here: exactly two fixed spots.' },
    ]),
  },
  explain: 'Two possible homes, so two checks, worst case. The cost is moved to inserts, which may have to kick keys around.',
});

const predictKick = (): Card => {
  const { t, k, steps } = cuckooSetup(1);
  const evicted = t[0][h1(k)]!;
  return {
    concept: CK,
    type: 'predict',
    prompt: `Insert ${k}: its Table 1 slot h1(${k}) = ${h1(k)} is taken by ${evicted}. ${k} takes the slot and kicks ${evicted} out. Where does ${evicted} try to go?`,
    scene: cuckooScene(t),
    body: {
      kind: 'choice',
      options: options({ text: `Table 2, slot ${h2(evicted)}`, why: `Its other home: h2(${evicted}) = ${h2(evicted)}.` }, [
        { text: `Table 1, slot ${(h1(k) + 1) % CM}`, why: 'Cuckoo doesn’t probe neighbours; a key only has its two homes.' },
        { text: `Table 2, slot ${h2(k)}`, why: `That’s ${k}'s second home, not ${evicted}'s.` },
        { text: 'It is discarded', why: 'Nothing is ever dropped. It moves to its other home.' },
      ]),
    },
    explain: `The kicked key goes to its alternative home. That may kick another key, and so on: ${steps.map((s) => `${s.key}→T${s.table + 1}[${s.slot}]`).join(', ')}.`,
  };
};

const simulateCuckoo = (): Card => {
  const { t, k, steps } = cuckooSetup(1);
  const scene = cuckooScene(t);
  const frames = [scene];
  const cur = t.map((r) => [...r]);
  steps.forEach((s) => {
    cur[s.table][s.slot] = s.key;
    frames.push({ ...cuckooScene(cur.map((r) => [...r])), highlight: [`${s.table ? 'b' : 'a'}:${s.slot}`] });
  });
  return {
    concept: CK,
    type: 'simulate',
    prompt: `Insert ${k}. Click each slot where a key gets placed, in order: ${k} goes into Table 1 first; any key it kicks out goes to its home in the other table, and so on.`,
    scene,
    body: {
      kind: 'click',
      expected: steps.map((s) => `${s.table ? 'b' : 'a'}:${s.slot}`),
      frames,
      wrongHint: (step) => {
        const s = steps[step];
        return step === 0 ? `Start in Table 1 at h1(${k}) = ${h1(k)}.` : `${s.key} was kicked out, so it goes to its home in Table ${s.table + 1}: slot ${s.slot}.`;
      },
    },
    explain: `Placements: ${steps.map((s) => `${s.key}→T${s.table + 1}[${s.slot}]`).join(', ')}. If kicks ever loop, the table is rebuilt with new hash functions.`,
  };
};

const countKicks = (): Card => {
  const { t, k, steps } = cuckooSetup(1);
  return {
    concept: CK,
    type: 'count',
    prompt: `Using the two tables shown (h1 = k mod ${CM}, h2 = (k ÷ ${CM}) mod ${CM}), insert ${k}. How many existing keys get kicked out of their slot?`,
    scene: cuckooScene(t),
    body: { kind: 'number', answer: steps.length - 1, unit: 'kicks' },
    explain: `${steps.map((s) => `${s.key}→T${s.table + 1}[${s.slot}]`).join(', ')}: ${steps.length - 1} kick${steps.length === 2 ? '' : 's'}.`,
  };
};

const growthCK = (): Card => growthCard(CK, 'worst-case lookup in a cuckoo table', () => 2, 0, 'Always exactly two candidate slots.');

const ckExplain = explainGenerators({
  concept: CK,
  truths: [
    'Every key has exactly two possible homes, one in each table.',
    'A lookup checks at most two slots, so it is O(1) in the worst case.',
    'Inserting into a taken slot kicks the old key to its other home.',
    'Kicks can chain; if they loop, the table is rebuilt with new hash functions.',
  ],
  myths: [
    { text: 'Cuckoo lookups probe neighbouring slots like linear probing.', why: 'Only the two fixed homes are ever checked.' },
    { text: 'A kicked-out key is thrown away.', why: 'It moves to its alternative home.' },
    { text: 'Cuckoo inserts are always O(1).', why: 'Kick chains and occasional rebuilds make inserts expected (not guaranteed) O(1).' },
  ],
  chains: [
    {
      prompt: 'Why is a cuckoo lookup O(1) even in the worst case?',
      steps: ['Inserts guarantee every key sits in one of its two homes.', 'Each home is one hash calculation away.', 'So a lookup checks two slots at most.', 'No chains or probe runs can grow.'],
    },
  ],
  summary: {
    best: 'Every key has two possible seats; if yours is taken you push the sitter to their other seat, so finding anyone means checking just two seats.',
    others: [
      { text: 'Cuckoo hashing uses two hash functions.', why: 'What, not why it helps.' },
      { text: 'It’s named after a bird.', why: 'True! But explains nothing about the structure.' },
      { text: 'It’s a faster hash table.', why: 'Faster lookups, but pricier inserts.' },
    ],
  },
});

export const cuckooConcept: Concept = {
  id: CK,
  title: 'Cuckoo Hashing',
  tier: 4,
  prereqs: [OA],
  tagline: 'Two possible homes. Lookups check two slots, ever.',
  hook: {
    problem: 'Chaining and probing are O(1) only on average: an unlucky cluster or long chain can make a lookup slow. Some systems need a guaranteed-fast lookup every time.',
    question: 'How could you guarantee a lookup never checks more than a couple of slots?',
    options: [
      { text: 'Give each key two possible homes, and move keys around at insert time so each one is always in one of them.', good: true, feedback: 'Yes. Lookup checks two slots, period. Inserts do the hard work by kicking keys to their other home.' },
      { text: 'Use a bigger table.', feedback: 'Helps on average; still no guarantee.' },
      { text: 'Sort each chain.', feedback: 'Chains can still be long.' },
    ],
  },
  lens: {
    layout: 'Two arrays (tables) and two hash functions; each key lives at T1[h1(k)] or T2[h2(k)].',
    invariant: 'Every stored key is in one of its two homes.',
    payoff: 'Worst-case O(1) lookup and delete (two checks).',
    price: 'Inserts may cause kick chains and occasional full rebuilds; the load factor must stay under ~50%.',
  },
  generators: {
    predict: [predictCuckooLookup, predictKick],
    simulate: [simulateCuckoo],
    count: [countKicks, growthCK],
    explain: ckExplain,
  },
};

// =====================================================================
// Consistent hashing
// =====================================================================

const CON = 'consistent-hashing';

function ringSetup() {
  const servers = distinctInts(randInt(3, 4), 0, 99).sort((a, b) => a - b);
  const names = ['A', 'B', 'C', 'D'].slice(0, servers.length);
  const owner = (p: number) => {
    const i = servers.findIndex((s) => s >= p);
    return i === -1 ? 0 : i;
  };
  return { servers, names, owner };
}

const serverScene = (servers: number[], names: string[]): Scene => ({
  views: [{ type: 'row', key: 's', items: names.map((n, i) => `${n}@${servers[i]}`), labels: names.map(() => ''), title: 'Servers on a ring of positions 0–99 (after 99 comes 0)' }],
});

const predictOwner = (): Card => {
  const { servers, names, owner } = ringSetup();
  const p = randInt(0, 99);
  const o = owner(p);
  const ccw = servers.map((s, i) => [s, i]).filter(([s]) => s <= p).pop()?.[1] ?? servers.length - 1;
  return {
    concept: CON,
    type: 'predict',
    prompt: `Servers sit on a ring at positions ${names.map((n, i) => `${n}=${servers[i]}`).join(', ')}. A key hashes to position ${p}. It belongs to the first server clockwise (at or after ${p}, wrapping past 99 to 0). Which server?`,
    body: {
      kind: 'choice',
      options: options({ text: names[o], why: `First server at or after ${p}${servers.every((s) => s < p) ? ', wrapping around to the start' : ''}.` }, [
        { text: names[ccw], why: 'That’s the server *before* the key (counter-clockwise).' },
        ...names.filter((_, i) => i !== o && i !== ccw).map((n) => ({ text: n, why: 'Walk clockwise from the key’s position.' })),
      ]),
    },
    explain: `Position ${p} → ${names[o]} (at ${servers[o]}). Each server owns the arc just before it.`,
  };
};

const predictRemove = (): Card => {
  const { servers, names } = ringSetup();
  const r = randInt(0, servers.length - 1);
  const next = names[(r + 1) % servers.length];
  return {
    concept: CON,
    type: 'predict',
    prompt: `Servers on the ring: ${names.map((n, i) => `${n}=${servers[i]}`).join(', ')}. Server ${names[r]} crashes and is removed. Which keys move to a different server?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: `Only ${names[r]}'s keys, and they all go to ${next}.`, correct: true, why: `${names[r]}'s arc now belongs to the next server clockwise, ${next}. Nothing else changes.` },
        { text: 'Almost all keys get reshuffled.', correct: false, why: 'That’s what hash mod N does. The ring only affects the removed server’s arc.' },
        { text: `${names[r]}'s keys are spread evenly across all other servers.`, correct: false, why: 'They all go to the single next server clockwise (virtual nodes spread them further).' },
        { text: 'No keys move; they are lost.', correct: false, why: 'They are re-homed to the next server.' },
      ]),
    },
    explain: 'Removing (or adding) a server only moves the keys in its arc, about 1/N of them. With hash mod N, changing N moves almost everything.',
  };
};

const simulateAssign = (): Card => {
  const { servers, names, owner } = ringSetup();
  const keys = distinctInts(4, 0, 99);
  const scene = serverScene(servers, names);
  const expected = keys.map((p) => `s:${owner(p)}`);
  const frames = [scene];
  expected.forEach((e) => frames.push({ ...cloneScene(scene), highlight: [e] }));
  return {
    concept: CON,
    type: 'simulate',
    prompt: `Keys hash to positions ${keys.join(', ')}. For each (in order), click the server that owns it: the first server clockwise at or after the key's position.`,
    scene,
    body: {
      kind: 'click',
      expected,
      frames,
      wrongHint: (step) => `Position ${keys[step]}: find the first server position ≥ ${keys[step]}. If none, wrap to the smallest.`,
    },
    explain: keys.map((p) => `${p} → ${names[owner(p)]}`).join('\n'),
  };
};

const countModMoves = (): Card => {
  const n = randInt(3, 5);
  const keys = distinctInts(8, 10, 99);
  const moved = keys.filter((k) => k % n !== k % (n + 1)).length;
  return {
    concept: CON,
    type: 'count',
    prompt: `Old-style sharding: server = key mod N. Keys: ${keys.join(', ')}. You go from ${n} to ${n + 1} servers. How many of these 8 keys change server?`,
    body: { kind: 'number', answer: moved, unit: 'keys' },
    explain: `${keys.map((k) => `${k}: ${k % n}→${k % (n + 1)}`).join(', ')}. ${moved} of 8 moved. Mod-N reshuffles most keys; the ring moves only about 1/N.`,
  };
};

const countRingMoves = (): Card => {
  const { servers, names, owner } = ringSetup();
  const keys = distinctInts(8, 0, 99);
  const r = randInt(0, servers.length - 1);
  const moved = keys.filter((p) => owner(p) === r).length;
  return {
    concept: CON,
    type: 'count',
    prompt: `Ring servers: ${names.map((n, i) => `${n}=${servers[i]}`).join(', ')}. Keys at positions ${keys.join(', ')}. If ${names[r]} is removed, how many of these keys move?`,
    body: { kind: 'number', answer: moved, unit: 'keys' },
    explain: `Only the keys ${names[r]} owned: ${keys.filter((p) => owner(p) === r).join(', ') || 'none'}. Everyone else stays put.`,
  };
};

const conExplain = explainGenerators({
  concept: CON,
  truths: [
    'Servers and keys are hashed onto the same ring of positions.',
    'A key belongs to the first server clockwise from its position.',
    'Adding or removing a server only moves the keys in that server’s arc.',
    'With hash mod N, changing N moves most keys; the ring moves about 1/N.',
    'Virtual nodes (several positions per server) even out the arcs.',
  ],
  myths: [
    { text: 'When a server leaves, all keys are reshuffled.', why: 'Only the leaving server’s keys move.' },
    { text: 'Consistent hashing means the hash never changes.', why: 'Hashes are always deterministic; “consistent” is about stable assignment as servers change.' },
    { text: 'Each server gets exactly equal load automatically.', why: 'Arcs can be uneven; virtual nodes help balance them.' },
  ],
  chains: [
    {
      prompt: 'Why does removing a server move so few keys?',
      steps: ['Each key belongs to the next server clockwise.', 'Removing a server only changes “next server” for keys in its arc.', 'Those keys now go to the following server.', 'Keys in every other arc keep their owner.'],
    },
  ],
  summary: {
    best: 'Put servers and keys on the same clock face; each key goes to the next server clockwise, so when a server leaves, only its own keys walk to the next one.',
    others: [
      { text: 'It’s a hash function that is consistent.', why: 'Misleading: it’s about assigning keys to servers.' },
      { text: 'It’s used in distributed caches.', why: 'A use, not a mechanism.' },
      { text: 'It distributes keys evenly with mod N.', why: 'mod N is exactly what it replaces.' },
    ],
  },
});

export const consistentHashingConcept: Concept = {
  id: CON,
  title: 'Consistent Hashing',
  tier: 4,
  prereqs: [HM],
  tagline: 'A ring where servers can come and go.',
  hook: {
    problem: 'A cache spreads keys over N servers with server = hash(key) mod N. One server dies; now it’s mod (N−1), and almost every key maps to a different server. The whole cache goes cold.',
    question: 'How could you add or remove servers and only move a few keys?',
    options: [
      { text: 'Put servers and keys on a circle of positions; each key goes to the next server clockwise.', good: true, feedback: 'Yes. A server leaving only affects the keys in its own arc.' },
      { text: 'Never remove servers.', feedback: 'Servers fail. The design has to cope.' },
      { text: 'Use a bigger N from the start.', feedback: 'Changing N still reshuffles almost everything.' },
    ],
  },
  lens: {
    layout: 'A sorted list of server positions on a ring (0..max, wrapping); keys hash to positions on the same ring.',
    invariant: 'Each key belongs to the first server clockwise from its position.',
    payoff: 'Adding/removing a server moves only ~1/N of the keys.',
    price: 'Arcs can be uneven (fixed with virtual nodes); finding the owner needs a search over positions (O(log N) with binary search).',
  },
  generators: {
    predict: [predictOwner, predictRemove],
    simulate: [simulateAssign],
    count: [countModMoves, countRingMoves],
    explain: conExplain,
  },
};

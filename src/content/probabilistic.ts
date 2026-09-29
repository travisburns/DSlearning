import type { Card, Concept, Scene, Val } from '../engine/types';
import { cloneScene } from '../engine/memory';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions } from './helpers';

// =====================================================================
// Skip list
// =====================================================================

const SK = 'skip-list';

/** keys sorted; levels[i] = how many levels key i reaches (≥ 1). */
function randomSkip() {
  const keys = distinctInts(randInt(7, 9), 1, 99).sort((a, b) => a - b);
  const levels = keys.map(() => {
    let l = 1;
    while (l < 4 && Math.random() < 0.5) l++;
    return l;
  });
  return { keys, levels, top: Math.max(...levels) };
}
/** Grid: row 0 = top level; column 0 = head (−∞). */
function skipScene(keys: number[], levels: number[], top: number): Scene {
  const rows: Val[][] = [];
  for (let L = top; L >= 1; L--) rows.push(['−∞', ...keys.map((k, i) => (levels[i] >= L ? k : null))]);
  return { views: [{ type: 'grid', key: 'k', rows, rowLabels: rows.map((_, r) => `level ${top - r}`), colLabels: ['head', ...keys.map(() => '')], title: 'Skip list: each level skips over more of the list below' }] };
}
/** Search path as grid cells [row, col]. Moves right while the next key at this level ≤ target, else drops down. */
function skipPath(keys: number[], levels: number[], top: number, target: number): [number, number][] {
  const path: [number, number][] = [];
  let col = 0; // 0 = head, i + 1 = key i
  for (let L = top; L >= 1; L--) {
    const row = top - L;
    path.push([row, col]);
    for (;;) {
      let next = -1;
      for (let i = col; i < keys.length; i++)
        if (levels[i] >= L) {
          next = i;
          break;
        }
      if (next < 0 || keys[next] > target) break;
      col = next + 1;
      path.push([row, col]);
      if (keys[next] === target) return path;
    }
  }
  return path;
}

const predictSkipLevels = (): Card => {
  const n = pick([16, 64, 1024, 1_000_000]);
  const k = randInt(1, 4);
  return {
    concept: SK,
    type: 'predict',
    prompt: `Each node is promoted to the next level up with probability ½ (coin flip). Out of ${n.toLocaleString()} nodes, about how many reach level ${k + 1} or higher (level 1 = everyone)?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        n / 2 ** k,
        [
          { value: n / (k + 1), why: 'Each level halves: it’s a power of ½, not 1/(k+1).' },
          { value: n / 2, why: `That’s level 2. Level ${k + 1} needs ${k} successful flips in a row.` },
          { value: n - k, why: 'Promotion is multiplicative, not subtractive.' },
        ].filter((x) => Number.isInteger(x.value)),
        `${k} heads in a row: (½)^${k}.`,
      ),
    },
    explain: `n × (½)^${k} = ${(n / 2 ** k).toLocaleString()}. Each level has half as many nodes, so there are about log₂ n levels, just like a balanced tree.`,
  };
};

const simulateSkip = (): Card => {
  let s: ReturnType<typeof randomSkip>;
  let target: number;
  let path: [number, number][];
  do {
    s = randomSkip();
    target = pick(s.keys);
    path = skipPath(s.keys, s.levels, s.top, target);
  } while (path.length < 4 || s.top < 2);
  const scene = skipScene(s.keys, s.levels, s.top);
  const exp = path.map(([r, c]) => `k:${r},${c}`);
  const frames = [scene];
  exp.forEach((_, i) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, i + 1) }));
  return {
    concept: SK,
    type: 'simulate',
    prompt: `Search for ${target}. Start at the top-left head. Rule: move RIGHT if the next node on this level is ≤ ${target}; otherwise drop DOWN a level. Click every cell you land on, including the start.`,
    scene,
    body: {
      kind: 'click',
      expected: exp,
      frames,
      wrongHint: (step) => (step === 0 ? 'Start at the head on the top level.' : `Look at the next node to the right on this level: is it ≤ ${target}? If so move right; if not (or none), go down.`),
    },
    explain: `${path.length} cells. High levels skip far ahead; lower levels refine. Expected O(log n), with no rebalancing ever.`,
  };
};

const orderSkipInsert = (): Card => ({
  concept: SK,
  type: 'simulate',
  prompt: 'Insert key x into a skip list. Put the steps in order.',
  body: {
    kind: 'order',
    steps: [
      'Search for x, remembering the last node visited on each level.',
      'Flip coins to choose x’s height (keep going while heads).',
      'On each level up to that height, splice x in after the remembered node.',
    ],
  },
  explain: 'The remembered nodes are exactly the predecessors on each level. Splicing is linked-list insertion, once per level.',
});

const countSkipNodes = (): Card => {
  const s = randomSkip();
  const total = s.levels.reduce((a, b) => a + b, 0);
  return {
    concept: SK,
    type: 'count',
    prompt: `How many node entries (across all levels, excluding the head column) does this skip list store?`,
    scene: skipScene(s.keys, s.levels, s.top),
    body: { kind: 'number', answer: total, unit: 'entries' },
    explain: `${total} for ${s.keys.length} keys. On average 2 per key (1 + ½ + ¼ + …), so memory is still O(n).`,
  };
};

const growthSkip = (): Card => growthCard(SK, 'expected search steps in a skip list', (n) => Math.round(2 * Math.log2(n)), 1, 'About log₂ n levels, a couple of steps per level.');

const skExplain = explainGenerators({
  concept: SK,
  truths: [
    'A skip list is a sorted linked list with extra “express lanes” above it.',
    'Each node is promoted to the next level with probability ½.',
    'Search moves right while the next key is ≤ the target, and drops down otherwise.',
    'Expected search, insert and delete are O(log n), with no rotations or rebalancing.',
    'On average each key uses about 2 nodes.',
  ],
  myths: [
    { text: 'Skip lists guarantee O(log n) in the worst case.', why: 'It’s expected; unlucky coin flips can make it slower.' },
    { text: 'Every level holds every key.', why: 'Each level holds about half of the one below.' },
    { text: 'Skip lists need to be rebalanced after inserts.', why: 'Randomness replaces rebalancing.' },
  ],
  chains: [
    {
      prompt: 'Why is skip-list search O(log n) on average?',
      steps: ['Each level has about half the nodes of the level below.', 'So there are about log₂ n levels.', 'On each level you only take a few steps before dropping down.', 'Total ≈ a constant times log n.'],
    },
  ],
  summary: {
    best: 'A skip list is a sorted list with express trains on top: ride the fastest line as far as you can, then change to a slower one near your stop.',
    others: [
      { text: 'A skip list is a list that skips.', why: 'Restates the name.' },
      { text: 'It’s a probabilistic balanced tree.', why: 'It’s lists, and that hides the mechanism.' },
      { text: 'It’s a faster linked list.', why: 'Only for sorted search, thanks to extra levels.' },
    ],
  },
});

export const skipListConcept: Concept = {
  id: SK,
  title: 'Skip List',
  tier: 9,
  prereqs: ['linked-list'],
  tagline: 'A sorted list with express lanes, built by coin flips.',
  hook: {
    problem: 'A sorted linked list inserts easily but searching is O(n): you can’t binary-search a list. Balanced trees fix that with complicated rotations.',
    question: 'How could a linked list support fast search without rotations?',
    options: [
      { text: 'Add upper levels that skip ahead, choosing which nodes appear up there by coin flip.', good: true, feedback: 'Yes: a skip list. Randomness gives log n levels on average, no rebalancing.' },
      { text: 'Keep a pointer to the middle node.', feedback: 'That helps once; you need middles of middles too.' },
      { text: 'Convert it to an array before each search.', feedback: 'That’s O(n) each time.' },
    ],
  },
  lens: {
    layout: 'Several linked lists stacked: level 1 has all keys; each higher level has a random ~half of the level below.',
    invariant: 'Every level is sorted; a key present on level L is present on all levels below.',
    payoff: 'Expected O(log n) search/insert/delete; simple code; easy to make concurrent.',
    price: 'Only probabilistic guarantees; extra pointers per node.',
  },
  generators: {
    predict: [predictSkipLevels],
    simulate: [simulateSkip, orderSkipInsert],
    count: [countSkipNodes, growthSkip],
    explain: skExplain,
  },
};

// =====================================================================
// Bloom filter
// =====================================================================

const BF = 'bloom-filter';
const M = 12;
const hs = [(x: number) => x % M, (x: number) => (x * 7 + 3) % M, (x: number) => Math.floor(x / 3) % M];

function bloom(items: number[], k = 2) {
  const bits = Array(M).fill(0);
  items.forEach((x) => hs.slice(0, k).forEach((h) => (bits[h(x)] = 1)));
  return bits;
}
const bloomScene = (bits: number[]): Scene => ({ views: [{ type: 'row', key: 'b', items: bits, title: `${M} bits; h1(x) = x mod ${M}, h2(x) = (7x + 3) mod ${M}` }] });

const predictBloomQuery = (): Card => {
  for (;;) {
    const items = distinctInts(randInt(3, 4), 10, 99);
    const bits = bloom(items);
    const y = randInt(10, 99);
    if (items.includes(y)) continue;
    const maybe = hs.slice(0, 2).every((h) => bits[h(y)] === 1);
    if (!maybe && Math.random() < 0.5) continue; // bias towards the interesting false-positive case
    return {
      concept: BF,
      type: 'predict',
      prompt: `The filter holds ${items.join(', ')}. Query ${y}: h1 = ${hs[0](y)}, h2 = ${hs[1](y)}. What does the filter answer?`,
      scene: bloomScene(bits),
      body: {
        kind: 'choice',
        options: shuffle([
          { text: '"Possibly present"', correct: maybe, why: maybe ? `Both bits are 1 (set by other items), a false positive, since ${y} was never added.` : 'A bit is 0, so it can’t be present.' },
          { text: '"Definitely not present"', correct: !maybe, why: !maybe ? 'At least one of its bits is 0, so it was never added.' : 'Both bits are 1, so the filter can’t rule it out.' },
          { text: `"Present, added ${items.length} items ago"`, correct: false, why: 'Bloom filters store no items, times or order.' },
        ]),
      },
      explain: `Bits ${hs[0](y)} and ${hs[1](y)} are ${bits[hs[0](y)]} and ${bits[hs[1](y)]}. ${maybe ? `So "maybe", but ${y} was never added: a false positive.` : 'A 0 bit proves absence.'}`,
    };
  }
};

const predictBloomDelete = (): Card => ({
  concept: BF,
  type: 'predict',
  prompt: 'Can you delete an item from a (plain) Bloom filter by clearing its bits back to 0?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'No: other items may share those bits, and clearing them would create false negatives.', correct: true, why: 'Bits are shared; a 0 is supposed to mean “definitely absent”.' },
      { text: 'Yes, that’s how deletion works.', correct: false, why: 'Another item hashing to the same bit would then look absent.' },
      { text: 'Yes, but only for the last item added.', correct: false, why: 'The filter has no idea which item was last.' },
      { text: 'No, because bits can never change.', correct: false, why: 'They can; it’s just unsafe to clear them.' },
    ]),
  },
  explain: 'Plain Bloom filters only grow. Counting Bloom filters replace bits with small counters to allow deletes.',
});

const simulateBloom = (): Card => {
  const items = distinctInts(3, 10, 99);
  const x = pick(distinctInts(10, 10, 99).filter((v) => !items.includes(v) && hs[0](v) !== hs[1](v)));
  const bits = bloom(items);
  const scene = bloomScene(bits);
  const exp = [hs[0](x), hs[1](x)].map((i) => `b:${i}`);
  const after = [...bits];
  after[hs[0](x)] = 1;
  const f1 = bloomScene([...after]);
  f1.highlight = [exp[0]];
  after[hs[1](x)] = 1;
  const f2 = bloomScene(after);
  f2.highlight = exp;
  return {
    concept: BF,
    type: 'simulate',
    prompt: `Add ${x}. Click the bit for h1(${x}) = ${x} mod ${M}, then the bit for h2(${x}) = (7·${x} + 3) mod ${M}.`,
    scene,
    body: { kind: 'click', expected: exp, frames: [scene, f1, f2], wrongHint: (step) => (step === 0 ? `${x} mod ${M} = ?` : `(7 × ${x} + 3) mod ${M} = ?`) },
    explain: `Bits ${hs[0](x)} and ${hs[1](x)} set. The item itself isn't stored anywhere; only its fingerprint of bits.`,
  };
};

const countBloomBits = (): Card => {
  const items = distinctInts(randInt(3, 5), 10, 99);
  return {
    concept: BF,
    type: 'count',
    prompt: `Start with ${M} zero bits. Add ${items.join(', ')} using h1(x) = x mod ${M} and h2(x) = (7x + 3) mod ${M}. How many bits are 1 afterwards?`,
    body: { kind: 'number', answer: bloom(items).filter(Boolean).length, unit: 'bits' },
    explain: `Positions: ${items.map((x) => `${x}→${hs[0](x)},${hs[1](x)}`).join('; ')}. Overlaps are why the count is ≤ ${2 * items.length}, and why false positives happen.`,
  };
};

const countBloomSize = (): Card => {
  const n = pick([1000, 10_000, 1_000_000]);
  return {
    concept: BF,
    type: 'count',
    prompt: `A Bloom filter with about 10 bits per item has roughly a 1% false-positive rate. How many BYTES for ${n.toLocaleString()} items?`,
    body: { kind: 'number', answer: (n * 10) / 8, unit: 'bytes' },
    explain: `${n.toLocaleString()} × 10 bits = ${(n * 10).toLocaleString()} bits = ${((n * 10) / 8).toLocaleString()} bytes, whatever size the items themselves are.`,
  };
};

const bfExplain = explainGenerators({
  concept: BF,
  truths: [
    'A Bloom filter is a bit array plus k hash functions.',
    'Adding an item sets its k bits to 1.',
    'If any of an item’s bits is 0, it was definitely never added.',
    'If all its bits are 1, it was probably added, but it could be a false positive.',
    'It never gives false negatives, and it doesn’t store the items.',
  ],
  myths: [
    { text: 'A Bloom filter can say “definitely present”.', why: 'Only “maybe present” or “definitely not”.' },
    { text: 'You can list the items in a Bloom filter.', why: 'Items aren’t stored, only bits.' },
    { text: 'Clearing an item’s bits deletes it safely.', why: 'Shared bits would cause false negatives.' },
    { text: 'Bigger items need more bits.', why: 'Size depends on the item count and error rate, not item size.' },
  ],
  chains: [
    {
      prompt: 'Why can a Bloom filter have false positives but never false negatives?',
      steps: ['Adding an item always sets all of its bits.', 'Bits are never cleared.', 'So an added item always finds all its bits set: no false negatives.', 'But other items may have set those same bits: false positives.'],
    },
  ],
  summary: {
    best: 'A Bloom filter is a tiny row of switches that can tell you “definitely not here” for sure, or “maybe here” with a small chance of being wrong.',
    others: [
      { text: 'A Bloom filter is a probabilistic set.', why: 'Jargon; which way can it be wrong?' },
      { text: 'It’s a compressed hash set.', why: 'It stores no items at all.' },
      { text: 'It filters out bad data.', why: 'Misleading name-based guess.' },
    ],
  },
});

export const bloomFilterConcept: Concept = {
  id: BF,
  title: 'Bloom Filter',
  tier: 9,
  prereqs: ['bitset', 'hash-function'],
  tagline: '“Definitely not” or “maybe”, in a few bits per item.',
  hook: {
    problem: 'A browser checks every URL against a list of a million malicious sites. Storing the full list on every phone is too big, and asking a server every time is too slow.',
    question: 'How could a tiny structure rule out almost every safe URL locally?',
    options: [
      { text: 'Hash each bad URL to a few bit positions and set them; a URL with any 0 bit is definitely safe.', good: true, feedback: 'Yes: a Bloom filter. ~1.2 MB for a million URLs at 1% error; only "maybe" hits go to the server.' },
      { text: 'Store the first 3 letters of each URL.', feedback: 'Huge numbers of safe URLs would match.' },
      { text: 'Store a hash set of URL hashes.', feedback: 'Better, but still several bytes per URL; the filter needs ~10 bits.' },
    ],
  },
  lens: {
    layout: 'An array of m bits and k hash functions.',
    invariant: 'For every added item, all k of its bits are 1.',
    payoff: 'Tiny memory; O(k) add and query; no false negatives.',
    price: 'False positives; no deletion (plain version); can’t list items.',
  },
  generators: {
    predict: [predictBloomQuery, predictBloomDelete],
    simulate: [simulateBloom],
    count: [countBloomBits, countBloomSize],
    explain: bfExplain,
  },
};

// =====================================================================
// Count-min sketch
// =====================================================================

const CM = 'count-min-sketch';
const W = 6;
const cmh = [(x: number) => x % W, (x: number) => (x * 5 + 1) % W, (x: number) => (x * 3 + 2) % W];

function sketch(stream: number[]) {
  const g = cmh.map(() => Array(W).fill(0));
  stream.forEach((x) => cmh.forEach((h, r) => g[r][h(x)]++));
  return g;
}
const cmScene = (g: number[][]): Scene => ({
  views: [{ type: 'grid', key: 'c', rows: g, rowLabels: ['h1', 'h2', 'h3'], colLabels: Array.from({ length: W }, (_, i) => String(i)), title: `Count-min sketch: 3 rows × ${W} counters (h1 = x mod ${W}, h2 = (5x+1) mod ${W}, h3 = (3x+2) mod ${W})` }],
});
function randomStream() {
  const kinds = distinctInts(4, 10, 60);
  const stream: number[] = [];
  kinds.forEach((k, i) => {
    for (let j = 0; j < [5, 3, 2, 1][i]; j++) stream.push(k);
  });
  return { kinds, stream: shuffle(stream) };
}

const predictCMEstimate = (): Card => {
  const { kinds, stream } = randomStream();
  const g = sketch(stream);
  const x = pick(kinds);
  const cells = cmh.map((h, r) => g[r][h(x)]);
  const est = Math.min(...cells);
  const truth = stream.filter((v) => v === x).length;
  return {
    concept: CM,
    type: 'predict',
    prompt: `Estimate how many times ${x} appeared. Its counters are row h1 col ${cmh[0](x)}, row h2 col ${cmh[1](x)}, row h3 col ${cmh[2](x)}.`,
    scene: cmScene(g),
    body: {
      kind: 'choice',
      options: numberOptions(
        est,
        [
          { value: Math.max(...cells), why: 'Other items inflate counters; the SMALLEST is closest to the truth.' },
          { value: cells.reduce((a, b) => a + b, 0), why: 'Adding rows counts ' + x + ' three times plus collisions.' },
          { value: Math.round(cells.reduce((a, b) => a + b, 0) / 3), why: 'Averaging keeps the collision noise; take the minimum.' },
        ],
        'Take the minimum of its counters.',
      ),
    },
    explain: `Counters: ${cells.join(', ')} → min ${est}. True count: ${truth}. The estimate is never below the truth, only (sometimes) above.`,
  };
};

const predictCMUnder = (): Card => ({
  concept: CM,
  type: 'predict',
  prompt: 'Can a count-min sketch ever report a count LOWER than the true count?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'No: every occurrence incremented all its counters, so each is ≥ the true count.', correct: true, why: 'Collisions only add.' },
      { text: 'Yes, when two items collide.', correct: false, why: 'Collisions add to a counter; they never subtract.' },
      { text: 'Yes, because it averages rows.', correct: false, why: 'It takes the minimum, not an average.' },
      { text: 'Only after a reset.', correct: false, why: 'A reset zeroes everything.' },
    ]),
  },
  explain: 'Overestimates only: like the Bloom filter’s one-sided error, but for counts.',
});

const simulateCM = (): Card => {
  const { stream } = randomStream();
  const g = sketch(stream);
  const x = randInt(10, 99);
  const scene = cmScene(g);
  const exp = cmh.map((h, r) => `c:${r},${h(x)}`);
  const frames = [scene];
  const cur = g.map((r) => [...r]);
  cmh.forEach((h, r) => {
    cur[r][h(x)]++;
    frames.push({ ...cmScene(cur.map((row) => [...row])), highlight: exp.slice(0, r + 1) });
  });
  return {
    concept: CM,
    type: 'simulate',
    prompt: `${x} arrives. Increment one counter per row: click row h1's counter, then h2's, then h3's.`,
    scene,
    body: { kind: 'click', expected: exp, frames, wrongHint: (step) => `Row ${step + 1}: compute ${['x mod 6', '(5x + 1) mod 6', '(3x + 2) mod 6'][step]} for x = ${x}.` },
    explain: `Columns ${cmh.map((h) => h(x)).join(', ')}. Three increments, no matter how many distinct items the stream has.`,
  };
};

const countCM = (): Card => {
  const { kinds, stream } = randomStream();
  const g = sketch(stream);
  const x = pick(kinds);
  return {
    concept: CM,
    type: 'count',
    prompt: `Using this sketch, what's the estimated count of ${x}?`,
    scene: cmScene(g),
    body: { kind: 'number', answer: Math.min(...cmh.map((h, r) => g[r][h(x)])), unit: 'times' },
    explain: `min(${cmh.map((h, r) => g[r][h(x)]).join(', ')}).`,
  };
};

const cmExplain = explainGenerators({
  concept: CM,
  truths: [
    'A count-min sketch is a small grid of counters, one hash function per row.',
    'Each arriving item increments one counter in every row.',
    'The estimate for an item is the minimum of its counters.',
    'It can overestimate (collisions) but never underestimate.',
    'Memory is fixed, however many distinct items the stream contains.',
  ],
  myths: [
    { text: 'The estimate is the average of the item’s counters.', why: 'The minimum is the least polluted.' },
    { text: 'A count-min sketch stores the items.', why: 'Only counters.' },
    { text: 'More rows make the estimate lower than the true count.', why: 'It’s still never below the truth; more rows just reduce overestimates.' },
  ],
  chains: [
    {
      prompt: 'Why use the minimum across rows?',
      steps: ['Each counter = the item’s true count + counts of items colliding with it.', 'Collisions only ever add.', 'Different rows collide with different items.', 'The smallest counter has the least extra, so it’s the best estimate.'],
    },
  ],
  summary: {
    best: 'Several small tally sheets, each mixing items differently; any item’s count is its lowest tally, which is only inflated by the few items sharing that box.',
    others: [
      { text: 'A count-min sketch counts things approximately.', why: 'How, and which way is it wrong?' },
      { text: 'It’s a hash map of counts.', why: 'It keeps no keys and has fixed size.' },
      { text: 'It’s a Bloom filter with numbers.', why: 'Related, but misses the min trick.' },
    ],
  },
});

export const countMinConcept: Concept = {
  id: CM,
  title: 'Count-Min Sketch',
  tier: 9,
  prereqs: [BF],
  tagline: 'Approximate counts in fixed memory.',
  hook: {
    problem: 'A network router sees billions of packets from millions of addresses and must spot the heaviest senders. A hash map of every address won’t fit.',
    question: 'How could you estimate each address’s count in a fixed, small memory?',
    options: [
      { text: 'Keep a few rows of counters; each address bumps one counter per row; estimate = its smallest counter.', good: true, feedback: 'Yes: a count-min sketch. Fixed memory, and the error only ever goes up.' },
      { text: 'Sample 1% of packets into a hash map.', feedback: 'Rare-but-real heavy senders can be missed, and memory still grows.' },
      { text: 'Count only the first million packets.', feedback: 'Traffic changes; that ignores most of the stream.' },
    ],
  },
  lens: {
    layout: 'A d × w grid of counters, with d hash functions (one per row).',
    invariant: 'Each counter ≥ the true count of every item hashing to it.',
    payoff: 'O(d) update and query, fixed memory, never undercounts.',
    price: 'Overestimates, especially for rare items; no list of which items exist.',
  },
  generators: {
    predict: [predictCMEstimate, predictCMUnder],
    simulate: [simulateCM],
    count: [countCM],
    explain: cmExplain,
  },
};

// =====================================================================
// HyperLogLog
// =====================================================================

const HL = 'hyperloglog';

const rank = (bits: string) => bits.indexOf('1') + 1 || bits.length + 1;
function randomHashes(n: number) {
  return Array.from({ length: n }, () => Array.from({ length: 8 }, () => (Math.random() < 0.5 ? '0' : '1')).join(''));
}
const hllScene = (regs: number[], items: string[]): Scene => ({
  views: [
    { type: 'row', key: 'h', items, labels: items.map((_, i) => `item ${i + 1}`), title: 'Hashed items (first 2 bits pick the register; rank = position of the first 1 in the rest)' },
    { type: 'row', key: 'r', items: regs, labels: ['00', '01', '10', '11'], title: 'Registers (each keeps the MAX rank it has seen)' },
  ],
});

const predictLeadingZeros = (): Card => {
  const k = randInt(3, 12);
  return {
    concept: HL,
    type: 'predict',
    prompt: `Hashes look like random coin flips. About how many DISTINCT items do you need to hash before one is likely to start with ${k} zeros in a row?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        2 ** k,
        [
          { value: k, why: 'Each extra zero halves the odds: it’s 2^k, not k.' },
          { value: k * k, why: 'Halving per zero means powers of 2.' },
          { value: 2 ** (k - 1), why: 'Off by one power of two.' },
        ],
        '(½)^k chance each, so about 2^k items.',
      ),
    },
    explain: `The chance of ${k} leading zeros is 1/2^${k}. Seeing it suggests about 2^${k} = ${(2 ** k).toLocaleString()} distinct items. That's the whole trick.`,
  };
};

const predictDuplicates = (): Card => ({
  concept: HL,
  type: 'predict',
  prompt: 'The same user visits your site 1,000 times. How does that affect a HyperLogLog count of distinct visitors?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'Not at all: the same user always hashes the same way, so the max rank doesn’t change.', correct: true, why: 'Duplicates produce identical hashes.' },
      { text: 'It counts them 1,000 times.', correct: false, why: 'Registers keep a max, not a sum.' },
      { text: 'It slightly increases the estimate each time.', correct: false, why: 'Same hash, same rank, same max.' },
      { text: 'It resets that register.', correct: false, why: 'Registers only ever increase.' },
    ]),
  },
  explain: 'Max is idempotent: seeing the same value again changes nothing. That’s why HLL counts DISTINCT items.',
});

const simulateHLL = (): Card => {
  let hashes: string[];
  let expected: string[];
  let frames: Scene[];
  for (;;) {
    hashes = randomHashes(5);
    const regs = [0, 0, 0, 0];
    const s0 = hllScene([...regs], hashes);
    frames = [s0];
    expected = [];
    hashes.forEach((hsh, i) => {
      const r = parseInt(hsh.slice(0, 2), 2);
      const rk = rank(hsh.slice(2));
      regs[r] = Math.max(regs[r], rk);
      expected.push(`r:${r}`);
      frames.push({ ...hllScene([...regs], hashes), highlight: [`h:${i}`, `r:${r}`] });
    });
    if (new Set(expected).size >= 2) break;
  }
  return {
    concept: HL,
    type: 'simulate',
    prompt: 'For each hashed item in order, click the register it updates (chosen by its first 2 bits). The register keeps the max rank.',
    scene: frames[0],
    body: { kind: 'click', expected, frames, wrongHint: (step) => `Item ${step + 1} starts with ${hashes[step].slice(0, 2)}: that’s register ${hashes[step].slice(0, 2)}.` },
    explain: 'Many registers each estimate from a quarter of the items; combining them (a harmonic mean) smooths out lucky streaks.',
  };
};

const countHLLRank = (): Card => {
  const h = randomHashes(1)[0].slice(0, 2) + '0'.repeat(randInt(0, 4)) + '1' + '0101'.slice(0, randInt(0, 2));
  const rest = h.slice(2);
  return {
    concept: HL,
    type: 'count',
    prompt: `Hash = ${h}. Ignore the first 2 bits (register choice). What's the rank: the position of the first 1 in the remaining bits (${rest})?`,
    body: { kind: 'number', answer: rank(rest), unit: '' },
    explain: `${rest}: first 1 at position ${rank(rest)} (${rank(rest) - 1} leading zeros). Longer zero runs are rarer, so they suggest more distinct items.`,
  };
};

const countHLLMemory = (): Card => ({
  concept: HL,
  type: 'count',
  prompt: 'A HyperLogLog with 16,384 registers, each 6 bits, can count billions of distinct items to ~1% error. How many KILOBYTES is that (1 KB = 1024 bytes)?',
  body: { kind: 'number', answer: 12, unit: 'KB' },
  explain: '16,384 × 6 bits = 98,304 bits = 12,288 bytes = 12 KB. An exact set of a billion IDs would take gigabytes.',
});

const hlExplain = explainGenerators({
  concept: HL,
  truths: [
    'HyperLogLog estimates how many distinct items a stream contains.',
    'A long run of leading zeros in a random hash is rare: 2^k items are needed to expect k zeros.',
    'Registers keep the maximum rank seen, so duplicates never change the estimate.',
    'Many registers are averaged (harmonic mean) to reduce luck.',
    'It uses a few kilobytes to count billions of items with ~1% error.',
  ],
  myths: [
    { text: 'HyperLogLog stores every item it has seen.', why: 'Only a small array of max ranks.' },
    { text: 'Adding a duplicate increases the count.', why: 'Same hash, same rank, no change.' },
    { text: 'It counts total items, including repeats.', why: 'It counts DISTINCT items.' },
    { text: 'One register is enough for a precise estimate.', why: 'One is very noisy; many are combined.' },
  ],
  chains: [
    {
      prompt: 'Why does the longest run of leading zeros estimate the number of distinct items?',
      steps: ['A random hash starts with k zeros with probability 1/2^k.', 'So you expect to need about 2^k distinct items to see such a hash.', 'Duplicates don’t create new hashes.', 'So the longest run seen ≈ log₂(distinct count).'],
    },
  ],
  summary: {
    best: 'HyperLogLog guesses how many different people it has seen by remembering the luckiest-looking coin-flip streak among them: longer streaks need more people.',
    others: [
      { text: 'HyperLogLog is a cardinality estimator.', why: 'Jargon.' },
      { text: 'It counts items using logarithms.', why: 'Vague.' },
      { text: 'It’s a compressed hash set.', why: 'It keeps no items.' },
    ],
  },
});

export const hyperLogLogConcept: Concept = {
  id: HL,
  title: 'HyperLogLog',
  tier: 9,
  prereqs: ['bits', 'hash-function'],
  tagline: 'Count distinct items from the luckiest coin-flip streak.',
  hook: {
    problem: 'How many different users visited today? Storing every user ID in a set takes gigabytes for a big site.',
    question: 'What tiny fact about the hashed IDs could hint at how many distinct ones there were?',
    options: [
      { text: 'The longest run of leading zeros seen: rare runs imply many distinct IDs.', good: true, feedback: 'Yes. Spread across many registers and averaged, that’s HyperLogLog: ~12 KB for billions.' },
      { text: 'The sum of all hashes.', feedback: 'Duplicates would inflate it.' },
      { text: 'The number of IDs seen.', feedback: 'That counts repeats too.' },
    ],
  },
  lens: {
    layout: 'An array of m small registers (e.g. 16,384 × 6 bits).',
    invariant: 'register[j] = max rank (leading zeros + 1) among hashes routed to j.',
    payoff: 'Distinct counts with ~1% error in kilobytes; mergeable across machines (take register-wise max).',
    price: 'Approximate only; can’t list items or answer membership.',
  },
  generators: {
    predict: [predictLeadingZeros, predictDuplicates],
    simulate: [simulateHLL],
    count: [countHLLRank, countHLLMemory],
    explain: hlExplain,
  },
};


import type { Card, Concept, Scene, TreeNode } from '../engine/types';
import { cloneScene } from '../engine/memory';
import { pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, growthCard, numberOptions, options } from './helpers';

const t = (id: string) => `t:${id}`;

// ---------- Compressed trie (radix tree) builder, shared with the suffix tree ----------

interface Raw {
  kids: Map<string, Raw>;
  end: boolean;
  start?: number;
}
function rawTrie(words: string[], starts?: number[]): Raw {
  const root: Raw = { kids: new Map(), end: false };
  words.forEach((w, wi) => {
    let n = root;
    for (const ch of w) {
      if (!n.kids.has(ch)) n.kids.set(ch, { kids: new Map(), end: false });
      n = n.kids.get(ch)!;
    }
    n.end = true;
    if (starts) n.start = starts[wi];
  });
  return root;
}
function compress(n: Raw, prefix: string, label: string, leafNote?: (r: Raw) => string | undefined): TreeNode {
  let node = n;
  let lab = label;
  let pre = prefix;
  while (node.kids.size === 1 && !node.end && lab !== '') {
    const [ch, next] = [...node.kids][0];
    lab += ch;
    pre += ch;
    node = next;
  }
  const kids = [...node.kids.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([ch, k]) => compress(k, pre + ch, ch, leafNote));
  return {
    id: pre || '^',
    label: lab || '•',
    note: leafNote ? leafNote(node) : node.end ? '✓' : undefined,
    tone: node.end && !leafNote ? 'accent' : undefined,
    children: kids,
  };
}
const radix = (words: string[]) => compress(rawTrie(words), '', '');
const countTree = (n: TreeNode): number => 1 + n.children.reduce((s, c) => s + (c ? countTree(c) : 0), 0);
/** Walk a compressed trie along `p`. Returns node ids visited and whether p was fully matched. */
function walkRadix(root: TreeNode, p: string): { ids: string[]; matched: boolean; last: TreeNode } {
  const ids: string[] = [];
  let n = root;
  let rest = p;
  while (rest) {
    const c = n.children.find((k) => k && k.label[0] === rest[0]);
    if (!c) return { ids, matched: false, last: n };
    ids.push(c.id);
    const take = Math.min(c.label.length, rest.length);
    if (c.label.slice(0, take) !== rest.slice(0, take)) return { ids, matched: false, last: c };
    rest = rest.slice(take);
    n = c;
  }
  return { ids, matched: true, last: n };
}
const trieNodeCount = (words: string[]) => new Set(words.flatMap((w) => Array.from({ length: w.length }, (_, i) => w.slice(0, i + 1)))).size;

// =====================================================================
// Radix (compressed) trie
// =====================================================================

const RX = 'radix-trie';

const SETS = [
  ['romane', 'romanus', 'romulus', 'rubens', 'ruber', 'rubicon'],
  ['test', 'team', 'toast', 'toaster', 'water', 'watch'],
  ['slow', 'slower', 'slowly', 'show', 'shower', 'stop'],
  ['card', 'care', 'careful', 'cart', 'dog', 'door'],
];

const predictRadixNodes = (): Card => {
  const words = shuffle(pick(SETS)).slice(0, randInt(3, 4));
  const rx = countTree(radix(words)) - 1;
  const tr = trieNodeCount(words);
  return {
    concept: RX,
    type: 'predict',
    prompt: `A plain trie of ${words.join(', ')} has ${tr} nodes (not counting the root). How many does the compressed (radix) trie have?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        rx,
        [
          { value: tr, why: 'That’s uncompressed. Chains of single children merge into one edge.' },
          { value: words.length, why: 'Branching points and word ends need nodes too.' },
          { value: rx + 1, why: 'Recount: merge every chain that has one child and no word end.' },
        ],
        'Only branch points and word ends keep their own node.',
      ),
    },
    explain: `${rx} nodes instead of ${tr}. Long single-child chains become one edge labelled with a whole substring.`,
    scene: { views: [{ type: 'tree', root: radix(words), title: 'Radix trie (✓ = a word ends here)' }] },
  };
};

const predictRadixSplit = (): Card => {
  const pairs = [
    ['water', 'watch', 'wat', 'er', 'ch'],
    ['toast', 'team', 't', 'oast', 'eam'],
    ['slower', 'show', 's', 'lower', 'how'],
    ['careful', 'cart', 'car', 'eful', 't'],
    ['romane', 'rubens', 'r', 'omane', 'ubens'],
  ];
  const [a, b, shared, ra, rb] = pick(pairs);
  return {
    concept: RX,
    type: 'predict',
    prompt: `A radix trie holds only "${a}" (one edge from the root labelled "${a}"). Insert "${b}". What happens to the edge?`,
    body: {
      kind: 'choice',
      options: options({ text: `Split into "${shared}", which then branches into "${ra}" and "${rb}"`, why: `"${a}" and "${b}" share "${shared}". The edge splits where they differ.` }, [
        { text: `Add a separate edge "${b}" from the root`, why: 'Two edges from one node can’t start with the same letter.' },
        { text: `Split into single letters: ${a.split('').join(', ')}…`, why: 'Only split at the point of difference.' },
        { text: `Relabel the edge "${b}"`, why: `"${a}" would be lost.` },
      ]),
    },
    explain: 'Inserting splits an edge at the first differing character. The shared part stays as one edge.',
  };
};

const simulateRadix = (): Card => {
  const words = pick(SETS);
  const root = radix(words);
  const w = pick(words.filter((x) => walkRadix(root, x).ids.length >= 2));
  const { ids } = walkRadix(root, w);
  const scene: Scene = { views: [{ type: 'tree', root, title: 'Radix trie' }] };
  const exp = ids.map(t);
  const frames = [scene];
  exp.forEach((_, k) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, k + 1) }));
  return {
    concept: RX,
    type: 'simulate',
    prompt: `Look up "${w}". Click each node you step into (each edge may consume several letters).`,
    scene,
    body: { kind: 'click', expected: exp, frames, wrongHint: () => 'Choose the child whose label matches the next letters of the word.' },
    explain: `${ids.length} steps for ${w.length} letters. Fewer hops (and fewer nodes in memory) than a letter-per-node trie.`,
  };
};

const countRadix = (): Card => {
  const words = shuffle(pick(SETS)).slice(0, randInt(3, 5));
  return {
    concept: RX,
    type: 'count',
    prompt: `How many nodes (not counting the root) does a radix trie of ${words.join(', ')} have?`,
    body: { kind: 'number', answer: countTree(radix(words)) - 1, unit: 'nodes' },
    explain: `A node exists only where paths branch or a word ends: ${countTree(radix(words)) - 1}.`,
  };
};

const rxExplain = explainGenerators({
  concept: RX,
  truths: [
    'A radix trie merges chains of single-child nodes into one edge labelled with a substring.',
    'Nodes only remain where paths branch or where a word ends.',
    'Lookup still costs O(word length) character comparisons, but fewer node hops.',
    'Inserting can split an edge at the first differing character.',
  ],
  myths: [
    { text: 'A radix trie stores fewer characters than the words contain.', why: 'All characters are still there, just on fewer, longer edges.' },
    { text: 'Two edges from the same node can start with the same letter.', why: 'Then lookup would be ambiguous; they’d be merged.' },
    { text: 'Compression makes lookups independent of word length.', why: 'You still compare every character.' },
  ],
  chains: [
    {
      prompt: 'Why does a radix trie use fewer nodes than a plain trie?',
      steps: ['A plain trie has one node per character along every path.', 'Many of those nodes have one child and aren’t word ends.', 'Such a chain carries no branching information.', 'So it’s merged into one edge with a multi-letter label.'],
    },
  ],
  summary: {
    best: 'A radix trie is a trie where boring stretches with no choices are squashed into a single labelled step.',
    others: [
      { text: 'A radix trie is a compressed trie.', why: 'Compressed how?' },
      { text: 'It’s a trie using a radix.', why: 'Meaningless to a beginner.' },
      { text: 'It stores only unique words.', why: 'Not the point: it’s about merging chains.' },
    ],
  },
});

export const radixTrieConcept: Concept = {
  id: RX,
  title: 'Radix Trie',
  tier: 8,
  prereqs: ['trie'],
  tagline: 'A trie with the boring chains squashed.',
  hook: {
    problem: 'A trie of long URLs has millions of nodes with exactly one child: "h→t→t→p→s→:→/→/…". Each costs memory and a pointer hop.',
    question: 'How could you avoid storing a node for every letter?',
    options: [
      { text: 'Merge any chain of single-child nodes into one edge labelled with the whole substring.', good: true, feedback: 'Yes: a radix (compressed) trie. Nodes only where something branches or ends.' },
      { text: 'Hash each URL instead.', feedback: 'Loses prefix queries entirely.' },
      { text: 'Only store the first 5 letters.', feedback: 'Then different URLs collide.' },
    ],
  },
  lens: {
    layout: 'Trie nodes whose edges carry strings instead of single characters.',
    invariant: 'Every non-root node branches or ends a word; sibling edges start with different characters.',
    payoff: 'Far fewer nodes and hops; same O(length) lookup and prefix queries.',
    price: 'Inserts/deletes may split or merge edges; edge labels complicate the code.',
  },
  generators: {
    predict: [predictRadixNodes, predictRadixSplit],
    simulate: [simulateRadix],
    count: [countRadix],
    explain: rxExplain,
  },
};

// =====================================================================
// Suffix array
// =====================================================================

const SA = 'suffix-array';
const SA_WORDS = ['banana', 'papaya', 'cocoa', 'abacab', 'kayak', 'barbara', 'rotator'];

function suffixArray(s: string) {
  return Array.from({ length: s.length }, (_, i) => i).sort((a, b) => (s.slice(a) < s.slice(b) ? -1 : 1));
}
const saScene = (s: string): Scene => {
  const sa = suffixArray(s);
  return {
    views: [
      { type: 'row', key: 'w', items: s.split(''), title: `The text "${s}" (positions 0–${s.length - 1})` },
      { type: 'row', key: 's', items: sa.map((i) => s.slice(i)), labels: sa.map((i) => `@${i}`), title: 'Suffix array: every suffix, sorted (label = start position)' },
    ],
  };
};

const predictSAFirst = (): Card => {
  const s = pick(SA_WORDS);
  const sa = suffixArray(s);
  return {
    concept: SA,
    type: 'predict',
    prompt: `Sort all suffixes of "${s}" alphabetically. Which suffix comes FIRST (give its start position)?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        sa[0],
        [
          { value: 0, why: 'The whole word isn’t necessarily smallest; compare letter by letter.' },
          { value: s.length - 1, why: 'The last letter alone isn’t necessarily smallest.' },
          { value: sa[1], why: 'Close: that one comes second.' },
        ],
        'The alphabetically smallest suffix.',
      ),
    },
    explain: `Sorted: ${sa.map((i) => `"${s.slice(i)}"@${i}`).join(', ')}.`,
  };
};

const predictSASearch = (): Card => {
  const s = pick(SA_WORDS);
  const n = s.length;
  return {
    concept: SA,
    type: 'predict',
    prompt: `Why can a suffix array find any pattern in "${s}" (and in a whole book) with binary search?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: 'Every occurrence of a pattern is the start of some suffix, and suffixes are sorted, so matches sit together.', correct: true, why: 'All suffixes beginning with the pattern are adjacent in sorted order.' },
        { text: 'Because the text itself is sorted.', correct: false, why: 'The text isn’t sorted; its suffixes are.' },
        { text: `Because there are only ${n} possible patterns.`, correct: false, why: 'There are many more possible patterns than suffixes.' },
        { text: 'It can’t; you must scan the text.', correct: false, why: 'Sorted suffixes make binary search possible.' },
      ]),
    },
    explain: 'A pattern occurs at position i exactly when the suffix starting at i begins with it. Sorted suffixes put all such matches in one block.',
  };
};

const simulateSASearch = (): Card => {
  let s: string, p: string, mids: number[];
  for (;;) {
    s = pick(SA_WORDS);
    const i = randInt(0, s.length - 2);
    p = s.slice(i, i + randInt(2, 3));
    const sa = suffixArray(s);
    mids = [];
    let lo = 0;
    let hi = sa.length - 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      mids.push(mid);
      const suf = s.slice(sa[mid]);
      if (suf.startsWith(p)) break;
      if (suf < p) lo = mid + 1;
      else hi = mid - 1;
    }
    if (mids.length >= 2) break;
  }
  const scene = saScene(s);
  const exp = mids.map((m) => `s:${m}`);
  const frames = [scene];
  exp.forEach((_, k) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, k + 1) }));
  return {
    concept: SA,
    type: 'simulate',
    prompt: `Binary-search the suffix array for "${p}". Click each middle entry you compare (middle = ⌊(lo + hi) / 2⌋), until one starts with "${p}".`,
    scene,
    body: {
      kind: 'click',
      expected: exp,
      frames,
      wrongHint: (step) => (step === 0 ? `Start in the middle: index ⌊(0 + ${s.length - 1}) / 2⌋.` : 'Compare: is the suffix alphabetically before or after the pattern? Halve accordingly.'),
    },
    explain: `${mids.length} comparisons. Each one halves the candidates: O(m log n) for a pattern of length m.`,
  };
};

const countSA = (): Card => {
  const n = randInt(10, 100000);
  return pick([
    {
      concept: SA,
      type: 'count' as const,
      prompt: `A text of ${n.toLocaleString()} characters. How many entries does its suffix array have?`,
      body: { kind: 'number' as const, answer: n, unit: 'entries' },
      explain: `One per starting position: ${n.toLocaleString()} integers. The suffixes themselves aren't copied, just their start positions.`,
    },
    {
      concept: SA,
      type: 'count' as const,
      prompt: `Binary search over a suffix array of ${n.toLocaleString()} entries needs at most how many comparisons? (⌈log₂(n + 1)⌉)`,
      body: { kind: 'number' as const, answer: Math.ceil(Math.log2(n + 1)), unit: 'comparisons' },
      explain: `Each comparison halves the range: ${Math.ceil(Math.log2(n + 1))}.`,
    },
  ]);
};

const saExplain = explainGenerators({
  concept: SA,
  truths: [
    'A suffix array lists the start positions of all suffixes, sorted alphabetically.',
    'Every occurrence of a pattern is a prefix of some suffix.',
    'All suffixes starting with a pattern are adjacent in the array, so binary search finds them.',
    'It stores only n integers, not the suffixes themselves.',
  ],
  myths: [
    { text: 'A suffix array stores copies of every suffix.', why: 'Only start positions; that would be O(n²) memory.' },
    { text: 'The suffix array sorts the text.', why: 'The text is unchanged; the positions are sorted.' },
    { text: 'Search in a suffix array is O(n).', why: 'Binary search: O(m log n).' },
  ],
  chains: [
    {
      prompt: 'Why are all matches of a pattern next to each other in a suffix array?',
      steps: ['A match at i means the suffix at i starts with the pattern.', 'Strings sharing a prefix sort next to each other.', 'So every matching suffix lies in one contiguous block.', 'Binary search finds the block’s edges.'],
    },
  ],
  summary: {
    best: 'A suffix array is an alphabetised list of every “from here to the end” piece of a text, so looking up a word is like looking it up in a dictionary.',
    others: [
      { text: 'It’s an array of suffixes.', why: 'Restates the name.' },
      { text: 'It’s used for DNA search.', why: 'A use, not a mechanism.' },
      { text: 'It’s a sorted copy of the text.', why: 'It sorts positions, not a copy.' },
    ],
  },
});

export const suffixArrayConcept: Concept = {
  id: SA,
  title: 'Suffix Array',
  tier: 8,
  prereqs: ['string', 'static-array'],
  tagline: 'Every suffix, alphabetised. Search like a dictionary.',
  hook: {
    problem: 'You’ll search one huge text (a genome, a book) for millions of different patterns. Scanning the text for each one is O(n) per search.',
    question: 'What could you prepare once to make every search fast?',
    options: [
      { text: 'Sort all the suffixes (by start position); any pattern’s matches are then a block you can binary-search.', good: true, feedback: 'Yes: a suffix array. n integers, O(m log n) per search.' },
      { text: 'A hash set of every substring.', feedback: 'There are ~n² substrings.' },
      { text: 'Split the text into words.', feedback: 'Patterns can span or sit inside words.' },
    ],
  },
  lens: {
    layout: 'An integer array of the n suffix start positions, in sorted order of the suffixes.',
    invariant: 'text[SA[i]..] < text[SA[i+1]..] for every i.',
    payoff: 'Pattern search in O(m log n); compact (n integers).',
    price: 'Building takes O(n log n) or clever O(n) algorithms; the text can’t change.',
  },
  generators: {
    predict: [predictSAFirst, predictSASearch],
    simulate: [simulateSASearch],
    count: [countSA],
    explain: saExplain,
  },
};

// =====================================================================
// Suffix tree
// =====================================================================

const SX = 'suffix-tree';
const SX_WORDS = ['banana', 'abab', 'papa', 'cocoa', 'aaba', 'abcab'];

function suffixTree(s: string): TreeNode {
  const text = s + '$';
  const sufs = Array.from({ length: text.length }, (_, i) => text.slice(i));
  return compress(rawTrie(sufs, sufs.map((_, i) => i)), '', '', (r) => (r.kids.size === 0 && r.start !== undefined ? `@${r.start}` : undefined));
}

const predictSXLeaves = (): Card => {
  const s = pick(SX_WORDS);
  return {
    concept: SX,
    type: 'predict',
    prompt: `The suffix tree of "${s}$" (with an end marker $) has how many leaves?`,
    body: {
      kind: 'choice',
      options: numberOptions(
        s.length + 1,
        [
          { value: s.length, why: 'Don’t forget the suffix "$" on its own.' },
          { value: new Set(s).size, why: 'That’s distinct letters.' },
          { value: (s.length * (s.length + 1)) / 2, why: 'That’s the number of substrings, not suffixes.' },
        ],
        'One leaf per suffix.',
      ),
    },
    explain: `Each of the ${s.length + 1} suffixes ends at its own leaf. The $ guarantees no suffix is a prefix of another, so none ends mid-edge.`,
  };
};

const predictSXCount = (): Card => {
  const s = pick(SX_WORDS);
  const subs = [...new Set(Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2)))];
  const p = pick(subs);
  const occ = Array.from({ length: s.length }, (_, i) => i).filter((i) => s.startsWith(p, i)).length;
  return {
    concept: SX,
    type: 'predict',
    prompt: `Walk "${p}" down the suffix tree of "${s}$". How many times does "${p}" occur in "${s}"?`,
    scene: { views: [{ type: 'tree', root: suffixTree(s), title: `Suffix tree of "${s}$" (leaf notes = start position)` }] },
    body: {
      kind: 'choice',
      options: numberOptions(
        occ,
        [
          { value: 1, why: 'Count the leaves below the point where the walk ends.' },
          { value: occ + 1, why: 'Only leaves below the end of the walk.' },
          { value: s.length + 1, why: 'That’s every suffix.' },
        ],
        'Count the leaves below where the walk ends.',
      ),
    },
    explain: `Every leaf below the end of "${p}" is a suffix starting with "${p}": ${occ} occurrence${occ === 1 ? '' : 's'}.`,
  };
};

const simulateSX = (): Card => {
  let s: string, p: string, ids: string[];
  let root: TreeNode;
  do {
    s = pick(SX_WORDS);
    const i = randInt(0, s.length - 2);
    p = s.slice(i, i + randInt(2, 3));
    root = suffixTree(s);
    ids = walkRadix(root, p).ids;
  } while (ids.length < 2);
  const scene: Scene = { views: [{ type: 'tree', root, title: `Suffix tree of "${s}$"` }] };
  const exp = ids.map(t);
  const frames = [scene];
  exp.forEach((_, k) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, k + 1) }));
  return {
    concept: SX,
    type: 'simulate',
    prompt: `Is "${p}" a substring of "${s}"? Walk it from the root: click each node you step into (the walk may end partway along an edge; click that node too).`,
    scene,
    body: { kind: 'click', expected: exp, frames, wrongHint: () => 'Follow the child whose edge label matches the next letters.' },
    explain: `The walk succeeds in ${ids.length} steps, O(length of "${p}"), however long the text is.`,
  };
};

const countSX = (): Card => {
  const s = pick(SX_WORDS);
  const p = s.slice(0, 1);
  const occ = Array.from({ length: s.length }, (_, i) => i).filter((i) => s.startsWith(p, i)).length;
  return {
    concept: SX,
    type: 'count',
    prompt: `In the suffix tree of "${s}$", how many leaves sit below the root's "${p}" branch?`,
    scene: { views: [{ type: 'tree', root: suffixTree(s) }] },
    body: { kind: 'number', answer: occ, unit: 'leaves' },
    explain: `One leaf per suffix starting with "${p}": ${occ}.`,
  };
};

const growthSX = (): Card => growthCard(SX, 'check if a 5-letter pattern occurs in a text of length n', () => 5, 0, 'The walk only depends on the pattern length.');

const sxExplain = explainGenerators({
  concept: SX,
  truths: [
    'A suffix tree is a compressed trie of all suffixes of a text.',
    'Every substring of the text is a path from the root.',
    'Substring search takes O(pattern length), independent of the text length.',
    'The number of leaves below a node is the number of occurrences of that path’s string.',
    'An end marker $ makes every suffix end at its own leaf.',
  ],
  myths: [
    { text: 'A suffix tree needs O(n²) nodes.', why: 'Compressed, it has O(n) nodes (≤ 2n).' },
    { text: 'Search time grows with the text length.', why: 'It grows with the pattern length only.' },
    { text: 'Suffix trees only find whole words.', why: 'Any substring is a root path.' },
  ],
  chains: [
    {
      prompt: 'Why is every substring a path from the root?',
      steps: ['Every substring is a prefix of some suffix.', 'Every suffix is a root-to-leaf path in the tree.', 'A prefix of a path is itself a path from the root.', 'So walking the substring from the root always succeeds if it occurs.'],
    },
  ],
  summary: {
    best: 'A suffix tree merges every “from here to the end” piece of a text into one branching tree, so checking any word is just walking its letters from the top.',
    others: [
      { text: 'A suffix tree is a tree of suffixes.', why: 'Restates the name.' },
      { text: 'It’s a faster suffix array.', why: 'Different structure, more memory.' },
      { text: 'It’s used in bioinformatics.', why: 'A use, not a mechanism.' },
    ],
  },
});

export const suffixTreeConcept: Concept = {
  id: SX,
  title: 'Suffix Tree',
  tier: 8,
  prereqs: [RX, SA],
  tagline: 'A radix trie of every suffix.',
  hook: {
    problem: 'A suffix array needs O(m log n) per search. Some tasks need "is this a substring?" in time that doesn’t depend on the text length at all.',
    question: 'What if you put all suffixes into one trie?',
    options: [
      { text: 'Every substring becomes a path from the root; compress it into a radix trie so it stays O(n) size.', good: true, feedback: 'Yes: a suffix tree. Search is O(pattern length).' },
      { text: 'It would have n² nodes, so it’s useless.', feedback: 'Uncompressed, yes; compressed, it has O(n) nodes.' },
      { text: 'You’d still need binary search.', feedback: 'No: you just walk the letters.' },
    ],
  },
  lens: {
    layout: 'A compressed trie of all n + 1 suffixes of text + "$"; leaves record suffix start positions.',
    invariant: 'Each root-to-leaf path spells one suffix; sibling edges start with different characters.',
    payoff: 'Substring test in O(m); occurrence counts and many string problems in linear time.',
    price: 'Large memory constant (many pointers per node); complex linear-time construction.',
  },
  generators: {
    predict: [predictSXLeaves, predictSXCount],
    simulate: [simulateSX],
    count: [countSX, growthSX],
    explain: sxExplain,
  },
};

// =====================================================================
// Rope
// =====================================================================

const RP = 'rope';

interface RNode {
  id: string;
  weight: number;
  text?: string;
  left?: RNode;
  right?: RNode;
}
let rid = 0;
function buildRope(chunks: string[]): RNode {
  if (chunks.length === 1) return { id: `r${rid++}`, weight: chunks[0].length, text: chunks[0] };
  const m = Math.ceil(chunks.length / 2);
  const left = buildRope(chunks.slice(0, m));
  const right = buildRope(chunks.slice(m));
  return { id: `r${rid++}`, weight: ropeLen(left), left, right };
}
const ropeLen = (n: RNode): number => (n.text !== undefined ? n.text.length : ropeLen(n.left!) + ropeLen(n.right!));
const ropeTree = (n: RNode): TreeNode => (n.text !== undefined ? { id: n.id, label: `"${n.text}"`, note: `len ${n.weight}`, children: [] } : { id: n.id, label: `w=${n.weight}`, children: [ropeTree(n.left!), ropeTree(n.right!)] });
function ropeIndex(n: RNode, i: number): { path: RNode[]; ch: string } {
  const path: RNode[] = [];
  let cur = n;
  let k = i;
  for (;;) {
    path.push(cur);
    if (cur.text !== undefined) return { path, ch: cur.text[k] };
    if (k < cur.weight) cur = cur.left!;
    else {
      k -= cur.weight;
      cur = cur.right!;
    }
  }
}
const TEXTS = [
  ['Hello_', 'my_', 'na', 'me_i', 's_Rope'],
  ['The_q', 'uick_', 'brown', '_fox'],
  ['data_', 'struc', 'tures_', 'are_', 'fun'],
];
function randomRope() {
  rid = 0;
  const chunks = pick(TEXTS);
  return { chunks, root: buildRope(chunks), text: chunks.join('') };
}

const predictRopeIndex = (): Card => {
  const { root, text } = randomRope();
  const i = randInt(2, text.length - 2);
  return {
    concept: RP,
    type: 'predict',
    prompt: `Each internal node's weight = the length of its LEFT subtree's text. Which character is at index ${i}?`,
    scene: { views: [{ type: 'tree', root: ropeTree(root), binary: true, title: `Rope for "${text}"` }] },
    body: {
      kind: 'choice',
      options: options({ text: `'${text[i]}'`, why: 'Go left if i < weight; otherwise subtract the weight and go right.' }, [
        { text: `'${text[i + 1]}'`, why: 'Off by one: indexes start at 0.' },
        { text: `'${text[i - 1]}'`, why: 'Off by one the other way.' },
        { text: `'${text[Math.min(text.length - 1, i + 2)]}'`, why: 'Recheck the subtraction when going right.' },
      ]),
    },
    explain: `${ropeIndex(root, i).path.map((n) => (n.text !== undefined ? `"${n.text}"` : `w=${n.weight}`)).join(' → ')}: '${text[i]}'. O(depth) instead of O(1), but edits get much cheaper.`,
  };
};

const predictConcat = (): Card => {
  const n = randInt(1000, 1_000_000);
  return {
    concept: RP,
    type: 'predict',
    prompt: `Two documents of ${n.toLocaleString()} characters each. Concatenating them as plain strings copies ${(2 * n).toLocaleString()} characters. What does concatenating two ropes do?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: 'Creates one new root with the two ropes as children: O(1) (plus rebalancing).', correct: true, why: 'No characters move; just a new parent node.' },
        { text: 'Copies both ropes’ leaves into a new rope.', correct: false, why: 'Ropes share existing nodes; nothing is copied.' },
        { text: 'Appends the second rope’s text to the last leaf.', correct: false, why: 'That would copy a whole document into one leaf.' },
        { text: 'It’s impossible without flattening.', correct: false, why: 'Concatenation is the rope’s easiest operation.' },
      ]),
    },
    explain: 'That’s why text editors use ropes (or similar trees): huge documents edited in the middle without copying everything.',
  };
};

const simulateRope = (): Card => {
  const { root, text } = randomRope();
  const i = randInt(1, text.length - 1);
  const { path } = ropeIndex(root, i);
  const scene: Scene = { views: [{ type: 'tree', root: ropeTree(root), binary: true, title: `Rope for "${text}" (w = length of left subtree)` }] };
  const exp = path.map((n) => t(n.id));
  const frames = [scene];
  exp.forEach((_, k) => frames.push({ ...cloneScene(scene), highlight: exp.slice(0, k + 1) }));
  return {
    concept: RP,
    type: 'simulate',
    prompt: `Find the character at index ${i}. At each node: if i < w, go left; else subtract w and go right. Click each node you visit.`,
    scene,
    body: { kind: 'click', expected: exp, frames, wrongHint: (step) => (step === 0 ? 'Start at the root.' : 'Compare the remaining index with this node’s w.') },
    explain: `Landed on '${text[i]}' after ${path.length} nodes.`,
  };
};

const countRopeWeight = (): Card => {
  const { root, chunks } = randomRope();
  return {
    concept: RP,
    type: 'count',
    prompt: `A rope is built from the chunks ${chunks.map((c) => `"${c}"`).join(', ')} (left half of the chunks on the left). What's the root's weight (length of its left subtree)?`,
    body: { kind: 'number', answer: root.weight, unit: 'characters' },
    explain: `Left subtree holds ${chunks.slice(0, Math.ceil(chunks.length / 2)).map((c) => `"${c}"`).join(' + ')} = ${root.weight} characters.`,
  };
};

const rpExplain = explainGenerators({
  concept: RP,
  truths: [
    'A rope is a binary tree whose leaves hold chunks of a long string.',
    'Each internal node stores the length of its left subtree (its weight).',
    'Finding character i walks down using the weights: O(depth).',
    'Concatenation just creates a new root over two ropes, copying no characters.',
    'Insert and delete in the middle split and re-join ropes instead of shifting characters.',
  ],
  myths: [
    { text: 'Indexing a rope is O(1) like a string.', why: 'It walks the tree: O(log n) when balanced.' },
    { text: 'Concatenating ropes copies both texts.', why: 'Only a new parent node is created.' },
    { text: 'A node’s weight is the length of its whole subtree.', why: 'It’s the length of its LEFT subtree.' },
  ],
  chains: [
    {
      prompt: 'Why is inserting into the middle of a rope cheap?',
      steps: ['Split the rope at the insert position into two ropes.', 'Splitting only rebuilds nodes along one path.', 'Concatenate: left + new text + right, each join is a new parent.', 'No characters are shifted.'],
    },
  ],
  summary: {
    best: 'A rope stores a huge text as a tree of small pieces, so gluing and cutting only rearranges pieces instead of copying the whole text.',
    others: [
      { text: 'A rope is a tree of strings.', why: 'What, not why.' },
      { text: 'A rope is a faster string.', why: 'Slower to index; faster to edit.' },
      { text: 'It’s a linked list of characters.', why: 'Chunks in a tree, not single characters in a list.' },
    ],
  },
});

export const ropeConcept: Concept = {
  id: RP,
  title: 'Rope',
  tier: 8,
  prereqs: ['binary-tree', 'string'],
  tagline: 'A long string as a tree of chunks.',
  hook: {
    problem: 'A text editor holds a 50 MB file as one string. Typing one letter near the start shifts 50 million characters.',
    question: 'How could edits avoid shifting the whole text?',
    options: [
      { text: 'Store the text as small chunks at the leaves of a balanced tree, with lengths in the nodes to find positions.', good: true, feedback: 'Yes: a rope. Edits touch one path; concatenation is a new root.' },
      { text: 'Use a linked list of characters.', feedback: 'Finding position 10 million would walk 10 million nodes.' },
      { text: 'Only save changes and apply them on display.', feedback: 'A log of changes gets slower as it grows.' },
    ],
  },
  lens: {
    layout: 'A binary tree: leaves hold string chunks; internal nodes hold the length of their left subtree.',
    invariant: 'An in-order walk of the leaves spells the text; each weight equals its left subtree’s length.',
    payoff: 'O(log n) index, insert, delete, split; O(1)-ish concatenation.',
    price: 'Slower indexing and more memory than a flat string; needs rebalancing.',
  },
  generators: {
    predict: [predictRopeIndex, predictConcat],
    simulate: [simulateRope],
    count: [countRopeWeight],
    explain: rpExplain,
  },
};


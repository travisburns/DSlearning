/**
 * Plain-language definitions for every technical word the app uses.
 * Any of these words in a card, lesson or explanation is underlined; tap it to see the meaning.
 */
export const GLOSSARY: Record<string, string> = {
  // Memory
  address: 'A box’s number in memory. Knowing it lets the computer go straight to that box.',
  cell: 'One box of memory. It holds exactly one number.',
  pointer: 'A box that holds the address of another box, so you can follow it there.',
  bit: 'The smallest piece of data: a single 0 or 1 (off or on).',
  byte: '8 bits together. Can hold a number from 0 to 255.',
  overflow: 'When a number is too big for the space it’s stored in, so it wraps around to a wrong value.',
  'random access': 'Being able to jump straight to any position in one step, without going through the others.',
  contiguous: 'Side by side in memory, with no gaps.',
  // Arrays & lists
  index: 'A position number in an array, counting from 0: the first item is [0], the second [1], and so on.',
  element: 'One item stored in a data structure.',
  capacity: 'How many slots are reserved, including empty ones. Can be bigger than how many are used.',
  node: 'One item in a linked structure (list, tree, graph): a value plus pointers to other nodes.',
  head: 'The first node of a list (or a pointer to it).',
  tail: 'The last node of a list (or a pointer to it).',
  sentinel: 'A dummy node at the start or end of a list that holds no data, used to avoid special cases.',
  immutable: 'Can’t be changed after it’s made. “Changing” it really makes a new copy.',
  mod: 'The remainder after dividing. 17 mod 5 = 2, because 17 = 3 × 5 + 2.',
  // Cost
  'Big-O': 'A way to say how the work grows as the data grows: O(1) doesn’t grow, O(n) grows in step with it, and so on.',
  'O(1)': 'Constant work: the same amount no matter how much data there is.',
  'O(log n)': 'Grows very slowly: doubling the data adds just one more step.',
  'O(n)': 'Grows in step with the data: twice the data, twice the work.',
  'O(n log n)': 'A bit more than O(n): typical of good sorting.',
  'O(n²)': 'Grows with the square of the data: twice the data, four times the work.',
  amortized: 'Averaged over many operations. A rare expensive step spread over many cheap ones.',
  touches: 'Boxes read or written: the unit of work this app counts.',
  // Rules
  invariant: 'A rule a data structure always keeps true, like “every parent is smaller than its children”. The whole structure depends on it.',
  // Stacks & queues
  LIFO: 'Last in, first out: the newest item leaves first (like a pile of plates).',
  FIFO: 'First in, first out: the oldest item leaves first (like a line at a shop).',
  push: 'Add an item (to the top of a stack, or the end of something).',
  pop: 'Remove and return an item (the top of a stack).',
  enqueue: 'Add an item to the back of a queue.',
  dequeue: 'Remove the item at the front of a queue.',
  priority: 'How urgent an item is. Here, a smaller number means more urgent.',
  // Hashing
  hash: 'A number computed from a key, used to decide where the key is stored.',
  'hash function': 'A recipe that turns any key into a number, always the same number for the same key.',
  bucket: 'One slot of a hash table, which can hold one or more keys.',
  collision: 'When two different keys land in the same bucket.',
  'load factor': 'How full a hash table is: number of keys ÷ number of buckets.',
  probe: 'Checking a slot while searching for a free spot or a key.',
  tombstone: 'A marker left where something was deleted, so searches know to keep going past it.',
  key: 'The thing you look something up by, like a name or an ID.',
  // Trees
  root: 'The top node of a tree: the only one with no parent.',
  leaf: 'A node with no children.',
  parent: 'The node directly above another node in a tree.',
  child: 'A node directly below another node in a tree.',
  subtree: 'A node together with everything below it.',
  depth: 'How many steps a node is below the root (the root has depth 0).',
  height: 'The number of steps on the longest path from the root down to a leaf.',
  balanced: 'Kept short and bushy (height about log n), rather than long and stringy.',
  rotation: 'A small rearrangement of a few nodes in a tree that keeps the order but changes the shape.',
  traversal: 'Visiting every node in a certain order.',
  inorder: 'Tree order: left subtree, then the node, then the right subtree.',
  preorder: 'Tree order: the node first, then its left subtree, then its right subtree.',
  postorder: 'Tree order: left subtree, right subtree, then the node last.',
  'level order': 'Tree order: row by row from the top, left to right.',
  'sift up': 'Moving a value up a heap, swapping with its parent while it’s smaller.',
  'sift down': 'Moving a value down a heap, swapping with its smaller child while it’s bigger.',
  // Graphs
  edge: 'A connection between two nodes in a graph.',
  directed: 'Edges go one way only, like one-way streets.',
  undirected: 'Edges go both ways.',
  degree: 'How many edges touch a node.',
  neighbour: 'A node connected to another node by an edge.',
  neighbours: 'Nodes connected to a node by an edge.',
  cycle: 'A path that leads back to where it started.',
  sparse: 'Mostly empty: few connections or few non-zero values.',
  dense: 'Mostly full: many connections or values.',
  // Strings & ranges
  prefix: 'The start of something. “ca” is a prefix of “cat”.',
  suffix: 'The end of something, from some position to the end. “at” is a suffix of “cat”.',
  substring: 'Any continuous piece of a string. “at” is a substring of “water”.',
  // Probabilistic & caches
  'false positive': 'Saying “maybe yes” when the true answer is no.',
  'false negative': 'Saying “no” when the true answer is yes.',
  cache: 'A small, fast store of recently or often used items, to avoid slow lookups.',
  evict: 'Remove an item from a cache to make room.',
  // App words
  misconception: 'Something you were certain about that turned out wrong. These come back first so you can fix them.',
};

/** Terms sorted longest-first so “hash function” wins over “hash”. */
export const GLOSSARY_TERMS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Matches any glossary term as a whole word (case-insensitive, plural/-s tolerant for simple words). */
export const GLOSSARY_RE = new RegExp(`(?<![A-Za-z0-9])(${GLOSSARY_TERMS.map(esc).join('|')})(?![A-Za-z0-9(])`, 'gi');

export function lookup(word: string): { term: string; def: string } | undefined {
  const k = GLOSSARY_TERMS.find((t) => t.toLowerCase() === word.toLowerCase());
  return k ? { term: k, def: GLOSSARY[k] } : undefined;
}

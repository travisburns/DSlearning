/**
 * The teaching part of every lesson, in plain language: what the structure is, and how it works
 * step by step. Shown first, before any questions.
 */
export const LEARN: Record<string, { what: string; how: string[] }> = {
  // ---------------- Tier 0: Primitives ----------------
  memory: {
    what: 'Before any data structure, you need to know where data lives. A computer’s memory is one very long row of boxes. Each box holds one number, and each box has its own number, called its address, starting from 0. Every data structure you’ll learn is just a clever way of arranging numbers in these boxes.',
    how: [
      'To store a number, the computer writes it into a box, say box 5.',
      'To get it back, it goes straight to box 5. It doesn’t look through boxes 0, 1, 2…; it jumps directly there. Reading box 5 or box 5,000,000 costs the same: one step.',
      'Writing into a box replaces what was there. The old number is gone.',
      'A variable in your code (like x) is just a name for one box’s address.',
    ],
  },
  pointers: {
    what: 'A pointer is a box that doesn’t hold normal data, but holds the address of another box. It’s like a note saying “the thing you want is in box 10”. Pointers let different parts of a program share the same data without copying it, and they’re how data gets linked together.',
    how: [
      'Box 17 holds the number 10. If we treat it as a pointer, it means “go to box 10”.',
      'Following the pointer: read box 17, get 10, then read box 10.',
      'Box 10 could itself hold another address, making a chain. Each hop costs one read, because you only find out the next address by reading the current box.',
      'Two pointers holding the same address both lead to the same box, so a change made through one is seen through the other.',
    ],
  },
  bits: {
    what: 'Inside, each memory box is made of tiny on/off switches called bits (1 = on, 0 = off). Numbers are stored as patterns of bits, called binary. Knowing this explains why some data structures pack information into bits, and why numbers have size limits.',
    how: [
      'Each bit position has a value, doubling from the right: 1, 2, 4, 8, 16, 32, 64, 128.',
      'A number is the sum of the positions that are on. 00001011 = 8 + 2 + 1 = 11.',
      '8 bits make a byte, which can hold 256 different values: 0 to 255.',
      'Each extra bit doubles how many values you can store.',
    ],
  },

  // ---------------- Tier 1: Linear ----------------
  'static-array': {
    what: 'An array stores a list of items in boxes side by side, with no gaps. Because they’re side by side, the computer can calculate exactly where any item is, so it can get the 500th item as fast as the 1st. The catch: squeezing a new item into the middle means shifting everything after it.',
    how: [
      'The array starts at some address, called its base. Item 0 is at the base, item 1 in the next box, and so on.',
      'To find item i: address = base + i. One sum, then one jump. No searching.',
      'Inserting at position i: every item from i onwards must shift one box to the right first, to make room.',
      'Deleting at position i: every item after it shifts one box left to close the gap. Gaps would break the “base + i” rule.',
    ],
  },
  matrix: {
    what: 'A 2D array (or matrix) is a grid of rows and columns, like a spreadsheet, a chessboard or an image. But memory is one long row, not a grid. So the grid is stored one row after another, and a little arithmetic finds any square.',
    how: [
      'Row 0 is stored first, then row 1 right after it, then row 2, and so on.',
      'To find the item at row r, column c: skip r whole rows (r × number of columns), then move c more boxes.',
      'So position = base + r × columns + c. Still one calculation and one jump.',
      'Items next to each other in a row are next to each other in memory; items above/below each other are a whole row apart.',
    ],
  },
  'dynamic-array': {
    what: 'A normal array has a fixed size: the boxes after it may belong to something else, so it can’t grow. A dynamic array (like a List in C# or a Python list) solves this: when it runs out of room, it moves everything into a new block twice as big.',
    how: [
      'It keeps some spare empty slots at the end. It tracks how many slots are used (length) and how many exist (capacity).',
      'Adding to the end when there’s room: just write into the next free slot.',
      'When it’s full: reserve a new block twice the size, copy every item over, then add the new one. The old block is abandoned.',
      'Because it doubles, these big copies get rarer and rarer, so adding items is cheap on average.',
    ],
  },
  string: {
    what: 'Text is stored as an array of numbers, one per character. Each letter has a code: ‘A’ is 65, ‘B’ is 66, and so on. So a string is really an array, with the same strengths and costs as one.',
    how: [
      '“cat” is stored as three boxes side by side: 99, 97, 116.',
      'Getting the 3rd character is instant, like any array.',
      'Comparing two strings checks letter by letter from the left and stops at the first difference.',
      'In many languages (including C#) strings can’t be changed. “Adding” to a string actually builds a whole new one, copying every character.',
    ],
  },
  'linked-list': {
    what: 'A linked list stores items in separate boxes scattered anywhere in memory. Each item (a node) holds its value and a pointer to the next item. The order lives in the pointers, not in the positions, so you can insert or remove items without shifting anything.',
    how: [
      'A “head” pointer holds the address of the first node.',
      'Each node = [value, next]. The last node’s next is empty (∅), meaning the end.',
      'To reach the 5th item, you must start at the head and follow 4 next-pointers. There’s no shortcut.',
      'To insert after a node A: make the new node point to A’s next, then point A at the new node. Two pointer changes, nothing moves.',
    ],
  },
  'doubly-linked-list': {
    what: 'A doubly linked list is a linked list where every node also points back to the node before it. You can walk it in both directions, and you can remove a node you’re holding without searching for the one before it.',
    how: [
      'Each node = [value, previous, next]. The list keeps a head and a tail pointer.',
      'Walk forwards with next, backwards with previous.',
      'To remove node X: point X’s previous node forward to X’s next, and X’s next node back to X’s previous. Two changes.',
      'The price: one more pointer per node, and every change must update both directions.',
    ],
  },
  'circular-linked-list': {
    what: 'A circular linked list is a linked list whose last node points back to the first instead of ending. You can go round and round forever, which is perfect for taking turns.',
    how: [
      'Same nodes as a normal linked list, but the last node’s next is the first node.',
      'Usually you keep a pointer to the last node (the tail). The first node is then just tail.next.',
      'Going round in a loop never hits an end, so there’s no special “start again” step.',
      'When walking it, stop when you get back to where you started, or you’ll loop forever.',
    ],
  },
  bitset: {
    what: 'A bitset stores a set of small whole numbers using one bit each: bit 5 on means “5 is in the set”. It’s extremely compact and fast: checking if a number is in the set is one step.',
    how: [
      'Think of a row of switches numbered 0, 1, 2, 3… Switch x on = x is in the set.',
      'The switches are packed into words of, say, 8 bits. Number x lives in word x ÷ 8, at bit x mod 8.',
      'Adding, removing and checking a number is one calculation and one bit change.',
      'Combining two sets (union, intersection) handles a whole word of numbers at once.',
    ],
  },

  // ---------------- Tier 2: Restricted interfaces ----------------
  stack: {
    what: 'A stack is a pile: you can only add to the top or take from the top, so the last thing you put in is the first thing out. It’s how Undo works, and how your programs keep track of function calls.',
    how: [
      'Push = put an item on top. Pop = take the top item off.',
      'It’s usually an array plus a counter “top” saying how many items there are.',
      'Push writes into the next free slot; pop takes the item just below “top”. Nothing else moves.',
      'Both are one step, however big the stack is.',
    ],
  },
  queue: {
    what: 'A queue is a line: items join at the back and leave from the front, so the first to arrive is the first served. Print jobs, messages and customer requests are all handled with queues.',
    how: [
      'Enqueue = join the back. Dequeue = leave from the front.',
      'A simple way: a linked list with pointers to both the front (head) and the back (tail).',
      'Enqueue attaches a new node after the tail. Dequeue takes the head and moves head to the next node.',
      'Both are one step. (Using a plain array and shifting everyone forward would be slow.)',
    ],
  },
  'circular-buffer': {
    what: 'A circular buffer is a queue stored in a fixed-size array, where the positions wrap around: after the last slot comes slot 0 again. Nothing ever shifts; only the “front” and “back” markers move.',
    how: [
      'Keep an array, a “head” position (the front) and a count of items.',
      'The back is at (head + count) mod size. “mod size” makes positions past the end wrap back to the start.',
      'Enqueue writes at the back; dequeue reads at head, then moves head forward one (wrapping).',
      'It has a fixed size: when full, you must refuse, overwrite the oldest, or grow.',
    ],
  },
  deque: {
    what: 'A deque (“deck”) is a line you can join or leave at either end. Use only one end and it acts like a stack; use opposite ends and it acts like a queue.',
    how: [
      'Four operations: add to front, add to back, remove from front, remove from back.',
      'Usually built on a circular buffer: adding to the front moves the head marker back one slot (wrapping).',
      'All four operations take one step.',
      'Only the ends are quick; the middle is not.',
    ],
  },
  'monotonic-stack': {
    what: 'A monotonic stack is a stack kept in order (e.g. always decreasing from bottom to top). It’s a trick for questions like “for each day, when is the next warmer day?”, answering all of them in one pass instead of checking every pair.',
    how: [
      'Go through the items left to right.',
      'Before pushing a new item, pop every item on top that is smaller than it.',
      'Each popped item has just found its answer: the new item is the first bigger one after it.',
      'Every item is pushed once and popped at most once, so the whole thing takes one pass.',
    ],
  },
  'priority-queue': {
    what: 'A priority queue always gives you the most urgent item next, whatever order things arrived in, like an emergency room. It’s a description of what you want, and there are several ways to build it with different costs.',
    how: [
      'Two operations: insert an item with a priority, and remove the most urgent one (smallest number = most urgent here).',
      'Simple version 1: keep an unsorted list. Inserting is instant, but finding the most urgent means checking every item.',
      'Simple version 2: keep it sorted. Removing is instant, but inserting means shifting items to keep the order.',
      'Each simple version makes one operation slow. The binary heap (a later lesson) makes both fast.',
    ],
  },

  // ---------------- Tier 3: Hashing ----------------
  'hash-function': {
    what: 'Arrays can find item number 7 instantly, but only by number. A hash function turns any key (a name, a word, an ID) into a number, so you can use it like an array position. Same key, same number, every time.',
    how: [
      'Compute a number from the key. For a whole number k, a simple one is k mod (table size).',
      'For text, combine the letter codes in a way that depends on their order.',
      'The result is a slot number from 0 to size − 1, so the key knows exactly where to go.',
      'Different keys sometimes land on the same slot (a collision). That can’t be avoided, only handled.',
    ],
  },
  'hash-chaining': {
    what: 'A hash table with chaining is an array of buckets. Each key is hashed to pick its bucket, and each bucket keeps a small list of the keys that landed there. Looking something up means checking just one short list, not everything.',
    how: [
      'Hash the key to get a bucket number.',
      'Insert: add the key to that bucket’s list.',
      'Find: hash the key, then look only through that bucket’s list.',
      'If buckets get crowded, lookups slow down, so the table grows when it gets too full.',
    ],
  },
  'hash-open-addressing': {
    what: 'Open addressing is another way to build a hash table: every key lives directly in the array, one per slot. If a key’s slot is taken, it tries the next slot, and the next, until it finds a free one.',
    how: [
      'Hash the key to get its “home” slot.',
      'Insert: if home is free, put it there; if not, step to the next slot (wrapping at the end) until one is free.',
      'Find: start at home and step along until you find the key or hit an empty slot (then it isn’t there).',
      'Deleting leaves a special marker, so later searches know to keep going past that slot.',
    ],
  },
  'hash-map': {
    what: 'A hash map (Dictionary in C#) stores key → value pairs and finds any value by its key almost instantly. A hash set is the same but stores only keys. They’re the most used structures in everyday programming.',
    how: [
      'It’s a hash table (chaining or open addressing) where each key also carries a value.',
      'Put, get and remove all hash the key to go straight to the right place.',
      'When it gets too full, it doubles its number of buckets and re-places every key, because each key’s bucket depends on the size.',
      'Keys must not change after you insert them, or the map looks in the wrong bucket.',
    ],
  },
  'cuckoo-hashing': {
    what: 'Cuckoo hashing gives every key exactly two possible homes, in two tables. A lookup only ever checks those two spots, so it is always fast, never unlucky.',
    how: [
      'Two tables, two hash functions: key k can live at table1[h1(k)] or table2[h2(k)].',
      'Find: check those two places. Done.',
      'Insert: put the key in its table-1 spot. If someone is there, kick them out to their other home, which may kick out someone else, and so on.',
      'If the kicking goes round in circles, rebuild the tables with new hash functions.',
    ],
  },
  'consistent-hashing': {
    what: 'When data is spread over many servers, you need to decide which server holds each key. Consistent hashing places servers and keys on a circle, so that adding or removing a server only moves a small share of the keys.',
    how: [
      'Picture a clock face numbered 0 to 99. Each server is placed at some position on it.',
      'Each key is hashed to a position too, and belongs to the first server clockwise from there.',
      'If a server is removed, only its keys move, to the next server clockwise. Everyone else stays put.',
      'Putting each server at several positions evens out how many keys each one gets.',
    ],
  },

  // ---------------- Tier 4: Core trees ----------------
  tree: {
    what: 'A tree organises data in levels, like folders inside folders or a family tree upside down. There is one top node (the root), and every other node hangs from exactly one parent.',
    how: [
      'Each node holds a value and pointers to its children.',
      'Nodes with no children are leaves. The root is the only node with no parent.',
      'There is exactly one path from the root to any node.',
      'Depth = how far a node is below the root. Height = the longest path from the root down to a leaf.',
    ],
  },
  'binary-tree': {
    what: 'A binary tree is a tree where each node has at most two children: a left one and a right one. Because each level can hold twice as many nodes as the one above, a well-shaped binary tree stays very short even with lots of nodes.',
    how: [
      'Each node = [value, left pointer, right pointer].',
      'Level 0 has 1 node, level 1 up to 2, level 2 up to 4… doubling each time.',
      'You can visit all nodes in different orders: e.g. node first then its subtrees (preorder), or left subtree, node, right subtree (inorder).',
      'Level order visits row by row from the top.',
    ],
  },
  bst: {
    what: 'A binary search tree keeps its values sorted in a tree shape: everything to the left of a node is smaller, everything to the right is bigger. Finding a value is a guessing game where each step throws away half of what’s left.',
    how: [
      'Search: start at the root. If your value is smaller, go left; if bigger, go right. Repeat until found or you run out of tree.',
      'Insert: search for the value, and attach it where the search runs out.',
      'Reading the tree in order (left, node, right) gives the values sorted.',
      'The catch: if values arrive already sorted, the tree becomes one long chain and searching gets slow.',
    ],
  },
  'binary-heap': {
    what: 'A binary heap keeps the smallest item always on top, and makes adding and removing items fast. It’s the usual way to build a priority queue. Surprisingly, it’s stored in a plain array, with no pointers at all.',
    how: [
      'Rule: every parent is smaller than (or equal to) its children. So the smallest is at the top.',
      'The tree is filled level by level, left to right, and stored in that order in an array. Children of position i are at 2i + 1 and 2i + 2.',
      'Insert: add at the end, then swap it upward with its parent while it’s smaller.',
      'Remove the smallest: take the top, move the last item to the top, then swap it down with its smaller child until the rule holds again.',
    ],
  },
  'd-ary-heap': {
    what: 'A d-ary heap is a heap where each node has d children instead of 2. With more children per node, the tree is shorter, which makes some operations faster.',
    how: [
      'Same rule as a binary heap: every parent is smaller than its children.',
      'Children of position i are at d·i + 1 up to d·i + d.',
      'Moving a value up is quicker (fewer levels).',
      'Moving a value down compares more children per level, so it costs more there.',
    ],
  },
  trie: {
    what: 'A trie stores words letter by letter in a tree: each step down is one letter, so each path from the top spells a word. Words that start the same share the same path, which makes autocomplete and prefix searches fast.',
    how: [
      'The root is empty. Each child edge is one letter.',
      'To store “cat”: go (or create) c → a → t, then mark that last node as the end of a word.',
      'To look up a word, follow its letters. The time depends only on the word’s length, not on how many words are stored.',
      'All words starting with “ca” are in the part of the tree below c → a.',
    ],
  },

  // ---------------- Tier 5: Balanced & disk trees ----------------
  'avl-tree': {
    what: 'An AVL tree is a binary search tree that fixes itself to stay short. After every insert, it checks that no node’s left and right sides differ in height by more than 1, and if one does, it rearranges a few nodes (a rotation).',
    how: [
      'Each node remembers its height.',
      'After inserting, walk back up checking each node’s balance (left height − right height).',
      'If a node is off by 2, rotate: lift its taller child up and move the node down, keeping the sorted order.',
      'The tree always stays about log n tall, so searches are always fast.',
    ],
  },
  'red-black-tree': {
    what: 'A red-black tree is another self-balancing binary search tree. Each node is coloured red or black, and a few colour rules guarantee no path is more than twice as long as any other. It’s what C#’s SortedDictionary and Java’s TreeMap use.',
    how: [
      'The root is black. A red node can’t have a red child.',
      'Every path from the root down to an empty spot has the same number of black nodes.',
      'After an insert or delete, fix any broken rule by recolouring and, if needed, a rotation or two.',
      'The rules keep the height at most about 2 × log n.',
    ],
  },
  'splay-tree': {
    what: 'A splay tree is a binary search tree that moves whatever you just used to the top. Things you use often stay near the top and become quick to reach.',
    how: [
      'After every search or insert, “splay” the node: rotate it up until it becomes the root.',
      'The rotations come in patterns depending on whether the node and its parent are on the same side.',
      'No balance information is stored.',
      'A single operation can be slow, but a long run of operations is fast on average.',
    ],
  },
  treap: {
    what: 'A treap gives every key a random number (its priority) and arranges the tree so keys are in search-tree order and priorities are in heap order. The randomness keeps the tree balanced on average, whatever order keys arrive in.',
    how: [
      'Each node has a key and a random priority.',
      'Keys follow the search-tree rule (smaller left, bigger right). Priorities follow the heap rule (smallest priority on top).',
      'Insert: add as a leaf like a normal search tree, then rotate it up while its priority is smaller than its parent’s.',
      'The shape ends up like a search tree built in random order, which is usually short.',
    ],
  },
  'b-tree': {
    what: 'A B-tree is a search tree built for data on disk, where each read is slow. Each node holds many sorted keys (hundreds), so the tree is very wide and very short. Finding one record among millions takes only a handful of reads.',
    how: [
      'Each node holds several sorted keys and one more child than keys.',
      'The keys split the number line into ranges; each child holds the keys in one range.',
      'Search: in each node, find which range your key is in and go to that child.',
      'When a node gets too full, it splits in two and pushes its middle key up. All leaves stay at the same depth.',
    ],
  },
  'b-plus-tree': {
    what: 'A B+ tree is a B-tree where all the actual data sits in the bottom row (the leaves), and those leaves are linked left to right. It’s the structure behind most database indexes, great for “everything between A and B”.',
    how: [
      'Upper nodes hold only signposts (keys) that direct you downwards.',
      'All records are in the leaves, in sorted order.',
      'Each leaf points to the next leaf.',
      'For a range: go down once to the start, then walk right along the leaves.',
    ],
  },

  // ---------------- Tier 6: Graphs & groups ----------------
  graph: {
    what: 'A graph is a set of dots (nodes) connected by lines (edges), with no rules about shape: no top, loops allowed, anything can connect to anything. Road maps, social networks and the web are graphs.',
    how: [
      'Nodes are the things; edges are the connections between them.',
      'Edges can be one-way (directed) or two-way (undirected).',
      'A node’s degree is how many edges touch it.',
      'Graphs can have cycles, so when exploring one you must remember where you’ve been.',
    ],
  },
  'adjacency-matrix': {
    what: 'An adjacency matrix stores a graph as a grid: one row and one column per node, and a mark in square [A][B] if there is an edge from A to B. Checking any connection is instant, but it always uses n × n squares.',
    how: [
      'Number the nodes 0 to n − 1.',
      'Put 1 (or the edge’s weight) in square [u][v] if there’s an edge from u to v, otherwise 0.',
      'Is there an edge u → v? Read one square.',
      'Listing all of u’s neighbours means reading u’s whole row.',
    ],
  },
  'adjacency-list': {
    what: 'An adjacency list stores a graph by giving each node its own list of neighbours. It only stores connections that really exist, so it’s the usual choice for big graphs where each node has few connections.',
    how: [
      'Keep an array with one entry per node.',
      'Each entry holds a list of that node’s neighbours.',
      'For a two-way edge A–B, B goes in A’s list and A goes in B’s list.',
      'Listing a node’s neighbours reads only its own list.',
    ],
  },
  'edge-list': {
    what: 'An edge list is the simplest way to store a graph: just a list of all the connections, each as a pair (from, to). It’s compact and easy to sort, but finding one node’s neighbours means reading the whole list.',
    how: [
      'Store each edge as (u, v), or (u, v, weight).',
      'Memory is one entry per edge.',
      'Sorting the list (e.g. by weight) is easy.',
      'To find a node’s neighbours, scan every edge.',
    ],
  },
  'union-find': {
    what: 'Union-find tracks groups that only ever merge, like friend groups joining up, and answers “are these two in the same group?” almost instantly. Each group elects a leader; everyone points towards their leader.',
    how: [
      'Keep a parent array: parent[x] is who x points to. A leader points to itself.',
      'find(x): follow parents until you reach the leader. Same leader = same group.',
      'union(a, b): find both leaders and make one point at the other (the smaller group joins the bigger one).',
      'After a find, point everyone you passed straight at the leader, so future finds are quicker.',
    ],
  },

  // ---------------- Tier 7: Range & spatial ----------------
  'prefix-sum': {
    what: 'A prefix-sum array stores running totals, so you can get the sum of any stretch of an array with one subtraction, instead of adding it all up each time.',
    how: [
      'P[0] = 0, and each P[i] = total of the first i items.',
      'Build it in one pass: each entry is the previous one plus the next item.',
      'Sum of items l to r = P[r + 1] − P[l].',
      'The catch: if one item changes, all the running totals after it change too.',
    ],
  },
  'sparse-table': {
    what: 'A sparse table answers questions like “what’s the smallest value between position l and r?” in one step, for data that never changes. It precomputes the answer for every stretch whose length is a power of two.',
    how: [
      'Row 0 holds the items themselves. Row 1 holds the min of each pair, row 2 of each 4, row 3 of each 8…',
      'Each entry is built from two entries of the row below.',
      'Any stretch is covered by two (possibly overlapping) blocks of the same power-of-two length.',
      'Answer = the smaller of those two blocks’ minimums. Overlap doesn’t matter for a minimum.',
    ],
  },
  'segment-tree': {
    what: 'A segment tree stores totals for the whole array, each half, each quarter and so on, in a tree. It answers range questions (sum, min…) and handles changes, both quickly.',
    how: [
      'The root covers the whole array; each node’s two children cover its left and right halves.',
      'Each node stores the total (or min…) of its stretch.',
      'A range question is answered by combining a few nodes that exactly cover the range.',
      'Changing one item only updates the nodes on the path from that item up to the root.',
    ],
  },
  'fenwick-tree': {
    what: 'A Fenwick tree (binary indexed tree) gives running totals that can also be updated quickly, using a single array and a clever trick with the binary form of the position numbers.',
    how: [
      'Positions start at 1. Entry f[i] stores the total of a chunk of items ending at i.',
      'The chunk size is the value of i’s lowest 1-bit (e.g. 12 = 1100 in binary → chunk of 4).',
      'Total up to i: add f[i], remove i’s lowest 1-bit, repeat until 0.',
      'Update item i: add to f[i], add i’s lowest 1-bit to i, repeat while in range.',
    ],
  },
  'interval-tree': {
    what: 'An interval tree stores ranges (like meeting times, 2pm–3pm) and quickly finds which ones overlap a given time. It’s a search tree by start time, where each node also remembers the latest end time below it.',
    how: [
      'Sort intervals into a search tree by their start.',
      'Each node also stores the maximum end time anywhere in its subtree.',
      'Two intervals overlap if each starts before the other ends.',
      'While searching, skip any subtree whose maximum end is before your query starts: nothing there can overlap.',
    ],
  },
  'kd-tree': {
    what: 'A k-d tree stores points on a map (x, y) in a search tree that alternates: one level splits by x, the next by y, and so on. It makes “what’s near this point?” fast.',
    how: [
      'At the root, compare x: smaller x goes left, bigger goes right.',
      'At the next level, compare y. Then x again, alternating.',
      'Each node splits its region of the map into two halves.',
      'Searches skip whole regions that are too far away.',
    ],
  },
  quadtree: {
    what: 'A quadtree divides a 2D area into four squares, and keeps dividing only the squares that are crowded. It’s used for maps and games to quickly find what’s near what.',
    how: [
      'Start with one square covering everything.',
      'If a square holds too many points, split it into four quarters (NW, NE, SW, SE).',
      'Empty areas stay as big squares; busy areas get divided finely.',
      'To find a point, pick the quarter it’s in at each level.',
    ],
  },

  // ---------------- Tier 8: Strings ----------------
  'radix-trie': {
    what: 'A radix trie is a trie with the boring parts squashed: any chain of letters with no branching is stored as one step labelled with the whole chunk. Far fewer nodes, same fast lookups.',
    how: [
      'Start from a trie (one letter per step).',
      'Wherever a node has just one child and isn’t the end of a word, merge it with the child.',
      'Edges now carry chunks of text, like “ter” instead of t → e → r.',
      'Inserting a word may split an edge where the new word differs.',
    ],
  },
  'suffix-array': {
    what: 'A suffix array lists every ending of a text (“banana”, “anana”, “nana”…) in alphabetical order. Any word you search for appears at the start of some ending, so you can look it up like in a dictionary.',
    how: [
      'A suffix is the text from some position to the end.',
      'Sort all the suffixes alphabetically, and store just their start positions.',
      'Every place a pattern occurs is the start of one of these suffixes.',
      'Binary search the sorted list to find the suffixes that start with your pattern.',
    ],
  },
  'suffix-tree': {
    what: 'A suffix tree puts every ending of a text into one compressed trie. Then checking whether any word appears in the text is just walking its letters from the top, however long the text is.',
    how: [
      'Add an end marker ($) to the text.',
      'Insert every suffix into a radix trie.',
      'Every substring of the text is a path from the root.',
      'The leaves below the end of your walk tell you where, and how often, the word occurs.',
    ],
  },
  rope: {
    what: 'A rope stores a very long text as a tree of small pieces, so text editors can insert and delete in the middle of huge files without copying the whole thing.',
    how: [
      'The leaves hold chunks of the text, in order from left to right.',
      'Each inner node stores the length of the text in its left side (its weight).',
      'To find character i: if i is less than the weight go left, otherwise subtract the weight and go right.',
      'Joining two ropes just makes a new node on top of both.',
    ],
  },

  // ---------------- Tier 9: Probabilistic ----------------
  'skip-list': {
    what: 'A skip list is a sorted linked list with express lanes on top that skip ahead. Coin flips decide which items get express stops. Searching becomes about as fast as a balanced tree, with simpler code.',
    how: [
      'The bottom level is a normal sorted linked list with every item.',
      'Each item flips a coin to decide whether it also appears on the level above, and again for the level above that…',
      'Search: start at the top-left, move right while the next item isn’t past your target, otherwise drop down a level.',
      'Higher levels skip far; lower levels fine-tune.',
    ],
  },
  'bloom-filter': {
    what: 'A Bloom filter answers “have I seen this before?” using a tiny amount of memory. It can say “definitely not” for sure, or “probably yes” with a small chance of being wrong.',
    how: [
      'Start with a row of bits, all 0.',
      'To add an item, compute a few hash positions for it and set those bits to 1.',
      'To check an item: if any of its bits is 0, it was never added. If all are 1, it probably was.',
      'Other items might have set those same bits, which is why “yes” is only “probably”.',
    ],
  },
  'count-min-sketch': {
    what: 'A count-min sketch estimates how many times each item appears in a huge stream of data, using a small fixed grid of counters. Its estimates can be a little too high, but never too low.',
    how: [
      'Keep a few rows of counters, each row with its own hash function.',
      'When an item arrives, add 1 to one counter in each row (the one its hash points to).',
      'To estimate an item’s count, look at its counter in each row and take the smallest.',
      'Other items sharing a counter only ever add to it, so the smallest is the most accurate.',
    ],
  },
  hyperloglog: {
    what: 'HyperLogLog estimates how many DIFFERENT items a huge stream contains (like unique visitors) using only a few kilobytes. It works by noticing how rare the luckiest-looking random pattern it has seen is.',
    how: [
      'Hash each item into random-looking bits.',
      'A hash that starts with many zeros in a row is rare: seeing 10 zeros suggests about 2¹⁰ ≈ 1,000 different items.',
      'Items are split into groups; each group remembers the longest run of zeros it has seen.',
      'Combining the groups gives an estimate. Repeats of the same item change nothing.',
    ],
  },

  // ---------------- Tier 10: Composites & advanced ----------------
  'ordered-map': {
    what: 'An ordered map (SortedDictionary in C#) stores key → value pairs and keeps the keys sorted. As well as looking up a key, you can ask “what comes just before or after this?” or “everything between these two?”.',
    how: [
      'It’s built on a self-balancing search tree (usually red-black).',
      'Look-ups, inserts and deletes each walk one path down the tree.',
      'Floor(x) = biggest key ≤ x; ceiling(x) = smallest key ≥ x.',
      'Walking the tree in order lists the keys sorted, so ranges are easy.',
    ],
  },
  'lru-cache': {
    what: 'An LRU cache keeps a limited number of items and, when full, throws out the one that hasn’t been used for the longest time. It combines a hash map and a doubly linked list so every operation is instant.',
    how: [
      'The linked list keeps items in order of last use: most recent at the front.',
      'The hash map lets you find any item’s place in the list instantly.',
      'Using an item moves it to the front of the list.',
      'When full, remove the item at the back of the list: it’s the least recently used.',
    ],
  },
  'lfu-cache': {
    what: 'An LFU cache throws out the item used the fewest times, instead of the least recently used one. Long-time favourites survive bursts of one-off items.',
    how: [
      'Each item keeps a count of how many times it’s been used.',
      'Items are grouped in lists by their count.',
      'Using an item moves it from the count-f list to the count-(f + 1) list.',
      'When full, remove from the lowest-count list (the least recent one in it, if there’s a tie).',
    ],
  },
  'sparse-matrix': {
    what: 'A sparse matrix is a grid that’s almost all zeros. Instead of storing every square, you store only the non-zero values and where they are, saving huge amounts of memory.',
    how: [
      'Store three lists: the non-zero values, the column of each, and where each row starts (row pointers).',
      'Row i’s values are between rowPtr[i] and rowPtr[i + 1] − 1.',
      'Reading a row only touches its non-zero values.',
      'Memory depends on how many non-zeros there are, not on the grid size.',
    ],
  },
  'mergeable-heaps': {
    what: 'Mergeable heaps are heaps built from linked trees instead of an array, so two whole heaps can be combined quickly. Useful when priority queues need to merge.',
    how: [
      'The heap is a collection of small trees, each with the smallest item on top.',
      'Two trees of the same size are combined by putting the one with the bigger top underneath the other.',
      'In a binomial heap, the tree sizes match the binary digits of the item count, and merging works like adding two binary numbers.',
      'Some versions (pairing, Fibonacci) delay the tidying until you remove the smallest.',
    ],
  },
  'persistent-structures': {
    what: 'A persistent structure never changes existing data. Each update creates a new version that reuses everything that didn’t change. You keep every old version for free, which is great for undo and history.',
    how: [
      'Nodes are never modified once created.',
      'To change one node, make a new copy of it, and new copies of every node above it (they need to point to the new copy).',
      'Everything else is shared between the old and new versions.',
      'Each version is just its own root pointer.',
    ],
  },
};

/** What each tier is about, in one plain sentence (shown on the map). */
export const TIER_INTRO: string[] = [
  'What memory is and how data is stored at the lowest level. Everything else is built on this.',
  'Storing items in a row: side by side in memory (arrays) or linked by pointers (lists).',
  'What the CPU physically does with those bits and addresses: gates, instructions, the call stack, caches.',
  'Lists with rules about where you add and remove: stacks, queues and friends.',
  'Finding things by name instantly, by turning keys into positions.',
  'Organising data in levels (trees) for fast searching and “smallest first”.',
  'Trees that keep themselves short, and wide trees built for disks.',
  'Networks of connections (graphs), and tracking groups that merge.',
  'Answering questions about stretches of data, and about points on a map.',
  'Structures for searching and editing large amounts of text.',
  'Trading a little accuracy for huge savings in time or memory.',
  'Combining earlier structures to build caches, sorted maps and version history.',
  'How the computer runs many programs at once: processes, threads, scheduling, locks and memory.',
  'How databases store, find and protect data: tables, indexes, joins, transactions and crash recovery.',
  'How computers talk: packets, routing, TCP, DNS, HTTP, and what to do when the network is slow.',
  'Putting it all together to build systems that stay fast and reliable as they grow.',
];

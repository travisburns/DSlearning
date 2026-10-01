/**
 * Real problems to solve in C# on LeetCode after passing a lesson. LeetCode runs your code against its own
 * tests, so the checking is done by a program, not by you or an AI.
 *
 * `note` says how to use this lesson on that problem when it isn't obvious (e.g. "build it yourself with
 * linear probing"). `none` explains lessons with no good graded problem.
 */

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Problem {
  n: number;
  slug: string;
  title: string;
  diff: Difficulty;
  note?: string;
}

export interface PracticeSet {
  problems: Problem[];
  none?: string;
}

const p = (n: number, slug: string, title: string, diff: Difficulty, note?: string): Problem => ({ n, slug, title, diff, note });

export const problemUrl = (pr: Problem) => `https://leetcode.com/problems/${pr.slug}/`;

// Shared problems, used by more than one lesson.
const SORT_ARRAY = (how: string) => p(912, 'sort-an-array', 'Sort an Array', 'Medium', how);
const DESIGN_HASHSET = (how: string) => p(705, 'design-hashset', 'Design HashSet', 'Easy', how);
const DESIGN_HASHMAP = (how: string) => p(706, 'design-hashmap', 'Design HashMap', 'Easy', how);
const RANGE_SUM_MUTABLE = (how: string) => p(307, 'range-sum-query-mutable', 'Range Sum Query - Mutable', 'Medium', how);

const NONE_RARE = 'No good graded problem exists for this one. You’ll rarely write it by hand; it’s here so you understand what it does and when to reach for it.';

export const PRACTICE: Record<string, PracticeSet> = {
  // ---------- Tier 0 ----------
  memory: {
    problems: [p(2502, 'design-memory-allocator', 'Design Memory Allocator', 'Medium', 'Memory as one long row of numbered slots, exactly as in the lesson.')],
  },
  pointers: {
    problems: [],
    none: 'Pointers are practised through every linked structure. Your first real pointer problems come with Singly Linked List.',
  },
  bits: {
    problems: [
      p(191, 'number-of-1-bits', 'Number of 1 Bits', 'Easy'),
      p(231, 'power-of-two', 'Power of Two', 'Easy'),
      p(190, 'reverse-bits', 'Reverse Bits', 'Easy'),
    ],
  },

  // ---------- Tier 1 ----------
  'static-array': {
    problems: [
      p(27, 'remove-element', 'Remove Element', 'Easy'),
      p(26, 'remove-duplicates-from-sorted-array', 'Remove Duplicates from Sorted Array', 'Easy'),
      p(88, 'merge-sorted-array', 'Merge Sorted Array', 'Easy', 'Fill from the back so nothing gets overwritten.'),
      p(189, 'rotate-array', 'Rotate Array', 'Medium'),
    ],
  },
  matrix: {
    problems: [
      p(867, 'transpose-matrix', 'Transpose Matrix', 'Easy'),
      p(54, 'spiral-matrix', 'Spiral Matrix', 'Medium'),
      p(48, 'rotate-image', 'Rotate Image', 'Medium'),
      p(73, 'set-matrix-zeroes', 'Set Matrix Zeroes', 'Medium'),
    ],
  },
  'dynamic-array': {
    problems: [
      p(1929, 'concatenation-of-array', 'Concatenation of Array', 'Easy'),
      p(1470, 'shuffle-the-array', 'Shuffle the Array', 'Easy'),
    ],
    none: 'LeetCode has no graded “build a growable array” problem. Use List<T> in these and remember what Add costs underneath.',
  },
  string: {
    problems: [
      p(344, 'reverse-string', 'Reverse String', 'Easy'),
      p(14, 'longest-common-prefix', 'Longest Common Prefix', 'Easy'),
      p(58, 'length-of-last-word', 'Length of Last Word', 'Easy'),
    ],
  },
  'linked-list': {
    problems: [
      p(206, 'reverse-linked-list', 'Reverse Linked List', 'Easy'),
      p(21, 'merge-two-sorted-lists', 'Merge Two Sorted Lists', 'Easy'),
      p(707, 'design-linked-list', 'Design Linked List', 'Medium', 'Build it yourself: nodes and next pointers.'),
      p(19, 'remove-nth-node-from-end-of-list', 'Remove Nth Node From End of List', 'Medium'),
    ],
  },
  'doubly-linked-list': {
    problems: [
      p(1472, 'design-browser-history', 'Design Browser History', 'Medium', 'Back and forward are prev and next pointers.'),
      p(707, 'design-linked-list', 'Design Linked List', 'Medium', 'Build the doubly linked version this time.'),
      p(430, 'flatten-a-multilevel-doubly-linked-list', 'Flatten a Multilevel Doubly Linked List', 'Medium'),
    ],
  },
  'circular-linked-list': {
    problems: [
      p(61, 'rotate-list', 'Rotate List', 'Medium', 'Join the tail to the head to make a ring, then cut it in the right place.'),
      p(1823, 'find-the-winner-of-the-circular-game', 'Find the Winner of the Circular Game', 'Medium'),
    ],
  },
  bitset: {
    problems: [
      p(2166, 'design-bitset', 'Design Bitset', 'Medium'),
      p(268, 'missing-number', 'Missing Number', 'Easy', 'Mark each number seen in a bool array (a bitset), then find the gap.'),
    ],
  },
  'binary-search': {
    problems: [
      p(704, 'binary-search', 'Binary Search', 'Easy'),
      p(35, 'search-insert-position', 'Search Insert Position', 'Easy'),
      p(74, 'search-a-2d-matrix', 'Search a 2D Matrix', 'Medium'),
      p(875, 'koko-eating-bananas', 'Koko Eating Bananas', 'Medium', 'Binary search on the answer, not on the array.'),
      p(153, 'find-minimum-in-rotated-sorted-array', 'Find Minimum in Rotated Sorted Array', 'Medium'),
    ],
  },
  'two-pointers': {
    problems: [
      p(125, 'valid-palindrome', 'Valid Palindrome', 'Easy'),
      p(167, 'two-sum-ii-input-array-is-sorted', 'Two Sum II - Input Array Is Sorted', 'Medium'),
      p(11, 'container-with-most-water', 'Container With Most Water', 'Medium'),
      p(15, '3sum', '3Sum', 'Medium'),
    ],
  },
  'sliding-window': {
    problems: [
      p(121, 'best-time-to-buy-and-sell-stock', 'Best Time to Buy and Sell Stock', 'Easy'),
      p(3, 'longest-substring-without-repeating-characters', 'Longest Substring Without Repeating Characters', 'Medium'),
      p(424, 'longest-repeating-character-replacement', 'Longest Repeating Character Replacement', 'Medium'),
      p(76, 'minimum-window-substring', 'Minimum Window Substring', 'Hard'),
    ],
  },
  'insertion-sort': {
    problems: [p(147, 'insertion-sort-list', 'Insertion Sort List', 'Medium')],
  },
  'counting-sort': {
    problems: [
      p(1051, 'height-checker', 'Height Checker', 'Easy', 'Heights are 1–100: count them instead of comparing.'),
      p(1122, 'relative-sort-array', 'Relative Sort Array', 'Easy'),
      p(75, 'sort-colors', 'Sort Colors', 'Medium', 'Only three values: count them.'),
    ],
  },
  'fast-slow-pointers': {
    problems: [
      p(876, 'middle-of-the-linked-list', 'Middle of the Linked List', 'Easy', 'LeetCode wants the SECOND middle when the length is even; adjust the stopping rule.'),
      p(141, 'linked-list-cycle', 'Linked List Cycle', 'Easy'),
      p(202, 'happy-number', 'Happy Number', 'Easy'),
      p(142, 'linked-list-cycle-ii', 'Linked List Cycle II', 'Medium'),
      p(287, 'find-the-duplicate-number', 'Find the Duplicate Number', 'Medium'),
    ],
  },
  'bit-manipulation': {
    problems: [
      p(136, 'single-number', 'Single Number', 'Easy'),
      p(338, 'counting-bits', 'Counting Bits', 'Easy'),
      p(268, 'missing-number', 'Missing Number', 'Easy', 'Solve it with XOR this time.'),
      p(371, 'sum-of-two-integers', 'Sum of Two Integers', 'Medium'),
    ],
  },

  // ---------- Tier 2 ----------
  stack: {
    problems: [
      p(20, 'valid-parentheses', 'Valid Parentheses', 'Easy'),
      p(155, 'min-stack', 'Min Stack', 'Medium'),
      p(150, 'evaluate-reverse-polish-notation', 'Evaluate Reverse Polish Notation', 'Medium'),
    ],
  },
  queue: {
    problems: [
      p(933, 'number-of-recent-calls', 'Number of Recent Calls', 'Easy'),
      p(232, 'implement-queue-using-stacks', 'Implement Queue using Stacks', 'Easy'),
      p(225, 'implement-stack-using-queues', 'Implement Stack using Queues', 'Easy'),
      p(2073, 'time-needed-to-buy-tickets', 'Time Needed to Buy Tickets', 'Easy'),
    ],
  },
  'circular-buffer': {
    problems: [p(622, 'design-circular-queue', 'Design Circular Queue', 'Medium', 'Exactly the lesson: a fixed array, head and tail wrapping with %.')],
  },
  deque: {
    problems: [
      p(641, 'design-circular-deque', 'Design Circular Deque', 'Medium'),
      p(1670, 'design-front-middle-back-queue', 'Design Front Middle Back Queue', 'Medium'),
    ],
  },
  'monotonic-stack': {
    problems: [
      p(496, 'next-greater-element-i', 'Next Greater Element I', 'Easy'),
      p(739, 'daily-temperatures', 'Daily Temperatures', 'Medium'),
      p(901, 'online-stock-span', 'Online Stock Span', 'Medium'),
      p(239, 'sliding-window-maximum', 'Sliding Window Maximum', 'Hard', 'The monotonic QUEUE version.'),
      p(84, 'largest-rectangle-in-histogram', 'Largest Rectangle in Histogram', 'Hard'),
    ],
  },
  'priority-queue': {
    problems: [
      p(1046, 'last-stone-weight', 'Last Stone Weight', 'Easy', 'Use C#’s PriorityQueue<TElement, TPriority>.'),
      p(703, 'kth-largest-element-in-a-stream', 'Kth Largest Element in a Stream', 'Easy'),
      p(973, 'k-closest-points-to-origin', 'K Closest Points to Origin', 'Medium'),
      p(215, 'kth-largest-element-in-an-array', 'Kth Largest Element in an Array', 'Medium'),
    ],
  },
  recursion: {
    problems: [
      p(509, 'fibonacci-number', 'Fibonacci Number', 'Easy'),
      p(206, 'reverse-linked-list', 'Reverse Linked List', 'Easy', 'Do it recursively this time.'),
      p(50, 'powx-n', 'Pow(x, n)', 'Medium', 'Halve n each call: x^n = (x^(n/2))².'),
    ],
  },
  'merge-sort': {
    problems: [
      p(88, 'merge-sorted-array', 'Merge Sorted Array', 'Easy', 'Just the merge step.'),
      SORT_ARRAY('Write merge sort yourself.'),
      p(148, 'sort-list', 'Sort List', 'Medium', 'Merge sort on a linked list: split with fast/slow pointers.'),
      p(315, 'count-of-smaller-numbers-after-self', 'Count of Smaller Numbers After Self', 'Hard', 'Count during the merge.'),
    ],
  },
  quicksort: {
    problems: [
      p(75, 'sort-colors', 'Sort Colors', 'Medium', 'A three-way partition around the value 1.'),
      p(215, 'kth-largest-element-in-an-array', 'Kth Largest Element in an Array', 'Medium', 'Quickselect: partition, then recurse into one side only.'),
      SORT_ARRAY('Write quicksort with a RANDOM pivot; a fixed pivot times out on sorted input.'),
    ],
  },
  backtracking: {
    problems: [
      p(78, 'subsets', 'Subsets', 'Medium'),
      p(46, 'permutations', 'Permutations', 'Medium'),
      p(39, 'combination-sum', 'Combination Sum', 'Medium'),
      p(79, 'word-search', 'Word Search', 'Medium'),
      p(51, 'n-queens', 'N-Queens', 'Hard'),
    ],
  },
  greedy: {
    problems: [
      p(455, 'assign-cookies', 'Assign Cookies', 'Easy'),
      p(55, 'jump-game', 'Jump Game', 'Medium'),
      p(435, 'non-overlapping-intervals', 'Non-overlapping Intervals', 'Medium', 'The meeting-room rule from the lesson: sort by end time.'),
      p(134, 'gas-station', 'Gas Station', 'Medium'),
    ],
  },

  // ---------- Tier 3 ----------
  'hash-function': {
    problems: [
      p(49, 'group-anagrams', 'Group Anagrams', 'Medium', 'The whole problem is choosing a good key: equal for anagrams, different otherwise.'),
      p(535, 'encode-and-decode-tinyurl', 'Encode and Decode TinyURL', 'Medium'),
    ],
  },
  'hash-chaining': {
    problems: [DESIGN_HASHMAP('Build it yourself with an array of buckets, each a list (chaining). Don’t use Dictionary.')],
  },
  'hash-open-addressing': {
    problems: [DESIGN_HASHSET('Build it yourself with one array and linear probing. Deletes need tombstones.')],
  },
  'hash-map': {
    problems: [
      p(1, 'two-sum', 'Two Sum', 'Easy'),
      p(217, 'contains-duplicate', 'Contains Duplicate', 'Easy'),
      p(242, 'valid-anagram', 'Valid Anagram', 'Easy'),
      p(49, 'group-anagrams', 'Group Anagrams', 'Medium'),
    ],
  },
  'cuckoo-hashing': {
    problems: [DESIGN_HASHSET('Build it with cuckoo hashing: two tables, two hash functions, kick out on collision.')],
  },
  'consistent-hashing': { problems: [], none: NONE_RARE },
  'hashing-patterns': {
    problems: [
      p(169, 'majority-element', 'Majority Element', 'Easy'),
      p(347, 'top-k-frequent-elements', 'Top K Frequent Elements', 'Medium'),
      p(128, 'longest-consecutive-sequence', 'Longest Consecutive Sequence', 'Medium'),
      p(560, 'subarray-sum-equals-k', 'Subarray Sum Equals K', 'Medium', 'Count prefix sums seen so far in a Dictionary.'),
    ],
  },
  'string-matching': {
    problems: [
      p(28, 'find-the-index-of-the-first-occurrence-in-a-string', 'Find the Index of the First Occurrence in a String', 'Easy', 'Write the rolling-hash (Rabin–Karp) version.'),
      p(187, 'repeated-dna-sequences', 'Repeated DNA Sequences', 'Medium'),
      p(686, 'repeated-string-match', 'Repeated String Match', 'Medium'),
    ],
  },
  'dp-1d': {
    problems: [
      p(70, 'climbing-stairs', 'Climbing Stairs', 'Easy'),
      p(746, 'min-cost-climbing-stairs', 'Min Cost Climbing Stairs', 'Easy'),
      p(198, 'house-robber', 'House Robber', 'Medium'),
      p(322, 'coin-change', 'Coin Change', 'Medium'),
      p(300, 'longest-increasing-subsequence', 'Longest Increasing Subsequence', 'Medium'),
    ],
  },
  'dp-2d': {
    problems: [
      p(62, 'unique-paths', 'Unique Paths', 'Medium'),
      p(64, 'minimum-path-sum', 'Minimum Path Sum', 'Medium'),
      p(1143, 'longest-common-subsequence', 'Longest Common Subsequence', 'Medium'),
      p(72, 'edit-distance', 'Edit Distance', 'Medium'),
    ],
  },

  // ---------- Tier 4 ----------
  tree: {
    problems: [
      p(589, 'n-ary-tree-preorder-traversal', 'N-ary Tree Preorder Traversal', 'Easy'),
      p(559, 'maximum-depth-of-n-ary-tree', 'Maximum Depth of N-ary Tree', 'Easy'),
    ],
  },
  'binary-tree': {
    problems: [
      p(104, 'maximum-depth-of-binary-tree', 'Maximum Depth of Binary Tree', 'Easy'),
      p(226, 'invert-binary-tree', 'Invert Binary Tree', 'Easy'),
      p(100, 'same-tree', 'Same Tree', 'Easy'),
    ],
  },
  bst: {
    problems: [
      p(700, 'search-in-a-binary-search-tree', 'Search in a Binary Search Tree', 'Easy'),
      p(701, 'insert-into-a-binary-search-tree', 'Insert into a Binary Search Tree', 'Medium'),
      p(98, 'validate-binary-search-tree', 'Validate Binary Search Tree', 'Medium'),
      p(230, 'kth-smallest-element-in-a-bst', 'Kth Smallest Element in a BST', 'Medium'),
      p(450, 'delete-node-in-a-bst', 'Delete Node in a BST', 'Medium'),
    ],
  },
  'binary-heap': {
    problems: [
      p(1046, 'last-stone-weight', 'Last Stone Weight', 'Easy', 'Write your own array-based max-heap instead of PriorityQueue.'),
      p(215, 'kth-largest-element-in-an-array', 'Kth Largest Element in an Array', 'Medium', 'Keep a min-heap of size k.'),
      p(295, 'find-median-from-data-stream', 'Find Median from Data Stream', 'Hard', 'Two heaps: a max-heap for the low half, a min-heap for the high half.'),
    ],
  },
  'd-ary-heap': {
    problems: [SORT_ARRAY('Write heapsort with a 4-ary heap: children of i are 4i+1 … 4i+4.')],
  },
  trie: {
    problems: [
      p(208, 'implement-trie-prefix-tree', 'Implement Trie (Prefix Tree)', 'Medium'),
      p(211, 'design-add-and-search-words-data-structure', 'Design Add and Search Words Data Structure', 'Medium'),
      p(212, 'word-search-ii', 'Word Search II', 'Hard'),
    ],
  },
  'tree-dfs': {
    problems: [
      p(94, 'binary-tree-inorder-traversal', 'Binary Tree Inorder Traversal', 'Easy'),
      p(144, 'binary-tree-preorder-traversal', 'Binary Tree Preorder Traversal', 'Easy'),
      p(145, 'binary-tree-postorder-traversal', 'Binary Tree Postorder Traversal', 'Easy'),
      p(112, 'path-sum', 'Path Sum', 'Easy'),
      p(543, 'diameter-of-binary-tree', 'Diameter of Binary Tree', 'Easy', 'Postorder: each node needs its children’s heights first.'),
    ],
  },
  heapsort: {
    problems: [SORT_ARRAY('Write in-place heapsort: build a max-heap, then swap the root to the end repeatedly.')],
  },

  // ---------- Tier 5 ----------
  'avl-tree': {
    problems: [
      p(110, 'balanced-binary-tree', 'Balanced Binary Tree', 'Easy', 'The AVL rule: heights of the two sides differ by at most 1.'),
      p(108, 'convert-sorted-array-to-binary-search-tree', 'Convert Sorted Array to Binary Search Tree', 'Easy'),
      p(1382, 'balance-a-binary-search-tree', 'Balance a Binary Search Tree', 'Medium'),
    ],
  },
  'red-black-tree': {
    problems: [
      p(729, 'my-calendar-i', 'My Calendar I', 'Medium', 'Use SortedSet or SortedDictionary: in .NET they are red-black trees.'),
      p(220, 'contains-duplicate-iii', 'Contains Duplicate III', 'Hard', 'A sliding window kept in a SortedSet.'),
    ],
    none: 'Nobody hand-writes a red-black tree in an interview. What you need is to know C#’s SortedSet is one, and what that makes fast.',
  },
  'splay-tree': { problems: [], none: NONE_RARE },
  treap: { problems: [], none: NONE_RARE },
  'b-tree': { problems: [], none: 'No graded problem exists. B-trees live inside databases and file systems; knowing why they are wide and shallow is the useful part.' },
  'b-plus-tree': { problems: [], none: 'No graded problem exists. B+ trees live inside databases; knowing why their leaves are linked is the useful part.' },

  // ---------- Tier 6 ----------
  graph: {
    problems: [
      p(1791, 'find-center-of-star-graph', 'Find Center of Star Graph', 'Easy'),
      p(997, 'find-the-town-judge', 'Find the Town Judge', 'Easy', 'Count in-degree and out-degree.'),
      p(1557, 'minimum-number-of-vertices-to-reach-all-nodes', 'Minimum Number of Vertices to Reach All Nodes', 'Medium'),
    ],
  },
  'adjacency-matrix': {
    problems: [p(547, 'number-of-provinces', 'Number of Provinces', 'Medium', 'The graph is given as an adjacency matrix.')],
  },
  'adjacency-list': {
    problems: [
      p(1971, 'find-if-path-exists-in-graph', 'Find if Path Exists in Graph', 'Easy', 'First turn the edge list into a List<int>[] adjacency list.'),
      p(133, 'clone-graph', 'Clone Graph', 'Medium'),
    ],
  },
  'edge-list': {
    problems: [
      p(1791, 'find-center-of-star-graph', 'Find Center of Star Graph', 'Easy', 'Answer straight from the edge list, no conversion.'),
      p(684, 'redundant-connection', 'Redundant Connection', 'Medium', 'Edges arrive as a list, one at a time.'),
    ],
  },
  'union-find': {
    problems: [
      p(547, 'number-of-provinces', 'Number of Provinces', 'Medium'),
      p(684, 'redundant-connection', 'Redundant Connection', 'Medium'),
      p(721, 'accounts-merge', 'Accounts Merge', 'Medium'),
    ],
  },
  bfs: {
    problems: [
      p(102, 'binary-tree-level-order-traversal', 'Binary Tree Level Order Traversal', 'Medium'),
      p(994, 'rotting-oranges', 'Rotting Oranges', 'Medium'),
      p(1091, 'shortest-path-in-binary-matrix', 'Shortest Path in Binary Matrix', 'Medium'),
      p(127, 'word-ladder', 'Word Ladder', 'Hard'),
    ],
  },
  dfs: {
    problems: [
      p(200, 'number-of-islands', 'Number of Islands', 'Medium'),
      p(695, 'max-area-of-island', 'Max Area of Island', 'Medium'),
      p(133, 'clone-graph', 'Clone Graph', 'Medium'),
      p(417, 'pacific-atlantic-water-flow', 'Pacific Atlantic Water Flow', 'Medium'),
    ],
  },
  'topological-sort': {
    problems: [
      p(207, 'course-schedule', 'Course Schedule', 'Medium', 'Kahn’s algorithm: can every course be taken?'),
      p(210, 'course-schedule-ii', 'Course Schedule II', 'Medium'),
    ],
  },
  dijkstra: {
    problems: [
      p(743, 'network-delay-time', 'Network Delay Time', 'Medium'),
      p(1631, 'path-with-minimum-effort', 'Path With Minimum Effort', 'Medium'),
      p(778, 'swim-in-rising-water', 'Swim in Rising Water', 'Hard'),
    ],
  },
  kruskal: {
    problems: [p(1584, 'min-cost-to-connect-all-points', 'Min Cost to Connect All Points', 'Medium')],
  },

  // ---------- Tier 7 ----------
  'prefix-sum': {
    problems: [
      p(1480, 'running-sum-of-1d-array', 'Running Sum of 1d Array', 'Easy'),
      p(303, 'range-sum-query-immutable', 'Range Sum Query - Immutable', 'Easy'),
      p(724, 'find-pivot-index', 'Find Pivot Index', 'Easy'),
      p(304, 'range-sum-query-2d-immutable', 'Range Sum Query 2D - Immutable', 'Medium'),
    ],
  },
  'sparse-table': { problems: [], none: NONE_RARE },
  'segment-tree': {
    problems: [
      RANGE_SUM_MUTABLE('Build a segment tree.'),
      p(315, 'count-of-smaller-numbers-after-self', 'Count of Smaller Numbers After Self', 'Hard'),
    ],
  },
  'fenwick-tree': {
    problems: [
      RANGE_SUM_MUTABLE('Build a Fenwick tree this time: i += i & -i.'),
      p(315, 'count-of-smaller-numbers-after-self', 'Count of Smaller Numbers After Self', 'Hard'),
    ],
  },
  'interval-tree': {
    problems: [
      p(56, 'merge-intervals', 'Merge Intervals', 'Medium'),
      p(57, 'insert-interval', 'Insert Interval', 'Medium'),
      p(731, 'my-calendar-ii', 'My Calendar II', 'Medium', 'An overlap question on a set of intervals.'),
    ],
  },
  'kd-tree': { problems: [], none: NONE_RARE },
  quadtree: {
    problems: [
      p(427, 'construct-quad-tree', 'Construct Quad Tree', 'Medium'),
      p(558, 'logical-or-of-two-binary-grids-represented-as-quad-trees', 'Logical OR of Two Binary Grids Represented as Quad-Trees', 'Medium'),
    ],
  },

  // ---------- Tier 8 ----------
  'radix-trie': {
    problems: [p(208, 'implement-trie-prefix-tree', 'Implement Trie (Prefix Tree)', 'Medium', 'Build the compressed version: edges hold whole strings, split them on insert.')],
  },
  'suffix-array': {
    problems: [
      p(1163, 'last-substring-in-lexicographical-order', 'Last Substring in Lexicographical Order', 'Hard'),
      p(1044, 'longest-duplicate-substring', 'Longest Duplicate Substring', 'Hard', 'Sorted suffixes: the answer is the longest common prefix of two neighbours.'),
    ],
  },
  'suffix-tree': {
    problems: [p(1044, 'longest-duplicate-substring', 'Longest Duplicate Substring', 'Hard', 'The deepest internal node of the suffix tree. Solving it with a suffix array or rolling hash is fine.')],
    none: 'Suffix trees are almost never written by hand; the suffix array does the same jobs in practice.',
  },
  rope: { problems: [], none: NONE_RARE },

  // ---------- Tier 9 ----------
  'skip-list': {
    problems: [p(1206, 'design-skiplist', 'Design Skiplist', 'Hard')],
  },
  'bloom-filter': { problems: [], none: NONE_RARE },
  'count-min-sketch': { problems: [], none: NONE_RARE },
  hyperloglog: { problems: [], none: NONE_RARE },

  // ---------- Tier 10 ----------
  'ordered-map': {
    problems: [
      p(981, 'time-based-key-value-store', 'Time Based Key-Value Store', 'Medium'),
      p(729, 'my-calendar-i', 'My Calendar I', 'Medium', 'SortedDictionary: find the neighbours of the new booking.'),
    ],
  },
  'lru-cache': {
    problems: [p(146, 'lru-cache', 'LRU Cache', 'Medium', 'Dictionary + doubly linked list, exactly as in the lesson.')],
  },
  'lfu-cache': {
    problems: [p(460, 'lfu-cache', 'LFU Cache', 'Hard')],
  },
  'sparse-matrix': { problems: [], none: NONE_RARE },
  'mergeable-heaps': { problems: [], none: NONE_RARE },
  'persistent-structures': {
    problems: [p(1146, 'snapshot-array', 'Snapshot Array', 'Medium', 'Keep a history per slot instead of copying the array.')],
  },

  // ---------- Systems: operating systems ----------
  'processes-threads': {
    problems: [p(1114, 'print-in-order', 'Print in Order', 'Easy', 'Concurrency problem: make three threads run in a fixed order. If C# isn’t offered, use Java: the ideas map one to one.')],
  },
  scheduling: {
    problems: [
      p(1834, 'single-threaded-cpu', 'Single-Threaded CPU', 'Medium', 'Shortest job first, with a priority queue of ready tasks.'),
      p(621, 'task-scheduler', 'Task Scheduler', 'Medium'),
    ],
  },
  locks: {
    problems: [
      p(1115, 'print-foobar-alternately', 'Print FooBar Alternately', 'Medium', 'Two threads taking turns. Use SemaphoreSlim or Monitor.'),
      p(1116, 'print-zero-even-odd', 'Print Zero Even Odd', 'Medium'),
      p(1195, 'fizz-buzz-multithreaded', 'Fizz Buzz Multithreaded', 'Medium'),
    ],
  },
  deadlock: {
    problems: [p(1226, 'the-dining-philosophers', 'The Dining Philosophers', 'Medium', 'Avoid deadlock with a fixed fork order.')],
  },
  'virtual-memory': {
    problems: [p(146, 'lru-cache', 'LRU Cache', 'Medium', 'The page replacement policy from this lesson.')],
  },
  'async-io': {
    problems: [],
    none: 'LeetCode has no graded async/await problem. The C# challenge (a concurrent fetcher) is the practice for this one.',
  },
};

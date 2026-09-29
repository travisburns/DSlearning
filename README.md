# DS Learning

Master every data structure by understanding it from its primitives, not by memorising facts.

Every structure is taught the same way:

1. **Problem**: a situation where what you already know hurts. Pick the idea you'd try.
2. **Primitive Lens**: four questions (layout, invariant, payoff, price). Answer each in your head before revealing it.
3. **Play** (for some structures): run real operations and watch memory and the touch counter.
4. **Checkpoint**: one card of each kind:
   - **Predict**: commit to what happens before you see it.
   - **Simulate**: you are the CPU; do the operation by clicking, in order.
   - **Count**: count the work and work out the cost yourself.
   - **Explain**: put together the reason it works (sort truths from misconceptions, order the reasoning, pick the plainest summary).
5. It then joins your **review pool**. Every review is a freshly generated problem, mixed across structures, so there's nothing to memorise.

Everything is graded by code. You rate your confidence before each answer: right-but-guessing doesn't count as mastered, and certain-but-wrong is flagged as a misconception and comes back first.

## Coverage

61 data structures in 11 tiers, unlocked in order (each builds on earlier ones):

| Tier | Structures |
|---|---|
| 0 Primitives | memory & addresses, pointers, bits & bytes |
| 1 Linear | static array, 2D array, dynamic array, string, singly / doubly / circular linked list, bitset |
| 2 Restricted | stack, queue, circular buffer, deque, monotonic stack/queue, priority queue |
| 3 Hashing | hash function, chaining, open addressing, hash set/map, cuckoo hashing, consistent hashing |
| 4 Core trees | tree basics, binary tree, BST, binary heap, d-ary heap, trie |
| 5 Balanced & disk trees | AVL, red-black, splay, treap, B-tree, B+ tree |
| 6 Graphs & groups | graph basics, adjacency matrix, adjacency list, edge list, union-find |
| 7 Range & spatial | prefix sums, sparse table, segment tree, Fenwick tree, interval tree, k-d tree, quadtree |
| 8 Strings | radix trie, suffix array, suffix tree, rope |
| 9 Probabilistic | skip list, Bloom filter, count-min sketch, HyperLogLog |
| 10 Composites | ordered map, LRU cache, LFU cache, sparse matrix, mergeable heaps, persistent structures |

## Run it

```bash
npm install
npm run dev      # open the printed URL
```

Progress is saved in your browser (localStorage). No account, no server.

Other commands:

```bash
npm test         # generates hundreds of cards per structure and checks every one is well-formed
npm run build    # production build into dist/ (serve with `npm run preview`)
```

## Code layout

```
src/
  engine/     types, memory helpers, randomness, mastery scheduling (spaced + interleaved)
  content/    one file per group of structures; each concept = problem, lens, playground, card generators
  ui/         map, lesson, review, card renderer, scene renderer (memory, arrays, lists, trees, graphs, grids)
  test/       content validation
docs/DESIGN.md  the design and reasoning behind it
```

Adding a structure means adding one `Concept` object in `src/content/` and registering it in `src/content/index.ts`. The engine and UI don't need to change. Algorithms will be added later the same way.

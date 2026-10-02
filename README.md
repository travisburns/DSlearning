# DS Learning

Master every data structure by understanding it from its primitives, not by memorising facts.

Every structure is taught the same way:

1. **Problem**: a situation where what you already know hurts. Pick the idea you'd try.
2. **Primitive Lens**: four questions (layout, invariant, payoff, price). Answer each in your head before revealing it.
3. **Play**: run real operations and watch memory and the touch counter, or step through a worked example one move at a time.
4. **Checkpoint**: one card of each kind:
   - **Predict**: commit to what happens before you see it.
   - **Simulate**: you are the CPU; do the operation by clicking, in order.
   - **Count**: count the work and work out the cost yourself.
   - **Break it**: break the structure's rule and say what fails (or find the node that breaks it).
   - **Explain**: put together the reason it works (sort truths from misconceptions, order the reasoning, pick the plainest summary).
   - **Connect**: what it's built from, and which primitive it rests on.
   - **Choose**: pick the right structure for a real situation.
   - **Transfer**: adapt it to a new problem.
5. It then joins your **review pool**, where **Rebuild** cards also appear: rebuild the structure (or its lens) from memory. Every review is a freshly generated problem, mixed across structures, so there's nothing to memorise.

**Moving on and mastery:**
- **Pass to unlock:** a lesson's checkpoint needs 6 of 8 right, answered “fairly sure” or “certain” (guesses don't count). Fail and you retry with brand-new problems. Passing unlocks the structures built on it.
- **Foundations first:** before a new lesson, any reviews due on the structures it's built from must be cleared.
- **Mastered (★):** every card type answered right, without guessing, on three separate days (practising early doesn't count). A later miss drops it back.

Everything is graded by code. You rate your confidence before each answer: right-but-guessing doesn't count as mastered, and certain-but-wrong is flagged as a misconception and comes back first.

The map shows five skills per structure: **Mechanism** (Predict, Simulate, Rebuild), **Invariant** (Break, Explain), **Cost** (Count), **Tradeoff** (Choose, Connect) and **Application** (Transfer). The **Stats** page shows how well your confidence matches your accuracy, your accuracy per card type, and your misconceptions.

## Coverage

61 data structures in 11 tiers (plus a computer architecture tier after the linear structures), unlocked in order (each builds on earlier ones):

| Tier | Structures |
|---|---|
| 0 Primitives | memory & addresses, pointers, bits & bytes |
| 1 Linear | static array, 2D array, dynamic array, string, singly / doubly / circular linked list, bitset |
| 2 Computer architecture | logic gates & binary arithmetic, the CPU cycle, the call stack, caches, pipelining & branch prediction, SIMD (systems lessons, see below) |
| 3 Restricted | stack, queue, circular buffer, deque, monotonic stack/queue, priority queue |
| 4 Hashing | hash function, chaining, open addressing, hash set/map, cuckoo hashing, consistent hashing |
| 5 Core trees | tree basics, binary tree, BST, binary heap, d-ary heap, trie |
| 6 Balanced & disk trees | AVL, red-black, splay, treap, B-tree, B+ tree |
| 7 Graphs & groups | graph basics, adjacency matrix, adjacency list, edge list, union-find |
| 8 Range & spatial | prefix sums, sparse table, segment tree, Fenwick tree, interval tree, k-d tree, quadtree |
| 9 Strings | radix trie, suffix array, suffix tree, rope |
| 10 Probabilistic | skip list, Bloom filter, count-min sketch, HyperLogLog |
| 11 Composites | ordered map, LRU cache, LFU cache, sparse matrix, mergeable heaps, persistent structures |

Plus 23 algorithms woven into the same path. Each one unlocks only after the data structures it uses have been passed (shown as rounded, dashed boxes on the map):

| Tier | Algorithms (needs) |
|---|---|
| 1 | binary search, two pointers, sliding window, insertion sort, counting sort (static array); fast & slow pointers (linked list); bit manipulation (bits) |
| 3 | recursion (stack); merge sort, quicksort (array + recursion); backtracking (recursion); greedy (merge sort) |
| 4 | counting with hash maps (hash map); string search (string + hash function); 1D DP (recursion + hash map); 2D DP (1D DP + 2D array) |
| 5 | tree traversals (binary tree + recursion); heapsort (binary heap) |
| 7 | BFS (graph + queue + adjacency list); DFS (graph + recursion + adjacency list); topological sort (BFS); Dijkstra (BFS + binary heap); Kruskal (union-find + edge list + merge sort) |

Algorithms use the same lesson steps and card types; their "4 questions" are what it works on, the key idea, why it's fast, and what it costs.

Then 29 systems lessons in five tracks, where the structures and algorithms show up inside real systems:

| Tier | Track | Lessons |
|---|---|---|
| 2 | Computer architecture | binary arithmetic & logic gates, fetch–decode–execute, machine code & the call stack, caches & the memory hierarchy, pipelining & branch prediction, SIMD |
| 12 | Operating systems | processes & threads, CPU scheduling, locks, deadlock, virtual memory & paging, async I/O |
| 13 | Databases | tables & SQL, indexes, joins, transactions, write-ahead log, isolation & MVCC |
| 14 | Networking | packets & IP routing, TCP, DNS, HTTP & APIs, latency/timeouts/retries |
| 15 | System design | caching layer, load balancing, sharding & replication, message queues, rate limiting |

Systems lessons use the same steps; their "4 questions" are what it's made of, what it guarantees, what that makes possible, and what it costs.

## Animations

Every lesson's **Try it** step opens with an animated walkthrough (`src/anim/`): values slide between slots, pointers re-aim, trees rotate and split, graphs light up as they are explored, with a caption at every step saying what is happening and why. Play, pause, step back and forward, change speed, or press **New example** to run it again on fresh random values. Each animation runs the real algorithm on those values, so every run is correct, not a canned recording.

- `src/anim/engine.ts`: the frame model (boxes, arrows, texts with stable ids) and the tweening between frames.
- `src/anim/kit.ts`: layout helpers (rows of slots, pointer tags, tree and graph layouts).
- `src/anim/scripts/*.ts`: one script per lesson, grouped by tier.
- `src/ui/AnimPlayer.tsx`: the player and its controls.

Tests run every animation 40 times with random values and check every frame.

## C# challenges

Every lesson also has a small work-style feature to build in C# (`challenges/`): a ticket, starter code with empty methods, xUnit tests that check behaviour **and speed**, and a reference solution. Examples: undo/redo with stacks, an API rate limiter with a queue, a URL shortener with hash maps, autocomplete with a trie, a build-task runner with topological sort, an LRU cache, a Bloom filter in front of a username check. The lesson's Done page shows the ticket and the exact command:

```
cd challenges/tests
dotnet test --filter Lesson=<lesson-id>
```

Speed tests fail an approach that gives correct answers but uses the wrong structure. `dotnet test -p:UseSolutions=true` runs every test against the reference solutions (all 249 pass). See `challenges/README.md`.

## C# practice

After you pass a lesson, its Done page lists real LeetCode problems that use it (`src/content/practice.ts`), easiest first, with a note where the link to the lesson isn't obvious. You solve them in C# on LeetCode, which checks your code with its own tests. A tick box per problem is your checklist (saved in the browser); it doesn't affect mastery. Lessons with no good graded problem (Bloom filter, B-tree, …) say so instead of padding the list. Passed lessons show a **C# practice →** button to get back there.

## Run it

```bash
npm install
npm run dev      # open the printed URL
```

Progress is saved in your browser (localStorage). No account, no server.

Other commands:

```bash
npm test         # generates hundreds of cards per structure and card type and checks every one is well-formed
npm run build    # production build into dist/ (serve with `npm run preview`)
```

## Code layout

```
src/
  engine/     types, memory helpers, randomness, mastery scheduling (spaced + interleaved) and stats
  content/    one file per group of structures; each concept = problem, lens, playground, card generators
              extras.ts: per-structure facts behind Break / Choose / Connect / Transfer
              generic.ts: turns those facts (and the lens) into cards for every structure
  ui/         map, lesson, review, stats, card renderer, scene renderer (memory, arrays, lists, trees, graphs, grids)
  test/       content validation
docs/DESIGN.md  the design and reasoning behind it
```

Adding a structure means adding one `Concept` object in `src/content/`, its entry in `src/content/extras.ts`, and registering it in `src/content/index.ts`. The engine and UI don't need to change. Algorithms are added the same way, with `kind: 'algorithm'` and their extras/learn text inline (`algoBasics.ts`, `sorting.ts`, `graphAlgos.ts`, `paradigms.ts`).

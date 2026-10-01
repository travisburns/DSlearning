# DSlearning — Design Brainstorm

> Goal: master every core data structure so the knowledge *sticks* — not by drilling facts,
> but by understanding each structure from its primitives and being able to rebuild,
> predict, break, explain, and apply it.
>
> Scope: all 61 data structures, plus 23 algorithms woven into the same path (each unlocks after the structures it uses).

---

## 1. Core philosophy

### 1.1 Everything is built from two primitives

Every data structure is a combination of:

1. **Contiguous slots** — a row of numbered boxes. Access by arithmetic (`base + i * size`).
   Fast to jump to; expensive to grow or shift.
2. **Links** — a box that holds the *address* of another box. Cheap to rewire;
   you can only follow them one hop at a time.

…plus **an invariant** — a rule the structure promises to keep true
(e.g. "parent ≤ children", "left < node < right", "items leave in the order they came").

So every structure is answered by the same four questions (the **Primitive Lens**):

| Question | Example: Binary heap |
|---|---|
| **Layout** — how does it sit in memory? | A plain array; children of `i` are at `2i+1`, `2i+2` |
| **Invariant** — what rule does it keep? | Every parent ≤ its children |
| **Payoff** — what does the rule make cheap? | Min is always at index 0 → O(1) peek |
| **Price** — what does keeping the rule cost? | Insert/remove must sift up/down → O(log n) |

If you can answer those four questions for a structure *without memorizing*, you understand it.
Every screen, card, and exercise in the app ladders back to this lens.

### 1.2 Never memorize Big-O — derive it

Complexity is never shown as a fact to remember. The simulator has a **touch counter**
(how many memory slots were read/written/followed). You run an operation at n = 8, 16, 32…
and *see* the curve. Big-O is the name you give to what you observed.

### 1.3 Reviews are generative, not recall

Traditional flashcards: "What's the time complexity of heap insert?" → you memorize "O(log n)".
Here: "Here's a heap. Insert 3. Tap the swaps in order." → a **freshly generated instance every time**.
You can't memorize the answer; you can only understand the mechanism. Spacing still happens,
but what gets spaced is a *skill* on a *concept*, never a string.

### 1.4 Pain drives the next structure

Each structure is unlocked by running into the limits of the previous one:

```
Array ──"can't grow"──▶ Dynamic Array ──"insert in middle is slow"──▶ Linked List
Linked List ──"finding a value is slow"──▶ Hash Table / BST
BST ──"can degrade into a list"──▶ Balanced trees
"I only ever want the smallest" ──▶ Heap
"lookup by prefix" ──▶ Trie
"things connected to things" ──▶ Graph
"are these two in the same group?" ──▶ Union-Find
```

You don't get told "here's a hash table." You get a problem you can't solve well yet,
and you're asked to invent something. The structure is the answer to *your* frustration.

---

## 2. Learning methods, and where each shows up

| Method | What it is | How we use it |
|---|---|---|
| **Productive failure / invention** | Attempt a problem *before* instruction | Every concept opens with "design something that…" |
| **First principles** | Build up from irreducible parts | The Primitive Lens + Memory Canvas |
| **Feynman technique** | Explain simply; gaps reveal themselves | "Explain" card: *assemble* the explanation from pieces (true vs. misconception, order the reasoning chain, pick the plain summary). Checked by code |
| **Prediction → observation** | Commit to a guess, then see | "What does memory look like after this op?" then animate |
| **Enactment / manual simulation** | *You* are the CPU | Tap swaps, drag pointers, move items by hand |
| **Retrieval practice** | Pull from memory, don't reread | Blank-canvas rebuilds, generated problems |
| **Spaced repetition** | Revisit at growing intervals | Scheduled per *concept × skill*, with new variants |
| **Interleaving** | Mix topics in a session | Review sessions mix structures, never blocks of one |
| **Discrimination / contrasting cases** | Compare near-neighbours | Array vs linked list side-by-side on the same op |
| **Elaborative interrogation** | Keep asking "why?" | "Why does this work?" / "Why not just use X?" prompts |
| **Error-driven learning** | Learn from what breaks | "Break it" cards: remove the invariant, watch it fail; find the bug |
| **Concreteness fading** | Concrete → pictorial → abstract | Real-world scene → box diagram → memory tape → code |
| **Dual coding** | Words + visuals together | Every concept has both a picture and a sentence |
| **Self-explanation** | Explain each step to yourself | After a simulation: "why did that swap happen?" |
| **Transfer / far application** | Use in new context | Design a variant structure (min-stack, LRU cache…) |
| **Metacognition / calibration** | Know what you know | Rate confidence *before* answering; track calibration |
| **Teaching (protégé effect)** | Teach it to learn it | "Fix the novice": a novice's explanation with a wrong step; find and fix it |

---

## 3. Interaction types (the "cards")

Each card type trains a different facet. A concept is **mastered** only when you pass several types,
not just one.

1. **Invent** — A problem with a pain point. Pick the idea you'd try from several; each idea gets
   feedback on why it would or wouldn't work.
2. **Predict** — Given a state and an operation, predict the resulting state (memory + abstract view).
3. **Simulate** — Perform the operation yourself: tap the swaps, drag the pointers, shift the slots.
   The app only checks; it never does it for you.
4. **Count** — How many touches does this op need at n = 8? n = 1024? Derive the growth rate.
5. **Break it** — Remove or violate the invariant (or read a buggy implementation).
   What goes wrong, and on which input?
6. **Choose** — A real-world scenario. Pick the structure *and justify it* in one sentence.
   Includes trick scenarios where the "obvious" answer is wrong.
7. **Connect** — "A hash table is just ___ + ___ + ___." Composing structures from primitives.
8. **Explain (Feynman)** — Assemble the explanation instead of writing prose: select the true
   statements and reject the misconceptions, put the cause→effect reasoning in order, spot the myth,
   pick the best plain one-sentence summary. Every piece is checked by code; no self-grading, no AI.
9. **Rebuild** — Blank canvas. After this sequence of ops, draw the structure from memory.
10. **Transfer** — Design a variant: stack with O(1) min, queue from two stacks, LRU cache,
    circular buffer, etc.

**No code cards.** Mastery of data structures is about mechanism, not syntax. If you can drive the
structure by hand on the Memory Canvas, writing it in C# (or anything) is just typing.

Every card is a **template + generator**, not a fixed question. (As built: Invent is the lesson's opening
problem; the other nine are card types. Build was dropped by decision; see section 10.) `Predict(heap, insert)` rolls a new
heap and a new value each time.

---

## 4. The lesson shape (first encounter with a concept)

```
 1. Hook      – concrete problem that hurts with what you already know
 2. Attempt   – invent something (it's fine to fail)
 3. Guide     – minimal, stepwise hints toward the real structure
 4. Play      – free manipulation in the simulator (memory view + abstract view)
 5. Predict   – guess, then watch
 6. Count     – derive the costs with the touch counter
 7. Break     – drop the invariant, see the failure
 8. Explain   – Feynman write-up, rubric self-check, one-sentence compression
 9. Apply     – choose / transfer problem
10. Seed      – concept enters the review pool as generative skills
```

Target: 15–25 minutes per concept. One new concept per session max.

---

## 5. Mastery model

Each concept has five **skills**, tracked separately:

- **Mechanism** — can you perform the operations? (Simulate, Predict, Rebuild)
- **Invariant** — do you know the rule and why it matters? (Break, Explain)
- **Cost** — can you derive the complexity? (Count)
- **Tradeoff** — do you know when *not* to use it? (Choose, Connect)
- **Application** — can you use/extend it in a new situation? (Transfer)

Each skill has a strength (0–1) that decays over time and is refreshed by successful generative
reviews. The review scheduler picks the weakest/most-decayed skills and **interleaves** across
concepts. A wrong answer spawns a targeted follow-up (e.g. failing a heap sift-down triggers a
"Break it" on the heap invariant), not just "see this again later".

Confidence is captured before each answer. High-confidence misses get priority (these are
misconceptions, the most valuable thing to fix).

The **Understanding Map** shows the concept graph colored by skill strength, so you can see
e.g. "I can *do* heaps but I can't *explain* why they're O(log n)".

---

## 6. Signature visual: the Memory Canvas

One canvas used for every structure, with two synced views:

- **Abstract view** — the textbook picture (boxes and arrows, trees, graphs).
- **Memory view** — a raw tape of numbered slots. A tree is revealed as nodes scattered through
  memory connected by stored addresses; a heap is revealed as *just an array*.

Toggling between them is the core "aha" engine: it makes it impossible to think of a data structure
as magic. Plus the **touch counter** and an **invariant light** (green while the invariant holds,
red the moment it's violated).

---

## 7. Curriculum (data structures only): the full catalog

Goal: **every data structure that shows up in CS courses, interviews, and real systems.**
Each tier is built from the tiers before it, so the order matters, but everything below is in scope.

**Tier 0 — Primitives (3)**
- Memory & addresses · Pointers / references · Bits & bytes

**Tier 1 — Linear (8)**
- Static array · 2D array / matrix · Dynamic array · String
- Singly linked list · Doubly linked list · Circular linked list · Bit array / bitset

**Tier 2 — Restricted interfaces (6)**
- Stack · Queue · Circular buffer · Deque · Monotonic stack / queue · Priority queue (the interface)

**Tier 3 — Hashing (6)**
- Hash function · Hash table: chaining · Hash table: open addressing · Hash set / hash map
- Cuckoo hashing · Consistent hashing

**Tier 4 — Core trees (6)**
- Tree basics · Binary tree · Binary search tree · Binary heap · d-ary heap · Trie

**Tier 5 — Balanced & disk trees (6)**
- AVL tree · Red-black tree · Splay tree · Treap · B-tree · B+ tree

**Tier 6 — Graphs & groups (5)**
- Graph basics (directed / undirected / weighted) · Adjacency matrix · Adjacency list · Edge list
- Union-Find (disjoint set)

**Tier 7 — Range & spatial (7)**
- Prefix-sum array · Sparse table · Segment tree · Fenwick tree · Interval tree · k-d tree · Quadtree

**Tier 8 — String structures (4)**
- Radix (compressed) trie · Suffix array · Suffix tree · Rope

**Tier 9 — Probabilistic (4)**
- Skip list · Bloom filter · Count-min sketch · HyperLogLog

**Tier 10 — Composites & advanced (6)**
- Ordered map / tree map · LRU cache · LFU cache · Sparse matrix
- Mergeable heaps (binomial / Fibonacci / pairing) · Persistent (immutable) structures

**Total: 61.** Anything more exotic (van Emde Boas, wavelet trees, …) can be added the same way.

Real-world anchors for each: undo/redo (stack), print queue (queue), phone contacts (hash table),
autocomplete (trie), task scheduler (heap), maps & social networks (graph), friend groups (union-find).

---

## 8. Architecture (as built)

```
src/
  engine/
    types.ts       ← Concept, Card, Scene/View definitions
    memory.ts      ← memory-tape helpers (cells, nodes, lists)
    mastery.ts     ← per concept × card-type levels, spacing, interleaving, confidence
  content/         ← one file per group of structures; each Concept =
                     problem (hook), lens, optional playground, card generators
  ui/
    SceneView      ← draws memory tapes, arrays, lists, stacks, ring buffers,
                     rows, grids, buckets, trees and graphs; any of them clickable
    CardView       ← choice / multi-select / order / number / click-sequence cards
    Lesson, Review, Home (the understanding map), Playground
```

- Content is **data**; the engine doesn't know what a heap is. Algorithms will be a new content
  set reusing the same scene renderer (algorithms *operate on* these structures).
- Local-first: progress saved in the browser, no account, no backend.
- `npm test` generates hundreds of cards per structure and checks each one is well-formed
  (exactly one right answer, no duplicate options, every click target actually drawn).

**Stack:** React + TypeScript + Vite. No server, no AI, no login. Every answer is checked by code.

---

## 9. Status

Built:
- All 61 structures, each with a problem, lens, Play step, and generated cards of all nine types:
  Predict, Simulate, Count, Break, Explain, Connect, Choose, Rebuild, Transfer.
- Hands-on playgrounds for 12 structures; every other structure gets a step-through worked example.
- Break / Choose / Connect / Transfer are driven by hand-written facts per structure (`content/extras.ts`);
  Rebuild uses the lens. Trees, heaps and linear structures also get hands-on Rebuild and Break cards
  (rebuild the final state value by value; click the node that breaks the rule).
- Spaced, interleaved reviews with confidence rating; the map shows the five skills from section 5.
- Stats page: calibration (confidence vs. accuracy), accuracy per card type, misconceptions.
- An animated, captioned walkthrough for all 84 lessons (2D SVG, tweened between steps), generated from the real
  algorithm on random values, with play/pause/step/speed controls.
- C# practice: real LeetCode problems per lesson after passing it (graded by LeetCode's tests).

- 23 algorithms in the same path (`kind: 'algorithm'`): searching, two pointers, sliding window,
  fast/slow pointers, bit tricks, hashing patterns, string search, recursion, five sorts, backtracking,
  greedy, 1D/2D DP, tree traversals, BFS, DFS, topological sort, Dijkstra, Kruskal. Each has prerequisites
  on the structures it uses, its tier is the highest tier of those, and it gets all nine card types.
  Generic cards compare algorithms with algorithms; the lens is read as setup / key idea / payoff / price.

---

## 10. Decisions

- **Platform:** simple front-end web project. Nothing elaborate.
- **Code:** none. The app teaches mechanism; syntax isn't the goal.
- **Checking:** everything is graded programmatically. No self-grading, no AI.
- **Scope:** all 61 data structures in section 7, plus algorithms placed after the structures they use.

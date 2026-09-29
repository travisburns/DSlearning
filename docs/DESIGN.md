# DSlearning — Design Brainstorm

> Goal: master every core data structure so the knowledge *sticks* — not by drilling facts,
> but by understanding each structure from its primitives and being able to rebuild,
> predict, break, explain, and apply it.
>
> Scope right now: **data structures only.** Algorithms come later as a separate content pack.

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
| **Feynman technique** | Explain simply; gaps reveal themselves | "Explain it" card: write plain-language explanation, check against rubric, fix gaps, simplify again |
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
| **Teaching (protégé effect)** | Teach it to learn it | "Teach the novice" mode — explain to a confused persona |
| **Build it** | Implementation | Code the structure against a test suite (later phase) |

---

## 3. Interaction types (the "cards")

Each card type trains a different facet. A concept is **mastered** only when you pass several types,
not just one.

1. **Invent** — A problem with a pain point. Sketch a structure on the canvas that solves it.
   Hints are stepwise and cost "hint points" (fewer hints = stronger signal).
2. **Predict** — Given a state and an operation, predict the resulting state (memory + abstract view).
3. **Simulate** — Perform the operation yourself: tap the swaps, drag the pointers, shift the slots.
   The app only checks; it never does it for you.
4. **Count** — How many touches does this op need at n = 8? n = 1024? Derive the growth rate.
5. **Break it** — Remove or violate the invariant (or read a buggy implementation).
   What goes wrong, and on which input?
6. **Choose** — A real-world scenario. Pick the structure *and justify it* in one sentence.
   Includes trick scenarios where the "obvious" answer is wrong.
7. **Connect** — "A hash table is just ___ + ___ + ___." Composing structures from primitives.
8. **Explain (Feynman)** — Write it plainly for a 12-year-old. Self-check against a rubric of
   key ideas (later: optional AI feedback). Then compress to one sentence.
9. **Rebuild** — Blank canvas. After this sequence of ops, draw the structure from memory.
10. **Transfer** — Design a variant: stack with O(1) min, queue from two stacks, LRU cache,
    circular buffer, etc.
11. **Build** *(later phase)* — Implement it in code; hidden tests probe the invariant and edge cases.

Every card is a **template + generator**, not a fixed question. `Predict(heap, insert)` rolls a new
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
- **Application** — can you use/extend it in a new situation? (Transfer, Build)

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

## 7. Curriculum (data structures only)

**Tier 0 — Primitives**
- Memory as numbered slots; values vs. references/pointers; index arithmetic

**Tier 1 — Linear foundations**
- Static array
- Dynamic array (growth, doubling, amortized cost)
- Singly linked list → doubly linked list (sentinels)

**Tier 2 — Restricted interfaces** (same guts, fewer doors)
- Stack · Queue · Deque · Circular buffer

**Tier 3 — Hashing**
- Hash functions · Hash table (chaining, open addressing, load factor, resizing) · Hash set

**Tier 4 — Trees**
- Tree vocabulary · Binary tree · Binary search tree
- Balanced BST (rotations; AVL / red-black as ideas)
- Binary heap / priority queue
- Trie

**Tier 5 — Networks & groups**
- Graph (adjacency list vs. matrix)
- Union-Find (disjoint set)

**Tier 6 — Composites & advanced** (optional)
- LRU cache (hash + DLL) · Skip list · B-tree · Segment tree · Fenwick tree · Bloom filter

Real-world anchors for each: undo/redo (stack), print queue (queue), phone contacts (hash table),
autocomplete (trie), task scheduler (heap), maps & social networks (graph), friend groups (union-find).

---

## 8. Architecture (built to add algorithms later)

```
content/
  ds/                  ← data-structures pack (now)
    concepts/*.ts      ← concept: lens answers, prerequisites, hooks, rubrics
    generators/*.ts    ← instance generators per concept
  algo/                ← algorithms pack (later)
engine/
  concept-graph        ← prerequisites, pain-driven unlocks
  mastery              ← skill strengths, decay, scheduling, interleaving
  cards/               ← one plugin per interaction type
  simulator/           ← memory model + touch counter + invariant checks
ui/
  MemoryCanvas, Understanding Map, Session runner, Feynman editor
```

- Content is **data**, cards are **plugins**, the engine doesn't know what a heap is.
  Algorithms become a new content pack reusing the same simulator (algorithms *operate on* these
  structures, so the canvas carries straight over).
- Local-first: progress in the browser (IndexedDB), no account needed. Sync can come later.

**Proposed stack:** React + TypeScript + Vite, SVG-based canvas, IndexedDB for progress,
Vitest for tests. Optional later: Claude API for Feynman feedback and Socratic hints.

---

## 9. Proposed build order

1. **MVP** — engine skeleton, Memory Canvas, 4 card types (Predict, Simulate, Count, Explain),
   Tier 0–2 content (primitives, arrays, linked lists, stack/queue).
2. Invent / Break / Choose / Rebuild cards; mastery scheduler + Understanding Map.
3. Tiers 3–4 (hashing, trees, heaps, tries).
4. Tier 5–6, Transfer cards, confidence calibration dashboard.
5. Build-it (code) cards; optional AI Feynman feedback.
6. Algorithms pack.

---

## 10. Open questions

- Platform: web app (default) vs. mobile vs. desktop?
- Should code appear from day one, and in which language?
- AI feedback on Feynman explanations (needs an API key) or rubric self-grading only?
- Solo tool, or eventually shareable with others?

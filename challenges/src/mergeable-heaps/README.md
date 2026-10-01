# Merge two job queues instantly (leftist heap)

**The ticket.** Each worker machine has its own priority queue of jobs. When a machine goes down, its whole queue must be merged into another machine's queue right away. With array heaps that means re-inserting everything (O(n log n)). A **leftist heap** merges two heaps in O(log n).

**Build** `LeftistHeap` in `LeftistHeap.cs` (min-heap of ints, built from nodes with Left, Right and a `Rank` = distance to the nearest missing child):

- `static Node? Merge(Node? a, Node? b)`: the smaller root stays on top; merge the other heap into its RIGHT child; then if the right child's rank is bigger than the left's, swap them (that keeps the right spine short); rank = right rank + 1.
- `void Push(int x)` = merge with a one-node heap. `int Pop()` = take the root, merge its two children (throw if empty). `int Peek()`, `int Count`.
- `void Absorb(LeftistHeap other)`: merge `other`'s jobs into this heap; `other` ends up empty.

**Rules.** No `PriorityQueue` or sorting. Absorb must be O(log n), not one push per job.

**Run:** `dotnet test --filter Lesson=mergeable-heaps`

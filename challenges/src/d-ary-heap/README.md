# Timer queue with a d-ary heap

**The ticket.** A network server keeps hundreds of thousands of timeouts and adds new ones far more often than it fires them. A heap with more children per node is shorter, so inserts (which sift up) get cheaper. Make the number of children configurable.

**Build** `DHeap` in `DHeap.cs` (a min-heap of `long` deadlines):

- `DHeap(int d)`: each node has up to `d` children. Children of `i` are `d*i + 1` … `d*i + d`; the parent of `i` is `(i - 1) / d`.
- `void Push(long deadline)`, `long Pop()` (smallest; throw if empty), `long Peek()`, `int Count`.
- `int Height`: levels below the root (0 for one item).

**Rules.** No `PriorityQueue` or sorting. It must work for any d ≥ 2.

**Run:** `dotnet test --filter Lesson=d-ary-heap`

# Build your own priority queue (binary heap)

**The ticket.** Our game engine's scheduler needs "give me the event with the smallest timestamp" millions of times per second, on a platform without `PriorityQueue`. Write a **binary min-heap** stored in an array.

**Build** `MinHeap` in `MinHeap.cs` (ints, smallest first):

- `void Push(int x)`: add at the end, then sift up (swap with the parent at `(i - 1) / 2` while smaller).
- `int Pop()`: take the root, move the last item to the root, sift down (swap with the smaller child at `2i + 1` / `2i + 2` while bigger). Throw `InvalidOperationException` if empty.
- `int Peek()`, `int Count`.
- `static List<int> SmallestK(IEnumerable<int> stream, int k)`: the k smallest values of a huge stream, ascending, keeping at most k items in memory (hint: a heap where the root is the largest of the k kept so far: push negatives).

**Rules.** No `PriorityQueue`, `SortedSet` or sorting inside the heap. Push and Pop are O(log n).

**Run:** `dotnet test --filter Lesson=binary-heap`

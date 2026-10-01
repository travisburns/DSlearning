# Thread-safe job queue (producer / consumer)

**The ticket.** Web request threads put jobs (send email, resize image) into a queue; background worker threads take them out. The queue must be safe with many threads on both sides, and bounded: if it fills up, producers wait instead of using unlimited memory; if it's empty, workers wait instead of spinning.

**Build** `BoundedQueue<T>` in `BoundedQueue.cs`:

- `BoundedQueue(int capacity)`.
- `void Enqueue(T item)`: waits while the queue is full.
- `T Dequeue()`: waits while it's empty.
- `int Count`.

**Hint.** One lock object guards a `Queue<T>`. Inside `lock (_gate) { … }`: wait with `Monitor.Wait(_gate)` in a `while` loop (not `if`: re-check the condition after waking), and after changing the queue call `Monitor.PulseAll(_gate)` to wake waiters.

**Rules.** No `BlockingCollection`, `ConcurrentQueue` or `Channel`. Every item is delivered exactly once.

**Run:** `dotnet test --filter Lesson=locks`

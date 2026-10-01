# Run jobs on a fixed number of worker threads

**The ticket.** The image service gets batches of slow jobs (resizing, uploading). Running them one after another is too slow; starting a thread per job would create thousands of threads. Run them on a fixed number of **worker threads** instead.

**Build** in `Workers.cs`:

- `void RunAll(IReadOnlyList<Action> jobs, int workers)`: start exactly `workers` threads (`new Thread(...)`); each repeatedly takes the next job that hasn't been taken and runs it, until none are left. Every job must run exactly once. Return only when all are finished (`Join` the threads).
- `long SumInParallel(int[] data, int threads)`: split the array into `threads` slices; each thread sums its own slice into its **own** local variable; then add the slice totals together.

**Hint.** Taking "the next job" is shared state: two threads must never take the same one. `Interlocked.Increment` on a shared index does it safely.

**Rules.** Use `Thread`, not `Parallel` or `Task.Run`: this lesson is about threads themselves.

**Run:** `dotnet test --filter Lesson=processes-threads`

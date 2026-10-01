# Fetch many URLs at once, politely

**The ticket.** A price-comparison page fetches data from 100 shop APIs. Awaiting them one by one takes 100 × the response time. Starting all 100 at once gets us rate-limited by the shops. Fetch them **concurrently, but at most N at a time**, and return the results in the original order.

**Build** in `Fetcher.cs`:

- `Task<string[]> FetchAllAsync(IReadOnlyList<string> urls, Func<string, Task<string>> fetch, int maxConcurrent)`: result `i` is the reply for `urls[i]`.
- `Task<string?> WithTimeoutAsync(Func<Task<string>> work, TimeSpan timeout)`: the result, or null if it takes longer than `timeout` (use `Task.WhenAny` with `Task.Delay`).

**Hint.** A `SemaphoreSlim(maxConcurrent)` is a counter of free slots: `await WaitAsync()` before each fetch and `Release()` in a `finally`. Start all the tasks, then `await Task.WhenAll`.

**Rules.** Never block: no `.Result`, `.Wait()` or `Thread.Sleep`.

**Run:** `dotnet test --filter Lesson=async-io`

# Keep the last N log lines

**The ticket.** A service writes millions of log lines. For crash reports we only need the last `N`, always in fixed memory: when full, a new line overwrites the oldest.

**Build** `RingLog` in `RingLog.cs` with a plain `string[]`, a head index and a count:

- `RingLog(int capacity)`.
- `void Add(string line)`: O(1). Overwrite the oldest when full.
- `List<string> Lines()`: oldest to newest.
- `int Count`.

**Rules.** No `Queue<T>` or `List<T>` inside (only for the `Lines()` result), and nothing ever shifts: positions wrap with `%`.

**Run:** `dotnet test --filter Lesson=circular-buffer`

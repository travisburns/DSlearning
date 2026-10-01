# Live vote counter

**The ticket.** During a live TV vote, candidates are numbered 1..n and votes stream in. The screen shows "votes for candidates 1–k" bands and ranges, refreshed constantly. A **Fenwick tree** (binary indexed tree) does point updates and prefix totals in O(log n) with one array and a few lines.

**Build** `VoteCounter` in `VoteCounter.cs` (candidates are 1-based):

- `VoteCounter(int candidates)`.
- `void Add(int candidate, long votes)`: `for (i = candidate; i <= n; i += i & -i) tree[i] += votes;`
- `long UpTo(int k)`: total for candidates 1..k: `for (i = k; i > 0; i -= i & -i) sum += tree[i];`
- `long Between(int a, int b)`: inclusive.
- `long Votes(int candidate)`.

**Rules.** O(log n) each. `i & -i` is the lowest set bit of i: it decides which range each slot covers.

**Run:** `dotnet test --filter Lesson=fenwick-tree`

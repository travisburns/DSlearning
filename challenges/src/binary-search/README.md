# Find the bad release, and look up tax brackets

**The ticket.** Two features, same idea.

1. **Bisect.** Release 1 was fine; somewhere along the way a release broke the build, and every release after it is broken too. Checking a release is slow (a full test run), so find the first bad one with as few checks as possible.
2. **Tax brackets.** Given the sorted lower limits of each bracket (e.g. `[0, 10000, 40000, 100000]`), return which bracket an income falls in.

**Build** in `Bisect.cs`:

- `int FirstBad(int releases, Func<int, bool> isBad)`: releases are numbered 1..releases and at least the last one is bad. Use at most ⌈log₂ n⌉ + 1 calls to `isBad`.
- `int BracketIndex(int[] lowerLimits, long income)`: the index of the last limit ≤ income.

**Rules.** No `Array.BinarySearch`. The tests count your `isBad` calls.

**Run:** `dotnet test --filter Lesson=binary-search`

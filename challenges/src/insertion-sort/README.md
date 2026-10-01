# Live leaderboard

**The ticket.** A game shows a top list that's always sorted, highest score first. Scores arrive one at a time, and the list is almost always already in order when a new score lands, so we insert each score straight into place instead of re-sorting the whole list.

**Build** in `Leaderboard.cs`:

- `void Add(int score)`: append, then slide it left past every smaller score (insertion sort's inner loop).
- `List<int> Top(int k)`: the k highest, in order.
- `static void InsertionSort(int[] a)`: sort an array ascending in place, the same way.

**Rules.** Don't use `Sort`, `OrderBy` or `BinarySearch`. On nearly-sorted data (a few out-of-place items) insertion sort is close to O(n); the speed test checks that.

**Run:** `dotnet test --filter Lesson=insertion-sort`

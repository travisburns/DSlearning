# Peak traffic and longest browsing streak

**The ticket.** The analytics dashboard needs two numbers.

1. **Peak load:** given requests per second for a whole day, the highest total over any `k` consecutive seconds.
2. **Longest unique streak:** given the pages a user visited in order, the length of the longest run with no page repeated.

**Build** in `Traffic.cs`:

- `long PeakLoad(int[] perSecond, int k)`: keep a running window sum; slide it by adding the new second and subtracting the one that left.
- `int LongestUniqueStreak(string[] pages)`: grow the window on the right; when a page repeats, shrink from the left until it's unique again.

**Rules.** O(n) each: re-adding the whole window every step is far too slow for a day of data.

**Run:** `dotnet test --filter Lesson=sliding-window`

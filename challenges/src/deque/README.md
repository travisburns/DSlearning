# Stock ticker: highest price in every window

**The ticket.** The trading screen shows, for every minute, the highest price over the last `k` minutes. A day has hundreds of thousands of ticks and `k` can be large, so re-scanning each window is too slow.

**Build** in `Ticker.cs`:

- `int[] WindowMax(int[] prices, int k)`: element `i` is the max of `prices[i..i+k-1]` (so the result has `n - k + 1` items).

**Hint.** Keep a double-ended queue of *indexes* whose prices are decreasing from front to back. New prices push out smaller ones from the back (they can never be the max again); the front falls out when it leaves the window. C#'s `LinkedList<int>` works as a deque (`AddLast`, `RemoveFirst`, `RemoveLast`).

**Rules.** O(n) total, whatever k is.

**Run:** `dotnet test --filter Lesson=deque`

# Price history: "what was the price at time T?"

**The ticket.** A pricing service records price changes with timestamps. Customer support asks "what was the price at 14:32 on that day?", meaning the most recent change at or before that moment. Reports also need every change within a time range, in order. A hash map can't answer "at or before"; an **ordered map** can.

**Build** `PriceHistory` in `PriceHistory.cs` (timestamps are `long`):

- `void Record(long time, decimal price)` (overwrite if that exact time exists).
- `decimal? PriceAt(long time)`: the price of the latest record with time ≤ `time`, or null.
- `List<(long Time, decimal Price)> Between(long from, long to)`: inclusive, in time order.
- `(long Time, decimal Price)? Latest`.

**Hint.** Keep the times in a sorted structure. `SortedList<long, decimal>` gives you a sorted `Keys` list you can binary-search; `SortedDictionary` is a red-black tree. Either way, the "at or before" query is a binary search, not a scan.

**Rules.** PriceAt must be O(log n).

**Run:** `dotnet test --filter Lesson=ordered-map`

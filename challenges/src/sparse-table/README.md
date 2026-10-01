# Coldest day in any date range

**The ticket.** A weather site has decades of daily temperatures (they never change) and answers "what was the coldest day between these dates?" millions of times. Precompute a **sparse table** so every query is O(1).

**Build** `ColdestDay` in `ColdestDay.cs`:

- `ColdestDay(int[] temps)`: `table[k][i]` = the minimum of the 2^k values starting at i. Level 0 is the data; level k is built from two halves of level k - 1.
- `int MinBetween(int from, int to)`: inclusive. Let k = ⌊log₂(length)⌋; the answer is the min of the window of 2^k starting at `from` and the one ending at `to` (they overlap, which is fine for a minimum).

**Rules.** O(n log n) to build, O(1) per query. No loops over the range in a query.

**Run:** `dotnet test --filter Lesson=sparse-table`

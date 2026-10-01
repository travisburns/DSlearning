# Sales report: revenue between any two days

**The ticket.** The finance dashboard lets people drag a date range and instantly see total revenue. Daily figures for years of history are loaded once and don't change; then the dashboard fires thousands of range queries.

**Build** `SalesReport` in `SalesReport.cs`:

- `SalesReport(long[] daily)`: precompute `prefix[i]` = total of the first i days (prefix[0] = 0).
- `long Between(int from, int to)`: total for days from..to inclusive, in O(1): `prefix[to + 1] - prefix[from]`.
- `double AverageBetween(int from, int to)`.
- `int FirstDayReaching(long target)`: the first day on which the running total reaches `target`, or -1. (The prefix array is sorted, so binary search works.)

**Rules.** Queries O(1) (FirstDayReaching O(log n)). No looping over the range.

**Run:** `dotnet test --filter Lesson=prefix-sum`

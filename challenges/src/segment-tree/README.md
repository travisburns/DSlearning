# Live sales dashboard

**The ticket.** Like the sales report, but figures change all day long (refunds, late orders). We need both "total and best day between two dates" and "update one day's figure", each fast. Prefix sums would need an O(n) rebuild after every update; a **segment tree** does both in O(log n).

**Build** `LiveSales` in `LiveSales.cs`:

- `LiveSales(int days)`: all zero.
- `void Set(int day, long value)`.
- `long Total(int from, int to)` and `long Best(int from, int to)` (the max), inclusive.
- Store sums and maxima in arrays of size 2 × (next power of 2), leaves at the bottom, each parent built from its two children.

**Rules.** Every operation O(log n). No looping over the range.

**Run:** `dotnet test --filter Lesson=segment-tree`

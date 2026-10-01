# Products in a price range

**The ticket.** The shop's filter panel asks "products between $20 and $50", sorted by price, thousands of times a minute. Keep prices in a **binary search tree** you write yourself.

**Build** `PriceIndex` in `PriceIndex.cs` (store distinct prices; duplicates are ignored):

- `void Add(int price)`, `bool Contains(int price)`, `int Count`.
- `List<int> Range(int lo, int hi)`: every price with lo ≤ price ≤ hi, ascending. Skip whole subtrees that can't contain anything in range.
- `int? Min()`, `int? Max()`.
- `int? Floor(int x)`: the largest price ≤ x ("the best thing you can afford").

**Rules.** No `SortedSet`, `List.Sort` or LINQ ordering. Range must not visit every node when the range is small.

**Run:** `dotnet test --filter Lesson=bst`

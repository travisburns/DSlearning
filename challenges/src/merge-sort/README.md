# Stable sort for the orders table

**The ticket.** Users sort the orders table by one column, then another. Sorting by date after sorting by customer must keep each date's orders in customer order: the sort has to be **stable** (equal items keep their order). Write it ourselves so we control exactly how it behaves.

**Build** in `StableSort.cs`:

- `T[] Sort<T>(T[] items, Comparison<T> compare)`: return a new sorted array, using merge sort: split in half, sort each half, merge. When two items compare equal, take the one from the LEFT half first: that's what makes it stable.

**Rules.** No `Array.Sort`, `List.Sort` or LINQ `OrderBy`. O(n log n) on any input: a million items in well under a second.

**Run:** `dotnet test --filter Lesson=merge-sort`

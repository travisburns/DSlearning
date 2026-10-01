# Merge two order feeds, and find a gift pair

**The ticket.** Two small features from the shop backend.

1. Two warehouses each send their order IDs **sorted**. Produce one sorted list with no duplicates.
2. Gift cards: given item prices **sorted** ascending and a card value, find two different items that use up the card exactly.

**Build** in `Orders.cs`:

- `List<int> MergeUnique(int[] a, int[] b)`: one pass with a pointer into each array.
- `(int, int)? PairForBudget(int[] sortedPrices, int budget)`: indexes `(i, j)` with `i < j` and prices adding to budget, or null. Start one pointer at each end.

**Rules.** O(n) each. No sorting, no `HashSet`, no nested loops: a million items must be instant.

**Run:** `dotnet test --filter Lesson=two-pointers`

# Sorted set for a live leaderboard (skip list)

**The ticket.** We need a sorted set of scores with fast insert, delete, lookup and "everything between A and B". Redis uses a **skip list** for exactly this (its sorted sets): simpler than a balanced tree, O(log n) on average thanks to coin flips.

**Build** `SkipList` in `SkipList.cs` (distinct ints):

- Each node has a value and an array of `next` pointers, one per level. A new node's height is found by flipping a coin: keep adding a level while it comes up heads (cap at 32).
- `bool Add(int x)`, `bool Remove(int x)`, `bool Contains(int x)`, `int Count`.
- `List<int> Range(int lo, int hi)`: ascending, lo ≤ x ≤ hi.
- Search: start at the top level of the head; move right while the next value is smaller than the target; otherwise drop down a level.

**Rules.** No `SortedSet`/`SortedList`/sorting. Sorted inserts must stay fast (a plain linked list would be O(n) each).

**Run:** `dotnet test --filter Lesson=skip-list`

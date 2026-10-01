# Leaderboard ranks

**The ticket.** The game shows "you are ranked #1,284" and "who is in 100th place?" for a leaderboard of hundreds of thousands of distinct scores that change constantly. A **treap** (a BST balanced by random priorities) where each node also stores the size of its subtree answers both in O(log n).

**Build** `RankedSet` in `RankedSet.cs`:

- `bool Insert(int score)` (false if present), `bool Remove(int score)`, `bool Contains(int score)`, `int Count`.
- `int Rank(int score)`: how many stored scores are **smaller** than `score`.
- `int Kth(int k)`: the k-th smallest (k = 0 is the smallest).
- Each node: key, random priority, left, right, size. Keep heap order on priorities with rotations (insert) or split/merge, and update sizes whenever children change.

**Rules.** No `SortedSet`, `List.Sort` or LINQ ordering. All operations O(log n) expected.

**Run:** `dotnet test --filter Lesson=treap`

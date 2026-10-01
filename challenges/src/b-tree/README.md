# A disk-friendly index (B-tree)

**The ticket.** Our storage engine reads the disk one 4 KB page at a time, so we want an index whose nodes hold many keys each and whose height stays tiny. Build a **B-tree**.

**Build** `BTree` in `BTree.cs`:

- `BTree(int t)`: minimum degree t. Every node except the root holds between `t - 1` and `2t - 1` keys, in sorted order; an inner node with k keys has k + 1 children. All leaves are at the same depth.
- `void Insert(int key)` (ignore duplicates): on the way down, split any full node (2t - 1 keys) before entering it: its middle key moves up into the parent. If the root is full, split it and grow a new root (the only way the tree gets taller).
- `bool Contains(int key)`, `int Count`, `int Height` (0 when the root is a leaf), `List<int> InOrder()`.

**Rules.** No `SortedSet`/`SortedDictionary`. With t = 32, a million keys must give a height of 3 or less.

**Run:** `dotnet test --filter Lesson=b-tree`

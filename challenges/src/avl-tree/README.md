# An index that stays fast on sorted input

**The ticket.** Our in-memory index is a plain BST. Data often arrives already sorted (IDs, timestamps), which turns the tree into a long stick: lookups get slow and the recursion overflows the stack. Make it self-balancing with **AVL** rotations.

**Build** `AvlIndex` in `AvlIndex.cs`:

- `void Insert(int key)` (ignore duplicates), `bool Contains(int key)`, `int Count`.
- `int Height`: edges on the longest root-to-leaf path (-1 if empty).
- `List<int> InOrder()`: ascending.
- After each insert, walk back up; wherever the left and right heights differ by 2, rotate (single for a straight line, double for a zig-zag).

**Rules.** No `SortedSet`/`SortedDictionary`. Inserting 200,000 keys in ascending order must keep the height around log₂ n (the tests allow up to 1.45 × log₂ n).

**Run:** `dotnet test --filter Lesson=avl-tree`

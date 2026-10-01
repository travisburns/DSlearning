# Lookup table that favours hot keys

**The ticket.** A DNS cache looks up names where a small set of popular names gets almost all the traffic. A **splay tree** moves every key it touches to the root, so hot keys stay near the top and are found in a step or two.

**Build** `SplayTree` in `SplayTree.cs`:

- `void Insert(int key)`, `bool Contains(int key)`: both splay the key (or the last node visited) to the root.
- `int? Root`: the key at the root (null if empty). `int Count`.

**Rules.** Do the splay **iteratively** (top-down splay, or bottom-up with parent pointers): sorted inserts make the tree 100,000 deep at times, which overflows the stack if you recurse.

**Run:** `dotnet test --filter Lesson=splay-tree`

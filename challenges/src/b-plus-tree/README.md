# Range scans for an orders table (B+ tree)

**The ticket.** `SELECT * FROM orders WHERE id BETWEEN 1000 AND 2000` has to be fast. Databases use a **B+ tree**: all records live in the leaves, upper nodes only hold signposts, and the leaves are linked left to right, so a range query goes down once and then walks along the leaves.

**Build** `BPlusTree` in `BPlusTree.cs` (int keys → string values):

- `BPlusTree(int maxKeys)`: a node splits when it would hold more than `maxKeys` keys.
- `void Put(int key, string value)` (overwrite if present), `string? Get(int key)`, `int Count`.
- `List<(int Key, string Value)> Range(int lo, int hi)`: find the leaf for `lo`, then follow `Next` links collecting keys ≤ hi.
- `int LeafCount`: number of leaves (count them by walking the leaf chain).
- Leaf split: right half moves to a new leaf, and a **copy** of its first key goes up as a signpost. Inner split: the middle key moves up.

**Rules.** No `SortedDictionary`/`SortedList`. Range must not visit leaves outside the range.

**Run:** `dotnet test --filter Lesson=b-plus-tree`

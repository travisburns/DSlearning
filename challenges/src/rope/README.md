# Text editor buffer for huge files

**The ticket.** Opening a 1 MB log file and typing in the middle is laggy: every keystroke copies the rest of the text (`string` and even `StringBuilder.Insert` shift everything after the cursor). Store the text as a **rope**, a balanced tree of pieces where inserting, deleting and reading a character are all O(log n).

**Build** `Rope` in `Rope.cs`:

- `Rope(string text)`, `int Length`, `char CharAt(int i)`.
- `void Insert(int index, string s)` and `void Delete(int index, int count)`.
- `string ToString()` (the full text).

**Hint.** One proven design: an *implicit treap*. Each node holds one character, a random priority and the size of its subtree. A node's position is the size of everything to its left, so there are no stored indexes. With **Split(tree, k)** (first k characters vs. the rest) and **Merge(a, b)**, insert = split + merge + merge, and delete = two splits + merge.

**Rules.** No `string` concatenation or `StringBuilder.Insert`/`Remove` on the whole text per edit.

**Run:** `dotnet test --filter Lesson=rope`

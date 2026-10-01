# Calculator: evaluate an expression tree

**The ticket.** Our spreadsheet parses formulas like `(3 + 4) * 2` into a binary tree: operators are inner nodes with a left and right child, numbers are leaves. Write the code that works with those trees.

**Build** in `Expr.cs` (the `Node` class is given):

- `double Evaluate(Node n)`: a leaf is its number; an operator node applies `+ - * /` to the values of its two subtrees.
- `int Height(Node n)`: 0 for a leaf.
- `string ToInfix(Node n)`: fully bracketed, e.g. `((3 + 4) * 2)`; leaves print their number.
- `int CountLeaves(Node n)`.

**Hint.** Every function is: handle this node, recurse into `Left` and `Right`.

**Run:** `dotnet test --filter Lesson=binary-tree`

# "Customers who bought this…" (sparse ratings)

**The ticket.** The recommendations service has a matrix of 1,000,000 customers × 100,000 products, holding how many times each customer bought each product. Almost every cell is 0: a dense `int[,]` would need 400 GB. Store only the non-zeros.

**Build** `SparseMatrix` in `SparseMatrix.cs`:

- `SparseMatrix(int rows, int cols)`; `int Rows`, `int Cols`, `int NonZeros`.
- `void Set(int r, int c, double v)` (setting 0 removes the entry) and `double Get(int r, int c)`.
- `double[] Multiply(double[] x)`: the matrix times a vector (length = Cols). Only touch the non-zeros.
- `SparseMatrix Transpose()`.
- `IEnumerable<(int Col, double Value)> Row(int r)`: the non-zeros of one row, by column.

**Hint.** One `Dictionary<int, double>` per row (or a single `Dictionary<(int, int), double>` plus per-row column lists) keeps Get/Set O(1) and lets Multiply walk only the stored values.

**Rules.** Memory and Multiply time scale with the number of non-zeros, not rows × cols.

**Run:** `dotnet test --filter Lesson=sparse-matrix`

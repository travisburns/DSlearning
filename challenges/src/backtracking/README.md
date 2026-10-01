# Sudoku solver for the puzzle app

**The ticket.** Our puzzle app needs a "solve" button. A 9 × 9 grid uses 0 for empty cells. Each row, column and 3 × 3 box must end up with 1–9 exactly once.

**Build** in `Sudoku.cs`:

- `bool Solve(int[,] grid)`: fill the grid in place and return true, or return false (grid unchanged in meaning) if there's no solution.
- `bool IsValid(int[,] grid)`: no repeated digit (ignoring 0s) in any row, column or box.

**Hint.** Backtracking: find an empty cell, try each digit that fits, recurse; if the recursion fails, put the 0 back (un-choose) and try the next digit.

**Rules.** Solving the given puzzles must take well under a second.

**Run:** `dotnet test --filter Lesson=backtracking`

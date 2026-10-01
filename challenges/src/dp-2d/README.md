# Diff and "did you mean?"

**The ticket.** Two text features.

1. **Diff:** how many lines do two versions of a file have in common, in order? (The longest common subsequence. Diff tools build on this.)
2. **Did you mean?:** the spell checker suggests the dictionary word with the fewest single-character edits (insert, delete or replace) from what was typed.

**Build** in `TextTools.cs`:

- `int CommonLines(string[] a, string[] b)`: dp[i, j] = best for the first i lines of a and the first j of b. Equal lines: diagonal + 1; otherwise the better of above and left.
- `int EditDistance(string a, string b)`.
- `string Suggest(string typed, string[] dictionary)`: the closest word (ties: the earliest in the dictionary).

**Rules.** O(n × m) tables. 2,000 × 2,000 must run in well under a second.

**Run:** `dotnet test --filter Lesson=dp-2d`

# Find in document (Ctrl+F)

**The ticket.** The document viewer's search highlights every match of the search text. Our naive search compares the pattern at every position, and on some documents (long runs of the same character, like logs or DNA data) it crawls.

**Build** in `Finder.cs`:

- `List<int> FindAll(string text, string pattern)`: every start index where pattern occurs (overlapping matches count). Use **Rabin–Karp**: a rolling hash of the current window, updated in O(1) as it slides; only when the hash matches the pattern's hash, compare the characters to confirm.

**Rules.** No `IndexOf`, `Contains`, `Regex` or `string.Equals` on substrings in a loop. Expected O(n + m).

**Run:** `dotnet test --filter Lesson=string-matching`

# Longest repeated phrase (plagiarism / dedup check)

**The ticket.** A content team wants to flag the longest passage repeated within a document (copy-paste detection), and the number of distinct substrings (a complexity score). A suffix tree answers both, but at work you'd build a **suffix array plus LCP array**, which does the same jobs with far less memory. Use either.

**Build** in `Repeats.cs`:

- `string LongestRepeat(string text)`: the longest substring that occurs at least twice (occurrences may overlap). Ties: the alphabetically smallest. "" if none.
- `long DistinctSubstrings(string text)`: how many different non-empty substrings.

**Hint.** In the sorted suffix array, the longest common prefix of each pair of neighbours (Kasai's algorithm builds all of these in O(n)) gives both answers: the longest repeat is the biggest LCP, and distinct substrings = Σ(suffix length) − Σ(LCP).

**Rules.** O(n log n) or better. A 50,000-char document must be quick.

**Run:** `dotnet test --filter Lesson=suffix-tree`

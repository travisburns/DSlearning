# Search index for a big document

**The ticket.** A legal-documents tool searches long contracts for phrases over and over. Build a **suffix array** once per document, then answer "how many times / where does this phrase occur?" with binary search.

**Build** in `SuffixIndex.cs`:

- `SuffixIndex(string text)`: `Array` = start positions of all suffixes, sorted alphabetically (ordinal). Build it with **prefix doubling**: sort by the first 1 char, then 2, 4, 8, … using the previous round's ranks, so each comparison is O(1).
- `int Count(string pattern)` and `List<int> Positions(string pattern)` (ascending): binary search for the block of suffixes starting with the pattern.

**Rules.** Sorting the suffixes by comparing whole strings is O(n² log n) on repetitive text (`aaaa…`). The test uses exactly that.

**Run:** `dotnet test --filter Lesson=suffix-array`

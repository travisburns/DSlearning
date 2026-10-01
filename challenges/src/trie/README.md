# Search box autocomplete

**The ticket.** As the user types in the search box, show up to `limit` matching product names, alphabetically. The catalogue has hundreds of thousands of names, and the box updates on every keystroke.

**Build** `Autocomplete` in `Autocomplete.cs` as a **trie** you write (each node: a `Dictionary<char, Node>` of children and a flag for "a word ends here"):

- `void Add(string word)` (lower-case letters).
- `List<string> Suggest(string prefix, int limit)`: walk down the prefix, then collect words below it in alphabetical order, stopping at `limit`.
- `bool Contains(string word)`, `int Count` (distinct words).

**Rules.** No scanning the whole word list: a suggestion only looks at the part of the trie under the prefix.

**Run:** `dotnet test --filter Lesson=trie`

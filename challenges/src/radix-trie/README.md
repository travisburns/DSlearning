# Longest-prefix routing table

**The ticket.** Our gateway forwards requests by the longest registered route that the request path starts with: `/api/users/42/photos` goes to the handler for `/api/users` if that's the longest match. There are tens of thousands of routes sharing long prefixes, so we store them in a **radix trie** (a trie whose edges hold whole strings, not single letters).

**Build** `RouteTable` in `RouteTable.cs`:

- `void Add(string route, string handler)` (overwrite if present). Splitting an edge when a new route shares only part of it is the key step.
- `string? Get(string route)`: exact match.
- `string? LongestPrefix(string path)`: the handler of the longest added route that `path` starts with, or null.
- `int NodeCount`: nodes including the root. A radix trie never has a non-route node with just one child, so it stays well under one node per character.

**Run:** `dotnet test --filter Lesson=radix-trie`

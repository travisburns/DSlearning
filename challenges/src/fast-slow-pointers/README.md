# Detect redirect loops

**The ticket.** Our link checker follows redirects: page A redirects to B, B to C, and so on. Misconfigured sites send it round in a loop forever. Detect loops without storing every URL visited (the crawler checks millions of chains and memory is tight).

**Build** in `Redirects.cs`:

- `bool HasLoop(string start, Func<string, string?> next)`: `next(url)` gives where a URL redirects, or null if it's a real page. Move one pointer one step at a time and another two steps; if they ever meet, there's a loop.
- `string? LoopEntry(string start, Func<string, string?> next)`: the first URL that is part of the loop (null if none). After they meet, restart one pointer at `start` and move both one step at a time: they meet at the entry.

**Rules.** O(1) extra memory: no `HashSet` or list of visited URLs.

**Run:** `dotnet test --filter Lesson=fast-slow-pointers`

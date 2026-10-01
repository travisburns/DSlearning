# URL shortener

**The ticket.** Build the core of a link shortener: long URL in, short code out, and back again. Shortening the same URL twice should give the same code.

**Build** `Shortener` in `Shortener.cs`:

- `string Shorten(string url)`: codes are the base-62 form (`0-9a-zA-Z`) of a counter that starts at 1, so the first URL gets `"1"`, the 62nd gets `"10"`.
- `string? Resolve(string code)`: the original URL, or null.
- `int Count`: how many distinct URLs.

**Hint.** You need to look things up in **both** directions instantly. `Dictionary<TKey, TValue>` is the tool; how many do you need?

**Rules.** Both operations O(1) on average: 300,000 links in well under a second.

**Run:** `dotnet test --filter Lesson=hash-map`

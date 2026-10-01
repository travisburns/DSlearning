# A hash map from scratch (chaining)

**The ticket.** Our embedded scripting engine needs a string → int map and can't depend on `Dictionary`. Build one with **separate chaining**.

**Build** `ChainedMap` in `ChainedMap.cs`:

- An array of buckets; each bucket is a linked list of (key, value) entries. Start with 8 buckets.
- `void Put(string key, int value)` (insert or overwrite), `bool TryGet(string key, out int value)`, `bool Remove(string key)`, `int Count`.
- When `Count / buckets > 0.75`, double the bucket array and re-insert every entry (their bucket numbers change).
- Use `key.GetHashCode()` (it's fine within one process); index = `(hash & 0x7FFFFFFF) % buckets.Length`.

**Rules.** No `Dictionary`, `HashSet` or `List` inside. O(1) average: 200,000 puts and gets in a fraction of a second.

**Run:** `dotnet test --filter Lesson=hash-chaining`

# Cache that keeps the popular items (LFU)

**The ticket.** The image CDN serves a few images constantly and a long tail rarely. LRU sometimes evicts a hugely popular image just because a burst of one-off requests came through. Evict the **least frequently used** entry instead (ties: the least recently used among them).

**Build** `LfuCache` in `LfuCache.cs` (string → string):

- `LfuCache(int capacity)`.
- `string? Get(string key)`: a hit adds 1 to its use count.
- `void Put(string key, string value)`: an update also counts as a use; a new key starts at count 1. If full, evict first, then add.
- `int Count`.

**Hint.** Keep `key → (value, count)`, and buckets `count → LinkedList<key>` (newest at the end), plus the current minimum count. On a use, move the key from bucket c to bucket c + 1. The victim is the first key of the minimum bucket.

**Rules.** Every operation O(1).

**Run:** `dotnet test --filter Lesson=lfu-cache`

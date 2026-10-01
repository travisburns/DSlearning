# Cache an expensive lookup (LRU)

**The ticket.** Product pages call a slow pricing service. Cache the last `capacity` results: a repeat request is answered from the cache, and when the cache is full the **least recently used** entry is thrown out.

**Build** `LruCache<TKey, TValue>` in `LruCache.cs`:

- `LruCache(int capacity)`.
- `bool TryGet(TKey key, out TValue value)`: a hit makes that entry the most recently used.
- `void Put(TKey key, TValue value)`: insert or update (both count as a use); evict the least recently used if over capacity.
- `TValue GetOrAdd(TKey key, Func<TKey, TValue> load)`: return the cached value, or call `load` (the slow service), cache it and return it.
- `int Count`.

**Hint.** You need two things at once: find any key instantly (`Dictionary`) and keep the usage order with O(1) "move to front" and "remove the oldest" (`LinkedList<T>`, with the dictionary storing each key's `LinkedListNode`).

**Rules.** Every operation O(1).

**Run:** `dotnet test --filter Lesson=lru-cache`

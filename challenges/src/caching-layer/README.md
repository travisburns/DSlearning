# A read-through cache with stampede protection

**The ticket.** Product pages call a slow pricing service (about 200 ms). We want an in-process cache in front of it: bounded in size, entries that expire, a way to drop an entry when a price changes, and, most importantly, when a popular product's entry expires and 500 requests miss at the same moment, the pricing service must be called **once**, not 500 times.

**Build** `ReadThroughCache<TKey, TValue>` in `ReadThroughCache.cs`:

- `ReadThroughCache(Func<TKey, TValue> load, int capacity, int ttlMs, Func<long> nowMs)`.
- `TValue Get(TKey key)`: return the cached value if it's there and younger than `ttlMs`; otherwise call `load`, store the result and return it.
  - At most `capacity` entries: when full, evict the least recently used (a `Get` that hits counts as a use).
  - If many threads `Get` the same missing key at once, `load` runs once and they all get its result.
  - A `load` for one key must not block `Get`s for other keys.
  - If `load` throws, every caller waiting on it gets the exception and nothing is cached.
- `void Invalidate(TKey key)`: drop the entry, so the next `Get` loads fresh data.
- `int Hits`, `int Loads` (how many times `load` was called), `int Count`.
- Safe to call from many threads at once.

**Hint.** LRU = `Dictionary` + `LinkedList` (see the LRU cache lesson). For the stampede: a second dictionary of loads in progress, `Dictionary<TKey, Lazy<TValue>>`. The first caller adds a `Lazy`; everyone else finds it and waits on `.Value`. Take a lock only to look things up and store them, never while `load` runs.

**Run:** `dotnet test --filter Lesson=caching-layer`

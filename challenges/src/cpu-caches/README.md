# A CPU cache simulator

**The ticket.** The performance team wants to show developers *why* some loops are slow. Build a cache simulator: feed it the memory addresses a loop touches, and it counts hits and misses exactly like a real set-associative cache.

**How a set-associative cache works.**
- Memory is split into lines of `lineBytes` bytes. Address `a` is in line `a / lineBytes`.
- The cache has `sets` sets, each holding up to `ways` lines. A line can only go in set `line % sets`.
- Reading an address whose line is in its set: **hit**. Otherwise: **miss**, and the line is loaded into its set; if the set is full, the **least recently used** line in that set is evicted. A hit also counts as "used".
- `ways = 1` is a direct-mapped cache; `sets = 1` is fully associative.

**Build** `CacheSim` in `CacheSim.cs`:

- `CacheSim(int lineBytes, int sets, int ways)`.
- `bool Access(long address)`: true on a hit.
- `int Hits`, `int Misses`.
- `void Reset()`: empty the cache and zero the counters.

Then use it in `Traversal.cs`:

- `static (int Hits, int Misses) SumMatrix(CacheSim cache, int n, bool rowByRow)`: simulate summing an `n×n` `int[,]` stored row-major starting at address 0 (element `[r, c]` is at `(r * n + c) * 4`), looping rows-then-columns if `rowByRow`, else columns-then-rows. Reset the cache first.

**Hint.** One small list per set, most recently used at the end. With at most a handful of ways, a `List<long>` per set is plenty fast.

**Run:** `dotnet test --filter Lesson=cpu-caches`

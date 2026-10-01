# Cache cluster router

**The ticket.** We spread cache keys over several cache servers. With `hash % servers`, adding one server moves almost every key and the caches all go cold at once. Route with a **hash ring** instead, so adding or removing a server moves only a small share of keys.

**Build** `HashRing` in `HashRing.cs`:

- `HashRing(int virtualNodes = 100)`: each server is placed on the ring `virtualNodes` times (at `Hash(server + "#" + i)`) so load evens out.
- `void AddServer(string name)` / `void RemoveServer(string name)`.
- `string ServerFor(string key)`: the first server position clockwise from `Hash(key)` (wrap to the start of the ring).
- Use the given `Hash` (FNV-1a) so results are stable.

**Hint.** Keep the ring positions sorted (`SortedList`, or a sorted array plus binary search) so ServerFor is O(log n).

**Rules.** Adding a 5th server to 4 must move well under half the keys (ideally about a fifth).

**Run:** `dotnet test --filter Lesson=consistent-hashing`

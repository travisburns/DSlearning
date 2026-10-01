# Shard users across database servers

**The ticket.** We split users across `N` database servers by hashing their user ID. Every service must agree on the shard, in every process, forever. C#'s `string.GetHashCode()` is randomised per process, so we need our own stable hash.

**Build** in `Sharding.cs`:

- `uint Fnv1a(string s)`: the FNV-1a 32-bit hash. Start with `2166136261`; for each byte of the UTF-8 encoding: XOR the byte in, then multiply by `16777619` (let it overflow: use `unchecked`).
- `int ShardFor(string userId, int shards)`: `hash % shards`.

**Rules.** The same input always gives the same output. The tests check known FNV-1a values and that 100,000 users spread evenly over 8 shards.

**Run:** `dotnet test --filter Lesson=hash-function`

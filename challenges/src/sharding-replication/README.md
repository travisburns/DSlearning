# A sharded, replicated key-value store

**The ticket.** Before we move the session store onto a real distributed database, the team wants a small simulation of how it behaves: which shard a key lands on, what a lagging follower returns, and exactly what is lost when a leader dies. Build it in memory.

**Build** `ShardedStore` in `ShardedStore.cs`:

- `static int ShardOf(string key, int shardCount)`: FNV-1a over the key's UTF-8 bytes, then `% shardCount`. (`hash = 2166136261; for each byte: hash ^= b; hash *= 16777619;` with `uint` and `unchecked`.) **Don't** use `string.GetHashCode()`: .NET randomises it per process, so two servers would disagree about where a key lives.
- `ShardedStore(int shardCount, int followersPerShard)`.
- `void Put(string key, string value)`: goes to the key's shard leader, which appends `(key, value)` to its log.
- `string? ReadLeader(string key)` and `string? ReadFollower(string key, int follower)`: the value as that copy sees it (a follower only sees the log entries it has applied).
- `void Replicate(int shard, int follower, int maxEntries)`: that follower applies up to `maxEntries` more entries of the leader's log. `void ReplicateAll()`: every follower catches up fully.
- `int Lag(int shard, int follower)`: how many log entries that follower is behind.
- `void FailOver(int shard)`: the leader dies. The follower that has applied the most entries (ties: lowest number) becomes leader; any entries it hadn't applied are **lost**. It leaves the follower list (later followers move up one) and a new, fully caught-up follower joins at the end, so the shard keeps the same number of followers.

**Hint.** Each shard needs just a log `List<(string Key, string Value)>` and, per follower, how many entries it has applied. A read scans its visible part of the log backwards for the newest value of that key (fine for this simulation).

**Run:** `dotnet test --filter Lesson=sharding-replication`

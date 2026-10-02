using System.Text;

namespace Challenges.ShardedStores;

public class ShardedStore
{
    private sealed class Shard
    {
        public List<(string Key, string Value)> Log = new();
        public List<int> Applied = new();
    }

    private readonly Shard[] _shards;

    public static int ShardOf(string key, int shardCount)
    {
        uint hash = 2166136261;
        foreach (var b in Encoding.UTF8.GetBytes(key))
        {
            hash ^= b;
            hash = unchecked(hash * 16777619);
        }
        return (int)(hash % (uint)shardCount);
    }

    public ShardedStore(int shardCount, int followersPerShard)
    {
        _shards = new Shard[shardCount];
        for (var i = 0; i < shardCount; i++)
        {
            _shards[i] = new Shard();
            for (var f = 0; f < followersPerShard; f++) _shards[i].Applied.Add(0);
        }
    }

    private Shard For(string key) => _shards[ShardOf(key, _shards.Length)];

    private static string? Find(List<(string Key, string Value)> log, int upTo, string key)
    {
        for (var i = upTo - 1; i >= 0; i--)
            if (log[i].Key == key) return log[i].Value;
        return null;
    }

    public void Put(string key, string value) => For(key).Log.Add((key, value));

    public string? ReadLeader(string key)
    {
        var s = For(key);
        return Find(s.Log, s.Log.Count, key);
    }

    public string? ReadFollower(string key, int follower)
    {
        var s = For(key);
        return Find(s.Log, s.Applied[follower], key);
    }

    public void Replicate(int shard, int follower, int maxEntries)
    {
        var s = _shards[shard];
        s.Applied[follower] = (int)Math.Min(s.Log.Count, (long)s.Applied[follower] + maxEntries);
    }

    public void ReplicateAll()
    {
        foreach (var s in _shards)
            for (var f = 0; f < s.Applied.Count; f++) s.Applied[f] = s.Log.Count;
    }

    public int Lag(int shard, int follower) => _shards[shard].Log.Count - _shards[shard].Applied[follower];

    public void FailOver(int shard)
    {
        var s = _shards[shard];
        var best = 0;
        for (var f = 1; f < s.Applied.Count; f++)
            if (s.Applied[f] > s.Applied[best]) best = f;
        var keep = s.Applied[best];
        s.Log.RemoveRange(keep, s.Log.Count - keep); // writes the new leader never saw are gone
        s.Applied.RemoveAt(best);
        s.Applied.Add(keep);
    }
}

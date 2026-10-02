namespace Challenges.ShardedStores;

public class ShardedStore
{
    public static int ShardOf(string key, int shardCount) => throw new NotImplementedException("Your code here");

    public ShardedStore(int shardCount, int followersPerShard)
    {
    }

    public void Put(string key, string value) => throw new NotImplementedException();

    public string? ReadLeader(string key) => throw new NotImplementedException();

    public string? ReadFollower(string key, int follower) => throw new NotImplementedException();

    public void Replicate(int shard, int follower, int maxEntries) => throw new NotImplementedException();

    public void ReplicateAll() => throw new NotImplementedException();

    public int Lag(int shard, int follower) => throw new NotImplementedException();

    public void FailOver(int shard) => throw new NotImplementedException();
}

using Challenges.ShardedStores;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "sharding-replication")]
public class ShardingReplicationTests
{
    [Theory]
    [InlineData("user:1", 8, 3)]
    [InlineData("user:2", 8, 6)]
    [InlineData("alice", 8, 7)]
    [InlineData("alice", 3, 2)]
    [InlineData("", 8, 5)]
    public void Shard_of_uses_fnv1a(string key, int shards, int expected) => Assert.Equal(expected, ShardedStore.ShardOf(key, shards));

    [Fact]
    public void Keys_spread_evenly()
    {
        var counts = new int[8];
        for (var i = 0; i < 80_000; i++) counts[ShardedStore.ShardOf($"session:{i}", 8)]++;
        Assert.All(counts, c => Assert.InRange(c, 9_000, 11_000));
    }

    [Fact]
    public void Writes_go_to_the_right_shard_only()
    {
        var s = new ShardedStore(4, 1);
        s.Put("alice", "a1");
        var shard = ShardedStore.ShardOf("alice", 4);
        for (var i = 0; i < 4; i++) Assert.Equal(i == shard ? 1 : 0, s.Lag(i, 0));
        Assert.Equal("a1", s.ReadLeader("alice"));
        Assert.Null(s.ReadLeader("bob"));
    }

    [Fact]
    public void Followers_lag_until_they_replicate()
    {
        var s = new ShardedStore(1, 2);
        s.Put("name", "Ann");
        s.ReplicateAll();
        s.Put("name", "Annie");
        s.Put("city", "York");
        Assert.Equal("Annie", s.ReadLeader("name"));
        Assert.Equal("Ann", s.ReadFollower("name", 0));
        Assert.Null(s.ReadFollower("city", 1));
        Assert.Equal(2, s.Lag(0, 0));
        s.Replicate(0, 0, 1);
        Assert.Equal("Annie", s.ReadFollower("name", 0));
        Assert.Null(s.ReadFollower("city", 0));
        Assert.Equal(1, s.Lag(0, 0));
        s.Replicate(0, 0, 100);
        Assert.Equal("York", s.ReadFollower("city", 0));
        Assert.Equal(0, s.Lag(0, 0));
        Assert.Equal(2, s.Lag(0, 1));
    }

    [Fact]
    public void Failover_promotes_the_most_up_to_date_follower_and_loses_unreplicated_writes()
    {
        var s = new ShardedStore(1, 3);
        s.Put("k", "v1");
        s.Put("k", "v2");
        s.Put("k", "v3");
        s.Put("k", "v4");
        s.Replicate(0, 0, 1);
        s.Replicate(0, 1, 3);
        s.Replicate(0, 2, 2);
        s.FailOver(0);
        Assert.Equal("v3", s.ReadLeader("k")); // v4 never reached a follower: lost
        // Followers were 0 (1 entry), 1 (3, promoted), 2 (2). Now: old 0, old 2, new.
        Assert.Equal(2, s.Lag(0, 0));
        Assert.Equal(1, s.Lag(0, 1));
        Assert.Equal(0, s.Lag(0, 2));
        Assert.Equal("v1", s.ReadFollower("k", 0));
        Assert.Equal("v2", s.ReadFollower("k", 1));
        Assert.Equal("v3", s.ReadFollower("k", 2));
        s.Put("k", "v5");
        Assert.Equal("v5", s.ReadLeader("k"));
        Assert.Equal(1, s.Lag(0, 2));
    }

    [Fact]
    public void Failover_ties_pick_the_lowest_follower()
    {
        var s = new ShardedStore(1, 2);
        s.Put("a", "1");
        s.Put("b", "2");
        s.Replicate(0, 0, 1);
        s.Replicate(0, 1, 1);
        s.FailOver(0);
        Assert.Equal("1", s.ReadLeader("a"));
        Assert.Null(s.ReadLeader("b"));
        Assert.Equal(0, s.Lag(0, 0));
        Assert.Equal(0, s.Lag(0, 1));
    }

    [Fact]
    public void Failover_with_everything_replicated_loses_nothing()
    {
        var s = new ShardedStore(3, 2);
        for (var i = 0; i < 300; i++) s.Put($"user:{i}", $"v{i}");
        s.ReplicateAll();
        for (var sh = 0; sh < 3; sh++) s.FailOver(sh);
        for (var i = 0; i < 300; i++)
        {
            Assert.Equal($"v{i}", s.ReadLeader($"user:{i}"));
            Assert.Equal($"v{i}", s.ReadFollower($"user:{i}", 1));
        }
    }
}

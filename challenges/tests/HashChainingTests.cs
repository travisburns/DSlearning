using Challenges.HashChaining;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "hash-chaining")]
public class HashChainingTests
{
    [Fact]
    public void Put_get_overwrite_remove()
    {
        var m = new ChainedMap();
        m.Put("apple", 3);
        m.Put("pear", 5);
        m.Put("apple", 9);
        Assert.Equal(2, m.Count);
        Assert.True(m.TryGet("apple", out var v));
        Assert.Equal(9, v);
        Assert.False(m.TryGet("kiwi", out _));
        Assert.True(m.Remove("apple"));
        Assert.False(m.Remove("apple"));
        Assert.False(m.TryGet("apple", out _));
        Assert.Equal(1, m.Count);
    }

    [Fact]
    public void Grows_when_crowded_and_keeps_everything()
    {
        var m = new ChainedMap();
        for (var i = 0; i < 1000; i++) m.Put("k" + i, i);
        Assert.True(m.BucketCount >= 1000 / 0.75, $"only {m.BucketCount} buckets for 1000 keys");
        for (var i = 0; i < 1000; i++)
        {
            Assert.True(m.TryGet("k" + i, out var v));
            Assert.Equal(i, v);
        }
    }

    [Fact]
    public void Fast_enough()
    {
        var keys = Enumerable.Range(0, 200_000).Select(i => "key" + i).ToArray();
        Perf.Under(1500, () =>
        {
            var m = new ChainedMap();
            foreach (var k in keys) m.Put(k, 1);
            foreach (var k in keys) Assert.True(m.TryGet(k, out _));
        }, "200,000 puts and gets");
    }
}

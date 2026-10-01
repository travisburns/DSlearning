using Challenges.BPlusTrees;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "b-plus-tree")]
public class BPlusTreeTests
{
    [Fact]
    public void Put_get_and_overwrite()
    {
        var t = new BPlusTree(3);
        for (var i = 0; i < 100; i++) t.Put(i * 2, "v" + i);
        t.Put(10, "ten");
        Assert.Equal(100, t.Count);
        Assert.Equal("ten", t.Get(10));
        Assert.Equal("v7", t.Get(14));
        Assert.Null(t.Get(11));
        Assert.True(t.LeafCount >= 100 / 3, "small nodes mean many leaves");
    }

    [Fact]
    public void Range_scan_follows_the_leaf_chain()
    {
        var t = new BPlusTree(4);
        var rnd = new Random(37);
        foreach (var k in Enumerable.Range(0, 1000).OrderBy(_ => rnd.Next())) t.Put(k, "o" + k);
        var r = t.Range(250, 260);
        Assert.Equal(Enumerable.Range(250, 11), r.Select(x => x.Key));
        Assert.Equal("o255", r[5].Value);
        Assert.Empty(t.Range(2000, 3000));
        Assert.Equal(1000, t.Range(int.MinValue, int.MaxValue).Count);
    }

    [Fact]
    public void Many_short_range_queries_are_fast()
    {
        var t = new BPlusTree(64);
        for (var i = 0; i < 500_000; i++) t.Put(i, "x");
        Perf.Under(1500, () =>
        {
            for (var q = 0; q < 100_000; q++) Assert.Equal(20, t.Range(q * 4, q * 4 + 19).Count);
        }, "100,000 range queries");
    }
}

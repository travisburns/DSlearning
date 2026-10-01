using Challenges.BTrees;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "b-tree")]
public class BTreeTests
{
    [Fact]
    public void Small_tree_with_splits()
    {
        var b = new BTree(2); // nodes hold 1 to 3 keys
        var rnd = new Random(31);
        var keys = Enumerable.Range(0, 500).Select(_ => rnd.Next(10_000)).ToList();
        foreach (var k in keys) b.Insert(k);
        var distinct = keys.Distinct().OrderBy(x => x).ToList();
        Assert.Equal(distinct.Count, b.Count);
        Assert.Equal(distinct, b.InOrder());
        Assert.True(b.Contains(keys[7]));
        Assert.False(b.Contains(-5));
        Assert.True(b.Height >= 4, "with at most 3 keys per node, 500 keys need several levels");
    }

    [Fact]
    public void Wide_nodes_keep_a_million_keys_shallow() =>
        Perf.Under(2000, () =>
        {
            var b = new BTree(32);
            for (var i = 0; i < 1_000_000; i++) b.Insert(i * 7 % 1_000_003);
            Assert.Equal(1_000_000, b.Count);
            Assert.True(b.Height <= 3, $"height {b.Height}: a B-tree with 63 keys per node should hold a million keys in 4 levels");
            for (var i = 0; i < 1_000_000; i += 101) Assert.True(b.Contains(i * 7 % 1_000_003));
        }, "a million inserts into a B-tree");
}

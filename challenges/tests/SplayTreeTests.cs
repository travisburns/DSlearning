using Challenges.Splay;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "splay-tree")]
public class SplayTreeTests
{
    [Fact]
    public void Accessed_key_moves_to_the_root()
    {
        var t = new SplayTree();
        foreach (var k in new[] { 50, 30, 70, 20, 40, 60, 80 }) t.Insert(k);
        Assert.Equal(80, t.Root);
        Assert.True(t.Contains(20));
        Assert.Equal(20, t.Root);
        Assert.False(t.Contains(45));
        Assert.True(t.Root is 40 or 50, "a missed search splays the last node visited");
        t.Insert(30);
        Assert.Equal(7, t.Count);
        Assert.Null(new SplayTree().Root);
    }

    [Fact]
    public void Sorted_inserts_and_scans_do_not_overflow() =>
        Perf.Under(1500, () =>
        {
            var t = new SplayTree();
            for (var i = 0; i < 100_000; i++) t.Insert(i);
            for (var i = 0; i < 100_000; i++) Assert.True(t.Contains(i));
            for (var r = 0; r < 1_000_000; r++) t.Contains(r % 5); // hot keys
        }, "100,000 sorted inserts, a full scan and 1,000,000 hot lookups");
}

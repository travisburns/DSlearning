using Challenges.Treaps;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "treap")]
public class TreapTests
{
    [Fact]
    public void Ranks_and_kth()
    {
        var s = new RankedSet();
        foreach (var x in new[] { 50, 20, 80, 10, 30, 70 }) Assert.True(s.Insert(x));
        Assert.False(s.Insert(30));
        Assert.Equal(6, s.Count);
        Assert.Equal(0, s.Rank(10));
        Assert.Equal(3, s.Rank(50));
        Assert.Equal(3, s.Rank(45));
        Assert.Equal(6, s.Rank(1000));
        Assert.Equal(10, s.Kth(0));
        Assert.Equal(70, s.Kth(4));
        Assert.True(s.Remove(20));
        Assert.False(s.Remove(20));
        Assert.Equal(30, s.Kth(1));
        Assert.Equal(1, s.Rank(30));
    }

    [Fact]
    public void Big_changing_leaderboard() =>
        Perf.Under(2000, () =>
        {
            var s = new RankedSet();
            for (var i = 0; i < 200_000; i++) s.Insert(i * 3); // sorted inserts: a plain BST would degrade
            for (var i = 0; i < 200_000; i += 2) s.Remove(i * 3);
            Assert.Equal(100_000, s.Count);
            for (var q = 0; q < 100_000; q++) Assert.Equal(q, s.Rank(s.Kth(q)));
        }, "200,000 inserts, 100,000 removals and 100,000 rank queries");
}

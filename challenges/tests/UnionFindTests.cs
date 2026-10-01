using Challenges.UnionFind;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "union-find")]
public class UnionFindTests
{
    [Fact]
    public void Groups_merge()
    {
        var n = new Networks(6);
        Assert.Equal(6, n.GroupCount);
        n.Connect(0, 1);
        n.Connect(2, 3);
        n.Connect(1, 3);
        n.Connect(0, 2); // already connected
        Assert.True(n.CanReach(0, 3));
        Assert.False(n.CanReach(0, 4));
        Assert.Equal(3, n.GroupCount);
        Assert.Equal(4, n.GroupSize(2));
        Assert.Equal(1, n.GroupSize(5));
    }

    [Fact]
    public void A_million_devices() =>
        Perf.Under(1500, () =>
        {
            const int N = 1_000_000;
            var n = new Networks(N);
            for (var i = 1; i < N; i++) n.Connect(i - 1, i); // one long chain: naive unions make a stick
            var rnd = new Random(41);
            for (var q = 0; q < 1_000_000; q++) Assert.True(n.CanReach(rnd.Next(N), rnd.Next(N)));
            Assert.Equal(1, n.GroupCount);
        }, "a million connections and a million reachability checks");
}

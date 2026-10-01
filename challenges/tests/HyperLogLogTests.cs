using Challenges.Hll;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "hyperloglog")]
public class HyperLogLogTests
{
    [Theory]
    [InlineData(1_000)]
    [InlineData(200_000)]
    public void Within_five_percent(int distinct)
    {
        var h = new HyperLogLog();
        for (var i = 0; i < distinct; i++) h.Add("visitor-" + i);
        for (var i = 0; i < distinct; i += 3) h.Add("visitor-" + i); // repeats don't count
        Assert.InRange(h.Count(), distinct * 0.95, distinct * 1.05);
    }

    [Fact]
    public void Merge_counts_the_union()
    {
        var a = new HyperLogLog();
        var b = new HyperLogLog();
        for (var i = 0; i < 60_000; i++) a.Add("v" + i);
        for (var i = 40_000; i < 100_000; i++) b.Add("v" + i);
        a.Merge(b);
        Assert.InRange(a.Count(), 95_000, 105_000);
    }

    [Fact]
    public void Empty_is_zero() => Assert.Equal(0, new HyperLogLog().Count());
}

using Challenges.Bst;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "bst")]
public class BstTests
{
    private static PriceIndex Sample()
    {
        var p = new PriceIndex();
        foreach (var x in new[] { 40, 20, 60, 10, 30, 50, 70, 25, 30 }) p.Add(x);
        return p;
    }

    [Fact]
    public void Add_and_contains()
    {
        var p = Sample();
        Assert.Equal(8, p.Count);
        Assert.True(p.Contains(25));
        Assert.False(p.Contains(26));
        Assert.Equal(10, p.Min());
        Assert.Equal(70, p.Max());
        Assert.Null(new PriceIndex().Min());
    }

    [Fact]
    public void Range_is_sorted()
    {
        var p = Sample();
        Assert.Equal(new[] { 20, 25, 30, 40, 50 }, p.Range(20, 50));
        Assert.Equal(new[] { 25 }, p.Range(21, 29));
        Assert.Empty(p.Range(71, 100));
    }

    [Fact]
    public void Floor()
    {
        var p = Sample();
        Assert.Equal(30, p.Floor(35));
        Assert.Equal(70, p.Floor(1000));
        Assert.Equal(40, p.Floor(40));
        Assert.Null(p.Floor(5));
    }

    [Fact]
    public void Narrow_ranges_on_a_big_catalogue_are_fast()
    {
        var p = new PriceIndex();
        var rnd = new Random(13);
        for (var i = 0; i < 200_000; i++) p.Add(rnd.Next(10_000_000));
        Perf.Under(1500, () =>
        {
            for (var q = 0; q < 100_000; q++)
            {
                var lo = rnd.Next(10_000_000);
                p.Range(lo, lo + 200);
            }
        }, "100,000 narrow range queries");
    }
}

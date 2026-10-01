using Challenges.OrderedMaps;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "ordered-map")]
public class OrderedMapTests
{
    [Fact]
    public void Price_at_a_moment()
    {
        var h = new PriceHistory();
        h.Record(100, 9.99m);
        h.Record(300, 12.50m);
        h.Record(200, 10.00m);
        Assert.Null(h.PriceAt(99));
        Assert.Equal(9.99m, h.PriceAt(100));
        Assert.Equal(10.00m, h.PriceAt(299));
        Assert.Equal(12.50m, h.PriceAt(10_000));
        h.Record(200, 11.00m);
        Assert.Equal(11.00m, h.PriceAt(250));
        Assert.Equal((300L, 12.50m), h.Latest);
        Assert.Null(new PriceHistory().Latest);
    }

    [Fact]
    public void Between_in_order()
    {
        var h = new PriceHistory();
        foreach (var t in new long[] { 50, 10, 40, 20, 30 }) h.Record(t, t);
        Assert.Equal(new long[] { 20, 30, 40 }, h.Between(15, 40).Select(x => x.Time));
        Assert.Empty(h.Between(51, 60));
    }

    [Fact]
    public void Many_queries()
    {
        var h = new PriceHistory();
        for (long t = 0; t < 200_000; t++) h.Record(t * 10, t);
        Perf.Under(1500, () =>
        {
            for (long q = 0; q < 1_000_000; q++) Assert.Equal(q % 200_000, h.PriceAt(q % 200_000 * 10 + 5));
        }, "1,000,000 price-at-time lookups");
    }
}

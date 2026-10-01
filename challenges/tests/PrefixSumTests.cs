using Challenges.PrefixSums;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "prefix-sum")]
public class PrefixSumTests
{
    [Fact]
    public void Range_totals()
    {
        var r = new SalesReport(new long[] { 5, 3, 8, 1, 9, 2 });
        Assert.Equal(12, r.Between(1, 3));
        Assert.Equal(28, r.Between(0, 5));
        Assert.Equal(9, r.Between(4, 4));
        Assert.Equal(4.0, r.AverageBetween(1, 3));
    }

    [Fact]
    public void First_day_reaching_a_target()
    {
        var r = new SalesReport(new long[] { 5, 3, 8, 1, 9, 2 });
        Assert.Equal(0, r.FirstDayReaching(5));
        Assert.Equal(2, r.FirstDayReaching(9));
        Assert.Equal(5, r.FirstDayReaching(28));
        Assert.Equal(-1, r.FirstDayReaching(29));
    }

    [Fact]
    public void Thousands_of_queries_on_years_of_data()
    {
        var daily = Enumerable.Range(0, 1_000_000).Select(i => (long)(i % 1000)).ToArray();
        var r = new SalesReport(daily);
        Perf.Under(1500, () =>
        {
            long total = 0;
            for (var q = 0; q < 2_000_000; q++) total += r.Between(q % 1000, 999_000 + q % 1000);
            Assert.True(total > 0);
        }, "2,000,000 range queries over 1,000,000 days");
    }
}

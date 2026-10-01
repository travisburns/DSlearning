using Challenges.MonotonicStack;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "monotonic-stack")]
public class MonotonicStackTests
{
    [Fact]
    public void Days_until_higher()
    {
        Assert.Equal(new[] { 1, 1, 4, 2, 1, 1, 0, 0 }, PriceAlerts.DaysUntilHigher(new[] { 73, 74, 75, 71, 69, 72, 76, 73 }));
        Assert.Equal(new[] { 0, 0, 0 }, PriceAlerts.DaysUntilHigher(new[] { 5, 5, 5 }));
    }

    [Fact]
    public void Falling_market_is_still_fast()
    {
        var prices = Enumerable.Range(0, 1_000_000).Select(i => 2_000_000 - i).ToArray();
        prices[^1] = int.MaxValue; // the very last day beats everything
        Perf.Under(1500, () =>
        {
            var a = PriceAlerts.DaysUntilHigher(prices);
            Assert.Equal(999_999, a[0]);
        }, "1,000,000 days of falling prices");
    }
}

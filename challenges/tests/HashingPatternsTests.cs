using Challenges.HashingPatterns;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "hashing-patterns")]
public class HashingPatternsTests
{
    [Fact]
    public void Gift_card_pair()
    {
        var p = new[] { 12, 7, 30, 18, 25 };
        var (i, j) = Checkout.TwoItemsFor(p, 37)!.Value;
        Assert.True(i < j);
        Assert.Equal(37, p[i] + p[j]);
        Assert.Null(Checkout.TwoItemsFor(p, 1000));
        Assert.Null(Checkout.TwoItemsFor(new[] { 10 }, 20));
        Assert.Equal((0, 1), Checkout.TwoItemsFor(new[] { 10, 10 }, 20));
    }

    [Fact]
    public void First_repeat()
    {
        Assert.Equal(4, Checkout.FirstRepeat(new[] { 9, 4, 2, 8, 4, 9 }));
        Assert.Null(Checkout.FirstRepeat(new[] { 1, 2, 3 }));
    }

    [Fact]
    public void Top_sellers()
    {
        var orders = new[] { "mug", "pen", "mug", "cap", "pen", "mug", "bag", "cap" };
        Assert.Equal(new[] { "mug", "cap", "pen" }, Checkout.TopSellers(orders, 3));
    }

    [Fact]
    public void Big_day_is_fast()
    {
        var prices = Enumerable.Range(1, 1_000_000).Select(i => i * 2).ToArray();
        var ids = Enumerable.Range(0, 1_000_000).Append(999_999).ToArray();
        Perf.Under(1500, () =>
        {
            Assert.Null(Checkout.TwoItemsFor(prices, 3)); // odd card, even prices
            Assert.Equal(999_999, Checkout.FirstRepeat(ids));
        }, "1,000,000 prices and orders");
    }
}

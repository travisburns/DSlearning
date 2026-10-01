using Challenges.Quicksort;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "quicksort")]
public class QuicksortTests
{
    [Fact]
    public void Kth_smallest()
    {
        var v = new[] { 9, 1, 8, 2, 7, 3 };
        Assert.Equal(1, Prices.KthSmallest(v, 0));
        Assert.Equal(3, Prices.KthSmallest(v, 2));
        Assert.Equal(9, Prices.KthSmallest(v, 5));
        Assert.Equal(new[] { 9, 1, 8, 2, 7, 3 }, v); // untouched
    }

    [Fact]
    public void Median_odd_and_even()
    {
        Assert.Equal(5, Prices.Median(new[] { 9, 5, 1 }));
        Assert.Equal(4.5, Prices.Median(new[] { 9, 5, 1, 4 }));
        Assert.Equal(7, Prices.Median(new[] { 7, 7, 7, 7 }));
    }

    [Fact]
    public void Sorted_input_does_not_blow_up()
    {
        var sorted = Enumerable.Range(0, 2_000_000).ToArray();
        Perf.Under(1500, () => Assert.Equal(999_999.5, Prices.Median(sorted)), "median of 2,000,000 already-sorted prices");
    }
}

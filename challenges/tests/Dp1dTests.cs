using Challenges.Dp1d;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "dp-1d")]
public class Dp1dTests
{
    [Fact]
    public void Ad_revenue_without_neighbours()
    {
        Assert.Equal(12, Planner.MaxAdRevenue(new[] { 2, 7, 9, 3, 1 }));
        Assert.Equal(4, Planner.MaxAdRevenue(new[] { 1, 2, 3, 1 }));
        Assert.Equal(0, Planner.MaxAdRevenue(Array.Empty<int>()));
        Assert.Equal(9, Planner.MaxAdRevenue(new[] { 9 }));
    }

    [Fact]
    public void Fewest_coins_beats_greedy()
    {
        Assert.Equal(2, Planner.MinCoins(6, new[] { 1, 3, 4 }));
        Assert.Equal(3, Planner.MinCoins(11, new[] { 1, 2, 5 }));
        Assert.Equal(-1, Planner.MinCoins(3, new[] { 2 }));
        Assert.Equal(0, Planner.MinCoins(0, new[] { 7 }));
    }

    [Fact]
    public void Big_inputs()
    {
        var slots = Enumerable.Range(0, 2_000_000).Select(i => i % 10).ToArray();
        Perf.Under(1500, () =>
        {
            Planner.MaxAdRevenue(slots);
            Assert.Equal(100, Planner.MinCoins(100_000, new[] { 1, 7, 100, 1000 }));
        }, "2,000,000 ad slots and making change for 100,000");
    }
}

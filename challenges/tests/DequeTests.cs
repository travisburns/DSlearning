using Challenges.Deques;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "deque")]
public class DequeTests
{
    [Fact]
    public void Max_of_each_window()
    {
        Assert.Equal(new[] { 3, 3, 5, 5, 6, 7 }, Ticker.WindowMax(new[] { 1, 3, -1, -3, 5, 3, 6, 7 }, 3));
        Assert.Equal(new[] { 4 }, Ticker.WindowMax(new[] { 4 }, 1));
        Assert.Equal(new[] { 9, 8, 7 }, Ticker.WindowMax(new[] { 9, 8, 7, 6 }, 2));
    }

    [Fact]
    public void Big_windows_are_still_linear()
    {
        var rnd = new Random(3);
        var prices = Enumerable.Range(0, 1_000_000).Select(_ => rnd.Next(1_000_000)).ToArray();
        Perf.Under(1500, () => Ticker.WindowMax(prices, 5_000), "1,000,000 prices with a 5,000 window");
    }
}

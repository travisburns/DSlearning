using Challenges.SlidingWindow;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "sliding-window")]
public class SlidingWindowTests
{
    [Fact]
    public void Peak_load()
    {
        Assert.Equal(16, Traffic.PeakLoad(new[] { 2, 1, 5, 1, 3, 9, 4 }, 3));
        Assert.Equal(13, Traffic.PeakLoad(new[] { 2, 1, 5, 1, 3, 9, 4 }, 2));
        Assert.Equal(25, Traffic.PeakLoad(new[] { 2, 1, 5, 1, 3, 9, 4 }, 7));
    }

    [Fact]
    public void Longest_unique_streak()
    {
        Assert.Equal(3, Traffic.LongestUniqueStreak(new[] { "home", "shop", "cart", "shop", "pay" }));
        Assert.Equal(4, Traffic.LongestUniqueStreak(new[] { "a", "b", "a", "c", "d", "b" }));
        Assert.Equal(1, Traffic.LongestUniqueStreak(new[] { "x", "x", "x" }));
        Assert.Equal(0, Traffic.LongestUniqueStreak(Array.Empty<string>()));
    }

    [Fact]
    public void A_whole_day_is_fast() =>
        Perf.Under(1600, () =>
        {
            var day = Enumerable.Range(0, 86_400 * 10).Select(i => i % 97).ToArray();
            Traffic.PeakLoad(day, 3600);
            var pages = Enumerable.Range(0, 500_000).Select(i => "p" + i % 1000).ToArray();
            Assert.Equal(1000, Traffic.LongestUniqueStreak(pages));
        }, "a day of traffic with a 1-hour window");
}

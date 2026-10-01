using Challenges.Dfs;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "dfs")]
public class DfsTests
{
    [Fact]
    public void Counts_islands()
    {
        var map = new[]
        {
            "##...#",
            "#..###",
            "..#...",
            "......",
            "#.#.##",
        };
        Assert.Equal((6, 4), Explore.Islands(map));
        Assert.Equal((0, 0), Explore.Islands(new[] { "..." }));
    }

    [Fact]
    public void Reachable_pages_with_cycles()
    {
        var links = new Dictionary<string, List<string>>
        {
            ["home"] = new() { "about", "blog" },
            ["blog"] = new() { "post1", "home" },
            ["post1"] = new() { "blog" },
            ["orphan"] = new() { "home" },
        };
        var r = Explore.Reachable(links, "home");
        Assert.Equal(new[] { "about", "blog", "home", "post1" }, r.OrderBy(x => x));
    }

    [Fact]
    public void One_huge_island_does_not_overflow()
    {
        var map = Enumerable.Repeat(new string('#', 1000), 1000).ToArray();
        Perf.Under(2000, () => Assert.Equal((1, 1_000_000), Explore.Islands(map)), "a 1000 × 1000 all-land map");
    }
}

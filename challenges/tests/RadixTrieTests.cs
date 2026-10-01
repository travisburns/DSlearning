using Challenges.RadixTrie;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "radix-trie")]
public class RadixTrieTests
{
    [Fact]
    public void Exact_and_longest_prefix()
    {
        var t = new RouteTable();
        t.Add("/api/users", "users");
        t.Add("/api/user-settings", "settings");
        t.Add("/api", "api");
        t.Add("/about", "about");
        Assert.Equal("users", t.Get("/api/users"));
        Assert.Null(t.Get("/api/use"));
        Assert.Equal("users", t.LongestPrefix("/api/users/42/photos"));
        Assert.Equal("settings", t.LongestPrefix("/api/user-settings?x=1"));
        Assert.Equal("api", t.LongestPrefix("/api/orders"));
        Assert.Null(t.LongestPrefix("/contact"));
        t.Add("/api", "api-v2");
        Assert.Equal("api-v2", t.Get("/api"));
    }

    [Fact]
    public void Compressed_edges_keep_the_node_count_low()
    {
        var t = new RouteTable();
        var rnd = new Random(103);
        for (var i = 0; i < 2000; i++) t.Add("/service/" + rnd.Next(100) + "/endpoint/" + Guid.NewGuid().ToString("N"), "h" + i);
        Assert.True(t.NodeCount <= 2 * 2000 + 1, $"{t.NodeCount} nodes for 2000 routes: edges should hold whole strings");
    }

    [Fact]
    public void Lots_of_lookups()
    {
        var t = new RouteTable();
        for (var i = 0; i < 50_000; i++) t.Add($"/tenant/{i}/api/v{i % 3}", "h" + i);
        Perf.Under(1500, () =>
        {
            for (var q = 0; q < 300_000; q++) Assert.NotNull(t.LongestPrefix($"/tenant/{q % 50_000}/api/v{q % 50_000 % 3}/items/9"));
        }, "300,000 route lookups");
    }
}

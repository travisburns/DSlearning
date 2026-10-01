using Challenges.FastSlowPointers;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "fast-slow-pointers")]
public class FastSlowPointersTests
{
    private static Func<string, string?> Map(params (string, string?)[] links)
    {
        var d = links.ToDictionary(l => l.Item1, l => l.Item2);
        return u => d.TryGetValue(u, out var v) ? v : null;
    }

    [Fact]
    public void Straight_chain_has_no_loop()
    {
        var next = Map(("a", "b"), ("b", "c"), ("c", null));
        Assert.False(Redirects.HasLoop("a", next));
        Assert.Null(Redirects.LoopEntry("a", next));
        Assert.False(Redirects.HasLoop("c", next));
    }

    [Fact]
    public void Finds_the_loop_and_where_it_starts()
    {
        var next = Map(("a", "b"), ("b", "c"), ("c", "d"), ("d", "e"), ("e", "c"));
        Assert.True(Redirects.HasLoop("a", next));
        Assert.Equal("c", Redirects.LoopEntry("a", next));
        var self = Map(("x", "x"));
        Assert.Equal("x", Redirects.LoopEntry("x", self));
    }

    [Fact]
    public void Long_chains_are_fine()
    {
        Func<string, string?> next = u =>
        {
            var n = int.Parse(u);
            return n < 1_000_000 ? (n + 1).ToString() : "500000";
        };
        Assert.Equal("500000", Redirects.LoopEntry("0", next));
    }
}

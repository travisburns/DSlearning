using Challenges.Graphs;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "graph")]
public class GraphTests
{
    private static SocialGraph Sample()
    {
        var g = new SocialGraph();
        foreach (var (a, b) in new[] { ("ann", "bob"), ("ann", "cat"), ("bob", "dan"), ("cat", "dan"), ("cat", "eve"), ("bob", "fay"), ("ann", "ann") })
            g.AddFriendship(a, b);
        return g;
    }

    [Fact]
    public void Friends_go_both_ways()
    {
        var g = Sample();
        Assert.Equal(new[] { "bob", "cat" }, g.Friends("ann"));
        Assert.Equal(new[] { "ann", "dan", "fay" }, g.Friends("bob"));
        Assert.Empty(g.Friends("zed"));
    }

    [Fact]
    public void Mutual_and_suggestions()
    {
        var g = Sample();
        Assert.Equal(new[] { "bob", "cat" }, g.Mutual("ann", "dan"));
        Assert.Equal(new[] { "dan", "eve", "fay" }, g.Suggest("ann", 5)); // dan shares 2, eve and fay 1
        Assert.Equal(new[] { "dan" }, g.Suggest("ann", 1));
    }
}

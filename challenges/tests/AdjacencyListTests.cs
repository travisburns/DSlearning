using Challenges.AdjacencyList;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "adjacency-list")]
public class AdjacencyListTests
{
    [Fact]
    public void Both_directions()
    {
        var c = new Catalogue(new[] { ("CS101", "CS201"), ("CS101", "CS202"), ("MATH1", "CS202"), ("CS201", "CS301") });
        Assert.Equal(5, c.CourseCount);
        Assert.Equal(4, c.LinkCount);
        Assert.Equal(new[] { "CS201", "CS202" }, c.Unlocks("CS101"));
        Assert.Equal(new[] { "CS101", "MATH1" }, c.Requires("CS202"));
        Assert.Empty(c.Unlocks("CS301"));
        Assert.Equal(new[] { "CS101", "MATH1" }, c.EntryCourses());
    }

    [Fact]
    public void Big_sparse_catalogue()
    {
        var pairs = Enumerable.Range(0, 300_000).Select(i => ("C" + i, "C" + (i + 1 + i % 7))).ToArray();
        Perf.Under(1500, () =>
        {
            var c = new Catalogue(pairs);
            for (var i = 0; i < 300_000; i += 3) c.Unlocks("C" + i);
            Assert.Equal(300_000, c.LinkCount);
        }, "a 300,000-link catalogue");
    }
}

using Challenges.TopologicalSort;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "topological-sort")]
public class TopologicalSortTests
{
    [Fact]
    public void Dependencies_first_ties_alphabetical()
    {
        var deps = new Dictionary<string, List<string>>
        {
            ["package"] = new() { "test", "docs" },
            ["test"] = new() { "compile" },
            ["compile"] = new() { "restore" },
            ["docs"] = new() { "restore" },
            ["lint"] = new(),
        };
        Assert.Equal(new[] { "lint", "restore", "compile", "docs", "test", "package" }, TaskRunner.Order(deps));
    }

    [Fact]
    public void Cycles_are_rejected()
    {
        var deps = new Dictionary<string, List<string>> { ["a"] = new() { "b" }, ["b"] = new() { "c" }, ["c"] = new() { "a" }, ["d"] = new() };
        Assert.Throws<InvalidOperationException>(() => TaskRunner.Order(deps));
    }

    [Fact]
    public void Big_builds()
    {
        var deps = new Dictionary<string, List<string>>();
        for (var i = 1; i < 100_000; i++) deps["t" + i.ToString("D6")] = new() { "t" + (i / 2).ToString("D6"), "t" + (i - 1).ToString("D6") };
        Perf.Under(1500, () =>
        {
            var order = TaskRunner.Order(deps);
            Assert.Equal(100_000, order.Count);
            Assert.Equal("t000000", order[0]);
        }, "100,000 tasks");
    }
}

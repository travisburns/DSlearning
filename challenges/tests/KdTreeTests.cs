using Challenges.KdTree;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "kd-tree")]
public class KdTreeTests
{
    private static readonly List<(double, double, string)> Stores = new()
    {
        (2, 3, "A"), (5, 4, "B"), (9, 6, "C"), (4, 7, "D"), (8, 1, "E"), (7, 2, "F"),
    };

    [Fact]
    public void Nearest_store()
    {
        var f = new StoreFinder(Stores);
        Assert.Equal("E", f.Nearest(9, 2)); // E (8,1) is √2 away; F (7,2) is 2 away
        Assert.Equal("A", f.Nearest(0, 0));
        Assert.Equal("D", f.Nearest(4, 8));
        Assert.Equal(new[] { "B", "D" }, f.Within(4.5, 5.5, 2));
    }

    [Fact]
    public void Matches_brute_force()
    {
        var rnd = new Random(83);
        var stores = Enumerable.Range(0, 2000).Select(i => (rnd.NextDouble() * 100, rnd.NextDouble() * 100, "s" + i)).ToList();
        var f = new StoreFinder(stores);
        for (var q = 0; q < 300; q++)
        {
            double x = rnd.NextDouble() * 120 - 10, y = rnd.NextDouble() * 120 - 10;
            var expected = stores.OrderBy(s => (s.Item1 - x) * (s.Item1 - x) + (s.Item2 - y) * (s.Item2 - y)).First().Item3;
            Assert.Equal(expected, f.Nearest(x, y));
            var r = rnd.NextDouble() * 15;
            var inside = stores.Where(s => (s.Item1 - x) * (s.Item1 - x) + (s.Item2 - y) * (s.Item2 - y) <= r * r).Select(s => s.Item3).OrderBy(n => n, StringComparer.Ordinal);
            Assert.Equal(inside, f.Within(x, y, r));
        }
    }

    [Fact]
    public void Busy_store_finder()
    {
        var rnd = new Random(89);
        var stores = Enumerable.Range(0, 200_000).Select(i => (rnd.NextDouble() * 1000, rnd.NextDouble() * 1000, "s" + i)).ToList();
        var f = new StoreFinder(stores);
        Perf.Under(1500, () =>
        {
            for (var q = 0; q < 100_000; q++) f.Nearest(rnd.NextDouble() * 1000, rnd.NextDouble() * 1000);
        }, "100,000 nearest-store queries over 200,000 stores");
    }
}

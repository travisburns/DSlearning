using Challenges.Kruskal;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "kruskal")]
public class KruskalTests
{
    [Fact]
    public void Cheapest_connection()
    {
        var opts = new List<(int, int, int)> { (0, 1, 4), (0, 2, 3), (1, 2, 1), (1, 3, 2), (2, 3, 4), (3, 4, 2), (4, 5, 6), (3, 5, 8) };
        var plan = Cabling.Plan(6, opts)!.Value;
        Assert.Equal(14, plan.Total);
        Assert.Equal(5, plan.Chosen.Count);
    }

    [Fact]
    public void Impossible_when_a_building_is_cut_off() =>
        Assert.Null(Cabling.Plan(4, new List<(int, int, int)> { (0, 1, 1), (1, 2, 1) }));

    [Fact]
    public void Big_campus()
    {
        var rnd = new Random(47);
        const int N = 100_000;
        var opts = new List<(int, int, int)>();
        for (var i = 1; i < N; i++) opts.Add((rnd.Next(i), i, rnd.Next(1, 1000)));
        for (var i = 0; i < 400_000; i++) opts.Add((rnd.Next(N), rnd.Next(N), rnd.Next(1, 1000)));
        Perf.Under(2000, () => Assert.Equal(N - 1, Cabling.Plan(N, opts)!.Value.Chosen.Count), "100,000 buildings and 500,000 options");
    }
}

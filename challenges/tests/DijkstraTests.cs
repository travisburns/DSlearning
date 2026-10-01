using Challenges.Dijkstra;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "dijkstra")]
public class DijkstraTests
{
    private static readonly List<(int, int, int)> Roads = new() { (0, 1, 7), (0, 2, 9), (0, 5, 14), (1, 2, 10), (1, 3, 15), (2, 3, 11), (2, 5, 2), (3, 4, 6), (4, 5, 9) };

    [Fact]
    public void Cheapest_costs()
    {
        Assert.Equal(new long[] { 0, 7, 9, 20, 20, 11, -1 }, Courier.Cheapest(7, Roads, 0));
    }

    [Fact]
    public void Route()
    {
        Assert.Equal(new[] { 0, 2, 5, 4 }, Courier.Route(7, Roads, 0, 4));
        Assert.Equal(new[] { 0 }, Courier.Route(7, Roads, 0, 0));
        Assert.Null(Courier.Route(7, Roads, 0, 6));
    }

    [Fact]
    public void Big_network()
    {
        var rnd = new Random(43);
        const int N = 100_000;
        var roads = new List<(int, int, int)>();
        for (var i = 1; i < N; i++) roads.Add((rnd.Next(i), i, rnd.Next(1, 100)));
        for (var i = 0; i < 200_000; i++) roads.Add((rnd.Next(N), rnd.Next(N), rnd.Next(1, 100)));
        Perf.Under(1500, () => Assert.DoesNotContain(-1L, Courier.Cheapest(N, roads, 0)), "100,000 depots and 300,000 roads");
    }
}

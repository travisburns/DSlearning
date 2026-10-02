using Challenges.Balancing;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "load-balancing")]
public class LoadBalancingTests
{
    private static string[] Take(Func<string?> next, int n) => Enumerable.Range(0, n).Select(_ => next()!).ToArray();

    [Fact]
    public void Round_robin_takes_turns()
    {
        var lb = new LoadBalancer(new[] { "A", "B", "C" }, 3);
        Assert.Equal(new[] { "A", "B", "C", "A", "B", "C", "A" }, Take(lb.NextRoundRobin, 7));
    }

    [Fact]
    public void Round_robin_skips_servers_that_are_down()
    {
        var lb = new LoadBalancer(new[] { "A", "B", "C" }, 2);
        lb.ReportHealth("B", false);
        Assert.True(lb.IsUp("B"));
        lb.ReportHealth("B", false);
        Assert.False(lb.IsUp("B"));
        Assert.Equal(new[] { "A", "C", "A", "C" }, Take(lb.NextRoundRobin, 4));
        lb.ReportHealth("B", true);
        Assert.True(lb.IsUp("B"));
        Assert.Equal(new[] { "A", "B", "C" }, Take(lb.NextRoundRobin, 3));
    }

    [Fact]
    public void A_success_resets_the_failure_count()
    {
        var lb = new LoadBalancer(new[] { "A" }, 3);
        lb.ReportHealth("A", false);
        lb.ReportHealth("A", false);
        lb.ReportHealth("A", true);
        lb.ReportHealth("A", false);
        lb.ReportHealth("A", false);
        Assert.True(lb.IsUp("A"));
        lb.ReportHealth("A", false);
        Assert.False(lb.IsUp("A"));
    }

    [Fact]
    public void All_down_means_null()
    {
        var lb = new LoadBalancer(new[] { "A", "B" }, 1);
        lb.ReportHealth("A", false);
        lb.ReportHealth("B", false);
        Assert.Null(lb.NextRoundRobin());
        Assert.Null(lb.Acquire());
    }

    [Fact]
    public void Least_connections_picks_the_least_busy()
    {
        var lb = new LoadBalancer(new[] { "A", "B", "C" }, 1);
        Assert.Equal(new[] { "A", "B", "C", "A" }, Take(lb.Acquire, 4));
        Assert.Equal(2, lb.InProgress("A"));
        lb.Release("B");
        lb.Release("C");
        Assert.Equal("B", lb.Acquire());
        Assert.Equal("C", lb.Acquire());
        Assert.Equal("B", lb.Acquire());
        Assert.Equal(2, lb.InProgress("B"));
    }

    [Fact]
    public void Least_connections_skips_down_servers_and_remembers_their_load()
    {
        var lb = new LoadBalancer(new[] { "A", "B", "C" }, 1);
        lb.ReportHealth("A", false);
        Assert.Equal(new[] { "B", "C", "B", "C" }, Take(lb.Acquire, 4));
        lb.ReportHealth("A", true);
        Assert.Equal("A", lb.Acquire());
        Assert.Equal("A", lb.Acquire());
        Assert.Equal("A", lb.Acquire()); // all tied at 2: earliest wins
        lb.ReportHealth("B", false);
        lb.Release("B");
        Assert.Equal(1, lb.InProgress("B"));
        Assert.Equal("C", lb.Acquire()); // B is least busy but down
        Assert.Equal(3, lb.InProgress("C"));
    }

    [Fact]
    public void Releases_balance_out()
    {
        var rng = new Random(5);
        var names = Enumerable.Range(0, 20).Select(i => $"s{i}").ToArray();
        var lb = new LoadBalancer(names, 1);
        var active = new List<string>();
        for (var step = 0; step < 5000; step++)
        {
            if (active.Count > 0 && rng.Next(3) == 0)
            {
                var k = rng.Next(active.Count);
                lb.Release(active[k]);
                active.RemoveAt(k);
            }
            else
            {
                var expected = names.OrderBy(n => lb.InProgress(n)).ThenBy(n => Array.IndexOf(names, n)).First();
                var got = lb.Acquire()!;
                Assert.Equal(expected, got);
                active.Add(got);
            }
        }
    }

    [Fact]
    public void Big_pools_stay_fast()
    {
        var names = Enumerable.Range(0, 20_000).Select(i => $"w{i}").ToArray();
        Perf.Under(800, () =>
        {
            var lb = new LoadBalancer(names, 1);
            var held = new Queue<string>();
            for (var i = 0; i < 60_000; i++)
            {
                held.Enqueue(lb.Acquire()!);
                if (held.Count > 25_000) lb.Release(held.Dequeue());
            }
        }, "60,000 least-connections picks over 20,000 servers");
    }
}

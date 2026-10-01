using Challenges.IntervalTree;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "interval-tree")]
public class IntervalTreeTests
{
    [Fact]
    public void Finds_overlaps_in_start_order()
    {
        var idx = new WindowIndex(new()
        {
            (10, 20, "db"), (5, 8, "dns"), (15, 40, "cdn"), (30, 35, "auth"), (1, 100, "backup"), (21, 29, "mail"),
        });
        Assert.Equal(new[] { "backup", "db", "cdn" }, idx.Overlapping(18, 20));
        Assert.Equal(new[] { "backup", "dns" }, idx.Overlapping(6, 6));
        Assert.Equal(new[] { "backup", "cdn", "mail", "auth" }, idx.Overlapping(25, 30));
        Assert.Empty(new WindowIndex(new() { (1, 2, "x") }).Overlapping(3, 9));
    }

    [Fact]
    public void Matches_brute_force()
    {
        var rnd = new Random(73);
        var ws = Enumerable.Range(0, 400).Select(i =>
        {
            var s = rnd.Next(1000);
            return (s, s + rnd.Next(0, 60), "w" + i.ToString("D3"));
        }).ToList();
        var idx = new WindowIndex(ws);
        for (var q = 0; q < 300; q++)
        {
            var a = rnd.Next(1050);
            var b = a + rnd.Next(0, 40);
            var expected = ws.Where(w => w.Item1 <= b && w.Item2 >= a).OrderBy(w => w.Item1).ThenBy(w => w.Item3, StringComparer.Ordinal).Select(w => w.Item3);
            Assert.Equal(expected, idx.Overlapping(a, b));
        }
    }

    [Fact]
    public void Big_schedule()
    {
        var rnd = new Random(79);
        var ws = Enumerable.Range(0, 300_000).Select(i =>
        {
            var s = rnd.Next(100_000_000);
            return (s, s + rnd.Next(1, 500), "w" + i);
        }).ToList();
        var idx = new WindowIndex(ws);
        Perf.Under(1500, () =>
        {
            var hits = 0;
            for (var q = 0; q < 100_000; q++)
            {
                var a = rnd.Next(100_000_000);
                hits += idx.Overlapping(a, a + 100).Count;
            }
            Assert.True(hits > 0);
        }, "100,000 overlap queries over 300,000 windows");
    }
}

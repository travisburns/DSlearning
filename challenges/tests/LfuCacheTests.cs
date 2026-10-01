using Challenges.Lfu;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "lfu-cache")]
public class LfuCacheTests
{
    [Fact]
    public void Evicts_least_frequently_used()
    {
        var c = new LfuCache(2);
        c.Put("logo", "L");
        c.Put("banner", "B");
        Assert.Equal("L", c.Get("logo"));   // logo used twice
        c.Put("promo", "P");                 // banner (1 use) goes
        Assert.Null(c.Get("banner"));
        Assert.Equal("L", c.Get("logo"));    // logo 3
        Assert.Equal("P", c.Get("promo"));   // promo 2
        c.Put("icon", "I");                  // promo (2) is least used
        Assert.Null(c.Get("promo"));
        Assert.Equal("L", c.Get("logo"));
        Assert.Equal(2, c.Count);
    }

    [Fact]
    public void Ties_go_to_the_least_recent()
    {
        var c = new LfuCache(2);
        c.Put("a", "1");
        c.Put("b", "2");
        c.Put("c", "3"); // a and b both used once; a is older
        Assert.Null(c.Get("a"));
        Assert.Equal("2", c.Get("b"));
    }

    [Fact]
    public void Matches_a_slow_reference()
    {
        var rnd = new Random(151);
        var c = new LfuCache(5);
        var data = new Dictionary<string, (string V, int N, int T)>();
        var tick = 0;
        for (var i = 0; i < 3000; i++)
        {
            var k = "k" + rnd.Next(12);
            tick++;
            if (rnd.Next(2) == 0)
            {
                var expected = data.TryGetValue(k, out var e) ? e.V : null;
                if (expected != null) data[k] = (e.V, e.N + 1, tick);
                Assert.Equal(expected, c.Get(k));
            }
            else
            {
                var v = "v" + i;
                if (data.TryGetValue(k, out var e)) data[k] = (v, e.N + 1, tick);
                else
                {
                    if (data.Count >= 5) data.Remove(data.OrderBy(x => x.Value.N).ThenBy(x => x.Value.T).First().Key);
                    data[k] = (v, 1, tick);
                }
                c.Put(k, v);
            }
        }
    }

    [Fact]
    public void Heavy_traffic() =>
        Perf.Under(1500, () =>
        {
            var c = new LfuCache(10_000);
            var rnd = new Random(157);
            for (var i = 0; i < 1_000_000; i++)
            {
                var k = "img" + (rnd.Next(10) < 7 ? rnd.Next(100) : rnd.Next(100_000));
                if (c.Get(k) == null) c.Put(k, "data");
            }
        }, "1,000,000 CDN requests");
}

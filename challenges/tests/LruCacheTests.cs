using Challenges.Lru;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "lru-cache")]
public class LruCacheTests
{
    [Fact]
    public void Evicts_least_recently_used()
    {
        var c = new LruCache<string, int>(2);
        c.Put("a", 1);
        c.Put("b", 2);
        Assert.True(c.TryGet("a", out _)); // a is now more recent than b
        c.Put("c", 3);                      // evicts b
        Assert.False(c.TryGet("b", out _));
        Assert.True(c.TryGet("a", out var a));
        Assert.Equal(1, a);
        c.Put("a", 10);                      // update counts as use
        c.Put("d", 4);                       // evicts c
        Assert.False(c.TryGet("c", out _));
        Assert.Equal(2, c.Count);
    }

    [Fact]
    public void Calls_the_slow_service_only_on_a_miss()
    {
        var calls = 0;
        var c = new LruCache<int, string>(3);
        string Load(int id)
        {
            calls++;
            return "price-" + id;
        }
        foreach (var id in new[] { 1, 2, 1, 3, 1, 4, 2 }) c.GetOrAdd(id, Load);
        Assert.Equal(5, calls); // misses: 1, 2, 3, 4, and 2 again (evicted when 4 arrived)
    }

    [Fact]
    public void Heavy_traffic() =>
        Perf.Under(1500, () =>
        {
            var c = new LruCache<int, int>(10_000);
            var rnd = new Random(149);
            for (var i = 0; i < 2_000_000; i++) c.GetOrAdd(rnd.Next(20_000), k => k * 2);
            Assert.Equal(10_000, c.Count);
        }, "2,000,000 cache requests");
}

using Challenges.Caching;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "caching-layer")]
public class CachingLayerTests
{
    private long _now;

    [Fact]
    public void Loads_on_miss_then_hits()
    {
        var calls = new List<int>();
        var c = new ReadThroughCache<int, string>(id => { calls.Add(id); return $"price-{id}"; }, 10, 1000, () => _now);
        Assert.Equal("price-7", c.Get(7));
        Assert.Equal("price-7", c.Get(7));
        Assert.Equal("price-8", c.Get(8));
        Assert.Equal(new[] { 7, 8 }, calls);
        Assert.Equal(1, c.Hits);
        Assert.Equal(2, c.Loads);
        Assert.Equal(2, c.Count);
    }

    [Fact]
    public void Entries_expire_after_the_ttl()
    {
        var version = 1;
        var c = new ReadThroughCache<string, int>(_ => version, 10, 500, () => _now);
        Assert.Equal(1, c.Get("p"));
        version = 2;
        _now += 499;
        Assert.Equal(1, c.Get("p"));
        _now += 1;
        Assert.Equal(2, c.Get("p"));
        Assert.Equal(2, c.Loads);
    }

    [Fact]
    public void Invalidate_forces_a_fresh_load()
    {
        var price = 10;
        var c = new ReadThroughCache<string, int>(_ => price, 10, 60_000, () => _now);
        Assert.Equal(10, c.Get("p"));
        price = 12;
        Assert.Equal(10, c.Get("p"));
        c.Invalidate("p");
        Assert.Equal(12, c.Get("p"));
        c.Invalidate("missing");
    }

    [Fact]
    public void Evicts_the_least_recently_used()
    {
        var c = new ReadThroughCache<int, int>(k => k * 10, 3, 60_000, () => _now);
        c.Get(1);
        c.Get(2);
        c.Get(3);
        c.Get(1); // 1 is now most recent; 2 is least
        c.Get(4); // evicts 2
        Assert.Equal(3, c.Count);
        var loads = c.Loads;
        c.Get(1);
        c.Get(3);
        c.Get(4);
        Assert.Equal(loads, c.Loads);
        c.Get(2);
        Assert.Equal(loads + 1, c.Loads);
    }

    [Fact]
    public void A_failed_load_is_not_cached()
    {
        var fail = true;
        var c = new ReadThroughCache<string, string>(_ => fail ? throw new TimeoutException("pricing down") : "ok", 10, 60_000, () => _now);
        Assert.Throws<TimeoutException>(() => c.Get("p"));
        Assert.Equal(0, c.Count);
        fail = false;
        Assert.Equal("ok", c.Get("p"));
    }

    [Fact]
    public void A_stampede_calls_load_once()
    {
        var c = new ReadThroughCache<string, int>(_ =>
        {
            Thread.Sleep(200);
            return 42;
        }, 10, 60_000, () => 0);
        var results = new int[100];
        Exception? error = null;
        Hang.Within(5000, () =>
        {
            using var go = new ManualResetEventSlim();
            var threads = Enumerable.Range(0, results.Length).Select(i => new Thread(() =>
            {
                go.Wait();
                try { results[i] = c.Get("hot"); }
                catch (Exception e) { error = e; }
            })).ToList();
            threads.ForEach(t => t.Start());
            go.Set();
            threads.ForEach(t => t.Join());
        }, "100 threads reading one key");
        if (error != null) throw error;
        Assert.All(results, r => Assert.Equal(42, r));
        Assert.Equal(1, c.Loads);
    }

    [Fact]
    public void Waiters_share_a_failure()
    {
        var c = new ReadThroughCache<string, int>(_ =>
        {
            Thread.Sleep(150);
            throw new TimeoutException("down");
        }, 10, 60_000, () => 0);
        var errors = 0;
        Hang.Within(5000, () =>
        {
            var tasks = Enumerable.Range(0, 20).Select(_ => Task.Run(() =>
            {
                try { c.Get("k"); }
                catch (TimeoutException) { Interlocked.Increment(ref errors); }
            })).ToArray();
            Task.WaitAll(tasks);
        }, "20 callers of a failing load");
        Assert.Equal(20, errors);
        Assert.True(c.Loads < 20, $"load ran {c.Loads} times for 20 simultaneous callers.");
    }

    [Fact]
    public void A_slow_load_does_not_block_other_keys()
    {
        using var release = new ManualResetEventSlim();
        var c = new ReadThroughCache<string, string>(k =>
        {
            if (k == "slow") release.Wait(3000);
            return k.ToUpperInvariant();
        }, 10, 60_000, () => 0);
        c.Get("fast");
        var slow = Task.Run(() => c.Get("slow"));
        Thread.Sleep(50);
        Hang.Within(500, () =>
        {
            Assert.Equal("FAST", c.Get("fast"));
            Assert.Equal("OTHER", c.Get("other"));
        }, "Reading other keys while one key is loading");
        release.Set();
        Assert.Equal("SLOW", slow.Result);
    }
}

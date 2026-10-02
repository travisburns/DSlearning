using Challenges.RateLimiting;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "rate-limiting")]
public class RateLimitingTests
{
    private long _now = 10_000;

    [Fact]
    public void Bucket_allows_a_burst_then_rejects()
    {
        var b = new TokenBucket(5, 1, () => _now);
        for (var i = 0; i < 5; i++) Assert.True(b.TryTake());
        Assert.False(b.TryTake());
        Assert.Equal(0, b.Available, 6);
    }

    [Fact]
    public void Bucket_refills_over_time_up_to_capacity()
    {
        var b = new TokenBucket(4, 2, () => _now);
        for (var i = 0; i < 4; i++) b.TryTake();
        _now += 500;
        Assert.Equal(1, b.Available, 6);
        Assert.True(b.TryTake());
        Assert.False(b.TryTake());
        _now += 250;
        Assert.Equal(0.5, b.Available, 6);
        _now += 60_000;
        Assert.Equal(4, b.Available, 6);
    }

    [Fact]
    public void Bucket_take_is_all_or_nothing()
    {
        var b = new TokenBucket(10, 1, () => _now);
        Assert.True(b.TryTake(7));
        Assert.False(b.TryTake(4));
        Assert.Equal(3, b.Available, 6);
        Assert.True(b.TryTake(3));
    }

    [Fact]
    public void Bucket_long_run_rate_matches_refill()
    {
        var b = new TokenBucket(10, 5, () => _now);
        var allowed = 0;
        for (var ms = 0; ms < 60_000; ms += 10)
        {
            _now += 10;
            if (b.TryTake()) allowed++;
        }
        // 10 up front + 5 per second for 60 s.
        Assert.InRange(allowed, 309, 311);
    }

    [Fact]
    public void Sliding_window_counts_the_last_window_only()
    {
        var l = new SlidingWindowLimiter(3, 1000, () => _now);
        Assert.True(l.Allow("k"));
        _now += 400;
        Assert.True(l.Allow("k"));
        Assert.True(l.Allow("k"));
        Assert.False(l.Allow("k"));
        _now += 599; // first request was 999 ms ago: still counts
        Assert.False(l.Allow("k"));
        _now += 1; // now exactly 1000 ms ago: drops out
        Assert.True(l.Allow("k"));
        Assert.False(l.Allow("k"));
    }

    [Fact]
    public void No_double_burst_at_a_window_edge()
    {
        var l = new SlidingWindowLimiter(10, 60_000, () => _now);
        _now = 59_000;
        for (var i = 0; i < 10; i++) Assert.True(l.Allow("k"));
        _now = 60_000;
        for (var i = 0; i < 10; i++) Assert.False(l.Allow("k"));
    }

    [Fact]
    public void Rejected_requests_do_not_count_and_clients_are_independent()
    {
        var l = new SlidingWindowLimiter(2, 1000, () => _now);
        Assert.True(l.Allow("a"));
        Assert.True(l.Allow("a"));
        for (var i = 0; i < 50; i++) Assert.False(l.Allow("a"));
        Assert.True(l.Allow("b"));
        _now += 1000;
        Assert.True(l.Allow("a"));
        Assert.True(l.Allow("a"));
    }

    [Fact]
    public void Many_clients_and_requests_are_fast()
    {
        Perf.Under(1500, () =>
        {
            long now = 0;
            var l = new SlidingWindowLimiter(100, 10_000, () => now);
            var keys = Enumerable.Range(0, 1000).Select(i => $"key{i}").ToArray();
            var allowed = 0;
            for (var i = 0; i < 2_000_000; i++)
            {
                if (i % 20 == 0) now++;
                if (l.Allow(keys[i % 1000])) allowed++;
            }
            Assert.True(allowed > 0);
        }, "2,000,000 checks across 1,000 keys");
    }
}

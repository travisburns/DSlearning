using Challenges.Queues;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "queue")]
public class QueueTests
{
    [Fact]
    public void Allows_up_to_n_per_window()
    {
        var r = new RateLimiter(3, 1000);
        Assert.True(r.Allow(0));
        Assert.True(r.Allow(100));
        Assert.True(r.Allow(200));
        Assert.False(r.Allow(300));   // 4th within 1s
        Assert.False(r.Allow(999));
        Assert.True(r.Allow(1000));   // the request at 0 has expired
        Assert.Equal(3, r.InWindow);
        Assert.True(r.Allow(5000));   // everything expired
        Assert.Equal(1, r.InWindow);
    }

    [Fact]
    public void Rejected_requests_dont_count()
    {
        var r = new RateLimiter(1, 100);
        Assert.True(r.Allow(0));
        Assert.False(r.Allow(50));
        Assert.True(r.Allow(100));
    }

    [Fact]
    public void Heavy_traffic_is_fast() =>
        Perf.Under(1500, () =>
        {
            var r = new RateLimiter(100_000, 60_000);
            var ok = 0;
            for (long t = 0; t < 2_000_000; t++) if (r.Allow(t / 10)) ok++;
            Assert.True(ok > 0);
        }, "2,000,000 requests against a 100,000-per-minute limit");
}

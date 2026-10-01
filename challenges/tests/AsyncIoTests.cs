using System.Diagnostics;
using Challenges.AsyncIo;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "async-io")]
public class AsyncIoTests
{
    [Fact]
    public async Task Concurrent_but_capped_and_in_order()
    {
        int running = 0, peak = 0;
        async Task<string> Fake(string url)
        {
            var now = Interlocked.Increment(ref running);
            lock (this) peak = Math.Max(peak, now);
            await Task.Delay(100);
            Interlocked.Decrement(ref running);
            return "reply:" + url;
        }
        var urls = Enumerable.Range(0, 100).Select(i => "shop" + i).ToList();
        var sw = Stopwatch.StartNew();
        var results = await Fetcher.FetchAllAsync(urls, Fake, 20);
        sw.Stop();
        Assert.Equal(urls.Select(u => "reply:" + u), results);
        Assert.True(peak <= 20, $"{peak} requests ran at once; the limit is 20");
        Assert.True(peak >= 10, $"only {peak} ran at once: requests should overlap up to the limit");
        Assert.True(sw.ElapsedMilliseconds < 2500, $"took {sw.ElapsedMilliseconds} ms: 100 × 100 ms at 20 at a time should be ≈500 ms");
    }

    [Fact]
    public async Task Timeouts()
    {
        Assert.Equal("fast", await Fetcher.WithTimeoutAsync(async () => { await Task.Delay(10); return "fast"; }, TimeSpan.FromSeconds(2)));
        var sw = Stopwatch.StartNew();
        Assert.Null(await Fetcher.WithTimeoutAsync(async () => { await Task.Delay(5000); return "slow"; }, TimeSpan.FromMilliseconds(100)));
        Assert.True(sw.ElapsedMilliseconds < 2000, "should give up after the timeout, not wait for the slow call");
    }
}

using Challenges.Resilience;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "latency-retries")]
public class LatencyRetriesTests
{
    [Fact]
    public void Retries_transient_failures_then_succeeds()
    {
        var sleeps = new List<int>();
        var calls = 0;
        var r = new Retrier(5, 100, new Random(1), sleeps.Add);
        var result = r.Run(() => ++calls < 3 ? throw new TransientException("503") : "rates");
        Assert.Equal("rates", result);
        Assert.Equal(3, calls);
        Assert.Equal(2, sleeps.Count);
    }

    [Fact]
    public void Gives_up_after_max_attempts_and_rethrows()
    {
        var sleeps = new List<int>();
        var calls = 0;
        var r = new Retrier(4, 50, new Random(2), sleeps.Add);
        var e = Assert.Throws<TransientException>(() => r.Run<int>(() => throw new TransientException($"fail {++calls}")));
        Assert.Equal(4, calls);
        Assert.Equal("fail 4", e.Message);
        Assert.Equal(3, sleeps.Count);
    }

    [Fact]
    public void Real_errors_are_not_retried()
    {
        var sleeps = new List<int>();
        var calls = 0;
        var r = new Retrier(5, 100, new Random(3), sleeps.Add);
        Assert.Throws<ArgumentException>(() => r.Run<int>(() =>
        {
            calls++;
            throw new ArgumentException("bad postcode");
        }));
        Assert.Equal(1, calls);
        Assert.Empty(sleeps);
    }

    [Fact]
    public void Backoff_doubles_with_bounded_jitter()
    {
        for (var seed = 0; seed < 50; seed++)
        {
            var sleeps = new List<int>();
            var r = new Retrier(6, 200, new Random(seed), sleeps.Add);
            Assert.Throws<TransientException>(() => r.Run<int>(() => throw new TransientException("timeout")));
            Assert.Equal(5, sleeps.Count);
            for (var k = 0; k < 5; k++)
            {
                var min = 200 << k;
                Assert.InRange(sleeps[k], min, min + min / 2);
            }
        }
    }

    [Fact]
    public void Jitter_spreads_clients_out()
    {
        var firstWaits = Enumerable.Range(0, 100).Select(seed =>
        {
            var sleeps = new List<int>();
            var calls = 0;
            new Retrier(3, 1000, new Random(seed), sleeps.Add).Run(() => ++calls < 2 ? throw new TransientException("x") : 0);
            return sleeps[0];
        }).ToList();
        Assert.True(firstWaits.Distinct().Count() > 50, "100 clients all waited (nearly) the same time: add random jitter.");
    }

    private long _now;

    private static int Fail() => throw new TransientException("down");

    [Fact]
    public void Opens_after_threshold_and_fails_fast()
    {
        var b = new CircuitBreaker(3, 30_000, () => _now);
        var calls = 0;
        int Down()
        {
            calls++;
            return Fail();
        }
        Assert.Equal(BreakerState.Closed, b.State);
        for (var i = 0; i < 3; i++) Assert.Throws<TransientException>(() => b.Call(Down));
        Assert.Equal(BreakerState.Open, b.State);
        Assert.Throws<CircuitOpenException>(() => b.Call(Down));
        _now += 29_999;
        Assert.Throws<CircuitOpenException>(() => b.Call(Down));
        Assert.Equal(3, calls);
    }

    [Fact]
    public void Success_resets_the_failure_count()
    {
        var b = new CircuitBreaker(3, 1000, () => _now);
        for (var round = 0; round < 5; round++)
        {
            Assert.Throws<TransientException>(() => b.Call(Fail));
            Assert.Throws<TransientException>(() => b.Call(Fail));
            Assert.Equal(1, b.Call(() => 1));
        }
        Assert.Equal(BreakerState.Closed, b.State);
    }

    [Fact]
    public void Half_open_trial_closes_on_success()
    {
        var b = new CircuitBreaker(2, 5000, () => _now);
        Assert.Throws<TransientException>(() => b.Call(Fail));
        Assert.Throws<TransientException>(() => b.Call(Fail));
        _now += 5000;
        Assert.Equal(BreakerState.HalfOpen, b.State);
        Assert.Equal("ok", b.Call(() => "ok"));
        Assert.Equal(BreakerState.Closed, b.State);
        Assert.Throws<TransientException>(() => b.Call(Fail));
        Assert.Equal(BreakerState.Closed, b.State);
    }

    [Fact]
    public void Half_open_trial_reopens_on_failure_with_a_fresh_timer()
    {
        var b = new CircuitBreaker(2, 5000, () => _now);
        Assert.Throws<TransientException>(() => b.Call(Fail));
        Assert.Throws<TransientException>(() => b.Call(Fail));
        _now += 6000;
        Assert.Throws<TransientException>(() => b.Call(Fail));
        Assert.Equal(BreakerState.Open, b.State);
        _now += 4999;
        Assert.Throws<CircuitOpenException>(() => b.Call(() => 1));
        _now += 1;
        Assert.Equal(1, b.Call(() => 1));
        Assert.Equal(BreakerState.Closed, b.State);
    }
}

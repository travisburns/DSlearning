using System.Diagnostics;
using Challenges.ProcessesThreads;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "processes-threads")]
public class ProcessesThreadsTests
{
    [Fact]
    public void Every_job_runs_once_on_at_most_n_threads_at_a_time()
    {
        var ran = new int[200];
        int running = 0, peak = 0;
        var threadIds = new System.Collections.Concurrent.ConcurrentDictionary<int, bool>();
        var jobs = Enumerable.Range(0, 200).Select(i => (Action)(() =>
        {
            var now = Interlocked.Increment(ref running);
            int p;
            while (now > (p = Volatile.Read(ref peak)) && Interlocked.CompareExchange(ref peak, now, p) != p) { }
            threadIds[Environment.CurrentManagedThreadId] = true;
            Thread.Sleep(5);
            Interlocked.Increment(ref ran[i]);
            Interlocked.Decrement(ref running);
        })).ToList();
        Hang.Within(10_000, () => Workers.RunAll(jobs, 8), "RunAll");
        Assert.All(ran, n => Assert.Equal(1, n));
        Assert.True(peak <= 8, $"{peak} jobs ran at once with only 8 workers");
        Assert.True(peak >= 2, "jobs never ran at the same time: are the threads really running in parallel?");
        Assert.True(threadIds.Count <= 8);
    }

    [Fact]
    public void Waiting_jobs_overlap()
    {
        var jobs = Enumerable.Range(0, 40).Select(_ => (Action)(() => Thread.Sleep(50))).ToList();
        var sw = Stopwatch.StartNew();
        Hang.Within(10_000, () => Workers.RunAll(jobs, 8), "RunAll");
        Assert.True(sw.ElapsedMilliseconds < 1200, $"40 × 50 ms jobs on 8 workers took {sw.ElapsedMilliseconds} ms (≈250 ms expected; 2,000 ms means they ran one at a time)");
    }

    [Fact]
    public void Parallel_sum()
    {
        var data = Enumerable.Range(1, 1_000_001).ToArray();
        foreach (var t in new[] { 1, 3, 8 }) Assert.Equal(500_001_500_001L, Workers.SumInParallel(data, t));
    }
}

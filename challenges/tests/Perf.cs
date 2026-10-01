using System.Diagnostics;
using Xunit;

// Timing tests are only meaningful when they don't fight each other for the CPU.
[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace Challenges.Tests;

/// <summary>
/// Speed checks. The limits are generous: the right structure finishes far below them, while the wrong one
/// (an O(n²) loop, a list scanned on every lookup) takes many times longer. A run that blows well past the
/// limit is abandoned, so a slow solution fails in seconds instead of hanging the test run.
/// </summary>
public static class Perf
{
    public static void Under(int ms, Action work, string what)
    {
        Run(work, ms * 3, what); // warm-up (JIT), not counted, but still cut off if hopeless
        var best = long.MaxValue;
        for (var attempt = 0; attempt < 3 && best >= ms; attempt++)
        {
            var sw = Stopwatch.StartNew();
            Run(work, ms * 2, what);
            best = Math.Min(best, sw.ElapsedMilliseconds);
        }
        Assert.True(best < ms, $"{what} took {best} ms (limit {ms} ms). It gives answers, but the approach is too slow for this size: which structure makes this fast?");
    }

    private static void Run(Action work, int cutoffMs, string what)
    {
        var task = Task.Run(work);
        if (!task.Wait(TimeSpan.FromMilliseconds(cutoffMs)) && !task.IsFaulted)
            Assert.Fail($"{what} was stopped after {cutoffMs} ms without finishing. The approach is far too slow for this size: which structure makes this fast?");
        task.GetAwaiter().GetResult(); // rethrow the real failure (e.g. an assertion) if there was one
    }
}

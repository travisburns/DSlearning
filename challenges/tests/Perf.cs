using System.Diagnostics;
using Xunit;

// Timing tests are only meaningful when they don't fight each other for the CPU.
[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace Challenges.Tests;

/// <summary>
/// Speed checks. The limits are generous: the right structure finishes far below them, while the wrong one
/// (an O(n²) loop, a list scanned on every lookup) takes many times longer.
/// </summary>
public static class Perf
{
    public static void Under(int ms, Action work, string what)
    {
        work(); // warm-up (JIT), not timed
        var best = long.MaxValue;
        for (var run = 0; run < 3 && best >= ms; run++)
        {
            var sw = Stopwatch.StartNew();
            work();
            best = Math.Min(best, sw.ElapsedMilliseconds);
        }
        Assert.True(best < ms, $"{what} took {best} ms (limit {ms} ms). It gives answers, but the approach is too slow for this size: which structure makes this fast?");
    }
}

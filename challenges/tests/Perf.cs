using System.Diagnostics;
using Xunit;

namespace Challenges.Tests;

/// <summary>Speed checks. The limits are generous: the right structure finishes far below them, the wrong one far above.</summary>
public static class Perf
{
    public static void Under(int ms, Action work, string what)
    {
        work(); // warm-up run (JIT), not timed
        var sw = Stopwatch.StartNew();
        work();
        sw.Stop();
        Assert.True(sw.ElapsedMilliseconds < ms, $"{what} took {sw.ElapsedMilliseconds} ms (limit {ms} ms). The approach is too slow for this size: which structure makes this fast?");
    }
}

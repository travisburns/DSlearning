using Challenges.SegmentTree;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "segment-tree")]
public class SegmentTreeTests
{
    [Fact]
    public void Matches_brute_force_through_updates()
    {
        var rnd = new Random(61);
        const int N = 100;
        var s = new LiveSales(N);
        var copy = new long[N];
        for (var step = 0; step < 2000; step++)
        {
            int a = rnd.Next(N), b = rnd.Next(N);
            if (step % 2 == 0)
            {
                copy[a] = rnd.Next(-50, 500);
                s.Set(a, copy[a]);
            }
            else
            {
                var (l, r) = (Math.Min(a, b), Math.Max(a, b));
                Assert.Equal(copy[l..(r + 1)].Sum(), s.Total(l, r));
                Assert.Equal(copy[l..(r + 1)].Max(), s.Best(l, r));
            }
        }
    }

    [Fact]
    public void Busy_day() =>
        Perf.Under(1500, () =>
        {
            const int N = 500_000;
            var s = new LiveSales(N);
            var rnd = new Random(67);
            long x = 0;
            for (var q = 0; q < 500_000; q++)
            {
                s.Set(rnd.Next(N), rnd.Next(1000));
                var a = rnd.Next(N - 100_000);
                x += s.Total(a, a + 99_999) + s.Best(a, a + 99_999);
            }
            Assert.True(x > 0);
        }, "500,000 updates and 1,000,000 range queries");
}

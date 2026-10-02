using System.Diagnostics;
using System.Numerics;
using Challenges.Simd;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "simd")]
public class SimdTests
{
    [Fact]
    public void Correct_for_every_length_including_tails()
    {
        var rng = new Random(4);
        for (var len = 0; len <= 100; len++)
        {
            var ints = Enumerable.Range(0, len).Select(_ => rng.Next(-1000, 1000)).ToArray();
            Assert.Equal(ints.Sum(), VectorMath.Sum(ints));
            Assert.Equal(ints.Count(x => x > 17), VectorMath.CountGreaterThan(ints, 17));

            var a = Enumerable.Range(0, len).Select(_ => (float)rng.NextDouble()).ToArray();
            var b = Enumerable.Range(0, len).Select(_ => (float)rng.NextDouble()).ToArray();
            var expectedDot = a.Zip(b, (x, y) => (double)x * y).Sum();
            Assert.Equal(expectedDot, VectorMath.Dot(a, b), 3);

            var scaled = a.ToArray();
            VectorMath.Scale(scaled, 2.5f);
            for (var i = 0; i < len; i++) Assert.Equal(a[i] * 2.5f, scaled[i]);
        }
    }

    [Fact]
    public void Sum_wraps_like_unchecked_ints()
    {
        var values = Enumerable.Repeat(int.MaxValue, 37).ToArray();
        var expected = 0;
        foreach (var v in values) expected = unchecked(expected + v);
        Assert.Equal(expected, VectorMath.Sum(values));
    }

    [Fact]
    public void Count_edges()
    {
        Assert.Equal(0, VectorMath.CountGreaterThan(new[] { 5, 5, 5, 5, 5, 5, 5, 5, 5 }, 5));
        Assert.Equal(9, VectorMath.CountGreaterThan(new[] { 6, 6, 6, 6, 6, 6, 6, 6, 6 }, 5));
        Assert.Equal(1, VectorMath.CountGreaterThan(new[] { int.MinValue, int.MaxValue }, 0));
    }

    [Fact]
    public void Dot_rejects_different_lengths() =>
        Assert.Throws<ArgumentException>(() => VectorMath.Dot(new float[3], new float[4]));

    private static int ScalarCount(int[] values, int threshold)
    {
        var c = 0;
        foreach (var v in values)
            if (v > threshold) c++;
        return c;
    }

    [Fact]
    public void Faster_than_the_plain_loop()
    {
        if (!Vector.IsHardwareAccelerated) return; // nothing to measure on this machine
        var rng = new Random(8);
        var data = Enumerable.Range(0, 4_000_000).Select(_ => rng.Next()).ToArray();
        var limit = int.MaxValue / 2;
        long Best(Func<int> f)
        {
            var best = long.MaxValue;
            for (var i = 0; i < 7; i++)
            {
                var sw = Stopwatch.StartNew();
                f();
                best = Math.Min(best, sw.ElapsedTicks);
            }
            return best;
        }
        Assert.Equal(ScalarCount(data, limit), VectorMath.CountGreaterThan(data, limit));
        var scalar = Best(() => ScalarCount(data, limit));
        var vector = Best(() => VectorMath.CountGreaterThan(data, limit));
        Assert.True(vector * 2 < scalar, $"Vector version took {vector} ticks vs {scalar} for a plain loop: it should be at least 2× faster. Is the loop really using Vector<int>?");
    }
}

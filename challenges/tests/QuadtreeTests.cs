using Challenges.Quadtree;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "quadtree")]
public class QuadtreeTests
{
    [Fact]
    public void Matches_brute_force()
    {
        var rnd = new Random(97);
        var map = new PinMap(1000, 4);
        var pins = new List<(double X, double Y, int Id)>();
        for (var i = 0; i < 3000; i++)
        {
            var p = (rnd.NextDouble() * 1000, rnd.NextDouble() * 1000, i);
            pins.Add(p);
            map.Add(p.Item1, p.Item2, i);
        }
        for (var i = 0; i < 50; i++) map.Add(500, 500, 10_000 + i); // many identical points must not break it
        Assert.Equal(3050, map.Count);
        for (var q = 0; q < 200; q++)
        {
            double x0 = rnd.NextDouble() * 900, y0 = rnd.NextDouble() * 900, x1 = x0 + rnd.NextDouble() * 100, y1 = y0 + rnd.NextDouble() * 100;
            var expected = pins.Where(p => p.X >= x0 && p.X <= x1 && p.Y >= y0 && p.Y <= y1).Select(p => p.Id).OrderBy(i => i);
            Assert.Equal(expected, map.InView(x0, y0, x1, y1));
        }
        Assert.Equal(50, map.InView(499, 499, 501, 501).Count(id => id >= 10_000));
    }

    [Fact]
    public void Panning_a_busy_map()
    {
        var rnd = new Random(101);
        var map = new PinMap(100_000);
        for (var i = 0; i < 300_000; i++) map.Add(rnd.NextDouble() * 100_000, rnd.NextDouble() * 100_000, i);
        Perf.Under(1500, () =>
        {
            for (var q = 0; q < 50_000; q++)
            {
                double x = rnd.NextDouble() * 99_000, y = rnd.NextDouble() * 99_000;
                map.InView(x, y, x + 500, y + 500);
            }
        }, "50,000 small map views over 300,000 pins");
    }
}

using Challenges.CountMin;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "count-min-sketch")]
public class CountMinSketchTests
{
    [Fact]
    public void Never_underestimates_and_stays_close()
    {
        var rnd = new Random(139);
        var cms = new CountMinSketch(2000, 5);
        var truth = new Dictionary<string, long>();
        for (var i = 0; i < 200_000; i++)
        {
            // A few popular tags and a long tail of rare ones.
            var tag = rnd.Next(10) < 3 ? "#hot" + rnd.Next(10) : "#tag" + rnd.Next(50_000);
            cms.Add(tag);
            truth[tag] = truth.GetValueOrDefault(tag) + 1;
        }
        Assert.Equal(200_000, cms.Total);
        foreach (var (tag, n) in truth)
        {
            var est = cms.Estimate(tag);
            Assert.True(est >= n, $"{tag}: estimate {est} is below the true {n}");
            Assert.True(est - n <= 400, $"{tag}: estimate {est} is too far above {n}");
        }
        Assert.Equal(0, new CountMinSketch(10, 3).Estimate("#never"));
    }
}

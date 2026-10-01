using Challenges.Bloom;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "bloom-filter")]
public class BloomFilterTests
{
    [Fact]
    public void Sizes_follow_the_formulas()
    {
        var b = new BloomFilter(100_000, 0.01);
        Assert.InRange(b.BitCount, 958_000, 959_000);
        Assert.Equal(7, b.HashCount);
    }

    [Fact]
    public void No_false_negatives_and_few_false_positives()
    {
        var b = new BloomFilter(100_000, 0.01);
        for (var i = 0; i < 100_000; i++) b.Add("user" + i);
        for (var i = 0; i < 100_000; i++) Assert.True(b.MightContain("user" + i));
        var fp = Enumerable.Range(0, 100_000).Count(i => b.MightContain("other" + i));
        Assert.True(fp < 2000, $"{fp / 1000.0:F1}% false positives (target 1%)");
    }
}

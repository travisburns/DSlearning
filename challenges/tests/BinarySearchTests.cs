using Challenges.BinarySearch;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "binary-search")]
public class BinarySearchTests
{
    [Theory]
    [InlineData(1, 1)]
    [InlineData(10, 1)]
    [InlineData(10, 10)]
    [InlineData(1000, 437)]
    [InlineData(2_000_000_000, 1_234_567_890)]
    public void Finds_the_first_bad_release_with_few_checks(int n, int firstBad)
    {
        var calls = 0;
        var got = Bisect.FirstBad(n, v =>
        {
            calls++;
            return v >= firstBad;
        });
        Assert.Equal(firstBad, got);
        Assert.True(calls <= (int)Math.Ceiling(Math.Log2(n)) + 1, $"{calls} checks for {n} releases is too many");
    }

    [Fact]
    public void Tax_brackets()
    {
        var limits = new[] { 0, 10_000, 40_000, 100_000 };
        Assert.Equal(0, Bisect.BracketIndex(limits, 0));
        Assert.Equal(0, Bisect.BracketIndex(limits, 9_999));
        Assert.Equal(1, Bisect.BracketIndex(limits, 10_000));
        Assert.Equal(2, Bisect.BracketIndex(limits, 99_999));
        Assert.Equal(3, Bisect.BracketIndex(limits, 5_000_000));
    }
}

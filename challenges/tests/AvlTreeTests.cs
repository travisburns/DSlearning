using Challenges.Avl;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "avl-tree")]
public class AvlTreeTests
{
    [Fact]
    public void Basic_operations()
    {
        var t = new AvlIndex();
        Assert.Equal(-1, t.Height);
        foreach (var k in new[] { 30, 10, 20, 40, 50, 25, 10 }) t.Insert(k);
        Assert.Equal(6, t.Count);
        Assert.True(t.Contains(25));
        Assert.False(t.Contains(26));
        Assert.Equal(new[] { 10, 20, 25, 30, 40, 50 }, t.InOrder());
        Assert.Equal(2, t.Height);
    }

    [Fact]
    public void Sorted_input_stays_short_and_fast() =>
        Perf.Under(1500, () =>
        {
            var t = new AvlIndex();
            const int n = 200_000;
            for (var i = 0; i < n; i++) t.Insert(i);
            Assert.True(t.Height <= 1.45 * Math.Log2(n + 2), $"height {t.Height} is too tall for {n} keys");
            for (var i = 0; i < n; i++) Assert.True(t.Contains(i));
        }, "200,000 ascending inserts and lookups");
}

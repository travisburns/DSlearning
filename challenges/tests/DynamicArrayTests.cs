using Challenges.DynamicArray;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "dynamic-array")]
public class DynamicArrayTests
{
    [Fact]
    public void Capacity_doubles_when_full()
    {
        var l = new GrowableList<int>();
        Assert.Equal(4, l.Capacity);
        for (var i = 0; i < 5; i++) l.Add(i);
        Assert.Equal(8, l.Capacity);
        for (var i = 5; i < 9; i++) l.Add(i);
        Assert.Equal(16, l.Capacity);
        Assert.Equal(9, l.Count);
    }

    [Fact]
    public void Index_and_remove()
    {
        var l = new GrowableList<string>();
        foreach (var s in new[] { "a", "b", "c", "d" }) l.Add(s);
        l[1] = "B";
        l.RemoveAt(0);
        Assert.Equal(3, l.Count);
        Assert.Equal("B", l[0]);
        Assert.Equal("d", l[2]);
        Assert.Throws<ArgumentOutOfRangeException>(() => l[3]);
        Assert.Throws<ArgumentOutOfRangeException>(() => l[-1]);
    }

    [Fact]
    public void A_million_adds_are_fast() =>
        Perf.Under(1500, () =>
        {
            var l = new GrowableList<int>();
            for (var i = 0; i < 1_000_000; i++) l.Add(i);
            Assert.Equal(999_999, l[999_999]);
        }, "1,000,000 adds");
}

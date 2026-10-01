using Challenges.DAryHeap;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "d-ary-heap")]
public class DAryHeapTests
{
    [Theory]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(8)]
    public void Pops_in_order_for_any_d(int d)
    {
        var h = new DHeap(d);
        var rnd = new Random(d);
        var vals = Enumerable.Range(0, 2000).Select(_ => (long)rnd.Next(100_000)).ToList();
        foreach (var v in vals) h.Push(v);
        vals.Sort();
        foreach (var v in vals) Assert.Equal(v, h.Pop());
        Assert.Throws<InvalidOperationException>(() => h.Pop());
    }

    [Fact]
    public void Wider_heaps_are_shorter()
    {
        var two = new DHeap(2);
        var four = new DHeap(4);
        for (var i = 0; i < 1000; i++)
        {
            two.Push(i);
            four.Push(i);
        }
        Assert.Equal(9, two.Height);  // ⌊log₂ 1000⌋
        Assert.Equal(5, four.Height); // fewer levels with 4 children per node
    }

    [Fact]
    public void Many_timers() =>
        Perf.Under(1500, () =>
        {
            var h = new DHeap(4);
            for (long i = 0; i < 1_000_000; i++)
            {
                h.Push(1_000_000 - i);
                if (i % 4 == 0) h.Pop();
            }
        }, "1,000,000 timers");
}

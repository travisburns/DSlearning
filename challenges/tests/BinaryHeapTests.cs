using Challenges.BinaryHeap;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "binary-heap")]
public class BinaryHeapTests
{
    [Fact]
    public void Pops_in_ascending_order()
    {
        var h = new MinHeap();
        foreach (var x in new[] { 5, 3, 9, 1, 7, 3, 8 }) h.Push(x);
        Assert.Equal(1, h.Peek());
        Assert.Equal(new[] { 1, 3, 3, 5, 7, 8, 9 }, Enumerable.Range(0, 7).Select(_ => h.Pop()));
        Assert.Throws<InvalidOperationException>(() => h.Pop());
    }

    [Fact]
    public void Smallest_k_of_a_stream()
    {
        Assert.Equal(new[] { 1, 2, 3 }, MinHeap.SmallestK(new[] { 9, 2, 8, 1, 7, 3, 6 }, 3));
        Assert.Empty(MinHeap.SmallestK(new[] { 1, 2 }, 0));
    }

    [Fact]
    public void Millions_of_events()
    {
        var rnd = new Random(17);
        var data = Enumerable.Range(0, 1_000_000).Select(_ => rnd.Next()).ToArray();
        Perf.Under(1500, () =>
        {
            var h = new MinHeap();
            foreach (var x in data) h.Push(x);
            var prev = int.MinValue;
            while (h.Count > 0)
            {
                var x = h.Pop();
                Assert.True(x >= prev);
                prev = x;
            }
        }, "1,000,000 pushes and pops");
    }
}

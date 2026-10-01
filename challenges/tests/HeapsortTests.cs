using Challenges.HeapSorting;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "heapsort")]
public class HeapsortTests
{
    [Fact]
    public void Sorts_in_place()
    {
        var a = new[] { 5, -1, 9, 3, 3, 0, 12, -7 };
        HeapSort.Sort(a);
        Assert.Equal(new[] { -7, -1, 0, 3, 3, 5, 9, 12 }, a);
        var one = new[] { 4 };
        HeapSort.Sort(one);
        HeapSort.Sort(Array.Empty<int>());
    }

    [Fact]
    public void Any_input_is_n_log_n()
    {
        var rnd = new Random(23);
        var random = Enumerable.Range(0, 1_000_000).Select(_ => rnd.Next()).ToArray();
        var sorted = Enumerable.Range(0, 1_000_000).ToArray();
        var reversed = sorted.Reverse().ToArray();
        Perf.Under(2000, () =>
        {
            foreach (var src in new[] { random, sorted, reversed })
            {
                var a = (int[])src.Clone();
                HeapSort.Sort(a);
                for (var i = 1; i < a.Length; i++) Assert.True(a[i - 1] <= a[i]);
            }
        }, "heapsorting 3 × 1,000,000 items");
    }
}

using Challenges.InsertionSort;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "insertion-sort")]
public class InsertionSortTests
{
    [Fact]
    public void Leaderboard_stays_sorted()
    {
        var b = new Leaderboard();
        foreach (var s in new[] { 50, 80, 20, 80, 95, 10 }) b.Add(s);
        Assert.Equal(new[] { 95, 80, 80 }, b.Top(3));
        Assert.Equal(6, b.Top(100).Count);
    }

    [Fact]
    public void Sorts_an_array()
    {
        var a = new[] { 5, -2, 9, 0, 5, 3 };
        Leaderboard.InsertionSort(a);
        Assert.Equal(new[] { -2, 0, 3, 5, 5, 9 }, a);
        var empty = Array.Empty<int>();
        Leaderboard.InsertionSort(empty);
    }

    [Fact]
    public void Nearly_sorted_input_is_fast() =>
        Perf.Under(1500, () =>
        {
            var a = Enumerable.Range(0, 200_000).ToArray();
            for (var i = 0; i < a.Length - 1; i += 1000) (a[i], a[i + 1]) = (a[i + 1], a[i]);
            Leaderboard.InsertionSort(a);
            Assert.Equal(199_999, a[^1]);
        }, "sorting 200,000 nearly-sorted items");
}

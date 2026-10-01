using Challenges.MergeSort;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "merge-sort")]
public class MergeSortTests
{
    private record Order(string Customer, int Day);

    [Fact]
    public void Sorts()
    {
        Assert.Equal(new[] { -3, 0, 2, 2, 9 }, StableSort.Sort(new[] { 2, 9, -3, 2, 0 }, (a, b) => a.CompareTo(b)));
        Assert.Empty(StableSort.Sort(Array.Empty<int>(), (a, b) => a.CompareTo(b)));
    }

    [Fact]
    public void Equal_items_keep_their_order()
    {
        var byCustomer = new[] { new Order("Ann", 2), new Order("Bob", 1), new Order("Cat", 2), new Order("Dan", 1), new Order("Eve", 2) };
        var byDay = StableSort.Sort(byCustomer, (a, b) => a.Day.CompareTo(b.Day));
        Assert.Equal(new[] { "Bob", "Dan", "Ann", "Cat", "Eve" }, byDay.Select(o => o.Customer));
        Assert.Equal("Ann", byCustomer[0].Customer); // input untouched
    }

    [Fact]
    public void A_million_items()
    {
        var rnd = new Random(7);
        var data = Enumerable.Range(0, 1_000_000).Select(_ => rnd.Next()).ToArray();
        Perf.Under(2000, () =>
        {
            var s = StableSort.Sort(data, (a, b) => a.CompareTo(b));
            for (var i = 1; i < s.Length; i++) Assert.True(s[i - 1] <= s[i]);
        }, "sorting 1,000,000 items");
    }
}

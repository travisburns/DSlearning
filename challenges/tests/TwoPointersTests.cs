using Challenges.TwoPointers;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "two-pointers")]
public class TwoPointersTests
{
    [Fact]
    public void Merges_and_removes_duplicates()
    {
        Assert.Equal(new[] { 1, 2, 3, 5, 7, 8 }, Orders.MergeUnique(new[] { 1, 3, 3, 7 }, new[] { 2, 3, 5, 7, 8 }));
        Assert.Equal(new[] { 4 }, Orders.MergeUnique(new[] { 4, 4 }, Array.Empty<int>()));
        Assert.Empty(Orders.MergeUnique(Array.Empty<int>(), Array.Empty<int>()));
    }

    [Fact]
    public void Finds_a_pair_for_the_budget()
    {
        var p = new[] { 3, 8, 12, 20, 25, 31 };
        var (i, j) = Orders.PairForBudget(p, 33)!.Value;
        Assert.True(i < j);
        Assert.Equal(33, p[i] + p[j]);
        Assert.Null(Orders.PairForBudget(p, 7));
        Assert.Null(Orders.PairForBudget(new[] { 10 }, 20)); // one item can't be used twice
    }

    [Fact]
    public void A_million_items_is_instant() =>
        Perf.Under(1500, () =>
        {
            var a = Enumerable.Range(0, 1_000_000).Select(x => x * 2).ToArray();
            var b = Enumerable.Range(0, 1_000_000).Select(x => x * 3).ToArray();
            Assert.Equal(1_666_666, Orders.MergeUnique(a, b).Count);
            Assert.Null(Orders.PairForBudget(a, 7)); // an odd budget can never be two even prices
        }, "merging two 1,000,000-item feeds");
}

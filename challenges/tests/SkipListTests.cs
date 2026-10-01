using Challenges.SkipLists;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "skip-list")]
public class SkipListTests
{
    [Fact]
    public void Sorted_set_operations()
    {
        var s = new SkipList();
        foreach (var x in new[] { 30, 10, 50, 20, 40 }) Assert.True(s.Add(x));
        Assert.False(s.Add(20));
        Assert.True(s.Contains(40));
        Assert.False(s.Contains(35));
        Assert.Equal(new[] { 20, 30, 40 }, s.Range(15, 45));
        Assert.True(s.Remove(30));
        Assert.False(s.Remove(30));
        Assert.Equal(new[] { 10, 20, 40, 50 }, s.Range(int.MinValue, int.MaxValue));
        Assert.Equal(4, s.Count);
    }

    [Fact]
    public void Matches_a_sorted_set()
    {
        var rnd = new Random(137);
        var s = new SkipList();
        var check = new SortedSet<int>();
        for (var i = 0; i < 5000; i++)
        {
            var x = rnd.Next(2000);
            if (rnd.Next(3) == 0) Assert.Equal(check.Remove(x), s.Remove(x));
            else Assert.Equal(check.Add(x), s.Add(x));
        }
        Assert.Equal(check.ToList(), s.Range(int.MinValue, int.MaxValue));
    }

    [Fact]
    public void Sorted_inserts_stay_fast() =>
        Perf.Under(1500, () =>
        {
            var s = new SkipList();
            for (var i = 0; i < 300_000; i++) s.Add(i);
            for (var i = 0; i < 300_000; i++) Assert.True(s.Contains(i));
            Assert.Equal(100, s.Range(5000, 5099).Count);
        }, "300,000 sorted inserts and lookups");
}

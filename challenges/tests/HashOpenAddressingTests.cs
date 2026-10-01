using Challenges.HashOpenAddressing;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "hash-open-addressing")]
public class HashOpenAddressingTests
{
    [Fact]
    public void Add_contains_remove()
    {
        var s = new IntSet();
        Assert.True(s.Add(5));
        Assert.False(s.Add(5));
        Assert.True(s.Contains(5));
        Assert.True(s.Remove(5));
        Assert.False(s.Contains(5));
        Assert.False(s.Remove(5));
        Assert.Equal(0, s.Count);
    }

    [Fact]
    public void Tombstones_keep_probe_chains_intact()
    {
        var s = new IntSet();
        // 3, 19 and 35 share a home slot in a 16-slot table (they're equal mod 16).
        s.Add(3);
        s.Add(19);
        s.Add(35);
        s.Remove(19);
        Assert.True(s.Contains(35), "35 sits past the removed 19: the search must probe past its tombstone");
        Assert.True(s.Add(19));
        Assert.Equal(3, s.Count);
    }

    [Fact]
    public void Millions_of_checks()
    {
        Perf.Under(1500, () =>
        {
            var s = new IntSet();
            for (var i = 0; i < 300_000; i++) s.Add(i * 7);
            var hits = 0;
            for (var i = 0; i < 2_000_000; i++) if (s.Contains(i)) hits++;
            Assert.Equal(285_715, hits);
            for (var i = 0; i < 300_000; i += 2) s.Remove(i * 7);
            Assert.Equal(150_000, s.Count);
        }, "300,000 adds and 2,000,000 lookups");
    }
}
